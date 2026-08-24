"use client";

import { useState, useTransition } from "react";
import { addPart, setPartStatus } from "./actions";

interface PartRow {
  id: number;
  name: string;
  quantity: number;
  status: "To order" | "Ordered" | "Received";
  note: string | null;
  for_equipment_id: string | null;
  unit_number: string | null;
}
interface EquipmentOption {
  id: string;
  unit_number: string;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";

function PartsSection({ title, list, onStatus }: { title: string; list: PartRow[]; onStatus: (id: number, status: PartRow["status"]) => void }) {
  return (
    <div className="card-surface rounded-xl mb-5 overflow-hidden">
      <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
        {title} <span className="text-muted font-normal">({list.length})</span>
      </h2>
      <table className="w-full text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
            <th className="text-left px-4 py-2.5 border-b border-line">Part</th>
            <th className="text-left px-4 py-2.5 border-b border-line">For</th>
            <th className="text-left px-4 py-2.5 border-b border-line">Qty</th>
            <th className="px-4 py-2.5 border-b border-line"></th>
          </tr>
        </thead>
        <tbody>
          {list.map((p) => (
            <tr key={p.id} className="border-b border-line">
              <td className="px-4 py-2.5">
                <span className="font-bold text-navy">{p.name}</span>
                {p.note && <div className="text-xs text-muted">{p.note}</div>}
              </td>
              <td className="px-4 py-2.5">
                {p.unit_number ? (
                  <span className="text-xs font-bold bg-card-2 border border-line rounded px-1.5 py-0.5">
                    Unit {p.unit_number}
                  </span>
                ) : (
                  <span className="text-xs font-bold bg-card-2 border border-line rounded px-1.5 py-0.5">🏭 Shop</span>
                )}
              </td>
              <td className="px-4 py-2.5">{p.quantity}</td>
              <td className="px-4 py-2.5 text-right whitespace-nowrap">
                {p.status === "To order" && (
                  <>
                    <button
                      onClick={() => onStatus(p.id, "Ordered")}
                      className="bg-card-2 border border-line text-steel-2 text-xs font-semibold px-2.5 py-1.5 rounded-md mr-1.5"
                    >
                      Mark ordered
                    </button>
                    <button
                      onClick={() => onStatus(p.id, "Received")}
                      className="bg-green/15 border border-green/30 text-green text-xs font-bold px-2.5 py-1.5 rounded-md"
                    >
                      ✓ Have it
                    </button>
                  </>
                )}
                {p.status === "Ordered" && (
                  <button
                    onClick={() => onStatus(p.id, "Received")}
                    className="bg-green/15 border border-green/30 text-green text-xs font-bold px-2.5 py-1.5 rounded-md"
                  >
                    ✓ Have it
                  </button>
                )}
                {p.status === "Received" && (
                  <span className="text-xs font-bold bg-green/15 text-green border border-green/30 rounded-full px-2 py-1">
                    ✓ Received
                  </span>
                )}
              </td>
            </tr>
          ))}
          {list.length === 0 && (
            <tr>
              <td colSpan={4} className="px-4 py-6 text-center text-muted">
                None.
              </td>
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
}

export function PartsClient({
  initialParts,
  equipment,
}: {
  initialParts: PartRow[];
  equipment: EquipmentOption[];
}) {
  const [parts, setParts] = useState(initialParts);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  const order = parts.filter((p) => p.status === "To order");
  const ordered = parts.filter((p) => p.status === "Ordered");
  const received = parts.filter((p) => p.status === "Received");

  function handleAdd(formData: FormData) {
    startTransition(async () => {
      const result = await addPart(formData);
      if (result?.error) setError(result.error);
      else {
        setError(null);
        setAdding(false);
        window.location.reload();
      }
    });
  }

  function handleStatus(id: number, status: PartRow["status"]) {
    setParts((prev) => prev.map((p) => (p.id === id ? { ...p, status } : p)));
    startTransition(() => {
      void setPartStatus(id, status);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Parts to Order</h1>
          <p className="text-muted text-sm mt-1">
            Parts needed for a unit or for the shop. Mark them ordered, then received as they arrive.
          </p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
          + Add Part
        </button>
      </div>

      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-amber">{order.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">To order</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-blue">{ordered.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Ordered</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-green">{received.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Received</div>
        </div>
      </div>

      {adding && (
        <div className="card-surface rounded-xl p-5 mb-5">
          <h3 className="font-bold text-navy text-sm mb-3">Add a part</h3>
          <form action={handleAdd} className="grid grid-cols-2 gap-3">
            <input name="name" required placeholder="Part name" className={inputCls} />
            <select name="for_equipment_id" className={inputCls}>
              <option value="">🏭 Shop stock (not unit-specific)</option>
              {equipment.map((u) => (
                <option key={u.id} value={u.id}>
                  Unit {u.unit_number}
                </option>
              ))}
            </select>
            <input name="quantity" type="number" min={1} defaultValue={1} className={inputCls} />
            <input name="note" placeholder="Note (optional)" className={inputCls} />
            {error && <div className="col-span-2 text-red text-sm">{error}</div>}
            <div className="col-span-2 flex gap-2">
              <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                + Add part
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

      <PartsSection title="🟠 To order" list={order} onStatus={handleStatus} />
      <PartsSection title="🔵 Ordered" list={ordered} onStatus={handleStatus} />
      <PartsSection title="🟢 Received" list={received} onStatus={handleStatus} />
    </div>
  );
}
