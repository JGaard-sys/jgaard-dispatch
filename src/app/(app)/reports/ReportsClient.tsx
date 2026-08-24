"use client";

import { useState, useTransition } from "react";
import { submitReport } from "./actions";

interface ReportRow {
  id: string;
  who_name: string;
  role: string | null;
  week_start: string;
  last_week: string | null;
  next_week: string | null;
  attention: string | null;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel w-full";

function mostRecentFriday() {
  const d = new Date();
  const day = d.getDay(); // 0 = Sun
  const diff = (day + 2) % 7; // days since last Friday
  d.setDate(d.getDate() - diff);
  return d.toISOString().slice(0, 10);
}

export function ReportsClient({ initialReports }: { initialReports: ReportRow[] }) {
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    startTransition(async () => {
      const result = await submitReport(formData);
      if (result?.error) setError(result.error);
      else {
        setError(null);
        setAdding(false);
        window.location.reload();
      }
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4 flex-wrap">
        <div>
          <h1 className="text-2xl font-bold text-navy">Reports</h1>
          <p className="text-muted text-sm mt-1">Weekly check-ins — what happened, what&apos;s next, what needs attention.</p>
        </div>
        <button onClick={() => setAdding(true)} className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
          + Submit report
        </button>
      </div>

      {adding && (
        <div className="card-surface rounded-xl p-5 mb-5">
          <h3 className="font-bold text-navy text-sm mb-3">This week&apos;s report</h3>
          <form action={handleSubmit} className="space-y-3">
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Week of</label>
              <input name="week_start" type="date" defaultValue={mostRecentFriday()} required className={inputCls + " max-w-[200px]"} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">What happened this week</label>
              <textarea name="last_week" rows={3} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">What&apos;s coming up next week</label>
              <textarea name="next_week" rows={3} className={inputCls} />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted mb-1">Needs attention / approval</label>
              <textarea name="attention" rows={2} className={inputCls} />
            </div>
            {error && <div className="text-red text-sm">{error}</div>}
            <div className="flex gap-2">
              <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                Submit
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

      {initialReports.map((r) => (
        <div key={r.id} className="card-surface rounded-xl p-5 mb-4">
          <div className="flex items-center gap-2 mb-1">
            <span className="font-bold text-navy">{r.who_name}</span>
            {r.role && <span className="text-xs text-muted">· {r.role}</span>}
            <span className="ml-auto text-xs text-muted">Week of {r.week_start}</span>
          </div>
          {r.last_week && (
            <p className="text-sm text-ink mt-2">
              <span className="font-semibold text-muted">This week: </span>
              {r.last_week}
            </p>
          )}
          {r.next_week && (
            <p className="text-sm text-ink mt-1.5">
              <span className="font-semibold text-muted">Next week: </span>
              {r.next_week}
            </p>
          )}
          {r.attention && (
            <p className="text-sm text-amber mt-1.5">
              <span className="font-semibold">Needs attention: </span>
              {r.attention}
            </p>
          )}
        </div>
      ))}

      {initialReports.length === 0 && (
        <div className="card-surface rounded-xl p-8 text-center text-muted text-sm">No reports submitted yet.</div>
      )}
    </div>
  );
}
