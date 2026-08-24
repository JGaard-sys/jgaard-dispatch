"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addGearItem(category: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hp_gear").insert({
    name: "New item — rename me",
    category,
    spec: "",
    quantity: 0,
    min_quantity: 1,
    location: "",
    condition: "Good",
  });
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { error: null };
}

export async function updateGearField(
  id: string,
  field: "name" | "spec" | "location" | "category" | "condition",
  value: string
) {
  const supabase = await createClient();
  const { error } = await supabase.from("hp_gear").update({ [field]: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { error: null };
}

export async function updateGearMin(id: string, min: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("hp_gear").update({ min_quantity: min }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { error: null };
}

export async function adjustGearQty(id: string, delta: number) {
  const supabase = await createClient();
  const { data: row } = await supabase.from("hp_gear").select("quantity").eq("id", id).single();
  const newQty = Math.max(0, (row?.quantity ?? 0) + delta);
  const { error } = await supabase.from("hp_gear").update({ quantity: newQty }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { error: null };
}

export async function removeGearItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("hp_gear").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/inventory");
  return { error: null };
}

export async function addGearCategory(name: string) {
  const supabase = await createClient();
  const trimmed = name.trim();
  if (!trimmed) return { error: "Type a category name first." };
  const { error } = await supabase.from("hp_gear_categories").insert({ name: trimmed });
  if (error) {
    if (error.code === "23505") return { error: "That category already exists." };
    return { error: error.message };
  }
  revalidatePath("/inventory");
  return { error: null };
}
