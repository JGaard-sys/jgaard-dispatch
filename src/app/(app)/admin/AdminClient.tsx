"use client";

import { useState, useTransition } from "react";
import { updateProfileTier, toggleActingOwner, updateAuthPin, updateStandardCrew } from "./actions";

interface ProfileRow {
  id: string;
  name: string;
  title: string | null;
  tier: "owner" | "staff" | "mech";
  acting_owner: boolean;
}
interface StandardCrewRow {
  category: string;
  operators: number;
  laborers: number;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";

export function AdminClient({
  initialProfiles,
  initialStandardCrew,
  initialPin,
}: {
  initialProfiles: ProfileRow[];
  initialStandardCrew: StandardCrewRow[];
  initialPin: string;
}) {
  const [profiles, setProfiles] = useState(initialProfiles);
  const [standardCrew, setStandardCrew] = useState(initialStandardCrew);
  const [pin, setPin] = useState(initialPin);
  const [pinSaved, setPinSaved] = useState(false);
  const [, startTransition] = useTransition();

  function handleTier(id: string, tier: ProfileRow["tier"]) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, tier } : p)));
    startTransition(() => {
      void updateProfileTier(id, tier);
    });
  }
  function handleActing(id: string, val: boolean) {
    setProfiles((prev) => prev.map((p) => (p.id === id ? { ...p, acting_owner: val } : p)));
    startTransition(() => {
      void toggleActingOwner(id, val);
    });
  }
  function handlePinSave() {
    startTransition(async () => {
      const result = await updateAuthPin(pin);
      setPinSaved(!result?.error);
    });
  }
  function handleCrewChange(category: string, field: "operators" | "laborers", value: number) {
    setStandardCrew((prev) => prev.map((c) => (c.category === category ? { ...c, [field]: value } : c)));
    const row = standardCrew.find((c) => c.category === category);
    if (!row) return;
    const next = { ...row, [field]: value };
    startTransition(() => {
      void updateStandardCrew(category, next.operators, next.laborers);
    });
  }

  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-navy">Admin</h1>
        <p className="text-muted text-sm mt-1">Owner-only settings — access, authorization code, and crew defaults.</p>
      </div>

      <div className="card-surface rounded-xl mb-5 overflow-hidden">
        <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">👤 People &amp; access</h2>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Name</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Title</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Tier</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Acting-owner</th>
            </tr>
          </thead>
          <tbody>
            {profiles.map((p) => (
              <tr key={p.id} className="border-b border-line">
                <td className="px-4 py-2.5 font-bold text-navy">{p.name}</td>
                <td className="px-4 py-2.5 text-muted">{p.title ?? "—"}</td>
                <td className="px-4 py-2.5">
                  <select
                    value={p.tier}
                    onChange={(e) => handleTier(p.id, e.target.value as ProfileRow["tier"])}
                    className={inputCls}
                    disabled={p.tier === "owner"}
                  >
                    <option value="owner">Owner</option>
                    <option value="staff">Staff</option>
                    <option value="mech">Mechanic</option>
                  </select>
                </td>
                <td className="px-4 py-2.5">
                  {p.tier !== "owner" && (
                    <label className="flex items-center gap-2 text-xs">
                      <input
                        type="checkbox"
                        checked={p.acting_owner}
                        onChange={(e) => handleActing(p.id, e.target.checked)}
                        className="w-4 h-4"
                      />
                      Delegate full owner access
                    </label>
                  )}
                </td>
              </tr>
            ))}
            {profiles.length === 0 && (
              <tr>
                <td colSpan={4} className="px-4 py-8 text-center text-muted">
                  No app users yet — create logins in Supabase Authentication, then they&apos;ll appear here.
                </td>
              </tr>
            )}
          </tbody>
        </table></div>
      </div>

      <div className="card-surface rounded-xl p-5 mb-5">
        <h2 className="text-sm font-bold text-navy mb-1">🔑 Authorization code</h2>
        <p className="text-xs text-muted mb-3">
          Required for major changes — deleting a job/project, changing a contractor rate.
        </p>
        <div className="flex gap-2 items-center">
          <input
            value={pin}
            onChange={(e) => {
              setPin(e.target.value);
              setPinSaved(false);
            }}
            maxLength={6}
            className={`${inputCls} w-32`}
          />
          <button onClick={handlePinSave} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
            Save
          </button>
          {pinSaved && <span className="text-green text-sm font-semibold">✓ Saved</span>}
        </div>
      </div>

      <div className="card-surface rounded-xl overflow-hidden">
        <h2 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
          🔢 Standard crew per unit type
        </h2>
        <div className="overflow-x-auto"><table className="w-full text-sm">
          <thead>
            <tr className="text-[11px] uppercase tracking-wide text-muted bg-bg">
              <th className="text-left px-4 py-2.5 border-b border-line">Unit type</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Operators</th>
              <th className="text-left px-4 py-2.5 border-b border-line">Laborers</th>
            </tr>
          </thead>
          <tbody>
            {standardCrew.map((c) => (
              <tr key={c.category} className="border-b border-line">
                <td className="px-4 py-2.5 font-semibold text-navy">{c.category}</td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={0}
                    value={c.operators}
                    onChange={(e) => handleCrewChange(c.category, "operators", parseInt(e.target.value) || 0)}
                    className={`${inputCls} w-20`}
                  />
                </td>
                <td className="px-4 py-2.5">
                  <input
                    type="number"
                    min={0}
                    value={c.laborers}
                    onChange={(e) => handleCrewChange(c.category, "laborers", parseInt(e.target.value) || 0)}
                    className={`${inputCls} w-20`}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table></div>
      </div>
    </div>
  );
}
