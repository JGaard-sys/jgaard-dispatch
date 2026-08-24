import { createClient } from "@/lib/supabase/server";
import { PageHead, Card, StatusPill } from "@/components/ui";
import { AddUnitForm } from "./AddUnitForm";

export default async function FleetPage() {
  const supabase = await createClient();
  const { data: equipment } = await supabase
    .from("equipment")
    .select("id, unit_number, category, description, status, location")
    .eq("active", true)
    .order("category")
    .order("unit_number");

  const units = equipment ?? [];

  return (
    <div>
      <PageHead
        title="Fleet"
        subtitle="Every truck, trailer and unit — type, status and location."
        action={<AddUnitForm />}
      />

      <Card title="🚛 All equipment" count={units.length}>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Unit</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Type</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Location</th>
            </tr>
          </thead>
          <tbody>
            {units.map((u) => (
              <tr key={u.id} className="border-b border-line hover:bg-card-2">
                <td className="px-4 py-2.5">
                  <span className="font-bold text-navy">Unit {u.unit_number}</span>
                  <div className="text-xs text-muted">{u.description}</div>
                </td>
                <td className="px-4 py-2.5">{u.category}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={u.status} />
                </td>
                <td className="px-4 py-2.5">{u.location ?? "—"}</td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No units yet — click &quot;+ Add Unit&quot; to add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </Card>
    </div>
  );
}
