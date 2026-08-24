import { createClient } from "@/lib/supabase/server";
import { getProfile } from "@/lib/get-profile";
import { PageHead, Tile, TileRow, Card } from "@/components/ui";
import Link from "next/link";

export default async function DashboardPage() {
  const profile = await getProfile();
  const supabase = await createClient();

  const today = new Date().toISOString().slice(0, 10);

  const [
    { count: unitsAvailable },
    { count: unitsOut },
    { count: unitsInShop },
    { count: jobsToday },
    { count: openWorkOrders },
    { count: priorityWorkOrders },
    { count: certsExpired },
    { data: lowStockGear },
  ] = await Promise.all([
    supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "Available").eq("active", true),
    supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "Out").eq("active", true),
    supabase.from("equipment").select("*", { count: "exact", head: true }).eq("status", "In shop").eq("active", true),
    supabase.from("jobs").select("*", { count: "exact", head: true }).eq("job_date", today).is("completed_at", null),
    supabase.from("work_orders").select("*", { count: "exact", head: true }).in("status", ["Open", "In progress"]),
    supabase.from("work_orders").select("*", { count: "exact", head: true }).in("status", ["Open", "In progress"]).in("priority", ["Safety", "High"]),
    supabase.from("employee_certs").select("*", { count: "exact", head: true }).lt("due_date", today),
    supabase.rpc("count_low_stock_gear"),
  ]);

  const lowStockCount = typeof lowStockGear === "number" ? lowStockGear : 0;

  return (
    <div>
      <PageHead
        title={`Welcome back, ${profile.short_name ?? profile.name}`}
        subtitle="Here's what's happening across the operation right now."
      />

      <TileRow>
        <Link href="/status">
          <Tile value={unitsAvailable ?? 0} label="Units available" color="var(--green)" />
        </Link>
        <Link href="/status">
          <Tile value={unitsOut ?? 0} label="Units out on jobs" color="var(--blue)" />
        </Link>
        <Link href="/status">
          <Tile value={unitsInShop ?? 0} label="In the shop" color="var(--amber)" />
        </Link>
        <Link href="/daily">
          <Tile value={jobsToday ?? 0} label="Jobs today" color="var(--navy)" />
        </Link>
      </TileRow>

      <TileRow>
        <Link href="/shop">
          <Tile value={priorityWorkOrders ?? 0} label="Needs attention now" color="var(--red)" />
        </Link>
        <Link href="/shop">
          <Tile value={openWorkOrders ?? 0} label="Open work orders" color="var(--blue)" />
        </Link>
        <Link href="/certs">
          <Tile value={certsExpired ?? 0} label="Expired certs" color="var(--red)" />
        </Link>
        <Link href="/inventory">
          <Tile value={lowStockCount} label="HP gear low stock" color="var(--amber)" />
        </Link>
      </TileRow>

      <Card title="Quick links">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3 p-4">
          {[
            { href: "/daily", label: "🗓️ Daily Dispatch" },
            { href: "/status", label: "📍 Status Board" },
            { href: "/fleet", label: "🚛 Fleet" },
            { href: "/crew", label: "👷 Crew" },
            { href: "/shop", label: "🔧 Mechanic Work" },
            { href: "/inventory", label: "💦 HP Blasting Inventory" },
          ].map((l) => (
            <Link
              key={l.href}
              href={l.href}
              className="bg-card-2 border border-line rounded-lg px-4 py-3 text-sm font-semibold text-ink hover:border-steel"
            >
              {l.label}
            </Link>
          ))}
        </div>
      </Card>
    </div>
  );
}
