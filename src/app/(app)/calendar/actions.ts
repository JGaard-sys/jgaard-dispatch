"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createJob(formData: FormData) {
  const supabase = await createClient();

  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const contact_name = String(formData.get("contact_name") ?? "").trim();
  const contact_phone = String(formData.get("contact_phone") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const job_date = String(formData.get("job_date") ?? "");
  const start_time = String(formData.get("start_time") ?? "") || null;
  const details = String(formData.get("details") ?? "").trim();
  const gear_notes = String(formData.get("gear_notes") ?? "").trim();
  const is_multiday = formData.get("is_multiday") === "on";

  if (!name || !job_date) return { error: "Job name and date are required." };

  const { data, error } = await supabase
    .from("jobs")
    .insert({
      name,
      client: client || null,
      contact_name: contact_name || null,
      contact_phone: contact_phone || null,
      location: location || null,
      job_date,
      start_time,
      details: details || null,
      gear_notes: gear_notes || null,
      is_multiday,
    })
    .select("id")
    .single();

  if (error) return { error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/daily");
  return { error: null, jobId: data.id as string };
}

export async function deleteJob(jobId: string) {
  const supabase = await createClient();

  // Release any equipment currently held by this job's needs before deleting.
  const { data: needs } = await supabase.from("job_needs").select("id").eq("job_id", jobId);
  const needIds = (needs ?? []).map((n) => n.id);
  if (needIds.length) {
    const { data: assigns } = await supabase
      .from("assignments")
      .select("id, equipment_id")
      .in("job_need_id", needIds);
    const equipmentIds = (assigns ?? []).map((a) => a.equipment_id).filter(Boolean) as string[];
    if (equipmentIds.length) {
      await supabase.from("equipment").update({ status: "Available" }).in("id", equipmentIds);
    }
  }

  const { error } = await supabase.from("jobs").delete().eq("id", jobId);
  if (error) return { error: error.message };

  revalidatePath("/calendar");
  revalidatePath("/daily");
  revalidatePath("/status");
  return { error: null };
}

export async function addJobNeed(jobId: string, category: string, task: string, startTime: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("job_needs").insert({
    job_id: jobId,
    category,
    task: task || null,
    start_time: startTime || null,
  });
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/daily");
  return { error: null };
}

export async function removeJobNeed(needId: string) {
  const supabase = await createClient();

  // Release equipment held against this need first.
  const { data: assigns } = await supabase
    .from("assignments")
    .select("id, equipment_id")
    .eq("job_need_id", needId);
  const equipmentIds = (assigns ?? []).map((a) => a.equipment_id).filter(Boolean) as string[];
  if (equipmentIds.length) {
    await supabase.from("equipment").update({ status: "Available" }).in("id", equipmentIds);
  }

  const { error } = await supabase.from("job_needs").delete().eq("id", needId);
  if (error) return { error: error.message };
  revalidatePath("/calendar");
  revalidatePath("/daily");
  return { error: null };
}
