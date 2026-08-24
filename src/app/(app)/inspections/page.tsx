import { createClient } from "@/lib/supabase/server";

function daysUntil(dateStr: string) {
  const due = new Date(dateStr + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / (1000 * 60 * 60 * 24));
}
function statusFor(dateStr: string) {
  const n = daysUntil(dateStr);
  if (n < 0) return { label: "Overdue", cls: "bg-red/15 text-red border-red/30", n };
  if (n <= 45) return { label: `Due in ${n}d`, cls: "bg-amber/15 text-amber border-amber/30", n };
  return { label: "Good", cls: "bg-green/15 text-green border-green/30", n };
}

interface InspRow {
  id: string;
  inspection_type: string;
  category: "cvip" | "tank" | "safety";
  due_date: string;
  unit_number: string;
  description: string | null;
}

function InspectionSection({ title, note, list }: { title: string; note: string; list: InspRow[] }) {
  const overdue = list.filter((r) => statusFor(r.due_date).n < 0).length;
  return (
    <div className="card-surface rounded-xl mb-5 overflow-hidden">
      <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line flex items-center gap-2">
        {title} <span className="text-muted font-normal">({list.length})</span>
        {overdue > 0 && (
          <span className="text-xs font-bold bg-red/15 text-red border border-red/30 rounded-full px-2 py-0.5">
            {overdue} overdue
          </span>
        )}
      </h2>
      <p className="text-xs text-muted px-4 pt-3">{note}</p>
      <div className="overflow-x-auto"><table className="w-full text-sm mt-2">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
            <th className="text-left px-4 py-2.5 border-b border-line">Unit</th>
            <th className="text-left px-4 py-2.5 border-b border-line">Check</th>
            <th className="text-left px-4 py-2.5 border-b border-line">Due date</th>
            <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
          </tr>
        </thead>
        <tbody>
          {list.map((r) => {
            const st = statusFor(r.due_date);
            return (
              <tr key={r.id} className="border-b border-line">
                <td className="px-4 py-2.5 font-bold text-navy">Unit {r.unit_number}</td>
                <td className="px-4 py-2.5">{r.inspection_type}</td>
                <td className="px-4 py-2.5">{r.due_date}</td>
                <td className="px-4 py-2.5">
                  <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full border ${st.cls}`}>
                    {st.label}
                  </span>
                </td>
              </tr>
            );
          })}
          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                None on file yet.
              </td>
            </tr>
          )}
        </tbody>
      </table></div>
    </div>
  );
}

export default async function InspectionsPage() {
  const supabase = await createClient();
  const { data } = await supabase
    .from("equipment_inspections")
    .select("id, inspection_type, category, due_date, equipment(unit_number, description)")
    .order("due_date");

  const rows: InspRow[] = (data ?? []).map((r) => {
    const eq = Array.isArray(r.equipment) ? r.equipment[0] : r.equipment;
    return {
      id: r.id,
      inspection_type: r.inspection_type,
      category: r.category,
      due_date: r.due_date,
      unit_number: eq?.unit_number ?? "?",
      description: eq?.description ?? null,
    };
  });

  const cvips = rows.filter((r) => r.category === "cvip").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const tank = rows.filter((r) => r.category === "tank").sort((a, b) => a.due_date.localeCompare(b.due_date));
  const safety = rows.filter((r) => r.category === "safety").sort((a, b) => a.due_date.localeCompare(b.due_date));

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Inspections</h1>
        <p className="text-muted text-sm mt-1">CVIP, tank checks, and safety equipment — soonest due first.</p>
      </div>

      <InspectionSection title="📄 CVIPs" note="Commercial Vehicle Inspection — annual, every unit." list={cvips} />
      <InspectionSection
        title="🛢️ Tank checks (CSA B620)"
        note="External & internal visual, leakage, thickness, pressure — tank units only."
        list={tank}
      />
      <InspectionSection
        title="🧯 Safety equipment"
        note="Fire extinguishers and hose pressure tests — annual, every unit."
        list={safety}
      />
    </div>
  );
}
