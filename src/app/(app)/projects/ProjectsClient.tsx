"use client";

import { useState, useTransition } from "react";
import {
  createProject,
  deleteProject,
  addProjectUnit,
  removeProjectUnit,
  addLoadItem,
  toggleLoadItem,
  removeLoadItem,
} from "./actions";
import { EQUIPMENT_CATEGORIES } from "@/lib/crew-constants";

interface ProjectUnit {
  id: string;
  category: string;
  quantity: number;
}
interface LoadItem {
  id: string;
  item_name: string;
  quantity: number;
  packed: boolean;
}
export interface ProjectRow {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  start_date: string;
  end_date: string | null;
  status: string;
  description: string | null;
  is_24hr: boolean;
  project_units: ProjectUnit[];
  project_load_items: LoadItem[];
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";
const STATUSES = ["Planning", "Quoted", "Scheduled", "Active", "Complete"];
const STATUS_STYLE: Record<string, string> = {
  Planning: "bg-card-2 text-muted border-line",
  Quoted: "bg-amber/15 text-amber border-amber/30",
  Scheduled: "bg-blue/15 text-blue border-blue/30",
  Active: "bg-green/15 text-green border-green/30",
  Complete: "bg-card-2 text-muted border-line",
};

function dateRange(p: ProjectRow) {
  if (!p.end_date || p.end_date === p.start_date) return p.start_date;
  return `${p.start_date} – ${p.end_date}`;
}

export function ProjectsClient({ initialProjects }: { initialProjects: ProjectRow[] }) {
  const [projects, setProjects] = useState(initialProjects);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const sorted = [...projects].sort((a, b) => a.start_date.localeCompare(b.start_date));
  const selected = projects.find((p) => p.id === selectedId) ?? null;

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createProject(formData);
      if (!result?.error) window.location.reload();
    });
  }
  function handleDelete(id: string) {
    setProjects((prev) => prev.filter((p) => p.id !== id));
    if (selectedId === id) setSelectedId(null);
    startTransition(() => {
      void deleteProject(id);
    });
  }
  function refresh() {
    window.location.reload();
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Projects</h1>
          <p className="text-muted text-sm mt-1">
            Larger, planned jobs — multi-unit, with equipment needs and a load list.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setSelectedId(null);
          }}
          className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg"
        >
          + New project
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
        <div className="card-surface rounded-xl overflow-hidden">
          <h3 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
            Projects <span className="text-muted font-normal">({sorted.length})</span>
          </h3>
          <div className="max-h-[70vh] overflow-y-auto">
            {sorted.map((p) => (
              <div
                key={p.id}
                onClick={() => {
                  setSelectedId(p.id);
                  setAdding(false);
                }}
                className={`px-4 py-3 border-b border-line cursor-pointer ${
                  selectedId === p.id ? "bg-card-2" : "hover:bg-card-2"
                }`}
              >
                <div className="flex items-center gap-2">
                  <span className="font-bold text-sm text-navy">{p.name}</span>
                  <span
                    className={`ml-auto text-[10px] font-bold rounded px-1.5 py-0.5 border ${STATUS_STYLE[p.status] ?? ""}`}
                  >
                    {p.status}
                  </span>
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {p.client ?? "—"} · {p.location ?? "—"}
                </div>
                <div className="text-xs text-muted mt-0.5">📅 {dateRange(p)}</div>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-muted text-sm">No projects yet — add one.</div>
            )}
          </div>
        </div>

        <div>
          {adding && (
            <div className="card-surface rounded-xl p-5">
              <h3 className="font-bold text-navy text-sm mb-3">New project</h3>
              <form action={handleCreate} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">Project name *</label>
                  <input name="name" required className={inputCls + " w-full"} />
                </div>
                <input name="client" placeholder="Client" className={inputCls} />
                <input name="location" placeholder="Location" className={inputCls} />
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Start *</label>
                  <input name="start_date" type="date" required className={inputCls + " w-full"} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">End</label>
                  <input name="end_date" type="date" className={inputCls + " w-full"} />
                </div>
                <select name="status" className={inputCls}>
                  {STATUSES.map((s) => (
                    <option key={s}>{s}</option>
                  ))}
                </select>
                <label className="flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="is_24hr" defaultChecked className="w-4 h-4" />
                  24-hr (day + night crew)
                </label>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">Description / scope</label>
                  <textarea name="description" rows={3} className={inputCls + " w-full"} />
                </div>
                <div className="col-span-2 flex gap-2">
                  <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                    ＋ Create project
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
            <ProjectDetail project={selected} onDelete={() => handleDelete(selected.id)} onChange={refresh} />
          )}

          {!adding && !selected && (
            <div className="card-surface rounded-xl p-8 text-center text-muted text-sm">
              👈 Pick a project to see its equipment needs and load list, or add a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function ProjectDetail({
  project,
  onDelete,
  onChange,
}: {
  project: ProjectRow;
  onDelete: () => void;
  onChange: () => void;
}) {
  const [unitCat, setUnitCat] = useState(EQUIPMENT_CATEGORIES[0]);
  const [unitQty, setUnitQty] = useState(1);
  const [loadName, setLoadName] = useState("");
  const [loadQty, setLoadQty] = useState(1);
  const [, startTransition] = useTransition();

  const packedCount = project.project_load_items.filter((l) => l.packed).length;

  function addUnit() {
    startTransition(async () => {
      await addProjectUnit(project.id, unitCat, unitQty);
      onChange();
    });
  }
  function removeUnit(id: string) {
    startTransition(async () => {
      await removeProjectUnit(id);
      onChange();
    });
  }
  function addLoad() {
    if (!loadName.trim()) return;
    startTransition(async () => {
      await addLoadItem(project.id, loadName.trim(), loadQty);
      setLoadName("");
      setLoadQty(1);
      onChange();
    });
  }
  function togglePacked(id: string, packed: boolean) {
    startTransition(async () => {
      await toggleLoadItem(id, packed);
      onChange();
    });
  }
  function removeLoad(id: string) {
    startTransition(async () => {
      await removeLoadItem(id);
      onChange();
    });
  }

  return (
    <div className="card-surface rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-navy text-lg">{project.name}</h2>
        <button onClick={onDelete} className="text-muted hover:text-red">
          🗑
        </button>
      </div>
      <div className="text-sm text-muted mb-3">
        {project.client ?? "—"} · {project.location ?? "—"} · {dateRange(project)}
      </div>
      {project.description && <p className="text-sm text-ink mb-4">{project.description}</p>}

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-4">
        🚛 Equipment needed ({project.project_units.reduce((s, u) => s + u.quantity, 0)})
      </div>
      {project.project_units.map((u) => (
        <div
          key={u.id}
          className="flex items-center gap-2 bg-card-2 border border-line rounded-lg px-3 py-2 mb-2 text-sm"
        >
          <span className="font-semibold text-navy">{u.category}</span>
          <span className="text-muted">× {u.quantity}</span>
          <button onClick={() => removeUnit(u.id)} className="ml-auto text-muted hover:text-red">
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <select value={unitCat} onChange={(e) => setUnitCat(e.target.value)} className={`${inputCls} flex-1`}>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c}>{c}</option>
          ))}
        </select>
        <input
          type="number"
          min={1}
          value={unitQty}
          onChange={(e) => setUnitQty(parseInt(e.target.value) || 1)}
          className={`${inputCls} w-20`}
        />
        <button onClick={addUnit} className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg">
          + Add equipment
        </button>
      </div>

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-6">
        📦 Load list ({packedCount}/{project.project_load_items.length} packed)
      </div>
      {project.project_load_items.map((l) => (
        <div key={l.id} className="flex items-center gap-2 mb-1.5">
          <input
            type="checkbox"
            checked={l.packed}
            onChange={(e) => togglePacked(l.id, e.target.checked)}
            className="w-4 h-4"
          />
          <span className={`text-sm flex-1 ${l.packed ? "line-through text-muted" : "text-ink"}`}>
            {l.item_name}
          </span>
          <span className="text-xs text-muted">× {l.quantity}</span>
          <button onClick={() => removeLoad(l.id)} className="text-muted hover:text-red">
            ×
          </button>
        </div>
      ))}
      <div className="flex gap-2 mt-2">
        <input
          value={loadName}
          onChange={(e) => setLoadName(e.target.value)}
          placeholder="Item to pack"
          className={`${inputCls} flex-1`}
        />
        <input
          type="number"
          min={1}
          value={loadQty}
          onChange={(e) => setLoadQty(parseInt(e.target.value) || 1)}
          className={`${inputCls} w-20`}
        />
        <button onClick={addLoad} className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg">
          + Add item
        </button>
      </div>
    </div>
  );
}
