"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function updateProfileTier(id: string, tier: "owner" | "staff" | "mech") {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ tier }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { error: null };
}

export async function toggleActingOwner(id: string, actingOwner: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("profiles").update({ acting_owner: actingOwner }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { error: null };
}

export async function updateAuthPin(pin: string) {
  const supabase = await createClient();
  if (!/^\d{4,6}$/.test(pin)) return { error: "PIN must be 4-6 digits." };
  const { error } = await supabase.from("app_settings").update({ value: pin }).eq("key", "auth_pin");
  if (error) return { error: error.message };
  revalidatePath("/admin");
  return { error: null };
}

export async function updateStandardCrew(category: string, operators: number, laborers: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("standard_crew")
    .update({ operators, laborers })
    .eq("category", category);
  if (error) return { error: error.message };
  revalidatePath("/admin");
  revalidatePath("/calendar");
  revalidatePath("/daily");
  revalidatePath("/forecast");
  return { error: null };
}
