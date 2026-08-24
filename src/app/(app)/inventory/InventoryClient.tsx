"use client";

import { useMemo, useState, useTransition } from "react";
import {
  addGearItem,
  updateGearField,
  updateGearMin,
  adjustGearQty,
  removeGearItem,
  addGearCategory,
} from "./actions";

export interface GearItem {
  id: string;
  name: string;
  category: string;
  spec: string | null;
  quantity: number;
  min_quantity: number;
  location: string | null;
  condition: "Good" | "Needs repair" | "Retired";
}

const inputCls =
  "w-full bg-card-2 border border-line rounded-md px-2 py-1.5 text-[13px] text-ink outline-none focus:border-steel";

function statusFor(g: GearItem) {
  if (g.condition === "Retired") return { label: "Retired", cls: "bg-card-2 text-muted border-line" };
  if (g.quantity <= 0) return { label: "Out of stock", cls: "bg-red/15 text-red border-red/30" };
  if (g.quantity < g.min_quantity) return { label: "Low stock", cls: "bg-amber/15 text-amber border-amber/30" };
  return { label: "In stock", cls: "bg-green/15 text-green border-green/30" };
}

export function InventoryClient({
  initialItems,
  initialCategories,
}: {
  initialItems: GearItem[];
  initialCategories: string[];
}) {
  const [items, setItems] = useState(initialItems);
  const [categories, setCategories] = useState(initialCategories);
  const [search, setSearch] = useState("");
  const [catFilter, setCatFilter] = useState("");
  const [newCat, setNewCat] = useState("");
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase();
    return items.filter(
      (g) =>
        (!catFilter || g.category === catFilter) &&
        (!q ||
          g.name.toLowerCase().includes(q) ||
          (g.spec ?? "").toLowerCase().includes(q) ||
          (g.location ?? "").toLowerCase().includes(q))
    );
  }, [items, search, catFilter]);

  const low = items.filter((g) => g.condition !== "Retired" && g.quantity > 0 && g.quantity < g.min_quantity).length;
  const out = items.filter((g) => g.condition !== "Retired" && g.quantity <= 0).length;
  const needsRepair = items.filter((g) => g.condition === "Needs repair").length;

  function patchLocal(id: string, patch: Partial<GearItem>) {
    setItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...patch } : g)));
  }

  function handleField(id: string, field: "name" | "spec" | "location", value: string) {
    patchLocal(id, { [field]: value } as Partial<GearItem>);
    startTransition(() => { void updateGearField(id, field, value); });
  }

  function handleCategory(id: string, value: string) {
    patchLocal(id, { category: value });
    startTransition(() => { void updateGearField(id, "category", value); });
  }

  function handleCondition(id: string, value: GearItem["condition"]) {
    patchLocal(id, { condition: value });
    startTransition(() => { void updateGearField(id, "condition", value); });
  }

  function handleMin(id: string, value: number) {
    patchLocal(id, { min_quantity: value });
    startTransition(() => { void updateGearMin(id, value); });
  }

  function handleAdjust(id: string, delta: number) {
    const item = items.find((g) => g.id === id);
    if (!item) return;
    const newQty = Math.max(0, item.quantity + delta);
    patchLocal(id, { quantity: newQty });
    startTransition(() => { void adjustGearQty(id, delta); });
  }

  function handleRemove(id: string) {
    setItems((prev) => prev.filter((g) => g.id !== id));
    startTransition(() => { void removeGearItem(id); });
  }

  function handleAddItem(category: string) {
    startTransition(async () => {
      await addGearItem(category);
      window.location.reload();
    });
  }

  function handleAddCategory() {
    const trimmed = newCat.trim();
    if (!trimmed) return;
    startTransition(async () => {
      const result = await addGearCategory(trimmed);
      if (!result?.error) {
        setCategories((prev) => [...prev, trimmed]);
        setNewCat("");
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">HP Blasting Inventory</h1>
          <p className="text-muted text-sm mt-1">
            Everything for high-pressure water blasting — names, specs and categories are all yours to edit.
          </p>
        </div>
        <button onClick={() => handleAddItem(categories[0])} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
          + Add Item
        </button>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-5">
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-ink">{items.length}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Items tracked</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-amber">{low}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Low stock</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-red">{out}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Out of stock</div>
        </div>
        <div className="card-surface rounded-xl p-4">
          <div className="text-3xl font-extrabold text-blue">{needsRepair}</div>
          <div className="text-[12.5px] text-muted mt-1.5 font-semibold uppercase tracking-wide">Needs repair</div>
        </div>
      </div>

      <div className="card-surface rounded-xl p-4 mb-5 space-y-3">
        <div className="flex gap-2 flex-wrap">
          <input
            className={`${inputCls} flex-[2] min-w-[200px]`}
            placeholder="🔎 Search by item, spec or location…"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
          <select
            className={`${inputCls} flex-1 min-w-[160px]`}
            value={catFilter}
            onChange={(e) => setCatFilter(e.target.value)}
          >
            <option value="">All categories</option>
            {categories.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="flex gap-2 flex-wrap">
          <input
            className={`${inputCls} flex-[2] min-w-[200px]`}
            placeholder="+ New category name (e.g. Pumps & Power Units)"
            value={newCat}
            onChange={(e) => setNewCat(e.target.value)}
          />
          <button
            onClick={handleAddCategory}
            className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg"
          >
            + Add category
          </button>
        </div>
      </div>

      {categories.map((cat) => {
        const list = filtered.filter((g) => g.category === cat);
        if (!list.length) return null;
        const catLow = list.filter((g) => g.condition !== "Retired" && g.quantity < g.min_quantity).length;

        return (
          <div key={cat} className="card-surface rounded-xl mb-5 overflow-hidden">
            <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line flex items-center gap-2">
              {cat}
              <span className="text-xs font-bold bg-card-2 text-muted rounded-full px-2 py-0.5">{list.length}</span>
              {catLow > 0 && (
                <span className="text-xs font-bold bg-amber/15 text-amber border border-amber/30 rounded-full px-2 py-0.5">
                  {catLow} low
                </span>
              )}
            </h2>
            <div className="overflow-x-auto"><table className="w-full text-sm">
              <thead>
                <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
                  <th className="text-left px-4 py-2.5 border-b border-line">Item &amp; spec</th>
                  <th className="text-left px-4 py-2.5 border-b border-line">Category &amp; location</th>
                  <th className="text-left px-4 py-2.5 border-b border-line">Qty on hand</th>
                  <th className="text-left px-4 py-2.5 border-b border-line">Condition</th>
                  <th className="text-left px-4 py-2.5 border-b border-line">Status</th>
                </tr>
              </thead>
              <tbody>
                {list.map((g) => {
                  const st = statusFor(g);
                  return (
                    <tr key={g.id} className="border-b border-line align-top">
                      <td className="px-4 py-2.5 min-w-[220px]">
                        <input
                          className={`${inputCls} font-bold mb-1.5`}
                          value={g.name}
                          onChange={(e) => handleField(g.id, "name", e.target.value)}
                        />
                        <input
                          className={inputCls}
                          value={g.spec ?? ""}
                          placeholder="Spec / size"
                          onChange={(e) => handleField(g.id, "spec", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5 min-w-[180px]">
                        <select
                          className={`${inputCls} mb-1.5`}
                          value={g.category}
                          onChange={(e) => handleCategory(g.id, e.target.value)}
                        >
                          {categories.map((c) => (
                            <option key={c} value={c}>
                              {c}
                            </option>
                          ))}
                        </select>
                        <input
                          className={inputCls}
                          value={g.location ?? ""}
                          placeholder="Shop location"
                          onChange={(e) => handleField(g.id, "location", e.target.value)}
                        />
                      </td>
                      <td className="px-4 py-2.5 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <button
                            onClick={() => handleAdjust(g.id, -1)}
                            disabled={g.quantity <= 0}
                            className="w-7 h-7 rounded-md bg-card-2 border border-line text-ink font-bold disabled:opacity-40"
                          >
                            −
                          </button>
                          <span className="font-bold w-6 text-center">{g.quantity}</span>
                          <button
                            onClick={() => handleAdjust(g.id, 1)}
                            className="w-7 h-7 rounded-md bg-card-2 border border-line text-ink font-bold"
                          >
                            +
                          </button>
                        </div>
                        <div className="text-xs text-muted mt-1.5 flex items-center gap-1">
                          min
                          <input
                            type="number"
                            min={0}
                            className={`${inputCls} w-14 py-1`}
                            value={g.min_quantity}
                            onChange={(e) => handleMin(g.id, parseInt(e.target.value) || 0)}
                          />
                        </div>
                      </td>
                      <td className="px-4 py-2.5 min-w-[130px]">
                        <select
                          className={inputCls}
                          value={g.condition}
                          onChange={(e) => handleCondition(g.id, e.target.value as GearItem["condition"])}
                        >
                          <option>Good</option>
                          <option>Needs repair</option>
                          <option>Retired</option>
                        </select>
                      </td>
                      <td className="px-4 py-2.5">
                        <span className={`inline-block text-xs font-bold px-2 py-1 rounded-full border ${st.cls}`}>
                          {st.label}
                        </span>
                        <button
                          onClick={() => handleRemove(g.id)}
                          title="Remove this item"
                          className="ml-2 text-muted hover:text-red text-sm"
                        >
                          🗑
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table></div>
          </div>
        );
      })}

      {filtered.length === 0 && (
        <div className="card-surface rounded-xl p-8 text-center text-muted">No gear matches that search.</div>
      )}
    </div>
  );
}
