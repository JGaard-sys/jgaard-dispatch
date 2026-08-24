"use client";

import { useRef, useState, useTransition } from "react";
import { addUnit } from "./actions";

const CATEGORIES = [
  "Combo Vac",
  "Semi Vac",
  "Pressure Truck",
  "High Pressure Pump",
  "Steamer",
  "Water Truck",
  "Crew Truck",
];

export function AddUnitForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addUnit(formData);
      if (result?.error) {
        setError(result.error);
      } else {
        setError(null);
        formRef.current?.reset();
        setOpen(false);
      }
    });
  }

  if (!open) {
    return (
      <button onClick={() => setOpen(true)} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
        + Add Unit
      </button>
    );
  }

  return (
    <div className="card-surface rounded-xl p-5 mb-5">
      <h3 className="font-bold text-navy text-sm mb-3">Add a new unit</h3>
      <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Unit number *</label>
          <input
            name="unit_number"
            required
            placeholder="e.g. 109"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Type *</label>
          <select
            name="category"
            required
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c}
              </option>
            ))}
          </select>
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-muted mb-1">Description</label>
          <input
            name="description"
            placeholder="e.g. 2019 Kenworth T880, 130bbl"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Make/model</label>
          <input
            name="make"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Home location</label>
          <input
            name="location"
            placeholder="e.g. Main yard"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>

        {error && <div className="col-span-2 text-red text-sm">{error}</div>}

        <div className="col-span-2 flex gap-2 mt-1">
          <button
            type="submit"
            disabled={pending}
            className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg disabled:opacity-60"
          >
            {pending ? "Adding…" : "＋ Add unit"}
          </button>
          <button
            type="button"
            onClick={() => setOpen(false)}
            className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
