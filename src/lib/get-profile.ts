import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import type { Tier } from "@/lib/nav";

export interface Profile {
  id: string;
  name: string;
  short_name: string | null;
  avatar_initials: string | null;
  tier: Tier;
  title: string | null;
  acting_owner: boolean;
}

/** Fetches the signed-in user's profile. Redirects to /login if not signed in. */
export async function getProfile(): Promise<Profile> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, name, short_name, avatar_initials, tier, title, acting_owner")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  return profile as Profile;
}

/** Effective tier — acting-owner delegation grants full owner access. */
export function effectiveTier(profile: Profile): Tier {
  return profile.acting_owner ? "owner" : profile.tier;
}
