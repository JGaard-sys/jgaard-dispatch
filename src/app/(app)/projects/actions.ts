"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function createProject(formData: FormData) {
  const supabase = await createClient();
  const name = String(formData.get("name") ?? "").trim();
  const client = String(formData.get("client") ?? "").trim();
  const location = String(formData.get("location") ?? "").trim();
  const start_date = String(formData.get("start_date") ?? "");
  const end_date = String(formData.get("end_date") ?? "") || null;
  const status = String(formData.get("status") ?? "Planning");
  const description = String(formData.get("description") ?? "").trim();
  const is_24hr = formData.get("is_24hr") === "on";

  if (!name || !start_date) return { error: "Project name and start date are required." };

  const { data, error } = await supabase
    .from("projects")
    .insert({ name, client: client || null, location: location || null, start_date, end_date, status, description: description || null, is_24hr })
    .select("id")
    .single();

  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null, id: data.id as string };
}

export async function updateProjectField(id: string, field: string, value: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").update({ [field]: value }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function deleteProject(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("projects").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function addProjectUnit(projectId: string, category: string, qty: number) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_units").insert({ project_id: projectId, category, quantity: qty });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function removeProjectUnit(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_units").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function addLoadItem(projectId: string, itemName: string, qty: number) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("project_load_items")
    .insert({ project_id: projectId, item_name: itemName, quantity: qty });
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function toggleLoadItem(id: string, packed: boolean) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_load_items").update({ packed }).eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}

export async function removeLoadItem(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("project_load_items").delete().eq("id", id);
  if (error) return { error: error.message };
  revalidatePath("/projects");
  return { error: null };
}
