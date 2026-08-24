import { createClient } from "@/lib/supabase/server";
import { PartsClient } from "./PartsClient";

export default async function PartsPage() {
  const supabase = await createClient();

  const [{ data: parts }, { data: equipment }] = await Promise.all([
    supabase
      .from("parts")
      .select("id, name, quantity, status, note, for_equipment_id, equipment(unit_number)")
      .order("created_at", { ascending: false }),
    supabase.from("equipment").select("id, unit_number").eq("active", true).order("unit_number"),
  ]);

  const flat = (parts ?? []).map((p) => {
    const eq = Array.isArray(p.equipment) ? p.equipment[0] : p.equipment;
    return {
      id: p.id,
      name: p.name,
      quantity: p.quantity,
      status: p.status,
      note: p.note,
      for_equipment_id: p.for_equipment_id,
      unit_number: eq?.unit_number ?? null,
    };
  });

  return <PartsClient initialParts={flat} equipment={equipment ?? []} />;
}
