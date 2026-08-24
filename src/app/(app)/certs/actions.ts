"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function addCert(formData: FormData) {
  const supabase = await createClient();
  const employee_id = String(formData.get("employee_id") ?? "");
  const cert_type = String(formData.get("cert_type") ?? "").trim();
  const due_date = String(formData.get("due_date") ?? "");

  if (!employee_id || !cert_type || !due_date) {
    return { error: "Employee, ticket type, and expiry date are all required." };
  }

  const { error } = await supabase.from("employee_certs").insert({ employee_id, cert_type, due_date });
  if (error) return { error: error.message };

  revalidatePath("/certs");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function removeCert(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("employee_certs").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/certs");
  revalidatePath("/dashboard");
  return { error: null };
}
