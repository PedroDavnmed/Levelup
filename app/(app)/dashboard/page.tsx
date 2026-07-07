"use client";

import { Check, Rocket } from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import { ACHIEVEMENTS } from "@/lib/achievements";
import { isScheduled, todayStr, localDateOf } from "@/lib/date";
import { xpByDay, lastNDates } from "@/lib/aggregate";
import { upcomingItems, formatTime, shortDate } from "@/lib/calendar";
import StatCard from "@/components/StatCard";
import TrendChart from "@/components/TrendChart";
import RangeToggle from "@/components/RangeToggle";
import EmptyState from "@/components/EmptyState";
import Modal from "@/components/Modal";
import Link from "next/link";

export default function DashboardPage() {
  const { state, hydrated, setDisplayName, toggleHabitToday } = useStore();
  const { displayName, totalXp } = state.profile;
  const prog = levelProgress(totalXp);
  const today = todayStr();

  const weekDates = useMemo(() => new Set(lastNDates(7)), []);
  const sessionsThisWeek = useMemo(
    () => state.logs.filter((l) => weekDates.has(localDateOf(l.loggedAt))).length,
    [state.logs, weekDates]
  );
  // Only habits scheduled today count toward "Habits today" (a Mon/Wed/Fri
  // habit shouldn't read as missed on a Tuesday).
  const scheduledToday = useMemo(
    () => state.habits.filter((h) => isScheduled(today, h.days)),
    [state.habits, today]
  );
  const habitsDoneToday = useMemo(() => {
    const ids = new Set(scheduledToday.map((h) => h.id));
    return state.completions.filter(
      (c) => c.completedOn === today && ids.has(c.habitId)
    ).length;
  }, [state.completions, scheduledToday, today]);
  const activeGoals = state.goals.filter((g) => g.status === "active").length;
  const [xpRange, setXpRange] = useState(14);
  const xpData = xpByDay(
    state.logs,
    state.completions,
    state.studyTasks,
    state.goals,
    state.events,
    xpRange
  );

  const unlockedCount = state.achievements.length;
  const rankInfo = rankForCount(unlockedCount);

  const upcoming = useMemo(
    () => upcomingItems(state, today, 5),
    [state, today]
  );

  const [showName, setShowName] = useState(false);
  const [nameDraft, setNameDraft] = useState("");

  // One-shot shimmer sweep across the XP bar whenever XP goes up.
  const [xpFlash, setXpFlash] = useState(0);
  const prevXp = useRef<number | null>(null);
  useEffect(() => {
    if (!hydrated) return;
    if (prevXp.current !== null && totalXp > prevXp.current) {
      setXpFlash((n) => n + 1);
    }
    prevXp.current = totalXp;
  }, [totalXp, hydrated]);

  function openNameEdit() {
    setNameDraft(displayName);
    setShowName(true);
  }

  function submitName(e: React.FormEvent) {
    e.preventDefault();
    if (nameDraft.trim()) setDisplayName(nameDraft.trim());
    setShowName(false);
  }

  if (!hydrated) {
    return <div className="text-muted text-sm">Loading your stats…</div>;
  }

  const isEmpty =
    state.activities.length === 0 &&
    state.habits.length === 0 &&
    state.goals.length === 0 &&
    state.studyTasks.length === 0 &&
    state.events.length === 0;

  return (
    <div className="space-y-6">
      <header className="flex items-end justify-between">
        <div>
          <p className="text-sm text-muted">Welcome back,</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-ink">
            {displayName} 👋{" "}
            <button
              onClick={openNameEdit}
              className="text-xs font-sans font-normal tracking-normal text-brand-400 align-middle"
            >
              edit
            </button>
          </h1>
        </div>
      </header>

      {/* Character panel — level + rank in one place */}
      <section className="card p-6">
        <div className="grid gap-6 sm:grid-cols-2">
          {/* Level side */}
          <div>
            <div className="flex items-end justify-between gap-3">
              <div>
                <p className="text-xs font-semibold uppercase tracking-widest text-muted">
                  Level
                </p>
                <p className="font-display text-5xl font-bold tracking-tight text-ink leading-none">
                  {prog.level}
                </p>
              </div>
              <div className="text-right">
                <p className="font-mono text-xs text-muted">
                  {totalXp} XP total
                </p>
                <p className="font-mono text-xs text-brand-400">
                  {prog.toNext} XP to LVL {prog.level + 1}
                </p>
              </div>
            </div>
            <div className="relative mt-3 h-3 rounded-full bg-bg overflow-hidden">
              <div
                className="h-full rounded-full bg-gradient-to-r from-brand-500 to-brand-400 glow transition-all duration-700 ease-spring"
                style={{ width: `${prog.pct}%` }}
              />
              {xpFlash > 0 && (
                <span
                  key={xpFlash}
                  aria-hidden
                  className="absolute inset-y-0 left-0 w-1/3 bg-white/25 blur-sm animate-shimmer"
                />
              )}
            </div>
          </div>

          {/* Rank side */}
          <div className="sm:border-l sm:border-line sm:pl-6">
            <div className="flex items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <span
                  className="grid h-12 w-12 place-items-center rounded-xl text-2xl"
                  style={{ backgroundColor: `${rankInfo.rank.color}22` }}
                >
                  {rankInfo.rank.icon}
                </span>
                <div>
                  <p
                    className="font-display font-bold tracking-tight"
                    style={{ color: rankInfo.rank.color }}
                  >
                    {rankInfo.rank.name}
                  </p>
                  <p className="text-xs text-muted">
                    {unlockedCount}/{ACHIEVEMENTS.length} achievements
                  </p>
                </div>
              </div>
              <p className="text-xs text-muted text-right">
                {rankInfo.next
                  ? `${rankInfo.toNext} more to ${rankInfo.next.name}`
                  : "Max rank reached 🎉"}
              </p>
            </div>
            <div className="mt-4 h-2.5 rounded-full bg-bg overflow-hidden">
              <div
                className="h-full rounded-full transition-all duration-700"
                style={{
                  width: `${rankInfo.pct}%`,
                  backgroundColor: rankInfo.rank.color,
                }}
              />
            </div>
          </div>
        </div>
      </section>

      {isEmpty && (
        <EmptyState
          icon={<Rocket size={26} aria-hidden />}
          title="Let's get your stats moving"
          hint="Add a training or study activity, create a habit, or set a goal — every action earns XP and fills your charts."
          action={
            <div className="flex flex-wrap justify-center gap-2">
              <Link href="/training" className="btn-primary">
                Add training
              </Link>
              <Link href="/habits" className="btn-ghost border border-line">
                New habit
              </Link>
              <Link href="/goals" className="btn-ghost border border-line">
                Set a goal
              </Link>
            </div>
          }
        />
      )}

      {/* Quick stats */}
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard label="Total XP" value={totalXp} accent="text-brand-400" />
        <StatCard label="Sessions (7d)" value={sessionsThisWeek} />
        <StatCard
          label="Habits today"
          value={
            scheduledToday.length > 0
              ? `${habitsDoneToday}/${scheduledToday.length}`
              : "—"
          }
        />
        <StatCard label="Active goals" value={activeGoals} />
      </section>

      {/* XP trend */}
      <section className="card p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="font-semibold text-ink">
            XP earned · last {xpRange} days
          </h2>
          <RangeToggle value={xpRange} onChange={setXpRange} />
        </div>
        <TrendChart data={xpData} type="area" color="#4D7CFF" />
      </section>

      {/* Upcoming calendar entries */}
      {upcoming.length > 0 && (
        <section className="card p-5">
          <div className="flex items-center justify-between mb-3">
            <h2 className="font-semibold text-ink">Upcoming</h2>
            <Link href="/calendar" className="text-xs font-medium text-brand-400">
              Open calendar →
            </Link>
          </div>
          <ul className="space-y-2">
            {upcoming.map((it) => (
              <li key={it.key} className="flex items-center gap-3">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ backgroundColor: it.style.color }}
                />
                <span className="text-sm text-ink truncate flex-1">
                  {it.title}
                </span>
                <span className="font-mono text-xs text-muted shrink-0">
                  {shortDate(it.date)}
                  {it.startTime ? ` · ${formatTime(it.startTime)}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      )}

      {/* Today's habits */}
      {state.habits.length > 0 && (
        <section className="card p-5">
          <h2 className="font-semibold text-ink mb-3">Today&apos;s habits</h2>
          {scheduledToday.length === 0 && (
            <p className="text-sm text-muted">
              No habits scheduled today — rest day.
            </p>
          )}
          <ul className="space-y-2">
            {scheduledToday.map((h) => {
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
                    {done ? <Check size={14} aria-hidden /> : null}
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

      {/* Edit display name */}
      <Modal
        open={showName}
        onClose={() => setShowName(false)}
        title="Your display name"
      >
        <form onSubmit={submitName} className="space-y-4">
          <div>
            <label className="label" htmlFor="display-name">
              Name
            </label>
            <input
              id="display-name"
              className="input"
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              placeholder="Player"
              autoFocus
            />
          </div>
          <button type="submit" className="btn-primary w-full">
            Save
          </button>
        </form>
      </Modal>
    </div>
  );
}
