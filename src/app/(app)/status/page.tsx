import { createClient } from "@/lib/supabase/server";
import { PageHead, Tile, TileRow, Card, StatusPill, Hint } from "@/components/ui";

export default async function StatusPage() {
  const supabase = await createClient();

  const { data: equipment } = await supabase
    .from("equipment")
    .select("id, unit_number, category, description, status, location")
    .eq("active", true)
    .order("status", { ascending: true })
    .order("unit_number", { ascending: true });

  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, role, shift_status")
    .eq("active", true)
    .order("name", { ascending: true });

  const units = equipment ?? [];
  const crew = employees ?? [];

  const available = units.filter((u) => u.status === "Available").length;
  const out = units.filter((u) => u.status === "Out").length;
  const inShop = units.filter((u) => u.status === "In shop").length;
  const peopleOff = crew.filter((e) => e.shift_status === "off").length;

  return (
    <div>
      <PageHead
        title="Status Board"
        subtitle="Who and what is out, in the shop, or available right now."
      />

      <TileRow>
        <Tile value={available} label="Units available" color="var(--green)" />
        <Tile value={out} label="Units out on jobs" color="var(--blue)" />
        <Tile value={inShop} label="In the shop" color="var(--amber)" />
        <Tile value={peopleOff} label="Crew off shift" color="var(--navy)" />
      </TileRow>

      <Hint>
        Tip: as a truck comes back to the shop, mark it in Fleet — if it has an open work order,
        mechanics get notified automatically.
      </Hint>

      <Card title="🚛 Equipment" count={units.length}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Unit</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Type</th>
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
                <td className="px-4 py-2.5">
                  <StatusPill status={u.status} />
                </td>
                <td className="px-4 py-2.5">{u.category}</td>
                <td className="px-4 py-2.5">{u.location ?? "—"}</td>
              </tr>
            ))}
            {units.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No equipment yet — add units in Fleet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>

      <Card title="👷 Crew" count={crew.length}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Name</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Position</th>
            </tr>
          </thead>
          <tbody>
            {crew.map((e) => (
              <tr key={e.id} className="border-b border-line hover:bg-card-2">
                <td className="px-4 py-2.5 font-bold text-navy">{e.name}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={e.shift_status === "off" ? "Off" : "Available"} />
                </td>
                <td className="px-4 py-2.5">{e.role ?? "—"}</td>
              </tr>
            ))}
            {crew.length === 0 && (
              <tr>
                <td colSpan={3} className="px-4 py-8 text-center text-muted">
                  No crew yet — add employees in Crew.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
