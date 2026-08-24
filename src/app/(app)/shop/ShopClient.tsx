"use client";

import { useMemo, useState, useTransition } from "react";
import {
  createWorkOrder,
  updateWOStatus,
  updateWOPriority,
  assignMechanic,
  addWONote,
  addWOPart,
  startTimer,
  stopTimer,
} from "./actions";

interface Note {
  id: string;
  note: string;
  created_at: string;
}
interface PartUsed {
  id: string;
  part_name: string;
  quantity: number;
}
interface TimeEntry {
  id: string;
  mechanic_id: string;
  started_at: string;
  stopped_at: string | null;
}
export interface WorkOrderRow {
  id: number;
  equipment_id: string;
  unit_number: string;
  description: string;
  operator_report: string | null;
  priority: "Safety" | "High" | "When time";
  status: "Open" | "In progress" | "Done";
  assigned_mechanic_id: string | null;
  reported_by: string | null;
  opened_at: string;
  wo_notes: Note[];
  wo_parts_used: PartUsed[];
  time_entries: TimeEntry[];
}
interface EquipmentOption {
  id: string;
  unit_number: string;
}
interface MechanicOption {
  id: string;
  name: string;
  hourly_rate: number | null;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";
const PRI_STYLE: Record<string, string> = {
  Safety: "bg-red/15 text-red border-red/30",
  High: "bg-amber/15 text-amber border-amber/30",
  "When time": "bg-card-2 text-muted border-line",
};

function isPriority(w: WorkOrderRow) {
  return w.status === "In progress" || w.priority === "Safety" || w.priority === "High";
}
function durationHours(entry: TimeEntry) {
  const start = new Date(entry.started_at).getTime();
  const end = entry.stopped_at ? new Date(entry.stopped_at).getTime() : Date.now();
  return (end - start) / (1000 * 60 * 60);
}
function fmtDur(hours: number) {
  const h = Math.floor(hours);
  const m = Math.round((hours - h) * 60);
  return `${h}h ${m}m`;
}

export function ShopClient({
  initialWOs,
  equipment,
  mechanics,
  currentMechanicId,
}: {
  initialWOs: WorkOrderRow[];
  equipment: EquipmentOption[];
  mechanics: MechanicOption[];
  currentMechanicId: string | null;
}) {
  const [wos] = useState(initialWOs);
  const [selectedId, setSelectedId] = useState<number | null>(null);
  const [adding, setAdding] = useState(false);
  const [showBacklog, setShowBacklog] = useState(false);
  const [, startTransition] = useTransition();

  const open = wos.filter((w) => w.status !== "Done");
  const priority = open.filter(isPriority);
  const backlog = open.filter((w) => !isPriority(w));
  const selected = wos.find((w) => w.id === selectedId) ?? null;

  const mechHours = useMemo(() => {
    const map: Record<string, number> = {};
    wos.forEach((w) => w.time_entries.forEach((t) => (map[t.mechanic_id] = (map[t.mechanic_id] ?? 0) + durationHours(t))));
    return map;
  }, [wos]);
  const totalCost = Object.entries(mechHours).reduce((sum, [mechId, hrs]) => {
    const rate = mechanics.find((m) => m.id === mechId)?.hourly_rate ?? 0;
    return sum + hrs * rate;
  }, 0);

  function refresh() {
    window.location.reload();
  }
  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createWorkOrder(formData);
      if (!result?.error) refresh();
    });
  }

  function Row({ w }: { w: WorkOrderRow }) {
    return (
      <div
        onClick={() => setSelectedId(w.id)}
        className={`px-4 py-3 border-b border-line cursor-pointer ${
          selectedId === w.id ? "bg-card-2" : "hover:bg-card-2"
        }`}
      >
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-navy">Unit {w.unit_number}</span>
          <span className={`text-[10px] font-bold rounded px-1.5 py-0.5 border ${PRI_STYLE[w.priority]}`}>
            {w.priority}
          </span>
          {w.status === "In progress" && (
            <span className="text-[10px] font-bold bg-blue/15 text-blue border border-blue/30 rounded px-1.5 py-0.5">
              IN PROGRESS
            </span>
          )}
        </div>
        <div className="text-xs text-muted mt-0.5 line-clamp-1">{w.description}</div>
      </div>
    );
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Mechanic Work</h1>
          <p className="text-muted text-sm mt-1">
            Priority repairs up top. Everything else sits in the backlog until there&apos;s time.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setSelectedId(null);
          }}
          className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg"
        >
          + New work order
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-red">{priority.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Needs attention now</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-muted">{backlog.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Backlog</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-blue">
            {Object.values(mechHours).reduce((s, h) => s + h, 0).toFixed(1)}h
          </div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Labour logged</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-green">${totalCost.toFixed(0)}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Labour cost</div>
        </div>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-5">
        <div>
          <div className="card-surface rounded-xl overflow-hidden mb-4">
            <h3 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
              🔧 Needs attention now <span className="text-muted font-normal">({priority.length})</span>
            </h3>
            {priority.map((w) => (
              <Row key={w.id} w={w} />
            ))}
            {priority.length === 0 && (
              <div className="px-4 py-6 text-center text-muted text-sm">Nothing urgent right now 🎉</div>
            )}
          </div>

          <div className="card-surface rounded-xl overflow-hidden">
            <h3
              onClick={() => setShowBacklog(!showBacklog)}
              className="text-sm font-bold text-navy px-4 py-3 border-b border-line cursor-pointer flex items-center gap-2"
            >
              🗂️ When there&apos;s time <span className="text-muted font-normal">({backlog.length})</span>
              <span className="ml-auto text-muted font-normal text-xs">{showBacklog ? "▾ hide" : "▸ show"}</span>
            </h3>
            {showBacklog && backlog.map((w) => <Row key={w.id} w={w} />)}
            {showBacklog && backlog.length === 0 && (
              <div className="px-4 py-6 text-center text-muted text-sm">Backlog is clear.</div>
            )}
          </div>
        </div>

        <div>
          {adding && (
            <div className="card-surface rounded-xl p-5">
              <h3 className="font-bold text-navy text-sm mb-3">New work order</h3>
              <form action={handleCreate} className="grid grid-cols-2 gap-3">
                <select name="equipment_id" required className={inputCls}>
                  <option value="">Unit…</option>
                  {equipment.map((u) => (
                    <option key={u.id} value={u.id}>
                      Unit {u.unit_number}
                    </option>
                  ))}
                </select>
                <select name="priority" defaultValue="When time" className={inputCls}>
                  <option value="Safety">Safety — stop the unit, fix now</option>
                  <option value="High">High — needs doing soon</option>
                  <option value="When time">When there&apos;s time — backlog</option>
                </select>
                <input name="reported_by" placeholder="Operator's name" className={inputCls + " col-span-2"} />
                <textarea
                  name="operator_report"
                  placeholder="What the operator reported (paste their text)"
                  rows={2}
                  className={inputCls + " col-span-2"}
                />
                <textarea
                  name="description"
                  required
                  placeholder="What needs to be done"
                  rows={2}
                  className={inputCls + " col-span-2"}
                />
                <div className="col-span-2 flex gap-2">
                  <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                    + Create work order
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

          {!adding && selected && (
            <WODetail wo={selected} mechanics={mechanics} currentMechanicId={currentMechanicId} onChange={refresh} />
          )}

          {!adding && !selected && (
            <div className="card-surface rounded-xl p-8 text-center text-muted text-sm">
              👈 Pick a work order to clock on, add parts, or leave a note.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function WODetail({
  wo,
  mechanics,
  currentMechanicId,
  onChange,
}: {
  wo: WorkOrderRow;
  mechanics: MechanicOption[];
  currentMechanicId: string | null;
  onChange: () => void;
}) {
  const [note, setNote] = useState("");
  const [partName, setPartName] = useState("");
  const [partQty, setPartQty] = useState(1);
  const [, startTransition] = useTransition();

  const runningEntry = wo.time_entries.find((t) => !t.stopped_at);

  function act(fn: () => Promise<unknown>) {
    startTransition(async () => {
      await fn();
      onChange();
    });
  }

  return (
    <div className="card-surface rounded-xl p-5">
      <div className="flex items-center gap-2 mb-1">
        <h2 className="font-bold text-navy text-lg">Unit {wo.unit_number}</h2>
        <span className={`text-xs font-bold rounded px-2 py-0.5 border ${PRI_STYLE[wo.priority]}`}>{wo.priority}</span>
      </div>
      <p className="text-sm text-ink mb-2">{wo.description}</p>
      {wo.operator_report && (
        <p className="text-xs text-muted mb-3">📱 {wo.operator_report} {wo.reported_by ? `— ${wo.reported_by}` : ""}</p>
      )}

      <div className="flex gap-2 flex-wrap mb-4">
        <select
          value={wo.priority}
          onChange={(e) => act(() => updateWOPriority(wo.id, e.target.value as WorkOrderRow["priority"]))}
          className={inputCls}
        >
          <option value="Safety">Safety</option>
          <option value="High">High</option>
          <option value="When time">When time</option>
        </select>
        <select
          value={wo.status}
          onChange={(e) => act(() => updateWOStatus(wo.id, e.target.value as WorkOrderRow["status"]))}
          className={inputCls}
        >
          <option value="Open">Open</option>
          <option value="In progress">In progress</option>
          <option value="Done">Done</option>
        </select>
        <select
          value={wo.assigned_mechanic_id ?? ""}
          onChange={(e) => act(() => assignMechanic(wo.id, e.target.value))}
          className={inputCls}
        >
          <option value="">Unassigned</option>
          {mechanics.map((m) => (
            <option key={m.id} value={m.id}>
              {m.name}
            </option>
          ))}
        </select>
      </div>

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">⏱️ Time tracking</div>
      <div className="mb-3">
        {wo.time_entries.map((t) => {
          const mech = mechanics.find((m) => m.id === t.mechanic_id);
          return (
            <div key={t.id} className="flex items-center gap-2 text-sm mb-1">
              <span className="font-semibold">{mech?.name ?? "?"}</span>
              <span className="text-muted">{fmtDur(durationHours(t))}</span>
              {!t.stopped_at && (
                <button
                  onClick={() => act(() => stopTimer(t.id))}
                  className="ml-auto bg-red/15 border border-red/30 text-red text-xs font-bold px-2.5 py-1 rounded-md"
                >
                  ⏹ Stop
                </button>
              )}
            </div>
          );
        })}
        {!runningEntry && (
          <select
            defaultValue=""
            onChange={(e) => {
              if (e.target.value) act(() => startTimer(wo.id, e.target.value));
            }}
            className={`${inputCls} mt-1`}
          >
            <option value="" disabled>
              ▶ Start timer as…
            </option>
            {(currentMechanicId ? mechanics.filter((m) => m.id === currentMechanicId) : mechanics).map((m) => (
              <option key={m.id} value={m.id}>
                {m.name}
              </option>
            ))}
          </select>
        )}
      </div>

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">🔩 Parts used</div>
      <div className="mb-2">
        {wo.wo_parts_used.map((p) => (
          <div key={p.id} className="text-sm text-ink mb-1">
            {p.part_name} × {p.quantity}
          </div>
        ))}
      </div>
      <div className="flex gap-2 mb-4">
        <input value={partName} onChange={(e) => setPartName(e.target.value)} placeholder="Part name" className={`${inputCls} flex-1`} />
        <input
          type="number"
          min={1}
          value={partQty}
          onChange={(e) => setPartQty(parseInt(e.target.value) || 1)}
          className={`${inputCls} w-16`}
        />
        <button
          onClick={() => {
            act(() => addWOPart(wo.id, partName, partQty));
            setPartName("");
            setPartQty(1);
          }}
          className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-3 py-2 rounded-lg"
        >
          + Add
        </button>
      </div>

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2">📝 Notes</div>
      {wo.wo_notes.map((n) => (
        <div key={n.id} className="text-sm text-ink bg-card-2 rounded-md px-3 py-2 mb-1.5">
          {n.note}
        </div>
      ))}
      <div className="flex gap-2">
        <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="Add a note" className={`${inputCls} flex-1`} />
        <button
          onClick={() => {
            act(() => addWONote(wo.id, note));
            setNote("");
          }}
          className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-3 py-2 rounded-lg"
        >
          + Add
        </button>
      </div>
    </div>
  );
}
