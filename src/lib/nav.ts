export type Tier = "owner" | "staff" | "mech";

export interface NavItem {
  id: string;
  label: string;
  href: string;
  icon: string;
  group: "Dispatch" | "Projects" | "Maintenance" | "Admin";
}

export const NAV: NavItem[] = [
  { id: "dashboard", label: "Dashboard", href: "/dashboard", icon: "🏠", group: "Dispatch" },
  { id: "daily", label: "Daily Dispatch", href: "/daily", icon: "🗓️", group: "Dispatch" },
  { id: "calendar", label: "Jobs & Calendar", href: "/calendar", icon: "📆", group: "Dispatch" },
  { id: "status", label: "Status Board", href: "/status", icon: "📍", group: "Dispatch" },
  { id: "reports", label: "Reports", href: "/reports", icon: "📝", group: "Dispatch" },
  { id: "fleet", label: "Fleet", href: "/fleet", icon: "🚛", group: "Dispatch" },
  { id: "crew", label: "Crew", href: "/crew", icon: "👷", group: "Dispatch" },
  { id: "certs", label: "Certifications", href: "/certs", icon: "🪪", group: "Dispatch" },
  { id: "forecast", label: "Labour Forecast", href: "/forecast", icon: "🔢", group: "Dispatch" },
  { id: "projects", label: "Projects", href: "/projects", icon: "📋", group: "Projects" },
  { id: "shop", label: "Mechanic Work", href: "/shop", icon: "🔧", group: "Maintenance" },
  { id: "parts", label: "Parts to Order", href: "/parts", icon: "📦", group: "Maintenance" },
  { id: "inventory", label: "HP Blasting Inventory", href: "/inventory", icon: "💦", group: "Maintenance" },
  { id: "inspections", label: "Inspections", href: "/inspections", icon: "🧯", group: "Maintenance" },
  { id: "admin", label: "Admin", href: "/admin", icon: "⚙️", group: "Admin" },
];

export const NAV_BY_TIER: Record<Tier, string[]> = {
  owner: ["dashboard", "daily", "calendar", "status", "reports", "fleet", "crew", "certs", "forecast", "projects", "shop", "parts", "inventory", "inspections", "admin"],
  staff: ["dashboard", "daily", "calendar", "status", "reports", "fleet", "crew", "certs", "forecast", "projects", "shop", "parts", "inventory", "inspections"],
  mech: ["shop", "parts", "inventory", "inspections"],
};

export function navForTier(tier: Tier): NavItem[] {
  const allowed = NAV_BY_TIER[tier] ?? [];
  return NAV.filter((n) => allowed.includes(n.id));
}
