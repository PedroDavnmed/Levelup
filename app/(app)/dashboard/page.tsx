"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { todayStr } from "@/lib/date";
import { xpByDay, lastNDates } from "@/lib/aggregate";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import EmptyState from "@/components/EmptyState";

export default function DashboardPage() {
  const { state, hydrated, setDisplayName, toggleHabitToday } = useStore();
  const { displayName, totalXp } = state.profile;
  const prog = levelProgress(totalXp);
  const today = todayStr();

  const weekDates = useMemo(() => new Set(lastNDates(7)), []);
  const sessionsThisWeek = useMemo(
    () => state.logs.filter((l) => weekDates.has(l.loggedAt.slice(0, 10))).length,
    [state.logs, weekDates]
  );
  const habitsDoneToday = state.completions.filter(
    (c) => c.completedOn === today
  ).length;
  const activeGoals = state.goals.filter((g) => g.status === "active").length;
  const xpData = xpByDay(state.logs, state.completions, 14);

  const unlockedCount = state.achievements.length;
  const rankInfo = rankForCount(unlockedCount);

  function editName() {
    const name = prompt("Your display name:", displayName);
    if (name && name.trim()) setDisplayName(name.trim());
  }

  if (!hydrated) {
    return <div className="text-muted text-sm">Loading your stats…</div>;
  }

  const isEmpty =
    state.activities.length === 0 &&
    state.habits.length === 0 &&
    state.goals.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="text-3xl font-bold text-ink">
            {displayName} 👋{" "}
            <button
              onClick={editName}
              className="text-xs font-normal text-brand-600 align-middle"
            >
              edit
            </button>
          </h1>
        </div>
      </header>

      {/* Level hero */}
      <section className="card p-6">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <span className="grid h-12 w-12 place-items-center rounded-xl bg-brand-500 text-white text-xl font-bold">
              {prog.level}
            </span>
            <div>
              <p className="font-semibold text-ink">Level {prog.level}</p>
              <p className="text-xs text-muted">{totalXp} total XP</p>
            </div>
          </div>
          <p className="text-sm text-muted">
            {prog.toNext} XP to level {prog.level + 1}
          </p>
        </div>
        <div className="h-3 rounded-full bg-bg overflow-hidden">
          <div
            className="h-full rounded-full bg-gradient-to-r from-brand-400 to-brand-600 transition-all duration-700"
            style={{ width: `${prog.pct}%` }}
          />
        </div>
      </section>

      {/* Rank */}
      <section className="card p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <span
              className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
              style={{ backgroundColor: `${rankInfo.rank.color}22` }}
            >
              {rankInfo.rank.icon}
            </span>
            <div>
              <p className="font-semibold text-ink">
                {rankInfo.rank.name} rank
              </p>
              <p className="text-xs text-muted">
                {unlockedCount} / {ACHIEVEMENTS.length} achievements unlocked
              </p>
            </div>
          </div>
          <p className="text-sm text-muted text-right">
            {rankInfo.next
              ? `${rankInfo.toNext} more to ${rankInfo.next.name}`
              : "Max rank reached 🎉"}
          </p>
        </div>
        <div className="mt-3 h-2.5 rounded-full bg-bg overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-700"
            style={{
              width: `${rankInfo.pct}%`,
              backgroundColor: rankInfo.rank.color,
            }}
          />
        </div>
      </section>

      {isEmpty && (
        <EmptyState
          icon="🚀"
          title="Let's get your stats moving"
          hint="Add a training or study activity, create a habit, or set a goal — every action earns XP and fills your charts."
        />
      )}

      {/* Quick stats */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total XP" value={totalXp} accent="text-brand-600" />
        <StatCard label="Sessions (7d)" value={sessionsThisWeek} />
        <StatCard
          label="Habits today"
          value={`${habitsDoneToday}/${state.habits.length}`}
        />
        <StatCard label="Active goals" value={activeGoals} />
      </section>

      {/* XP trend */}
      <section className="card p-5">
        <h2 className="font-semibold text-ink mb-3">XP earned · last 14 days</h2>
        <TrendChart data={xpData} type="area" color="#5b7cfa" />
      </section>

      {/* Today's habits */}
      {state.habits.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-ink mb-3">Today&apos;s habits</h2>
          <ul className="space-y-2">
            {state.habits.map((h) => {
              const done = state.completions.some(
                (c) => c.habitId === h.id && c.completedOn === today
              );
              return (
                <li key={h.id} className="flex items-center gap-3">
                  <button
                    onClick={() => toggleHabitToday(h.id)}
                    className={`grid h-7 w-7 place-items-center rounded-lg border-2 text-sm transition ${
                      done
                        ? "bg-mint border-mint text-white"
                        : "border-line text-muted hover:border-mint"
                    }`}
                    aria-label={done ? "Mark not done" : "Mark done"}
                  >
                    {done ? "✓" : ""}
                  </button>
                  <span
                    className={`text-sm ${done ? "text-muted line-through" : "text-ink"}`}
                  >
                    {h.title}
                  </span>
                </li>
              );
            })}
          </ul>
        </section>
      )}
    </div>
  );
}
