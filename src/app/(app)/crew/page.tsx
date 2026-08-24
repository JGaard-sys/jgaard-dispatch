import { createClient } from "@/lib/supabase/server";
import { PageHead, Card, StatusPill } from "@/components/ui";
import { AddEmployeeForm } from "./AddEmployeeForm";

export default async function CrewPage() {
  const supabase = await createClient();
  const { data: employees } = await supabase
    .from("employees")
    .select("id, name, position, phone, role, shift_status")
    .eq("active", true)
    .order("name");

  const crew = employees ?? [];

  return (
    <div>
      <PageHead
        title="Crew"
        subtitle="Who's available, who's out, and who's on shift."
        action={<AddEmployeeForm />}
      />

      <Card title="👷 All employees" count={crew.length}>
        <table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Name</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Position</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Phone</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Shift</th>
            </tr>
          </thead>
          <tbody>
            {crew.map((e) => (
              <tr key={e.id} className="border-b border-line hover:bg-card-2">
                <td className="px-4 py-2.5 font-bold text-navy">{e.name}</td>
                <td className="px-4 py-2.5">{e.position ?? "—"}</td>
                <td className="px-4 py-2.5">{e.phone ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <StatusPill status={e.shift_status === "off" ? "Off" : "Available"} />
                </td>
              </tr>
            ))}
            {crew.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-10 text-center text-muted">
                  No employees yet — click &quot;+ Add Employee&quot; to add your first one.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </Card>
    </div>
  );
}
