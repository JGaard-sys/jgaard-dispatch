# J-Gaard Dispatch

Real Next.js + Supabase build of the dispatch app, based on the approved prototype and build brief.

## What's built so far (foundation)

- Full database schema with role-based security (`supabase/schema.sql`)
- Real email/password login (Supabase Auth)
- Role-aware navigation (owner / staff / mechanic) that only shows each tier what they should see
- Dashboard with live counts pulled from every module
- Status Board (live equipment + crew view)
- Fleet — with a **working** "+ Add Unit" form
- Crew — with a **working** "+ Add Employee" form
- HP Blasting Inventory — fully editable (names, specs, categories, quantities, min-stock, condition), matching everything built out in the prototype

**Not built yet** (next iterations): Daily Dispatch board, Jobs & Calendar, Projects, Mechanic Work / shop module, Parts to Order, Certifications, Labour Forecast, Reports, Admin. These follow the same patterns already established here — bring this repo back to Claude Code and ask for the next module.

## One-time setup

### 1. Create a Supabase project
Go to supabase.com, create a free project, and wait for it to finish provisioning.

### 2. Run the database schema
In your Supabase project: **SQL Editor -> New query**, paste the entire contents of `supabase/schema.sql`, and run it. This creates every table, the standard crew defaults, the HP gear categories, and all the security policies in one shot.

### 3. Create your first user (yourself, as owner)
In Supabase: **Authentication -> Users -> Add user** — create yourself with an email and password.

Then in **SQL Editor**, run (replace the values):
```sql
insert into profiles (id, name, short_name, avatar_initials, tier, title)
values (
  'paste-the-user-uuid-from-the-users-list',
  'Jordan Paulgaard',
  'Jordan P.',
  'JP',
  'owner',
  'Owner / Admin'
);
```
Repeat for Jeremy and anyone else who needs a login (use `tier: 'staff'` for PMs/HSE/the service coordinator, `tier: 'mech'` for mechanics).

### 4. Connect your local environment
```bash
cp .env.example .env.local
```
Fill in `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` from **Project Settings -> API** in Supabase.

### 5. Run it locally
```bash
npm install
npm run dev
```
Visit `http://localhost:3000` and sign in with the account you created in step 3.

### 6. Deploy to Vercel
- Push this repo to GitHub.
- Go to vercel.com, import the repo.
- Add the same two environment variables from `.env.local` in Vercel's project settings.
- Deploy. You'll get a live URL your team can log into from anywhere.

## Adding your real fleet and crew

Once logged in as an owner, go to **Fleet** and **Crew** and use the **+ Add Unit** / **+ Add Employee** buttons to enter your real trucks and people — this was a deliberate decision (no bulk import), so it's manual, one at a time, through the app itself.
