import { createClient } from "@/lib/supabase/server";
import { InventoryClient } from "./InventoryClient";

export default async function InventoryPage() {
  const supabase = await createClient();

  const [{ data: items }, { data: cats }] = await Promise.all([
    supabase
      .from("hp_gear")
      .select("id, name, category, spec, quantity, min_quantity, location, condition")
      .order("name"),
    supabase.from("hp_gear_categories").select("name").order("name"),
  ]);

  return (
    <InventoryClient
      initialItems={items ?? []}
      initialCategories={(cats ?? []).map((c) => c.name)}
    />
  );
}
