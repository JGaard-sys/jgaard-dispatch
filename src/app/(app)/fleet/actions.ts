"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

const TANK_CATEGORIES = new Set(["Combo Vac", "Semi Vac"]);

export async function addUnit(formData: FormData) {
  const supabase = await createClient();

  const unit_number = String(formData.get("unit_number") ?? "").trim();
  const category = String(formData.get("category") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const make = String(formData.get("make") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();

  if (!unit_number || !category) {
    return { error: "Unit number and type are required." };
  }

  const { error } = await supabase.from("equipment").insert({
    unit_number,
    category,
    description: description || null,
    make: make || null,
    location: location || null,
    is_tank_unit: TANK_CATEGORIES.has(category),
    status: "Available",
  });

  if (error) return { error: error.message };

  revalidatePath("/fleet");
  return { error: null };
}

export async function updateUnitStatus(id: string, status: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("equipment").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/fleet");
  revalidatePath("/status");
  return { error: null };
}
