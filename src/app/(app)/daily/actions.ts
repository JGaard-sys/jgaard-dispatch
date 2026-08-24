"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function assignEquipment(needId: string, equipmentId: string, date: string) {
  const supabase = await createClient();

  // If this need already has an assignment, release its old equipment first.
  const { data: existing } = await supabase
    .from("assignments")
    .select("id, equipment_id")
    .eq("job_need_id", needId)
    .maybeSingle();

  if (existing?.equipment_id) {
    await supabase.from("equipment").update({ status: "Available" }).eq("id", existing.equipment_id);
  }

  if (existing) {
    const { error } = await supabase
      .from("assignments")
      .update({ equipment_id: equipmentId, texted: false })
      .eq("id", existing.id);
    if (error) return { error: error.message };
  } else {
    const { error } = await supabase
      .from("assignments")
      .insert({ job_need_id: needId, equipment_id: equipmentId, assignment_date: date });
    if (error) return { error: error.message };
  }

  const { error: statusError } = await supabase
    .from("equipment")
    .update({ status: "Out" })
    .eq("id", equipmentId);
  if (statusError) return { error: statusError.message };

  revalidatePath("/daily");
  revalidatePath("/status");
  revalidatePath("/fleet");
  return { error: null };
}

export async function clearNeedAssignment(needId: string) {
  const supabase = await createClient();

  const { data: existing } = await supabase
    .from("assignments")
    .select("id, equipment_id")
    .eq("job_need_id", needId)
    .maybeSingle();

  if (!existing) return { error: null };

  if (existing.equipment_id) {
    await supabase.from("equipment").update({ status: "Available" }).eq("id", existing.equipment_id);
  }

  const { error } = await supabase.from("assignments").delete().eq("id", existing.id);
  if (error) return { error: error.message };

  revalidatePath("/daily");
  revalidatePath("/status");
  revalidatePath("/fleet");
  return { error: null };
}

export async function addCrewToAssignment(
  assignmentId: string,
  employeeId: string,
  shift: "day" | "night",
  crewType: "operator" | "laborer"
) {
  const supabase = await createClient();
  const { error } = await supabase.from("assignment_crew").insert({
    assignment_id: assignmentId,
    employee_id: employeeId,
    shift,
    crew_type: crewType,
  });
  if (error) return { error: error.message };
  revalidatePath("/daily");
  revalidatePath("/status");
  return { error: null };
}

export async function removeCrewFromAssignment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assignment_crew").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/daily");
  revalidatePath("/status");
  return { error: null };
}

export async function textAndDispatchJob(jobId: string) {
  const supabase = await createClient();

  const { data: needs } = await supabase.from("job_needs").select("id").eq("job_id", jobId);
  const needIds = (needs ?? []).map((n) => n.id);
  if (!needIds.length) return { error: null };

  const { error } = await supabase
    .from("assignments")
    .update({ texted: true })
    .in("job_need_id", needIds);
  if (error) return { error: error.message };

  revalidatePath("/daily");
  return { error: null };
}

export async function completeJob(jobId: string) {
  const supabase = await createClient();

  const { data: needs } = await supabase.from("job_needs").select("id").eq("job_id", jobId);
  const needIds = (needs ?? []).map((n) => n.id);

  if (needIds.length) {
    const { data: assigns } = await supabase
      .from("assignments")
      .select("equipment_id")
      .in("job_need_id", needIds);
    const equipmentIds = (assigns ?? []).map((a) => a.equipment_id).filter(Boolean) as string[];
    if (equipmentIds.length) {
      await supabase.from("equipment").update({ status: "Available" }).in("id", equipmentIds);
    }
  }

  const { error } = await supabase
    .from("jobs")
    .update({ completed_at: new Date().toISOString() })
    .eq("id", jobId);
  if (error) return { error: error.message };

  revalidatePath("/daily");
  revalidatePath("/calendar");
  revalidatePath("/status");
  revalidatePath("/fleet");
  return { error: null };
}
