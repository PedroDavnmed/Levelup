"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import type { ActivityType } from "@/lib/types";
import { sumByDay } from "@/lib/aggregate";
import { activeDaysConsistency, consistencyColor } from "@/lib/consistency";
import { localDateOf } from "@/lib/date";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import TrendChart from "@/components/TrendChart";
import ProgressRing from "@/components/ProgressRing";
import RangeToggle from "@/components/RangeToggle";
import Loading from "@/components/Loading";

export default function ActivityTracker({
  type,
  icon,
  title,
  color,
  defaultUnit,
  unitOptions,
}: {
  type: ActivityType;
  icon: string;
  title: string;
  color: string;
  defaultUnit: string;
  unitOptions: string[];
}) {
  const {
    state,
    hydrated,
    addActivity,
    deleteActivity,
    updateActivity,
    logActivity,
  } = useStore();

  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [logFor, setLogFor] = useState<string | null>(null);

  // New / edit activity form
  const [name, setName] = useState("");
  const [unit, setUnit] = useState(defaultUnit);
  const [xp, setXp] = useState(10);

  // Log form
  const [value, setValue] = useState("");
  const [note, setNote] = useState("");

  const [range, setRange] = useState(14);

  const activities = useMemo(
    () => state.activities.filter((a) => a.type === type),
    [state.activities, type]
  );
  const activityIds = useMemo(
    () => new Set(activities.map((a) => a.id)),
    [activities]
  );
  const logs = useMemo(
    () => state.logs.filter((l) => activityIds.has(l.activityId)),
    [state.logs, activityIds]
  );

  // Totals grouped by unit — activities of one type can use different units
  // (e.g. min, reps, km), so a single combined sum would be meaningless.
  const totalsByUnit = useMemo(() => {
    const unitOf = new Map(activities.map((a) => [a.id, a.unit]));
    const totals = new Map<string, number>();
    for (const l of logs) {
      const u = unitOf.get(l.activityId) ?? "";
      totals.set(u, (totals.get(u) ?? 0) + l.value);
    }
    return [...totals.entries()];
  }, [logs, activities]);
  const chartData = sumByDay(logs, range);
  const consistency = activeDaysConsistency(
    logs.map((l) => localDateOf(l.loggedAt)),
    range
  );

  const recent = useMemo(
    () =>
      [...logs]
        .sort((a, b) => b.loggedAt.localeCompare(a.loggedAt))
        .slice(0, 8),
    [logs]
  );

  function submitNew(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    if (editId) {
      updateActivity(editId, { title: name.trim(), unit, xpPerLog: xp });
    } else {
      addActivity(type, name.trim(), unit, xp);
    }
    closeForm();
  }

  function openNew() {
    setEditId(null);
    setName("");
    setUnit(defaultUnit);
    setXp(10);
    setShowNew(true);
  }

  function openEdit(a: (typeof activities)[number]) {
    setEditId(a.id);
    setName(a.title);
    setUnit(a.unit);
    setXp(a.xpPerLog);
    setShowNew(false);
  }

  function closeForm() {
    setShowNew(false);
    setEditId(null);
    setName("");
    setUnit(defaultUnit);
    setXp(10);
  }

  function submitLog(e: React.FormEvent) {
    e.preventDefault();
    if (logFor == null) return;
    const v = parseFloat(value);
    logActivity(logFor, isNaN(v) ? 0 : v, note.trim() || undefined);
    setValue("");
    setNote("");
    setLogFor(null);
  }

  const logTarget = activities.find((a) => a.id === logFor);

  if (!hydrated) return <Loading />;

  return (
    <div>
      <PageHeader
        title={title}
        icon={icon}
        subtitle={`${logs.length} sessions logged`}
        action={
          <button onClick={openNew} className="btn-primary">
            + New
          </button>
        }
      />

      {activities.length === 0 ? (
        <EmptyState
          icon={icon}
          title={`No ${title.toLowerCase()} activities yet`}
          hint={`Create one (like "${type === "training" ? "Gym session" : "Read textbook"}") to start logging and earning XP.`}
          action={
            <button onClick={openNew} className="btn-primary">
              + New activity
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="grid gap-4 sm:grid-cols-3">
            <div className="card p-5 flex items-center gap-4">
              <ProgressRing
                pct={consistency}
                size={72}
                color={consistencyColor(consistency)}
              >
                {consistency}%
              </ProgressRing>
              <div>
                <p className="text-sm font-medium text-ink">Consistency</p>
                <p className="text-xs text-muted">
                  days active over the last {range}
                </p>
              </div>
            </div>
            <StatCard label="Total sessions" value={logs.length} />
            <div className="card p-5">
              <p className="text-sm text-muted">Total logged</p>
              {totalsByUnit.length <= 1 ? (
                <>
                  <p className="mt-1 text-3xl font-bold text-brand-600">
                    {totalsByUnit[0]?.[1] ?? 0}
                  </p>
                  {totalsByUnit[0] && (
                    <p className="mt-0.5 text-xs text-muted">
                      {totalsByUnit[0][0]}
                    </p>
                  )}
                </>
              ) : (
                <div className="mt-1 space-y-0.5">
                  {totalsByUnit.map(([unit, total]) => (
                    <p key={unit} className="text-xl font-bold text-brand-600">
                      {total}{" "}
                      <span className="text-xs font-normal text-muted">
                        {unit}
                      </span>
                    </p>
                  ))}
                </div>
              )}
            </div>
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink">Last {range} days</h2>
              <RangeToggle value={range} onChange={setRange} />
            </div>
            <TrendChart data={chartData} type="bar" color={color} />
          </section>

          <section className="grid gap-3 sm:grid-cols-2">
            {activities.map((a) => {
              const aLogs = logs.filter((l) => l.activityId === a.id);
              const aTotal = aLogs.reduce((s, l) => s + l.value, 0);
              return (
                <div key={a.id} className="card p-4 flex items-center justify-between">
                  <div className="min-w-0">
                    <p className="font-medium text-ink truncate">{a.title}</p>
                    <p className="text-xs text-muted">
                      {aLogs.length} logs · {aTotal} {a.unit} · +{a.xpPerLog} XP each
                    </p>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <button
                      onClick={() => setLogFor(a.id)}
                      className="btn-primary px-3 py-1.5 text-xs"
                    >
                      + Log
                    </button>
                    <button
                      onClick={() => openEdit(a)}
                      className="text-muted hover:text-ink text-sm px-1"
                      aria-label="Edit activity"
                    >
                      ✏️
                    </button>
                    <button
                      onClick={() => {
                        if (confirm(`Delete "${a.title}" and its logs?`))
                          deleteActivity(a.id);
                      }}
                      className="text-muted hover:text-red-500 text-sm px-1"
                      aria-label="Delete activity"
                    >
                      🗑
                    </button>
                  </div>
                </div>
              );
            })}
          </section>

          {recent.length > 0 && (
            <section className="card p-5">
              <h2 className="font-semibold text-ink mb-3">Recent history</h2>
              <ul className="divide-y divide-line">
                {recent.map((l) => {
                  const a = activities.find((x) => x.id === l.activityId);
                  return (
                    <li key={l.id} className="flex items-center justify-between py-2.5">
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-ink truncate">
                          {a?.title ?? "Activity"}
                        </p>
                        {l.note && (
                          <p className="text-xs text-muted truncate">{l.note}</p>
                        )}
                      </div>
                      <div className="text-right shrink-0 ml-3">
                        <p className="text-sm text-ink">
                          {l.value} {a?.unit}
                        </p>
                        <p className="text-xs text-muted">
                          {new Date(l.loggedAt).toLocaleDateString()} · +{l.xpAwarded} XP
                        </p>
                      </div>
                    </li>
                  );
                })}
              </ul>
            </section>
          )}
        </div>
      )}

      {/* New / edit activity modal */}
      <Modal
        open={showNew || editId != null}
        onClose={closeForm}
        title={
          editId
            ? `Edit ${title.toLowerCase()} activity`
            : `New ${title.toLowerCase()} activity`
        }
      >
        <form onSubmit={submitNew} className="space-y-4">
          <div>
            <label className="label" htmlFor="act-name">Name</label>
            <input
              id="act-name"
              className="input"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder={type === "training" ? "Gym session" : "Math revision"}
              autoFocus
            />
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="label" htmlFor="act-unit">Unit</label>
              <select
                id="act-unit"
                className="input"
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
              >
                {unitOptions.map((u) => (
                  <option key={u} value={u}>{u}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="act-xp">XP per log</label>
              <input
                id="act-xp"
                type="number"
                min={1}
                className="input"
                value={xp}
                onChange={(e) => setXp(Math.max(1, parseInt(e.target.value) || 1))}
              />
            </div>
          </div>
          <button type="submit" className="btn-primary w-full">
            {editId ? "Save changes" : "Create activity"}
          </button>
        </form>
      </Modal>

      {/* Log modal */}
      <Modal open={logFor != null} onClose={() => setLogFor(null)} title={`Log: ${logTarget?.title ?? ""}`}>
        <form onSubmit={submitLog} className="space-y-4">
          <div>
            <label className="label" htmlFor="log-value">
              Amount ({logTarget?.unit})
            </label>
            <input
              id="log-value"
              type="number"
              step="any"
              min={0}
              className="input"
              value={value}
              onChange={(e) => setValue(e.target.value)}
              placeholder="e.g. 45"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="log-note">Note (optional)</label>
            <input
              id="log-note"
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="How did it go?"
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Log &amp; earn +{logTarget?.xpPerLog ?? 0} XP
          </button>
        </form>
      </Modal>
    </div>
  );
}
