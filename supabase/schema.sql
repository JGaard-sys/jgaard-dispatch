-- ============================================================================
-- J-Gaard Dispatch — Database Schema
-- Run this once in the Supabase SQL Editor on a fresh project.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. PROFILES  (one row per app user, linked to Supabase auth.users)
-- ----------------------------------------------------------------------------
create type user_tier as enum ('owner', 'staff', 'mech');

create table profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  name text not null,
  short_name text,
  avatar_initials text,
  tier user_tier not null default 'staff',
  title text,
  phone text,
  acting_owner boolean not null default false,   -- true while delegated owner access is active
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 2. EMPLOYEES  (field/shop crew — may or may not have an app login)
-- ----------------------------------------------------------------------------
create table employees (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  position text,
  phone text,
  employee_group text,             -- e.g. 'c1' (combo/vac ops), 'c3', 'lab' (laborer)
  role text,                       -- display role, e.g. "Operator", "Laborer"
  shift_status text not null default 'on' check (shift_status in ('on','off')),
  hourly_rate numeric(10,2),       -- used for mechanics / contractor labour costing
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table employee_certs (
  id uuid primary key default gen_random_uuid(),
  employee_id uuid not null references employees(id) on delete cascade,
  cert_type text not null,          -- e.g. 'H2S Alive', 'Confined Space Entry'
  due_date date not null,
  created_at timestamptz not null default now()
);
create index on employee_certs (employee_id);
create index on employee_certs (due_date);

-- ----------------------------------------------------------------------------
-- 3. EQUIPMENT  (trucks / units)
-- ----------------------------------------------------------------------------
create type equipment_category as enum (
  'Combo Vac','Semi Vac','Pressure Truck','High Pressure Pump','Steamer','Water Truck','Crew Truck'
);
create type equipment_status as enum ('Available','Out','In shop','Down');

create table equipment (
  id uuid primary key default gen_random_uuid(),
  unit_number text not null unique,
  category equipment_category not null,
  description text,
  make text,
  status equipment_status not null default 'Available',
  location text,
  is_tank_unit boolean not null default false,   -- drives which inspection schedule applies
  night_at_shop boolean not null default false,  -- "at the shop" vs "out overnight" toggle
  active boolean not null default true,
  created_at timestamptz not null default now()
);

create table equipment_inspections (
  id uuid primary key default gen_random_uuid(),
  equipment_id uuid not null references equipment(id) on delete cascade,
  inspection_type text not null,     -- e.g. 'CVIP', 'External visual', 'Fire extinguisher'
  category text not null default 'tank' check (category in ('cvip','tank','safety')),
  due_date date not null,
  created_at timestamptz not null default now()
);
create index on equipment_inspections (equipment_id);
create index on equipment_inspections (due_date);

-- standard crew per unit type — editable in Admin
create table standard_crew (
  category equipment_category primary key,
  operators int not null default 1,
  laborers int not null default 0
);
insert into standard_crew (category, operators, laborers) values
  ('Combo Vac', 2, 0),
  ('Semi Vac', 1, 0),
  ('Pressure Truck', 1, 0),
  ('High Pressure Pump', 2, 0),   -- usually runs 1-3; 2 used as the forecasting default
  ('Steamer', 2, 0),
  ('Water Truck', 1, 0),
  ('Crew Truck', 1, 0);

-- ----------------------------------------------------------------------------
-- 4. JOBS  (day-to-day dispatch)
-- ----------------------------------------------------------------------------
create table jobs (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  contact_name text,
  contact_phone text,
  location text,
  job_date date not null,
  start_time time,
  details text,
  gear_notes text,
  is_multiday boolean not null default false,
  day_shift_start time default '06:00',
  day_shift_end time default '18:00',
  night_shift_start time default '18:00',
  night_shift_end time default '06:00',
  completed_at timestamptz,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table job_needs (
  id uuid primary key default gen_random_uuid(),
  job_id uuid not null references jobs(id) on delete cascade,
  category equipment_category not null,
  task text,
  start_time time,
  operators_override int,   -- null = use standard_crew default
  laborers_override int,
  sort_order int not null default 0
);
create index on job_needs (job_id);

create table assignments (
  id uuid primary key default gen_random_uuid(),
  job_need_id uuid not null references job_needs(id) on delete cascade,
  equipment_id uuid references equipment(id),
  assignment_date date not null,
  texted boolean not null default false,
  created_at timestamptz not null default now()
);
create index on assignments (job_need_id);
create index on assignments (assignment_date);

create table assignment_crew (
  id uuid primary key default gen_random_uuid(),
  assignment_id uuid not null references assignments(id) on delete cascade,
  employee_id uuid not null references employees(id),
  shift text not null default 'day' check (shift in ('day','night')),
  crew_type text not null default 'operator' check (crew_type in ('operator','laborer'))
);
create index on assignment_crew (assignment_id);

-- ----------------------------------------------------------------------------
-- 5. PROJECTS  (PM-run, larger multi-unit jobs)
-- ----------------------------------------------------------------------------
create type project_status as enum ('Planning','Quoted','Scheduled','Active','Complete');

create table projects (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  client text,
  project_manager uuid references profiles(id),
  location text,
  start_date date not null,
  end_date date,
  status project_status not null default 'Planning',
  description text,
  is_24hr boolean not null default true,
  created_at timestamptz not null default now()
);

create table project_units (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  category equipment_category not null,
  quantity int not null default 1
);

-- free-text load list, deliberately NOT linked to hp_gear inventory
create table project_load_items (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  item_name text not null,
  quantity int not null default 1,
  packed boolean not null default false,
  sort_order int not null default 0
);

create table project_documents (
  id uuid primary key default gen_random_uuid(),
  project_id uuid not null references projects(id) on delete cascade,
  file_name text not null,
  storage_path text not null,        -- Supabase Storage object path
  category text not null default 'Other' check (category in ('Safety tickets','Safe work plans','Procedures','Other')),
  uploaded_by uuid references profiles(id),
  uploaded_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 6. SHOP / MECHANIC WORK
-- ----------------------------------------------------------------------------
create type wo_priority as enum ('Safety','High','When time');
create type wo_status as enum ('Open','In progress','Done');

create table work_orders (
  id bigint generated always as identity primary key,
  equipment_id uuid not null references equipment(id),
  description text not null,          -- what needs to be done (coordinator's words)
  operator_report text,               -- pasted-in text from the field operator
  priority wo_priority not null default 'When time',
  status wo_status not null default 'Open',
  assigned_mechanic_id uuid references employees(id),
  reported_by text,                   -- operator's name, free text
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  created_by uuid references profiles(id)
);
create index on work_orders (equipment_id);
create index on work_orders (status);

create table wo_notes (
  id uuid primary key default gen_random_uuid(),
  work_order_id bigint not null references work_orders(id) on delete cascade,
  note text not null,
  created_by uuid references profiles(id),
  created_at timestamptz not null default now()
);

create table wo_parts_used (
  id uuid primary key default gen_random_uuid(),
  work_order_id bigint not null references work_orders(id) on delete cascade,
  part_name text not null,
  quantity int not null default 1
);

create table wo_photos (
  id uuid primary key default gen_random_uuid(),
  work_order_id bigint not null references work_orders(id) on delete cascade,
  storage_path text not null,   -- Supabase Storage object path
  uploaded_at timestamptz not null default now()
);

create table time_entries (
  id uuid primary key default gen_random_uuid(),
  work_order_id bigint not null references work_orders(id) on delete cascade,
  mechanic_id uuid not null references employees(id),
  started_at timestamptz not null,
  stopped_at timestamptz
);
create index on time_entries (work_order_id);
create index on time_entries (mechanic_id);

-- ----------------------------------------------------------------------------
-- 7. PARTS TO ORDER
-- ----------------------------------------------------------------------------
create table parts (
  id bigint generated always as identity primary key,
  name text not null,
  for_equipment_id uuid references equipment(id),   -- null = general shop stock
  quantity int not null default 1,
  status text not null default 'To order' check (status in ('To order','Ordered','Received')),
  note text,
  created_at timestamptz not null default now()
);

-- ----------------------------------------------------------------------------
-- 8. HP BLASTING INVENTORY
-- ----------------------------------------------------------------------------
create table hp_gear_categories (
  name text primary key
);
insert into hp_gear_categories (name) values
  ('Hoses'), ('Nozzles & Jetting Heads'), ('Guns & Wands'),
  ('Fittings & Adapters'), ('Swivels & Whip Checks'), ('PPE');

create table hp_gear (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  category text not null references hp_gear_categories(name),
  spec text,
  quantity int not null default 0,
  min_quantity int not null default 1,
  location text,
  condition text not null default 'Good' check (condition in ('Good','Needs repair','Retired')),
  notes text,
  created_at timestamptz not null default now()
);
create index on hp_gear (category);

-- ----------------------------------------------------------------------------
-- 9. INSPECTIONS DEFAULTS (Admin-editable regulation schedule)
-- ----------------------------------------------------------------------------
create table inspection_defaults (
  inspection_type text primary key,
  category text not null check (category in ('cvip','tank','safety')),
  interval_months int not null,
  applies_to_tank_units_only boolean not null default false
);
insert into inspection_defaults (inspection_type, category, interval_months, applies_to_tank_units_only) values
  ('CVIP', 'cvip', 12, false),
  ('External visual', 'tank', 6, true),
  ('Internal visual', 'tank', 12, true),
  ('Leakage test', 'tank', 12, true),
  ('Thickness test', 'tank', 24, true),
  ('Pressure test', 'tank', 24, true),
  ('Fire extinguisher', 'safety', 12, false),
  ('Hose pressure test', 'safety', 12, false);

-- ----------------------------------------------------------------------------
-- 10. ADMIN SETTINGS
-- ----------------------------------------------------------------------------
create table app_settings (
  key text primary key,
  value text
);
insert into app_settings (key, value) values ('auth_pin', '4021');

-- ----------------------------------------------------------------------------
-- 11. ACTIVITY LOG  (audit trail — who did what, when)
-- ----------------------------------------------------------------------------
create table activity_log (
  id bigint generated always as identity primary key,
  actor_id uuid references profiles(id),
  actor_name text,                 -- denormalized so history reads fine after a user is removed
  action text not null,            -- e.g. 'job.dispatch', 'job.delete', 'wo.create', 'auth_pin.used'
  target_type text,                -- e.g. 'job', 'project', 'work_order'
  target_id text,
  detail text,
  created_at timestamptz not null default now()
);
create index on activity_log (created_at desc);
create index on activity_log (actor_id);

-- Helper used by the dashboard to count HP gear below its minimum threshold
-- (column-to-column comparisons aren't expressible through the JS query builder directly)
create or replace function count_low_stock_gear() returns int
language sql stable as $$
  select count(*)::int from hp_gear
  where condition <> 'Retired' and quantity < min_quantity;
$$;

-- ----------------------------------------------------------------------------
-- 11a. WEEKLY REPORTS  (Friday report)
-- ----------------------------------------------------------------------------
create table weekly_reports (
  id uuid primary key default gen_random_uuid(),
  profile_id uuid references profiles(id),
  who_name text not null,        -- denormalized, so it reads fine even if the profile is later removed
  role text,
  week_start date not null,
  last_week text,
  next_week text,
  attention text,
  created_at timestamptz not null default now()
);
create index on weekly_reports (week_start desc);

-- ============================================================================
-- ROW LEVEL SECURITY
-- Tiers: owner (full access) / staff (full access, major changes need PIN,
-- enforced in the app layer) / mech (shop-related tables only)
-- ============================================================================

alter table profiles enable row level security;
alter table employees enable row level security;
alter table employee_certs enable row level security;
alter table equipment enable row level security;
alter table equipment_inspections enable row level security;
alter table standard_crew enable row level security;
alter table jobs enable row level security;
alter table job_needs enable row level security;
alter table assignments enable row level security;
alter table assignment_crew enable row level security;
alter table projects enable row level security;
alter table project_units enable row level security;
alter table project_load_items enable row level security;
alter table project_documents enable row level security;
alter table work_orders enable row level security;
alter table wo_notes enable row level security;
alter table wo_parts_used enable row level security;
alter table wo_photos enable row level security;
alter table time_entries enable row level security;
alter table parts enable row level security;
alter table hp_gear enable row level security;
alter table hp_gear_categories enable row level security;
alter table inspection_defaults enable row level security;
alter table app_settings enable row level security;
alter table activity_log enable row level security;
alter table weekly_reports enable row level security;

-- Helper: current user's tier
create or replace function current_tier() returns user_tier
language sql stable security definer as $$
  select tier from profiles where id = auth.uid();
$$;

-- Everyone signed in can read their own profile + the roster (needed for "who's on"),
-- but only owners manage profiles.
create policy "profiles_select_all" on profiles for select using (auth.uid() is not null);
create policy "profiles_owner_write" on profiles for all using (current_tier() = 'owner');

-- Owners & staff: full read/write on the dispatch tables.
-- Mechanics: read-only on dispatch tables (they need to see units/employees), full access to shop tables.
create policy "os_full_employees" on employees for all using (current_tier() in ('owner','staff'));
create policy "mech_read_employees" on employees for select using (current_tier() = 'mech');

create policy "os_full_certs" on employee_certs for all using (current_tier() in ('owner','staff'));
create policy "mech_read_certs" on employee_certs for select using (current_tier() = 'mech');

create policy "os_full_equipment" on equipment for all using (current_tier() in ('owner','staff'));
create policy "mech_read_equipment" on equipment for select using (current_tier() = 'mech');
create policy "mech_update_equipment_status" on equipment for update using (current_tier() = 'mech');

create policy "os_full_inspections" on equipment_inspections for all using (current_tier() in ('owner','staff'));
create policy "mech_read_inspections" on equipment_inspections for select using (current_tier() = 'mech');

create policy "all_read_standard_crew" on standard_crew for select using (auth.uid() is not null);
create policy "owner_write_standard_crew" on standard_crew for all using (current_tier() = 'owner');

create policy "os_full_jobs" on jobs for all using (current_tier() in ('owner','staff'));
create policy "os_full_job_needs" on job_needs for all using (current_tier() in ('owner','staff'));
create policy "os_full_assignments" on assignments for all using (current_tier() in ('owner','staff'));
create policy "os_full_assignment_crew" on assignment_crew for all using (current_tier() in ('owner','staff'));

create policy "os_full_projects" on projects for all using (current_tier() in ('owner','staff'));
create policy "os_full_project_units" on project_units for all using (current_tier() in ('owner','staff'));
create policy "os_full_project_load_items" on project_load_items for all using (current_tier() in ('owner','staff'));
create policy "os_full_project_documents" on project_documents for all using (current_tier() in ('owner','staff'));

-- Shop tables: everyone signed in can read; owner/staff/mech can all write
-- (mechanics create time entries & notes on their own work; coordinators create WOs).
create policy "all_read_work_orders" on work_orders for select using (auth.uid() is not null);
create policy "os_write_work_orders" on work_orders for insert with check (current_tier() in ('owner','staff'));
create policy "all_update_work_orders" on work_orders for update using (auth.uid() is not null);

create policy "all_rw_wo_notes" on wo_notes for all using (auth.uid() is not null);
create policy "all_rw_wo_parts" on wo_parts_used for all using (auth.uid() is not null);
create policy "all_rw_wo_photos" on wo_photos for all using (auth.uid() is not null);
create policy "all_rw_time_entries" on time_entries for all using (auth.uid() is not null);

create policy "all_read_parts" on parts for select using (auth.uid() is not null);
create policy "os_write_parts" on parts for insert with check (current_tier() in ('owner','staff'));
create policy "all_update_parts" on parts for update using (auth.uid() is not null);

create policy "all_rw_hp_gear" on hp_gear for all using (auth.uid() is not null);
create policy "all_read_hp_gear_categories" on hp_gear_categories for select using (auth.uid() is not null);
create policy "os_write_hp_gear_categories" on hp_gear_categories for insert with check (current_tier() in ('owner','staff'));

create policy "all_read_inspection_defaults" on inspection_defaults for select using (auth.uid() is not null);
create policy "owner_write_inspection_defaults" on inspection_defaults for all using (current_tier() = 'owner');

create policy "owner_only_app_settings" on app_settings for all using (current_tier() = 'owner');

create policy "all_read_activity_log" on activity_log for select using (auth.uid() is not null);
create policy "all_insert_activity_log" on activity_log for insert with check (auth.uid() is not null);

create policy "os_full_weekly_reports" on weekly_reports for all using (current_tier() in ('owner','staff'));
