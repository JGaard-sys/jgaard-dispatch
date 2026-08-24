"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addPart(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const for_equipment_id = String(formData.get("for_equipment_id") ?? "") || null;
  const quantity = parseInt(String(formData.get("quantity") ?? "1")) || 1;
  const note = String(formData.get("note") ?? "").trim();

  if (!name) return { error: "Part name is required." };

  const { error } = await supabase.from("parts").insert({
    name,
    for_equipment_id,
    quantity,
    note: note || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/parts");
  return { error: null };
}

export async function setPartStatus(id: number, status: "To order" | "Ordered" | "Received") {
  const supabase = await createClient();
  const { error } = await supabase.from("parts").update({ status }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/parts");
  return { error: null };
}
