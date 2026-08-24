import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getProfile, effectiveTier } from "@/lib/get-profile";
import { AdminClient } from "./AdminClient";

export default async function AdminPage() {
  const profile = await getProfile();
  if (effectiveTier(profile) !== "owner") redirect("/dashboard");

  const supabase = await createClient();
  const [{ data: profiles }, { data: standardCrew }, { data: pinRow }] = await Promise.all([
    supabase.from("profiles").select("id, name, title, tier, acting_owner").order("name"),
    supabase.from("standard_crew").select("category, operators, laborers"),
    supabase.from("app_settings").select("value").eq("key", "auth_pin").single(),
  ]);

  return (
    <AdminClient
      initialProfiles={profiles ?? []}
      initialStandardCrew={standardCrew ?? []}
      initialPin={pinRow?.value ?? "4021"}
    />
  );
}
