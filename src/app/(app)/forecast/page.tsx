import { createClient } from "@/lib/supabase/server";
import { getStandardCrew } from "@/lib/crew";

function addDays(dateStr: string, n: number) {
  const d = new Date(dateStr + "T00:00:00");
  d.setDate(d.getDate() + n);
  return d.toISOString().slice(0, 10);
}
function prettyDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", { weekday: "short", month: "short", day: "numeric" });
}

interface JobForForecast {
  job_date: string;
  is_multiday: boolean;
  completed_at: string | null;
  job_needs: { category: string; operators_override: number | null; laborers_override: number | null }[];
}
interface ProjectForForecast {
  start_date: string;
  end_date: string | null;
  is_24hr: boolean;
  project_units: { category: string; quantity: number }[];
}

export default async function ForecastPage() {
  const supabase = await createClient();
  const today = new Date().toISOString().slice(0, 10);
  const rangeEnd = addDays(today, 13);

  const [{ data: jobs }, { data: projects }, standardCrew, { data: opsRoster }, { data: labRoster }] = await Promise.all([
    supabase
      .from("jobs")
      .select("job_date, is_multiday, completed_at, job_needs(category, operators_override, laborers_override)")
      .is("completed_at", null)
      .lte("job_date", rangeEnd),
    supabase
      .from("projects")
      .select("start_date, end_date, is_24hr, project_units(category, quantity)")
      .lte("start_date", rangeEnd),
    getStandardCrew(),
    supabase.from("employees").select("id", { count: "exact", head: true }).neq("employee_group", "lab").eq("shift_status", "on"),
    supabase.from("employees").select("id", { count: "exact", head: true }).eq("employee_group", "lab").eq("shift_status", "on"),
  ]);

  const days = Array.from({ length: 14 }, (_, i) => addDays(today, i));

  function crewOn(dateStr: string) {
    let ops = 0;
    let labs = 0;
    (jobs as JobForForecast[] | null)?.forEach((j) => {
      const active = j.is_multiday ? j.job_date <= dateStr : j.job_date === dateStr;
      if (!active) return;
      const shifts = j.is_multiday ? 2 : 1;
      j.job_needs.forEach((n) => {
        const std = standardCrew[n.category] ?? { operators: 1, laborers: 0 };
        ops += (n.operators_override ?? std.operators) * shifts;
        labs += (n.laborers_override ?? std.laborers) * shifts;
      });
    });
    (projects as ProjectForForecast[] | null)?.forEach((p) => {
      const active = p.start_date <= dateStr && (!p.end_date || dateStr <= p.end_date);
      if (!active) return;
      const shifts = p.is_24hr ? 2 : 1;
      p.project_units.forEach((u) => {
        const std = standardCrew[u.category] ?? { operators: 1, laborers: 0 };
        ops += std.operators * u.quantity * shifts;
        labs += std.laborers * u.quantity * shifts;
      });
    });
    return { ops, labs };
  }

  const opsCap = (opsRoster as unknown as { count: number } | null)?.count ?? 0;
  const labCap = (labRoster as unknown as { count: number } | null)?.count ?? 0;

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Labour Forecast</h1>
        <p className="text-muted text-sm mt-1">
          Operators and laborers needed per day, next 14 days, vs. who&apos;s on shift. 24-hr jobs and projects count day + night crew.
        </p>
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Day</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Operators needed</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Laborers needed</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Roster capacity</th>
            </tr>
          </thead>
          <tbody>
            {days.map((d) => {
              const { ops, labs } = crewOn(d);
              const opsShort = ops > opsCap;
              const labShort = labs > labCap;
              return (
                <tr key={d} className="border-b border-line">
                  <td className="px-4 py-2.5 font-semibold text-navy">
                    {prettyDate(d)}
                    {d === today && <span className="text-xs text-muted ml-1.5">(today)</span>}
                  </td>
                  <td className="px-4 py-2.5">
                    {ops}
                    {opsShort && (
                      <span className="ml-2 text-xs font-bold bg-red/15 text-red border border-red/30 rounded px-1.5 py-0.5">
                        short {ops - opsCap}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5">
                    {labs}
                    {labShort && (
                      <span className="ml-2 text-xs font-bold bg-red/15 text-red border border-red/30 rounded px-1.5 py-0.5">
                        short {labs - labCap}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-2.5 text-muted">
                    {opsCap} ops / {labCap} labs on shift
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <p className="text-xs text-muted mt-3">
        Roster capacity is a snapshot of who&apos;s currently marked &quot;on shift&quot; in Crew — it doesn&apos;t yet account for who&apos;s
        already tied up on a specific day. Treat it as a rough ceiling, not an exact per-day number.
      </p>
    </div>
  );
}
