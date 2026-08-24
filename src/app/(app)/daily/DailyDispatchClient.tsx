"use client";

import { useMemo, useState, useTransition } from "react";
import {
  assignEquipment,
  clearNeedAssignment,
  addCrewToAssignment,
  removeCrewFromAssignment,
  textAndDispatchJob,
  completeJob,
} from "./actions";
import type { CrewReq } from "@/lib/crew-constants";

interface AssignmentCrewRow {
  id: string;
  employee_id: string;
  shift: "day" | "night";
  crew_type: "operator" | "laborer";
}
interface AssignmentRow {
  id: string;
  equipment_id: string | null;
  texted: boolean;
  assignment_crew: AssignmentCrewRow[];
}
interface JobNeedRow {
  id: string;
  category: string;
  task: string | null;
  start_time: string | null;
  assignments: AssignmentRow[];
}
export interface DailyJobRow {
  id: string;
  name: string;
  client: string | null;
  location: string | null;
  job_date: string;
  start_time: string | null;
  details: string | null;
  is_multiday: boolean;
  completed_at: string | null;
  job_needs: JobNeedRow[];
}
interface EquipmentRow {
  id: string;
  unit_number: string;
  category: string;
  status: string;
}
interface EmployeeRow {
  id: string;
  name: string;
  role: string | null;
  shift_status: string;
}

const inputCls =
  "bg-card-2 border border-line rounded-md px-2.5 py-1.5 text-sm text-ink outline-none focus:border-steel";

function firstName(n: string) {
  return n.split(" ")[0];
}

export function DailyDispatchClient({
  date,
  initialJobs,
  equipment,
  employees,
  standardCrew,
}: {
  date: string;
  initialJobs: DailyJobRow[];
  equipment: EquipmentRow[];
  employees: EmployeeRow[];
  standardCrew: Record<string, CrewReq>;
}) {
  const [jobs, setJobs] = useState(initialJobs);
  const [selectedId, setSelectedId] = useState<string | null>(jobs[0]?.id ?? null);
  const [, startTransition] = useTransition();

  const selected = jobs.find((j) => j.id === selectedId) ?? null;

  // Busy sets derived from everything currently on the board (holds until job complete).
  const busyEquipmentIds = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) => j.job_needs.forEach((n) => n.assignments.forEach((a) => a.equipment_id && set.add(a.equipment_id))));
    return set;
  }, [jobs]);
  const busyEmployeeIds = useMemo(() => {
    const set = new Set<string>();
    jobs.forEach((j) =>
      j.job_needs.forEach((n) => n.assignments.forEach((a) => a.assignment_crew.forEach((c) => set.add(c.employee_id))))
    );
    return set;
  }, [jobs]);

  function refresh() {
    window.location.reload();
  }

  function handleAssignEquipment(needId: string, equipmentId: string) {
    startTransition(async () => {
      await assignEquipment(needId, equipmentId, date);
      refresh();
    });
  }
  function handleClearNeed(needId: string) {
    startTransition(async () => {
      await clearNeedAssignment(needId);
      refresh();
    });
  }
  function handleAddCrew(assignmentId: string, employeeId: string, shift: "day" | "night", crewType: "operator" | "laborer") {
    startTransition(async () => {
      await addCrewToAssignment(assignmentId, employeeId, shift, crewType);
      refresh();
    });
  }
  function handleRemoveCrew(id: string) {
    startTransition(async () => {
      await removeCrewFromAssignment(id);
      refresh();
    });
  }
  function handleTextDispatch(jobId: string) {
    startTransition(async () => {
      await textAndDispatchJob(jobId);
      refresh();
    });
  }
  function handleComplete(jobId: string) {
    startTransition(async () => {
      await completeJob(jobId);
      refresh();
    });
  }

  function changeDate(newDate: string) {
    window.location.href = `/daily?date=${newDate}`;
  }

  const availUnits = equipment.filter((u) => u.status === "Available").length;
  const availOps = employees.filter((e) => e.shift_status === "on" && !busyEmployeeIds.has(e.id)).length;

  return (
    <div>
      <div className="mb-1">
        <h1 className="text-2xl font-bold text-navy">Daily Dispatch</h1>
        <p className="text-muted text-sm mt-1">
          Fill each job&apos;s units and crew, then Text &amp; Dispatch. Nothing frees up until you mark a job complete.
        </p>
      </div>

      <div className="card-surface rounded-xl px-4 py-2.5 flex items-center gap-3 my-4 text-sm">
        <button onClick={() => changeDate(shiftDate(date, -1))} className="text-steel-2 font-semibold">
          ‹ Prev
        </button>
        <div className="font-bold text-navy">{prettyDate(date)}</div>
        <button onClick={() => changeDate(shiftDate(date, 1))} className="text-steel-2 font-semibold">
          Next ›
        </button>
        <span className="flex-1" />
        <span className="text-muted">
          {jobs.filter((j) => !j.completed_at).length} to dispatch · {availUnits} units free · {availOps} operators free
        </span>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-[340px_1fr] gap-5">
        <div className="card-surface rounded-xl overflow-hidden">
          <h3 className="text-sm font-bold text-navy px-4 py-3 border-b border-line">
            Jobs <span className="text-muted font-normal">({jobs.length})</span>
          </h3>
          <div className="max-h-[70vh] overflow-y-auto">
            {jobs.map((j) => {
              const anyTexted = j.job_needs.some((n) => n.assignments.some((a) => a.texted));
              return (
                <div
                  key={j.id}
                  onClick={() => setSelectedId(j.id)}
                  className={`px-4 py-3 border-b border-line cursor-pointer ${
                    selectedId === j.id ? "bg-card-2" : "hover:bg-card-2"
                  }`}
                >
                  <div className="font-bold text-sm text-navy flex items-center gap-2">
                    {j.name}
                    {j.completed_at && (
                      <span className="text-[10px] font-bold bg-green/15 text-green border border-green/30 rounded px-1.5 py-0.5">
                        DONE
                      </span>
                    )}
                    {!j.completed_at && anyTexted && (
                      <span className="text-[10px] font-bold bg-blue/15 text-blue border border-blue/30 rounded px-1.5 py-0.5">
                        TEXTED
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-muted mt-0.5">
                    {j.client ?? "—"} · {j.job_needs.length} unit(s)
                  </div>
                </div>
              );
            })}
            {jobs.length === 0 && (
              <div className="px-4 py-8 text-center text-muted text-sm">
                No jobs on the board for this day — add them on Jobs &amp; Calendar.
              </div>
            )}
          </div>
        </div>

        <div>
          {!selected && (
            <div className="card-surface rounded-xl p-8 text-center text-muted text-sm">
              👈 Pick a job from the list to build it.
            </div>
          )}

          {selected && (
            <div className="card-surface rounded-xl p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-bold text-navy text-lg">
                  {selected.name}
                  {selected.is_multiday && (
                    <span className="ml-2 text-[10px] font-bold bg-blue/15 text-blue border border-blue/30 rounded px-1.5 py-0.5 align-middle">
                      MULTI-DAY
                    </span>
                  )}
                </h2>
                {selected.completed_at ? (
                  <span className="text-xs font-bold text-green">✓ Dispatched &amp; complete</span>
                ) : (
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTextDispatch(selected.id)}
                      className="btn-chrome font-bold text-sm px-4 py-2 rounded-lg"
                    >
                      📧 Text All &amp; Dispatch
                    </button>
                    <button
                      onClick={() => handleComplete(selected.id)}
                      className="bg-green/15 border border-green/30 text-green font-bold text-sm px-4 py-2 rounded-lg"
                    >
                      ✓ Mark complete
                    </button>
                  </div>
                )}
              </div>

              {selected.job_needs.map((need) => (
                <NeedRow
                  key={need.id}
                  need={need}
                  jobIsMultiday={selected.is_multiday}
                  equipment={equipment}
                  employees={employees}
                  busyEquipmentIds={busyEquipmentIds}
                  busyEmployeeIds={busyEmployeeIds}
                  standardCrew={standardCrew}
                  onAssignEquipment={(eqId) => handleAssignEquipment(need.id, eqId)}
                  onClear={() => handleClearNeed(need.id)}
                  onAddCrew={handleAddCrew}
                  onRemoveCrew={handleRemoveCrew}
                />
              ))}

              {selected.job_needs.length === 0 && (
                <div className="text-sm text-muted text-center py-6">
                  This job has no equipment needs yet — add some on Jobs &amp; Calendar.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function NeedRow({
  need,
  jobIsMultiday,
  equipment,
  employees,
  busyEquipmentIds,
  busyEmployeeIds,
  standardCrew,
  onAssignEquipment,
  onClear,
  onAddCrew,
  onRemoveCrew,
}: {
  need: JobNeedRow;
  jobIsMultiday: boolean;
  equipment: EquipmentRow[];
  employees: EmployeeRow[];
  busyEquipmentIds: Set<string>;
  busyEmployeeIds: Set<string>;
  standardCrew: Record<string, CrewReq>;
  onAssignEquipment: (equipmentId: string) => void;
  onClear: () => void;
  onAddCrew: (assignmentId: string, employeeId: string, shift: "day" | "night", crewType: "operator" | "laborer") => void;
  onRemoveCrew: (id: string) => void;
}) {
  const assignment = need.assignments[0] ?? null;
  const assignedUnit = assignment?.equipment_id
    ? equipment.find((u) => u.id === assignment.equipment_id)
    : null;

  const availableForCategory = equipment.filter(
    (u) => u.category === need.category && (u.status === "Available" || u.id === assignment?.equipment_id)
  );

  return (
    <div className="bg-card-2 border border-line rounded-lg p-3 mb-3">
      <div className="flex items-center gap-2 mb-2">
        <span className="font-semibold text-navy">{need.category}</span>
        {need.task && <span className="text-sm text-muted">— {need.task}</span>}
        {need.start_time && <span className="text-sm text-muted">@ {need.start_time}</span>}
        {assignment?.texted && (
          <span className="text-[10px] font-bold bg-green/15 text-green border border-green/30 rounded px-1.5 py-0.5 ml-auto">
            ✓ TEXTED
          </span>
        )}
      </div>

      {!assignedUnit ? (
        <select
          defaultValue=""
          onChange={(e) => e.target.value && onAssignEquipment(e.target.value)}
          className={`${inputCls} w-full`}
        >
          <option value="" disabled>
            ＋ Pick a {need.category}
          </option>
          {availableForCategory.map((u) => (
            <option key={u.id} value={u.id}>
              Unit {u.unit_number}
            </option>
          ))}
        </select>
      ) : (
        <>
          <div className="flex items-center gap-2 mb-2 text-sm">
            <span className="font-bold text-navy">Unit {assignedUnit.unit_number}</span>
            <button onClick={onClear} className="text-muted hover:text-red text-xs ml-auto">
              × clear unit
            </button>
          </div>

          <CrewBlock
            label={jobIsMultiday ? "☀️ Day crew" : "Crew"}
            shift="day"
            assignment={assignment!}
            employees={employees}
            busyEmployeeIds={busyEmployeeIds}
            req={standardCrew[need.category]}
            onAddCrew={onAddCrew}
            onRemoveCrew={onRemoveCrew}
          />
          {jobIsMultiday && (
            <CrewBlock
              label="🌙 Night crew"
              shift="night"
              assignment={assignment!}
              employees={employees}
              busyEmployeeIds={busyEmployeeIds}
              req={standardCrew[need.category]}
              onAddCrew={onAddCrew}
              onRemoveCrew={onRemoveCrew}
            />
          )}
        </>
      )}
    </div>
  );
}

function CrewBlock({
  label,
  shift,
  assignment,
  employees,
  busyEmployeeIds,
  req,
  onAddCrew,
  onRemoveCrew,
}: {
  label: string;
  shift: "day" | "night";
  assignment: AssignmentRow;
  employees: EmployeeRow[];
  busyEmployeeIds: Set<string>;
  req?: CrewReq;
  onAddCrew: (assignmentId: string, employeeId: string, shift: "day" | "night", crewType: "operator" | "laborer") => void;
  onRemoveCrew: (id: string) => void;
}) {
  const crewOnShift = assignment.assignment_crew.filter((c) => c.shift === shift);
  const availableEmployees = employees.filter(
    (e) => e.shift_status === "on" && (!busyEmployeeIds.has(e.id) || crewOnShift.some((c) => c.employee_id === e.id))
  );

  return (
    <div className="mb-2 last:mb-0">
      <div className="text-xs font-semibold text-muted mb-1 flex items-center gap-2">
        {label}
        {req && (
          <span className="text-muted/70">
            (standard: {req.operators} op{req.operators !== 1 ? "s" : ""}
            {req.laborers ? ` + ${req.laborers} lab` : ""})
          </span>
        )}
      </div>
      <div className="flex flex-wrap gap-1.5 items-center">
        {crewOnShift.map((c) => {
          const emp = employees.find((e) => e.id === c.employee_id);
          return (
            <span
              key={c.id}
              className="inline-flex items-center gap-1 bg-card border border-line rounded-full px-2.5 py-1 text-xs font-semibold"
            >
              {emp ? firstName(emp.name) : "?"}
              <span className="text-muted">({c.crew_type === "laborer" ? "lab" : "op"})</span>
              <button onClick={() => onRemoveCrew(c.id)} className="text-muted hover:text-red">
                ×
              </button>
            </span>
          );
        })}
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onAddCrew(assignment.id, e.target.value, shift, "operator");
              e.target.value = "";
            }
          }}
          className={`${inputCls} text-xs py-1`}
        >
          <option value="" disabled>
            ＋ Operator
          </option>
          {availableEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
        <select
          defaultValue=""
          onChange={(e) => {
            if (e.target.value) {
              onAddCrew(assignment.id, e.target.value, shift, "laborer");
              e.target.value = "";
            }
          }}
          className={`${inputCls} text-xs py-1`}
        >
          <option value="" disabled>
            ＋ Laborer
          </option>
          {availableEmployees.map((e) => (
            <option key={e.id} value={e.id}>
              {e.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

function prettyDate(d: string) {
  return new Date(d + "T00:00:00").toLocaleDateString("en-CA", {
    weekday: "long",
    month: "short",
    day: "numeric",
  });
}
function shiftDate(d: string, delta: number) {
  const dt = new Date(d + "T00:00:00");
  dt.setDate(dt.getDate() + delta);
  return dt.toISOString().slice(0, 10);
}
