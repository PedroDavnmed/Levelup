"use client";

import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import { ACHIEVEMENTS } from "@/lib/achievements";
import {
  activeDaysConsistency,
  habitConsistency,
  consistencyColor,
} from "@/lib/consistency";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";

function ConsistencyCard({
  label,
  pct,
}: {
  label: string;
  pct: number;
}) {
  return (
    <div className="card p-5 flex flex-col items-center text-center gap-2">
      <ProgressRing pct={pct} size={84} color={consistencyColor(pct)}>
        {pct}%
      </ProgressRing>
      <p className="text-sm font-medium text-ink">{label}</p>
    </div>
  );
}

export default function StatsPage() {
  const { state, hydrated } = useStore();

  const m = useMemo(() => {
    const trainIds = new Set(
      state.activities.filter((a) => a.type === "training").map((a) => a.id)
    );
    const studyIds = new Set(
      state.activities.filter((a) => a.type === "study").map((a) => a.id)
    );
    const trainLogs = state.logs.filter((l) => trainIds.has(l.activityId));
    const studyLogs = state.logs.filter((l) => studyIds.has(l.activityId));
    const studyMinutes = studyLogs.reduce((s, l) => s + l.value, 0);

    const activeDays = new Set<string>();
    state.logs.forEach((l) => activeDays.add(l.loggedAt.slice(0, 10)));
    state.completions.forEach((c) => activeDays.add(c.completedOn));
    state.events
      .filter((e) => e.type === "task" && e.done)
      .forEach((e) => activeDays.add(e.date));

    return {
      trainLogs,
      studyLogs,
      studyMinutes,
      trainConsistency: activeDaysConsistency(
        trainLogs.map((l) => l.loggedAt.slice(0, 10)),
        30
      ),
      studyConsistency: activeDaysConsistency(
        studyLogs.map((l) => l.loggedAt.slice(0, 10)),
        30
      ),
      habitConsistency: habitConsistency(state.habits, state.completions, 30),
      completions: state.completions.length,
      longestStreak: state.habits.reduce(
        (mx, h) => Math.max(mx, h.longestStreak),
        0
      ),
      goalsDone: state.goals.filter((g) => g.status === "done").length,
      goalsActive: state.goals.filter((g) => g.status === "active").length,
      tasksDone: state.events.filter((e) => e.type === "task" && e.done).length,
      tasksTotal: state.events.filter((e) => e.type === "task").length,
      meetings: state.events.filter((e) => e.type === "meeting").length,
      eventsKind: state.events.filter((e) => e.type === "event").length,
      entriesTotal: state.events.length,
      activeDays: activeDays.size,
    };
  }, [state]);

  if (!hydrated) return null;

  const prog = levelProgress(state.profile.totalXp);
  const rank = rankForCount(state.achievements.length);
  const studyHours = (m.studyMinutes / 60).toFixed(1);

  return (
    <div>
      <PageHeader
        title="Stats"
        icon="📊"
        subtitle="Every metric you've built up"
      />

      {/* Consistency overview */}
      <section className="grid gap-4 grid-cols-3 mb-6">
        <ConsistencyCard label="Training" pct={m.trainConsistency} />
        <ConsistencyCard label="Study" pct={m.studyConsistency} />
        <ConsistencyCard label="Habits" pct={m.habitConsistency} />
      </section>

      {/* Progression */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
        Progression
      </h2>
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        <StatCard label="Level" value={prog.level} accent="text-brand-600" />
        <StatCard label="Total XP" value={state.profile.totalXp} />
        <StatCard label="Rank" value={`${rank.rank.icon} ${rank.rank.name}`} />
        <StatCard
          label="Achievements"
          value={`${state.achievements.length}/${ACHIEVEMENTS.length}`}
        />
      </section>

      {/* Activity counters */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
        What you&apos;ve done
      </h2>
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4 mb-6">
        <StatCard label="Training sessions" value={m.trainLogs.length} />
        <StatCard label="Study sessions" value={m.studyLogs.length} />
        <StatCard label="Study hours" value={studyHours} />
        <StatCard label="Days active" value={m.activeDays} />
        <StatCard
          label="Habits completed"
          value={m.completions}
          accent="text-brand-600"
        />
        <StatCard label="Longest streak" value={`${m.longestStreak}🔥`} />
        <StatCard label="Goals completed" value={m.goalsDone} />
        <StatCard label="Goals active" value={m.goalsActive} />
      </section>

      {/* Calendar counters */}
      <h2 className="text-sm font-semibold text-muted uppercase tracking-wide mb-2">
        Calendar
      </h2>
      <section className="grid gap-4 grid-cols-2 sm:grid-cols-4">
        <StatCard
          label="Tasks done"
          value={`${m.tasksDone}/${m.tasksTotal}`}
          accent="text-brand-600"
        />
        <StatCard label="Meetings" value={m.meetings} />
        <StatCard label="Events" value={m.eventsKind} />
        <StatCard label="Total entries" value={m.entriesTotal} />
      </section>
    </div>
  );
}
