import { createClient } from "@/lib/supabase/server";
import { getStandardCrew } from "@/lib/crew";
import { CalendarClient } from "./CalendarClient";

export default async function CalendarPage() {
  const supabase = await createClient();

  const [{ data: jobs }, standardCrew] = await Promise.all([
    supabase
      .from("jobs")
      .select(
        "id, name, client, location, job_date, start_time, details, gear_notes, is_multiday, completed_at, job_needs(id, category, task, start_time)"
      )
      .order("job_date"),
    getStandardCrew(),
  ]);

  return <CalendarClient initialJobs={jobs ?? []} standardCrew={standardCrew} />;
}
