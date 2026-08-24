import { createClient } from "@/lib/supabase/server";
import type { CrewReq } from "@/lib/crew-constants";

export type { CrewReq } from "@/lib/crew-constants";
export { EQUIPMENT_CATEGORIES } from "@/lib/crew-constants";

export async function getStandardCrew(): Promise<Record<string, CrewReq>> {
  const supabase = await createClient();
  const { data } = await supabase.from("standard_crew").select("category, operators, laborers");
  const map: Record<string, CrewReq> = {};
  (data ?? []).forEach((r) => {
    map[r.category as string] = { operators: r.operators, laborers: r.laborers };
  });
  return map;
}
