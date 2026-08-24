"use client";

import { useMemo, useState, useTransition } from "react";
import { createJob, deleteJob, addJobNeed, removeJobNeed } from "./actions";
import { EQUIPMENT_CATEGORIES, type CrewReq } from "@/lib/crew-constants";

export interface JobNeed {
  id: string;
  category: string;
  task: string | null;
  start_time: string | null;
}

export interface JobRow {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  job_date: string;
  start_time: string | null;
  details: string | null;
  gear_notes: string | null;
  is_multiday: boolean;
  completed_at: string | null;
  job_needs: JobNeed[];
}

const inputCls =
  "w-full bg-card-2 border border-line rounded-md px-3 py-2 text-sm text-ink outline-none focus:border-steel";

function prettyDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

export function CalendarClient({
  initialJobs,
  standardCrew,
}: {
  initialJobs: JobRow[];
  standardCrew: Record<string, CrewReq>;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [adding, setAdding] = useState(false);
  const [, startTransition] = useTransition();

  const sorted = useMemo(
    () => [...jobs].sort((a, b) => a.job_date.localeCompare(b.job_date)),
    [jobs]
  );
  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  function handleCreate(formData: FormData) {
    startTransition(async () => {
      const result = await createJob(formData);
      if (!result?.error && result?.jobId) {
        window.location.reload();
      }
    });
  }

  function handleDelete(id: string) {
    setJobs((prev) => prev.filter((j) => j.id !== id));
    if (selectedId === id) setSelectedId(null);
    startTransition(() => {
      void deleteJob(id);
    });
  }

  function handleAddNeed(jobId: string, category: string, task: string, startTime: string) {
    startTransition(async () => {
      await addJobNeed(jobId, category, task, startTime);
      window.location.reload();
    });
  }

  function handleRemoveNeed(jobId: string, needId: string) {
    setJobs((prev) =>
      prev.map((j) =>
        j.id === jobId ? { ...j, job_needs: j.job_needs.filter((n) => n.id !== needId) } : j
      )
    );
    startTransition(() => {
      void removeJobNeed(needId);
    });
  }

  return (
    <div>
      <div className="flex items-start justify-between mb-5 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-navy">Jobs &amp; Calendar</h1>
          <p className="text-muted text-sm mt-1">
            Every job that&apos;s been phoned in — add it here, then build the crew on Daily Dispatch.
          </p>
        </div>
        <button
          onClick={() => {
            setAdding(true);
            setSelectedId(null);
          }}
          className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg"
        >
          + Add job
        </button>
      </div>

      <div className="grid grid-cols-[340px_1fr] gap-5">
        <div className="card-surface rounded-xl overflow-hidden">
          <h3 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
            Jobs <span className="text-muted font-normal">({sorted.length})</span>
          </h3>
          <div className="max-h-[70vh] overflow-y-auto">
            {sorted.map((j) => (
              <div
                key={j.id}
                onClick={() => {
                  setSelectedId(j.id);
                  setAdding(false);
                }}
                className={`px-4 py-3 border-b border-line cursor-pointer ${
                  selectedId === j.id ? "bg-card-2" : "hover:bg-card-2"
                }`}
              >
                <div className="font-bold text-sm text-navy flex items-center gap-2">
                  {j.name}
                  {j.is_multiday && (
                    <span className="text-[10px] font-bold bg-blue/15 text-blue border border-blue/30 rounded px-1.5 py-0.5">
                      MULTI-DAY
                    </span>
                  )}
                  {j.completed_at && (
                    <span className="text-[10px] font-bold bg-green/15 text-green border border-green/30 rounded px-1.5 py-0.5">
                      DONE
                    </span>
                  )}
                </div>
                <div className="text-xs text-muted mt-0.5">
                  {prettyDate(j.job_date)} · {j.client ?? "—"}
                </div>
                <div className="text-xs text-muted mt-0.5">{j.job_needs.length} unit(s) needed</div>
              </div>
            ))}
            {sorted.length === 0 && (
              <div className="px-4 py-8 text-center text-muted text-sm">No jobs yet — add one.</div>
            )}
          </div>
        </div>

        <div>
          {adding && (
            <div className="card-surface rounded-xl p-5">
              <h3 className="font-bold text-navy text-sm mb-3">New job</h3>
              <form action={handleCreate} className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">Job name *</label>
                  <input name="name" required className={inputCls} placeholder="e.g. Tank farm rinse" />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Client</label>
                  <input name="client" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Location</label>
                  <input name="location" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Contact name</label>
                  <input name="contact_name" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Contact phone</label>
                  <input name="contact_phone" type="tel" className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Job date *</label>
                  <input name="job_date" type="date" required className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-muted mb-1">Start time</label>
                  <input name="start_time" type="time" className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">
                    Job details (what needs doing)
                  </label>
                  <textarea name="details" rows={3} className={inputCls} />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-muted mb-1">
                    🧰 Gear / tooling to bring
                  </label>
                  <input name="gear_notes" className={inputCls} placeholder='e.g. 3" vac hoses, spill kit' />
                </div>
                <label className="col-span-2 flex items-center gap-2 text-sm text-ink">
                  <input type="checkbox" name="is_multiday" className="w-4 h-4" />
                  Multi-day job (holds crew &amp; equipment daily until marked complete)
                </label>
                <div className="col-span-2 flex gap-2 mt-1">
                  <button type="submit" className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg">
                    ＋ Add job
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
            <JobDetail
              job={selected}
              standardCrew={standardCrew}
              onDelete={() => handleDelete(selected.id)}
              onAddNeed={(cat, task, time) => handleAddNeed(selected.id, cat, task, time)}
              onRemoveNeed={(needId) => handleRemoveNeed(selected.id, needId)}
            />
          )}

          {!adding && !selected && (
            <div className="card-surface rounded-xl p-8 text-center text-muted text-sm">
              👈 Pick a job to see or edit its equipment needs, or add a new one.
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobDetail({
  job,
  standardCrew,
  onDelete,
  onAddNeed,
  onRemoveNeed,
}: {
  job: JobRow;
  standardCrew: Record<string, CrewReq>;
  onDelete: () => void;
  onAddNeed: (category: string, task: string, startTime: string) => void;
  onRemoveNeed: (needId: string) => void;
}) {
  const [category, setCategory] = useState(EQUIPMENT_CATEGORIES[0]);
  const [task, setTask] = useState("");
  const [time, setTime] = useState("");

  return (
    <div className="card-surface rounded-xl p-5">
      <div className="flex items-center justify-between mb-1">
        <h2 className="font-bold text-navy text-lg">{job.name}</h2>
        <button onClick={onDelete} title="Delete job" className="text-muted hover:text-red">
          🗑
        </button>
      </div>
      <div className="text-sm text-muted mb-4">
        {prettyDate(job.job_date)} {job.start_time ? `· ${job.start_time}` : ""} · {job.client ?? "—"} ·{" "}
        {job.location ?? "—"}
      </div>

      {job.details && <p className="text-sm text-ink mb-3">{job.details}</p>}
      {job.gear_notes && (
        <p className="text-xs text-muted mb-4">🧰 {job.gear_notes}</p>
      )}

      <div className="text-xs font-bold text-navy uppercase tracking-wide mb-2 mt-4">
        Equipment needed ({job.job_needs.length})
      </div>

      {job.job_needs.map((n) => {
        const req = standardCrew[n.category] ?? { operators: 1, laborers: 0 };
        return (
          <div
            key={n.id}
            className="flex items-center gap-2 bg-card-2 border border-line rounded-lg px-3 py-2 mb-2 text-sm"
          >
            <span className="font-semibold text-navy">{n.category}</span>
            {n.task && <span className="text-muted">— {n.task}</span>}
            {n.start_time && <span className="text-muted">@ {n.start_time}</span>}
            <span className="text-muted ml-auto text-xs">
              standard crew: {req.operators} op{req.operators !== 1 ? "s" : ""}
              {req.laborers ? ` + ${req.laborers} lab` : ""}
            </span>
            <button onClick={() => onRemoveNeed(n.id)} className="text-muted hover:text-red">
              ×
            </button>
          </div>
        );
      })}

      <div className="flex gap-2 mt-3 flex-wrap">
        <select value={category} onChange={(e) => setCategory(e.target.value)} className={`${inputCls} flex-1 min-w-[140px]`}>
          {EQUIPMENT_CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
        <input
          value={task}
          onChange={(e) => setTask(e.target.value)}
          placeholder="Task (optional)"
          className={`${inputCls} flex-1 min-w-[140px]`}
        />
        <input
          value={time}
          onChange={(e) => setTime(e.target.value)}
          type="time"
          className={`${inputCls} w-32`}
        />
        <button
          onClick={() => {
            onAddNeed(category, task, time);
            setTask("");
            setTime("");
          }}
          className="bg-card-2 border border-line text-steel-2 font-semibold text-sm px-4 py-2 rounded-lg"
        >
          + Add unit
        </button>
      </div>
    </div>
  );
}
