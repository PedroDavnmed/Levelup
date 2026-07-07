"use client";

import { Flame, Pencil, Trash2 } from "lucide-react";
import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { isScheduled, todayStr } from "@/lib/date";
import { liveScheduledStreak } from "@/lib/streaks";
import { completionsByDay } from "@/lib/aggregate";
import { habitConsistency, consistencyColor } from "@/lib/consistency";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import TrendChart from "@/components/TrendChart";
import ProgressRing from "@/components/ProgressRing";
import RangeToggle from "@/components/RangeToggle";
import Loading from "@/components/Loading";

const DAY_LABELS = ["S", "M", "T", "W", "T", "F", "S"];
const DAY_NAMES = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const ALL_DAYS = [0, 1, 2, 3, 4, 5, 6];

/** "Mon · Wed · Fri", or null for an every-day habit. */
function scheduleText(days?: number[]): string | null {
  if (!days || days.length === 0 || days.length >= 7) return null;
  return [...days].sort((a, b) => a - b).map((d) => DAY_NAMES[d]).join(" · ");
}

export default function HabitsPage() {
  const { state, hydrated, addHabit, deleteHabit, updateHabit, toggleHabitToday } =
    useStore();
  const [showNew, setShowNew] = useState(false);
  const [editId, setEditId] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [days, setDays] = useState<number[]>(ALL_DAYS);
  const [range, setRange] = useState(14);

  const today = todayStr();
  // "Done today" only counts habits actually scheduled today — a Mon/Wed/Fri
  // habit must not read as "missed" on a Tuesday.
  const { doneTodayCount, scheduledTodayCount } = useMemo(() => {
    const scheduledIds = new Set(
      state.habits.filter((h) => isScheduled(today, h.days)).map((h) => h.id)
    );
    return {
      scheduledTodayCount: scheduledIds.size,
      doneTodayCount: state.completions.filter(
        (c) => c.completedOn === today && scheduledIds.has(c.habitId)
      ).length,
    };
  }, [state.habits, state.completions, today]);
  const chartData = completionsByDay(state.completions, range);
  const consistency = habitConsistency(state.habits, state.completions, range);

  // Normalize selection: 0 or all-7 days means "every day" (stored as undefined).
  const scheduleDays =
    days.length === 0 || days.length >= 7
      ? undefined
      : [...days].sort((a, b) => a - b);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    if (editId) updateHabit(editId, { title: title.trim(), days: scheduleDays });
    else addHabit(title.trim(), scheduleDays);
    closeForm();
  }

  function toggleDay(d: number) {
    setDays((cur) =>
      cur.includes(d) ? cur.filter((x) => x !== d) : [...cur, d]
    );
  }

  function openNew() {
    setEditId(null);
    setTitle("");
    setDays(ALL_DAYS);
    setShowNew(true);
  }

  function openEdit(h: (typeof state.habits)[number]) {
    setEditId(h.id);
    setTitle(h.title);
    setDays(h.days && h.days.length ? h.days : ALL_DAYS);
    setShowNew(false);
  }

  function closeForm() {
    setShowNew(false);
    setEditId(null);
    setTitle("");
    setDays(ALL_DAYS);
  }

  if (!hydrated) return <Loading />;

  return (
    <div>
      <PageHeader
        title="Habits"
        icon={<Flame size={22} aria-hidden />}
        subtitle={
          scheduledTodayCount > 0
            ? `${doneTodayCount}/${scheduledTodayCount} done today`
            : "no habits scheduled today"
        }
        action={
          <button onClick={openNew} className="btn-primary">
            + New
          </button>
        }
      />

      {state.habits.length === 0 ? (
        <EmptyState
          icon={<Flame size={22} aria-hidden />}
          title="No habits yet"
          hint='Add a daily habit like "Drink water" or "Read 10 pages" and keep the streak alive.'
          action={
            <button onClick={openNew} className="btn-primary">
              + New habit
            </button>
          }
        />
      ) : (
        <div className="space-y-6">
          <section className="card p-5 flex items-center gap-4">
            <ProgressRing
              pct={consistency}
              size={80}
              color={consistencyColor(consistency)}
            >
              {consistency}%
            </ProgressRing>
            <div>
              <p className="font-medium text-ink">Daily consistency</p>
              <p className="text-xs text-muted">
                share of habit-days completed over the last {range} days — skip a
                planned day and it drops
              </p>
            </div>
          </section>

          <section className="space-y-3">
            {state.habits.map((h) => {
              const done = state.completions.some(
                (c) => c.habitId === h.id && c.completedOn === today
              );
              const streak = liveScheduledStreak(
                h.lastCompletedDate,
                h.currentStreak,
                h.days,
                today
              );
              const sched = scheduleText(h.days);
              return (
                <div key={h.id} className="card p-4 flex items-center gap-4">
                  <button
                    onClick={() => toggleHabitToday(h.id)}
                    className={`grid h-11 w-11 place-items-center rounded-xl border-2 text-lg transition ${
                      done
                        ? "bg-mint border-mint text-white"
                        : "border-line text-muted hover:border-mint"
                    }`}
                    aria-label={done ? "Mark not done" : "Mark done today"}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-ink truncate">{h.title}</p>
                    <p className="text-xs text-muted">
                      🔥 {streak} day streak · best {h.longestStreak}
                      {sched ? ` · ${sched}` : ""}
                      {!isScheduled(today, h.days)
                        ? " · not scheduled today"
                        : ""}
                    </p>
                  </div>
                  <button
                    onClick={() => openEdit(h)}
                    className="text-muted hover:text-ink text-sm px-1 shrink-0"
                    aria-label="Edit habit"
                  >
                    <Pencil size={15} aria-hidden />
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`Delete habit "${h.title}"?`))
                        deleteHabit(h.id);
                    }}
                    className="text-muted hover:text-red-500 text-sm px-1 shrink-0"
                    aria-label="Delete habit"
                  >
                    <Trash2 size={15} aria-hidden />
                  </button>
                </div>
              );
            })}
          </section>

          <section className="card p-5">
            <div className="flex items-center justify-between mb-3">
              <h2 className="font-semibold text-ink">
                Completions · last {range} days
              </h2>
              <RangeToggle value={range} onChange={setRange} />
            </div>
            <TrendChart data={chartData} type="bar" color="#FFB454" />
          </section>
        </div>
      )}

      <Modal
        open={showNew || editId != null}
        onClose={closeForm}
        title={editId ? "Edit habit" : "New habit"}
      >
        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="label" htmlFor="habit-title">
              What do you want to do daily?
            </label>
            <input
              id="habit-title"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Drink 2L water"
              autoFocus
            />
          </div>
          <div>
            <label className="label">Repeat on</label>
            <div className="flex gap-1.5">
              {DAY_LABELS.map((lbl, d) => (
                <button
                  key={d}
                  type="button"
                  onClick={() => toggleDay(d)}
                  aria-pressed={days.includes(d)}
                  aria-label={DAY_NAMES[d]}
                  className={`grid h-9 w-9 place-items-center rounded-lg border text-xs font-medium transition ${
                    days.includes(d)
                      ? "border-brand-500 bg-brand-500 text-white"
                      : "border-line text-muted hover:border-brand-400"
                  }`}
                >
                  {lbl}
                </button>
              ))}
            </div>
            <p className="mt-1 text-xs text-muted">
              {scheduleDays
                ? "Only the selected days count toward your streak."
                : "Every day."}
            </p>
          </div>
          {!editId && (
            <p className="text-xs text-muted">
              Each completion earns +5 XP and grows your streak.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            {editId ? "Save changes" : "Add habit"}
          </button>
        </form>
      </Modal>
    </div>
  );
}
