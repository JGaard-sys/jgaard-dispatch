"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createWorkOrder(formData: FormData) {
  const supabase = await createClient();
  const equipment_id = String(formData.get("equipment_id") ?? "");
  const description = String(formData.get("description") ?? "").trim();
  const operator_report = String(formData.get("operator_report") ?? "").trim();
  const priority = String(formData.get("priority") ?? "When time");
  const reported_by = String(formData.get("reported_by") ?? "").trim();

  if (!equipment_id || !description) return { error: "Unit and description are required." };

  const { error } = await supabase.from("work_orders").insert({
    equipment_id,
    description,
    operator_report: operator_report || null,
    priority,
    reported_by: reported_by || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/shop");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateWOStatus(id: number, status: "Open" | "In progress" | "Done") {
  const supabase = await createClient();
  const patch: Record<string, unknown> = { status };
  if (status === "Done") patch.closed_at = new Date().toISOString();
  const { error } = await supabase.from("work_orders").update(patch).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function updateWOPriority(id: number, priority: "Safety" | "High" | "When time") {
  const supabase = await createClient();
  const { error } = await supabase.from("work_orders").update({ priority }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  revalidatePath("/dashboard");
  return { error: null };
}

export async function assignMechanic(id: number, mechanicId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("work_orders").update({ assigned_mechanic_id: mechanicId || null }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { error: null };
}

export async function addWONote(workOrderId: number, note: string) {
  const supabase = await createClient();
  if (!note.trim()) return { error: "Note can't be empty." };
  const { error } = await supabase.from("wo_notes").insert({ work_order_id: workOrderId, note: note.trim() });
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { error: null };
}

export async function addWOPart(workOrderId: number, partName: string, qty: number) {
  const supabase = await createClient();
  if (!partName.trim()) return { error: "Part name can't be empty." };
  const { error } = await supabase
    .from("wo_parts_used")
    .insert({ work_order_id: workOrderId, part_name: partName.trim(), quantity: qty });
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { error: null };
}

export async function startTimer(workOrderId: number, mechanicId: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("time_entries").insert({
    work_order_id: workOrderId,
    mechanic_id: mechanicId,
    started_at: new Date().toISOString(),
  });
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { error: null };
}

export async function stopTimer(entryId: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("time_entries")
    .update({ stopped_at: new Date().toISOString() })
    .eq("id", entryId);
  if (error) return { error: error.message };
  revalidatePath("/shop");
  return { error: null };
}
