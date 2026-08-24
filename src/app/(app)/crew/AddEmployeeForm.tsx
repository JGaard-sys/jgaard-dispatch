"use client";

import { useRef, useState, useTransition } from "react";
import { addEmployee } from "./actions";

export function AddEmployeeForm() {
  const formRef = useRef<HTMLFormElement>(null);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await addEmployee(formData);
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
        + Add Employee
      </button>
    );
  }

  return (
    <div className="card-surface rounded-xl p-5 mb-5">
      <h3 className="font-bold text-navy text-sm mb-3">Add a new employee</h3>
      <form ref={formRef} action={handleSubmit} className="grid grid-cols-2 gap-3">
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Full name *</label>
          <input
            name="name"
            required
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Phone</label>
          <input
            name="phone"
            type="tel"
            placeholder="780-555-0100"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Position</label>
          <input
            name="position"
            placeholder="e.g. Operator, Laborer, Mechanic"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div>
          <label className="block text-xs font-semibold text-muted mb-1">Role / display tag</label>
          <input
            name="role"
            placeholder="Shown on the crew list"
            className="w-full bg-card-2 border border-line rounded-lg px-3 py-2 text-sm outline-none focus:border-steel"
          />
        </div>
        <div className="col-span-2">
          <label className="block text-xs font-semibold text-muted mb-1">Crew group</label>
          <input
            name="employee_group"
            placeholder="e.g. c1, c3, lab — used for scheduling groups"
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
            {pending ? "Adding…" : "＋ Add employee"}
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
