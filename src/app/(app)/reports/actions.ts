"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { getProfile } from "@/lib/get-profile";

export async function submitReport(formData: FormData) {
  const supabase = await createClient();
  const profile = await getProfile();

  const week_start = String(formData.get("week_start") ?? "");
  const last_week = String(formData.get("last_week") ?? "").trim();
  const next_week = String(formData.get("next_week") ?? "").trim();
  const attention = String(formData.get("attention") ?? "").trim();

  if (!week_start) return { error: "Week is required." };

  const { error } = await supabase.from("weekly_reports").insert({
    profile_id: profile.id,
    who_name: profile.name,
    role: profile.title,
    week_start,
    last_week: last_week || null,
    next_week: next_week || null,
    attention: attention || null,
  });
  if (error) return { error: error.message };

  revalidatePath("/reports");
  return { error: null };
}
