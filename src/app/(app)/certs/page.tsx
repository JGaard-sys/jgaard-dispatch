import { createClient } from "@/lib/supabase/server";
import { CertsClient } from "./CertsClient";

export default async function CertsPage() {
  const supabase = await createClient();

  const [{ data: certs }, { data: employees }] = await Promise.all([
    supabase
      .from("employee_certs")
      .select("id, cert_type, due_date, employee_id, employees(name, role)")
      .order("due_date"),
    supabase.from("employees").select("id, name").eq("active", true).order("name"),
  ]);

  const flat = (certs ?? []).map((c) => {
    const emp = Array.isArray(c.employees) ? c.employees[0] : c.employees;
    return {
      id: c.id,
      cert_type: c.cert_type,
      due_date: c.due_date,
      employee_id: c.employee_id,
      employee_name: emp?.name ?? "Unknown",
      employee_role: emp?.role ?? null,
    };
  });

  return <CertsClient initialCerts={flat} employees={employees ?? []} />;
}
