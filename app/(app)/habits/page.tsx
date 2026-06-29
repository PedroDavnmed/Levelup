"use client";

import { useMemo, useState } from "react";
import { useStore } from "@/lib/store";
import { todayStr } from "@/lib/date";
import { liveStreak } from "@/lib/streaks";
import { completionsByDay } from "@/lib/aggregate";
import { habitConsistency, consistencyColor } from "@/lib/consistency";
import PageHeader from "@/components/PageHeader";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import TrendChart from "@/components/TrendChart";
import ProgressRing from "@/components/ProgressRing";

export default function HabitsPage() {
  const { state, hydrated, addHabit, deleteHabit, toggleHabitToday } =
    useStore();
  const [showNew, setShowNew] = useState(false);
  const [title, setTitle] = useState("");

  const today = todayStr();
  const doneTodayCount = useMemo(
    () => state.completions.filter((c) => c.completedOn === today).length,
    [state.completions, today]
  );
  const chartData = completionsByDay(state.completions, 14);
  const consistency = habitConsistency(state.habits, state.completions, 30);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!title.trim()) return;
    addHabit(title.trim());
    setTitle("");
    setShowNew(false);
  }

  if (!hydrated) return null;

  return (
    <div>
      <PageHeader
        title="Habits"
        icon="🔥"
        subtitle={`${doneTodayCount}/${state.habits.length} done today`}
        action={
          <button onClick={() => setShowNew(true)} className="btn-primary">
            + New
          </button>
        }
      />

      {state.habits.length === 0 ? (
        <EmptyState
          icon="🔥"
          title="No habits yet"
          hint='Add a daily habit like "Drink water" or "Read 10 pages" and keep the streak alive.'
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
                share of habit-days completed over the last 30 days — skip a
                planned day and it drops
              </p>
            </div>
          </section>

          <section className="space-y-3">
            {state.habits.map((h) => {
              const done = state.completions.some(
                (c) => c.habitId === h.id && c.completedOn === today
              );
              const streak = liveStreak(
                h.lastCompletedDate,
                h.currentStreak,
                today
              );
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
                    </p>
                  </div>
                  <button
                    onClick={() => {
                      if (confirm(`Delete habit "${h.title}"?`))
                        deleteHabit(h.id);
                    }}
                    className="text-muted hover:text-red-500 text-sm px-1 shrink-0"
                    aria-label="Delete habit"
                  >
                    🗑
                  </button>
                </div>
              );
            })}
          </section>

          <section className="card p-5">
            <h2 className="font-semibold text-ink mb-3">
              Completions · last 14 days
            </h2>
            <TrendChart data={chartData} type="bar" color="#f6c66b" />
          </section>
        </div>
      )}

      <Modal open={showNew} onClose={() => setShowNew(false)} title="New habit">
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
          <p className="text-xs text-muted">
            Each completion earns +5 XP and grows your streak.
          </p>
          <button type="submit" className="btn-primary w-full">
            Add habit
          </button>
        </form>
      </Modal>
    </div>
  );
}
