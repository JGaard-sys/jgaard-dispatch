import { createClient } from "@/lib/supabase/server";
import { ReportsClient } from "./ReportsClient";

export default async function ReportsPage() {
  const supabase = await createClient();
  const { data: reports } = await supabase
    .from("weekly_reports")
    .select("id, who_name, role, week_start, last_week, next_week, attention")
    .order("week_start", { ascending: false })
    .limit(50);

  return <ReportsClient initialReports={reports ?? []} />;
}
