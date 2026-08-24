import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/get-profile";
import { ShopClient } from "./ShopClient";

export default async function ShopPage() {
  const supabase = await createClient();
  const profile = await getProfile();

  const [{ data: wos }, { data: equipment }, { data: employees }] = await Promise.all([
    supabase
      .from("work_orders")
      .select(
        "id, equipment_id, description, operator_report, priority, status, assigned_mechanic_id, reported_by, opened_at, equipment(unit_number), wo_notes(id, note, created_at), wo_parts_used(id, part_name, quantity), time_entries(id, mechanic_id, started_at, stopped_at)"
      )
      .order("opened_at", { ascending: false }),
    supabase.from("equipment").select("id, unit_number").eq("active", true).order("unit_number"),
    supabase.from("employees").select("id, name, hourly_rate").eq("active", true).order("name"),
  ]);

  const flat = (wos ?? []).map((w) => {
    const eq = Array.isArray(w.equipment) ? w.equipment[0] : w.equipment;
    return { ...w, unit_number: eq?.unit_number ?? "?" };
  });

  // If the signed-in user is a mechanic, try to match them to an employee record by name for the timer dropdown default.
  const currentMechanic = (employees ?? []).find((e) => e.name === profile.name);

  return (
    <ShopClient
      initialWOs={flat}
      equipment={equipment ?? []}
      mechanics={employees ?? []}
      currentMechanicId={currentMechanic?.id ?? null}
    />
  );
}
