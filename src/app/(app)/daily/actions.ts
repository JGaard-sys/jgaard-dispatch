"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { sendSms } from "@/lib/sms";

interface DispatchCrewRow {
  id: string;
  employee_id: string;
  shift: "day" | "night";
  crew_type: "operator" | "laborer";
}
interface DispatchAssignmentRow {
  id: string;
  equipment_id: string | null;
  texted: boolean;
  assignment_crew: DispatchCrewRow[];
}
interface DispatchNeedRow {
  id: string;
  category: string;
  task: string | null;
  start_time: string | null;
  assignments: DispatchAssignmentRow[];
}
interface DispatchJobInfo {
  name: string;
  client: string | null;
  location: string | null;
  job_date: string;
  start_time: string | null;
  details: string | null;
}

function buildDispatchMessage(args: {
  job: DispatchJobInfo;
  need: DispatchNeedRow;
  unitNumber: string;
  crew: DispatchCrewRow;
}): string {
  const { job, need, unitNumber, crew } = args;
  const lines = [
    "J-GAARD DISPATCH",
    `Job: ${job.name}${job.client ? ` (${job.client})` : ""}`,
    `Date: ${job.job_date}`,
  ];
  const start = need.start_time ?? job.start_time;
  if (start) lines.push(`Start: ${start.slice(0, 5)}`);
  lines.push(`Unit: ${need.category} #${unitNumber}${need.task ? ` - ${need.task}` : ""}`);
  lines.push(`You: ${crew.crew_type === "laborer" ? "Laborer" : "Operator"}${crew.shift === "night" ? " (night shift)" : ""}`);
  if (job.location) lines.push(`Location: ${job.location}`);
  if (job.details) lines.push(`Details: ${job.details.slice(0, 300)}`);
  return lines.join("\n");
}

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

export async function textAndDispatchJob(
  jobId: string
): Promise<{ error: string | null; summary: string | null }> {
  const supabase = await createClient();

  // Only signed-in users may send texts (they cost money).
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return { error: "You must be signed in to send texts.", summary: null };

  const { data: jobData, error: jobError } = await supabase
    .from("jobs")
    .select("name, client, location, job_date, start_time, details")
    .eq("id", jobId)
    .maybeSingle();
  if (jobError) return { error: jobError.message, summary: null };
  if (!jobData) return { error: "Job not found.", summary: null };
  const job = jobData as unknown as DispatchJobInfo;

  const { data: needsData, error: needsError } = await supabase
    .from("job_needs")
    .select(
      `id, category, task, start_time,
       assignments ( id, equipment_id, texted, assignment_crew ( id, employee_id, shift, crew_type ) )`
    )
    .eq("job_id", jobId);
  if (needsError) return { error: needsError.message, summary: null };
  const needs = (needsData ?? []) as unknown as DispatchNeedRow[];

  // Only units that haven't been texted yet.
  const pending = needs.flatMap((need) =>
    need.assignments.filter((a) => !a.texted).map((assignment) => ({ need, assignment }))
  );
  if (!pending.length) {
    return {
      error: null,
      summary: needs.length
        ? "Everyone on this job has already been texted."
        : "This job has no units to dispatch yet.",
    };
  }

  const equipmentIds = pending
    .map((p) => p.assignment.equipment_id)
    .filter((id): id is string => Boolean(id));
  const employeeIds = Array.from(
    new Set(pending.flatMap((p) => p.assignment.assignment_crew.map((c) => c.employee_id)))
  );

  const [{ data: equipmentData }, { data: employeeData }] = await Promise.all([
    supabase.from("equipment").select("id, unit_number").in("id", equipmentIds),
    supabase.from("employees").select("id, name, phone").in("id", employeeIds),
  ]);
  const unitById = new Map(
    ((equipmentData ?? []) as unknown as { id: string; unit_number: string }[]).map((u) => [
      u.id,
      u.unit_number,
    ])
  );
  const personById = new Map(
    ((employeeData ?? []) as unknown as { id: string; name: string; phone: string | null }[]).map(
      (e) => [e.id, e]
    )
  );

  const tasks: { assignmentId: string; label: string; phone: string | null; body: string }[] = [];
  const problems: string[] = [];

  for (const { need, assignment } of pending) {
    const unitNumber = assignment.equipment_id ? unitById.get(assignment.equipment_id) : undefined;
    if (!unitNumber) {
      problems.push(`${need.category}: no unit picked`);
      continue;
    }
    if (assignment.assignment_crew.length === 0) {
      problems.push(`${need.category} #${unitNumber}: no crew assigned`);
      continue;
    }
    for (const crew of assignment.assignment_crew) {
      const person = personById.get(crew.employee_id);
      tasks.push({
        assignmentId: assignment.id,
        label: person?.name ?? "Unknown crew member",
        phone: person?.phone ?? null,
        body: buildDispatchMessage({ job, need, unitNumber, crew }),
      });
    }
  }

  if (!tasks.length) {
    return {
      error: null,
      summary: problems.length ? `No texts sent.\n\n${problems.join("\n")}` : "Nothing to send.",
    };
  }

  const results = await Promise.all(
    tasks.map(async (task) => ({ task, result: await sendSms(task.phone, task.body) }))
  );

  let sent = 0;
  const failedAssignments = new Set<string>();
  for (const { task, result } of results) {
    if (result.ok) {
      sent++;
    } else {
      failedAssignments.add(task.assignmentId);
      problems.push(`${task.label}: ${result.error}`);
    }
  }

  // Mark a unit as texted only if every crew member on it actually got their text.
  const textedIds = Array.from(new Set(tasks.map((t) => t.assignmentId))).filter(
    (id) => !failedAssignments.has(id)
  );
  if (textedIds.length) {
    const { error } = await supabase.from("assignments").update({ texted: true }).in("id", textedIds);
    if (error) {
      return { error: `Texts were sent but could not be recorded: ${error.message}`, summary: null };
    }
  }

  revalidatePath("/daily");

  const lines = [`Sent ${sent} text${sent === 1 ? "" : "s"}.`];
  if (problems.length) lines.push("", "Needs attention:", ...problems);
  return { error: null, summary: lines.join("\n") };
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
