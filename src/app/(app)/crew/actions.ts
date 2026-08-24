"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addEmployee(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const position = String(formData.get("position") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const role = String(formData.get("role") ?? "").trim();
  const employee_group = String(formData.get("employee_group") ?? "").trim();

  if (!name) return { error: "Name is required." };

  const { error } = await supabase.from("employees").insert({
    name,
    position: position || null,
    phone: phone || null,
    role: role || null,
    employee_group: employee_group || null,
  });

  if (error) return { error: error.message };

  revalidatePath("/crew");
  return { error: null };
}

export async function toggleShift(id: string, current: string) {
  const supabase = await createClient();
  const next = current === "off" ? "on" : "off";
  const { error } = await supabase.from("employees").update({ shift_status: next }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/crew");
  revalidatePath("/status");
  return { error: null };
}
