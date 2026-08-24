import { createClient } from "@/lib/supabase/server";
import { getStandardCrew } from "@/lib/crew";
import { DailyDispatchClient } from "./DailyDispatchClient";

export default async function DailyDispatchPage({
  searchParams,
}: {
  searchParams: Promise<{ date?: string }>;
}) {
  const params = await searchParams;
  const date = params.date ?? new Date().toISOString().slice(0, 10);

  const supabase = await createClient();

  const [{ data: jobs }, { data: equipment }, { data: employees }, standardCrew] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        `id, name, client, location, job_date, start_time, details, is_multiday, completed_at,
         job_needs (
           id, category, task, start_time,
           assignments ( id, equipment_id, texted, assignment_crew ( id, employee_id, shift, crew_type ) )
         )`
      )
      .is("completed_at", null)
      .lte("job_date", date)
      .order("job_date"),
    supabase.from("equipment").select("id, unit_number, category, status").eq("active", true).order("unit_number"),
    supabase.from("employees").select("id, name, role, shift_status").eq("active", true).order("name"),
    getStandardCrew(),
  ]);

  return (
    <DailyDispatchClient
      date={date}
      initialJobs={jobs ?? []}
      equipment={equipment ?? []}
      employees={employees ?? []}
      standardCrew={standardCrew}
    />
  );
}
