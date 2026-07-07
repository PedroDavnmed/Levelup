"use client";

import { BookOpen, Pencil, Star, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { XP_REWARDS } from "@/lib/types";
import type { StudyTask } from "@/lib/types";
import {
  countDatesByDay,
  studyTaskDates,
  studyTaskDate,
  studyTasksCompletedOn,
  taskQuadrant,
  totalFocusMinutes,
} from "@/lib/aggregate";
import type { Quadrant } from "@/lib/aggregate";
import { taskConsistency, consistencyColor } from "@/lib/consistency";
import { todayStr, addDays } from "@/lib/date";
import { shortDate, prettyDate } from "@/lib/calendar";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import TrendChart from "@/components/TrendChart";
import ProgressRing from "@/components/ProgressRing";
import RangeToggle from "@/components/RangeToggle";
import FocusTimer from "@/components/FocusTimer";
import Loading from "@/components/Loading";

/** "Xh Ym" (or "Ym") for a minutes total. */
function fmtMins(m: number): string {
  const h = Math.floor(m / 60);
  const min = m % 60;
  return h > 0 ? `${h}h ${min}m` : `${min}m`;
}

/** Eisenhower quadrants, in reading order, with their labels/accents. */
const QUADRANTS: {
  key: Quadrant;
  label: string;
  accent: string;
  dot: string;
}[] = [
  { key: "do", label: "Do first", accent: "text-red-500", dot: "bg-red-500" },
  { key: "schedule", label: "Schedule", accent: "text-amber", dot: "bg-amber" },
  { key: "next", label: "Do next", accent: "text-brand-400", dot: "bg-brand-500" },
  { key: "later", label: "Later", accent: "text-muted", dot: "bg-muted" },
];

export default function StudyTasks() {
  const {
    state,
    hydrated,
    addStudyTask,
    toggleStudyTaskDone,
    deleteStudyTask,
    updateStudyTask,
  } = useStore();

  const today = todayStr();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(today);
  const [important, setImportant] = useState(false);
  const [view, setView] = useState<"list" | "matrix">("list");
  const [range, setRange] = useState(14);
  const [doneDay, setDoneDay] = useState(today); // which day's completions to show

  const tasks = state.studyTasks;
  // Pending tasks split by due date so overdue/upcoming stand out.
  const { overdue, todayTasks, upcoming } = useMemo(() => {
    const pending = tasks.filter((t) => !t.done);
    const byDate = (a: StudyTask, b: StudyTask) =>
      studyTaskDate(a).localeCompare(studyTaskDate(b));
    return {
      overdue: pending.filter((t) => studyTaskDate(t) < today).sort(byDate),
      todayTasks: pending.filter((t) => studyTaskDate(t) === today).sort(byDate),
      upcoming: pending.filter((t) => studyTaskDate(t) > today).sort(byDate),
    };
  }, [tasks, today]);
  const pendingCount = overdue.length + todayTasks.length + upcoming.length;
  // Same pending set, grouped into Eisenhower quadrants for the matrix view.
  const quadrants = useMemo(() => {
    const groups: Record<Quadrant, StudyTask[]> = {
      do: [],
      schedule: [],
      next: [],
      later: [],
    };
    for (const t of tasks) {
      if (!t.done) groups[taskQuadrant(t, today)].push(t);
    }
    return groups;
  }, [tasks, today]);
  const done = useMemo(() => tasks.filter((t) => t.done), [tasks]);
  // Tasks completed on the selected day (newest first).
  const dayDone = useMemo(
    () =>
      studyTasksCompletedOn(tasks, doneDay).sort((a, b) =>
        (b.completedAt ?? "").localeCompare(a.completedAt ?? "")
      ),
    [tasks, doneDay]
  );

  const completedDates = useMemo(() => studyTaskDates(tasks), [tasks]);
  const chartData = countDatesByDay(completedDates, range);
  const consistency = taskConsistency(tasks, today, range);
  const earnedXp = done.length * XP_REWARDS.taskCompletion;
  const dayXp = dayDone.length * XP_REWARDS.taskCompletion;
  const focusMins = totalFocusMinutes(state.focusSessions, range);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editId) {
      updateStudyTask(editId, {
        title: title.trim(),
        note: note.trim() || undefined,
        date,
        important,
      });
    } else {
      addStudyTask(title.trim(), note.trim() || undefined, date, important);
    }
    closeForm();
  }

  function openNew() {
    setEditId(null);
    setTitle("");
    setNote("");
    setDate(today);
    setImportant(false);
    setShowForm(true);
  }

  function openEdit(t: StudyTask) {
    setEditId(t.id);
    setTitle(t.title);
    setNote(t.note ?? "");
    setDate(studyTaskDate(t));
    setImportant(t.important ?? false);
    setShowForm(true);
  }

  function closeForm() {
    setShowForm(false);
    setEditId(null);
    setTitle("");
    setNote("");
    setDate(today);
    setImportant(false);
  }

  // One pending-task row (checkbox + title + due-date/note + edit/delete).
  function pendingRow(t: StudyTask) {
    const d = studyTaskDate(t);
    const isOverdue = d < today;
    const dateLabel = d === today ? null : shortDate(d);
    const meta = dateLabel || t.note;
    return (
      <li key={t.id} className="flex items-center gap-3 py-2.5">
        <button
          onClick={() => toggleStudyTaskDone(t.id)}
          className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-line text-sm text-muted transition hover:border-brand-500"
          aria-label="Mark done"
        />
        <div className="min-w-0 flex-1">
          <p className="text-sm font-medium text-ink truncate">{t.title}</p>
          {meta && (
            <p className="text-xs text-muted truncate">
              {dateLabel && (
                <span className={isOverdue ? "text-red-500" : ""}>
                  {isOverdue ? `Overdue · ${dateLabel}` : dateLabel}
                </span>
              )}
              {dateLabel && t.note ? " · " : ""}
              {t.note}
            </p>
          )}
        </div>
        <button
          onClick={() => updateStudyTask(t.id, { important: !t.important })}
          className={`grid h-10 w-10 place-items-center shrink-0 ${
            t.important ? "text-amber-500" : "text-muted hover:text-amber-500"
          }`}
          aria-label={t.important ? "Unmark important" : "Mark important"}
          aria-pressed={!!t.important}
          title="Important"
        >
          <Star
            size={15}
            aria-hidden
            fill={t.important ? "currentColor" : "none"}
          />
        </button>
        <button
          onClick={() => openEdit(t)}
          className="grid h-10 w-10 place-items-center shrink-0 text-muted hover:text-ink"
          aria-label="Edit task"
        >
          <Pencil size={15} aria-hidden />
        </button>
        <button
          onClick={() => deleteStudyTask(t.id)}
          className="grid h-10 w-10 place-items-center shrink-0 text-muted hover:text-red-500"
          aria-label="Delete task"
        >
          <Trash2 size={15} aria-hidden />
        </button>
      </li>
    );
  }

  if (!hydrated) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Study"
        icon={<BookOpen size={22} aria-hidden />}
        subtitle={`${done.length} tasks completed`}
        action={
          <button onClick={openNew} className="btn-primary">
            + New
          </button>
        }
      />

      <div className="mb-6">
        <FocusTimer />
      </div>

      {tasks.length === 0 ? (
        <EmptyState
          icon={<BookOpen size={22} aria-hidden />}
          title="No study tasks yet"
          hint='Add a task like "Read chapter 4" or "Practice problems", check it off when done, and earn XP.'
          action={
            <button onClick={openNew} className="btn-primary">
              + New task
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          {/* Stats */}
          <section className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            <div className="card p-5 flex items-center gap-4">
              <ProgressRing
                pct={consistency}
                size={72}
                color={consistency === null ? "#3A4760" : consistencyColor(consistency)}
              >
                {consistency === null ? "—" : `${consistency}%`}
              </ProgressRing>
              <div>
                <p className="text-sm font-medium text-ink">On time</p>
                <p className="text-xs text-muted">
                  tasks done on time · last {range} days
                </p>
              </div>
            </div>
            <StatCard label="Tasks completed" value={done.length} />
            <StatCard
              label="Focus time"
              value={fmtMins(focusMins)}
              sub={`over the last ${range} days`}
            />
            <StatCard
              label="XP from study"
              value={earnedXp}
              accent="text-brand-400"
            />
          </section>

          {/* Trend */}
          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink">
                Completed · last {range} days
              </h2>
              <RangeToggle value={range} onChange={setRange} />
            </div>
            <TrendChart data={chartData} type="bar" color="#4D7CFF" />
          </section>

          {/* To do — list (grouped by due date) or Eisenhower matrix */}
          <section className="card p-5">
            <div className="mb-3 flex items-center justify-between gap-2">
              <h2 className="font-semibold text-ink">
                To do{pendingCount > 0 ? ` (${pendingCount})` : ""}
              </h2>
              <div className="flex rounded-lg border border-line p-0.5 text-xs font-medium">
                {(["list", "matrix"] as const).map((v) => (
                  <button
                    key={v}
                    onClick={() => setView(v)}
                    className={`rounded-md px-2.5 py-1 capitalize transition ${
                      view === v
                        ? "bg-brand-500 text-white"
                        : "text-muted hover:text-ink"
                    }`}
                    aria-pressed={view === v}
                  >
                    {v}
                  </button>
                ))}
              </div>
            </div>
            {pendingCount === 0 ? (
              <p className="text-sm text-muted">
                All caught up — nothing left to do. 🎉
              </p>
            ) : view === "matrix" ? (
              <div className="grid gap-4 sm:grid-cols-2">
                {QUADRANTS.map((q) => (
                  <div key={q.key} className="rounded-xl border border-line p-3">
                    <p
                      className={`mb-1 flex items-center gap-1.5 text-xs font-semibold uppercase tracking-wide ${q.accent}`}
                    >
                      <span
                        aria-hidden
                        className={`inline-block h-2 w-2 rounded-full ${q.dot}`}
                      />
                      {q.label} ({quadrants[q.key].length})
                    </p>
                    {quadrants[q.key].length === 0 ? (
                      <p className="py-1 text-xs text-muted">Nothing here.</p>
                    ) : (
                      <ul className="divide-y divide-line">
                        {quadrants[q.key].map(pendingRow)}
                      </ul>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                {overdue.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-red-500">
                      Overdue ({overdue.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {overdue.map(pendingRow)}
                    </ul>
                  </div>
                )}
                {todayTasks.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      Today ({todayTasks.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {todayTasks.map(pendingRow)}
                    </ul>
                  </div>
                )}
                {upcoming.length > 0 && (
                  <div>
                    <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-muted">
                      Upcoming ({upcoming.length})
                    </p>
                    <ul className="divide-y divide-line">
                      {upcoming.map(pendingRow)}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </section>

          {/* Completed — browse by day (defaults to today) */}
          {done.length > 0 && (
            <section className="card p-5">
              <div className="flex items-center justify-between mb-1">
                <h2 className="font-semibold text-ink">Completed</h2>
                <p className="text-xs text-muted">
                  {dayDone.length} on this day · +{dayXp} XP
                </p>
              </div>

              {/* Day navigator */}
              <div className="mb-3 flex items-center gap-2">
                <button
                  onClick={() => setDoneDay((d) => addDays(d, -1))}
                  className="btn-ghost border border-line px-2.5 py-1"
                  aria-label="Previous day"
                >
                  ‹
                </button>
                <input
                  type="date"
                  className="input flex-1"
                  value={doneDay}
                  max={today}
                  onChange={(e) => setDoneDay(e.target.value || today)}
                  aria-label="Completed day"
                />
                <button
                  onClick={() =>
                    setDoneDay((d) => (addDays(d, 1) > today ? d : addDays(d, 1)))
                  }
                  disabled={doneDay >= today}
                  className="btn-ghost border border-line px-2.5 py-1 disabled:opacity-40"
                  aria-label="Next day"
                >
                  ›
                </button>
                {doneDay !== today && (
                  <button
                    onClick={() => setDoneDay(today)}
                    className="btn-ghost border border-line px-3 py-1 text-sm"
                  >
                    Today
                  </button>
                )}
              </div>

              {dayDone.length === 0 ? (
                <p className="text-sm text-muted">
                  Nothing completed on {prettyDate(doneDay)}.
                </p>
              ) : (
                <ul className="divide-y divide-line">
                  {dayDone.map((t) => (
                    <li key={t.id} className="flex items-center gap-3 py-2.5">
                      <button
                        onClick={() => toggleStudyTaskDone(t.id)}
                        className="grid h-7 w-7 shrink-0 place-items-center rounded-lg border-2 border-mint bg-mint text-sm text-white transition"
                        aria-label="Mark not done"
                      >
                        ✓
                      </button>
                      <div className="min-w-0 flex-1">
                        <p className="text-sm font-medium text-muted line-through truncate">
                          {t.title}
                        </p>
                        {t.note && (
                          <p className="text-xs text-muted truncate">{t.note}</p>
                        )}
                      </div>
                      <button
                        onClick={() => deleteStudyTask(t.id)}
                        className="text-muted hover:text-red-500 text-sm px-1 shrink-0"
                        aria-label="Delete task"
                      >
                        <Trash2 size={15} aria-hidden />
                      </button>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          )}
        </div>
      )}

      {/* New / edit task modal */}
      <Modal
        open={showForm}
        onClose={closeForm}
        title={editId ? "Edit study task" : "New study task"}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="task-title">
              Task
            </label>
            <input
              id="task-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Read chapter 4"
              autoFocus
            />
          </div>
          <div>
            <label className="label" htmlFor="task-note">
              Note (optional)
            </label>
            <input
              id="task-note"
              className="input"
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. sections 4.1–4.3"
            />
          </div>
          <div>
            <label className="label" htmlFor="task-date">
              Due date
            </label>
            <input
              id="task-date"
              type="date"
              required
              className="input"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
            <p className="mt-1 text-xs text-muted">
              Shows on this day in your calendar. Defaults to today.
            </p>
          </div>
          <label className="flex items-center gap-2 text-sm text-ink">
            <input
              type="checkbox"
              checked={important}
              onChange={(e) => setImportant(e.target.checked)}
            />
            <span>Important</span>
            <span className="text-xs text-muted">
              — places it in the top row of the matrix
            </span>
          </label>
          {!editId && (
            <p className="text-xs text-muted">
              Completing a task earns +{XP_REWARDS.taskCompletion} XP.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            {editId ? "Save changes" : "Add task"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
