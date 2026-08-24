"use client";

import { useState, useTransition } from "react";
import { addCert, removeCert } from "./actions";

interface CertRow {
  id: string;
  cert_type: string;
  due_date: string;
  employee_id: string;
  employee_name: string;
  employee_role: string | null;
}
interface EmployeeOption {
  id: string;
  name: string;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";

function daysUntil(dateStr: string) {
  const due = new Date(dateStr + "T00:00:00").getTime();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return Math.round((due - today.getTime()) / (1000 * 60 * 60 * 24));
}

function statusFor(dateStr: string) {
  const n = daysUntil(dateStr);
  if (n < 0) return { label: "Expired", cls: "bg-red/15 text-red border-red/30", n };
  if (n <= 45) return { label: `Due in ${n}d`, cls: "bg-amber/15 text-amber border-amber/30", n };
  return { label: "Valid", cls: "bg-green/15 text-green border-green/30", n };
}

export function CertsClient({
  initialCerts,
  employees,
}: {
  initialCerts: CertRow[];
  employees: EmployeeOption[];
}) {
  const [certs, setCerts] = useState(initialCerts);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const sorted = [...certs].sort((a, b) => statusFor(a.due_date).n - statusFor(b.due_date).n);
  const expired = sorted.filter((c) => statusFor(c.due_date).n < 0).length;
  const soon = sorted.filter((c) => {
    const n = statusFor(c.due_date).n;
    return n >= 0 && n <= 45;
  }).length;
  const badPeople = [...new Set(sorted.filter((c) => statusFor(c.due_date).n < 0).map((c) => c.employee_name))];

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addCert(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        setAdding(false);
        window.location.reload();
      }
    });
  }

  function handleRemove(id: string) {
    setCerts((prev) => prev.filter((c) => c.id !== id));
    startTransition(() => {
      void removeCert(id);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Certifications &amp; Tickets</h1>
          <p className="text-muted text-sm mt-1">
            Every worker&apos;s tickets — sorted by what lapses next.
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
          + Add Ticket
        </button>
      </div>

      <div className="card-surface border-l-4 border-l-amber rounded-lg px-4 py-3 text-sm text-ink mb-5">
        🔔 An expired ticket means that person shouldn&apos;t be dispatched until it&apos;s renewed.
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mb-5">
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-red">{expired}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Expired</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-amber">{soon}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Expiring within 45 days</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-green">{sorted.length - expired - soon}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Valid</div>
        </div>
      </div>

      {badPeople.length > 0 && (
        <div className="card-surface border-l-4 border-l-red rounded-lg px-4 py-3 text-sm text-ink mb-5">
          ⚠️ <b>{badPeople.length} worker{badPeople.length === 1 ? "" : "s"} with an expired ticket:</b>{" "}
          {badPeople.join(", ")} — check before dispatching.
        </div>
      )}

      {adding && (
        <div className="card-surface rounded-xl p-5 mb-5">
          <h3 className="font-bold text-navy text-sm mb-3">Add a ticket</h3>
          <form action={handleAdd} className="grid grid-cols-3 gap-3">
            <select name="employee_id" required className={inputCls}>
              <option value="">Employee…</option>
              {employees.map((e) => (
                <option key={e.id} value={e.id}>
                  {e.name}
                </option>
              ))}
            </select>
            <input name="cert_type" required placeholder="e.g. H2S Alive" className={inputCls} />
            <input name="due_date" type="date" required className={inputCls} />
            {error && <div className="col-span-3 text-red text-sm">{error}</div>}
            <div className="col-span-3 flex gap-2">
              <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                + Add ticket
              </button>
              <button
                type="button"
                onClick={() => setAdding(false)}
                className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      <div className="card-surface rounded-xl overflow-hidden">
        <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
          🪪 All tickets <span className="text-muted font-normal">({sorted.length})</span>
        </h2>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Worker</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Ticket</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Expiry</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
              <th className="px-4 py-2.5 border-b border-line"></th>
            </tr>
          </thead>
          <tbody>
            {sorted.map((c) => {
              const st = statusFor(c.due_date);
              return (
                <tr key={c.id} className="border-b border-line hover:bg-card-2">
                  <td className="px-4 py-2.5">
                    <span className="font-bold text-navy">{c.employee_name}</span>
                    <div className="text-xs text-muted">{c.employee_role ?? ""}</div>
                  </td>
                  <td className="px-4 py-2.5">{c.cert_type}</td>
                  <td className="px-4 py-2.5">{c.due_date}</td>
                  <td className="px-4 py-2.5">
                    <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full border ${st.cls}`}>
                      {st.label}
                    </span>
                  </td>
                  <td className="px-4 py-2.5 text-right">
                    <button onClick={() => handleRemove(c.id)} className="text-muted hover:text-red">
                      🗑
                    </button>
                  </td>
                </tr>
              );
            })}
            {sorted.length === 0 && (
              <tr>
                <td colSpan={5} className="px-4 py-10 text-center text-muted">
                  No tickets on file yet.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
