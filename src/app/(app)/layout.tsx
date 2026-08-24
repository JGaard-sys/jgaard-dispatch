import { getProfile, effectiveTier } from "@/lib/get-profile";
import { navForTier } from "@/lib/nav";
import { Sidebar } from "@/components/Sidebar";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const profile = await getProfile();
  const tier = effectiveTier(profile);
  const items = navForTier(tier);

  const initials =
    profile.avatar_initials ??
    profile.name
      .split(" ")
      .map((p) => p[0])
      .join("")
      .slice(0, 2)
      .toUpperCase();

  return (
    <div className="flex flex-col md:flex-row min-h-screen bg-bg">
      <Sidebar
        items={items}
        userLabel={profile.short_name ?? profile.name}
        userInitials={initials}
        actingOwner={profile.acting_owner}
      />
      <main className="flex-1 p-4 md:p-6 max-w-[1400px] w-full">{children}</main>
    </div>
  );
}
