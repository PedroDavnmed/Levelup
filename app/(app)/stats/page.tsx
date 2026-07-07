"use client";

import { BarChart3 } from "lucide-react";
import { useMemo } from "react";
import { useStore } from "@/lib/store";
import { levelProgress } from "@/lib/gamification";
import { rankForCount } from "@/lib/ranks";
import { ACHIEVEMENTS } from "@/lib/achievements";
import {
  activeDaysConsistency,
  habitConsistency,
  taskConsistency,
  consistencyColor,
} from "@/lib/consistency";
import { studyTaskDates } from "@/lib/aggregate";
import { allCalendarItems } from "@/lib/calendar";
import PageHeader from "@/components/PageHeader";
import StatCard from "@/components/StatCard";
import ProgressRing from "@/components/ProgressRing";
import { localDateOf, todayStr } from "@/lib/date";
import Loading from "@/components/Loading";

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
    const trainLogs = state.logs.filter((l) => trainIds.has(l.activityId));
    const studyDates = studyTaskDates(state.studyTasks);

    const activeDays = new Set<string>();
    state.logs.forEach((l) => activeDays.add(localDateOf(l.loggedAt)));
    state.completions.forEach((c) => activeDays.add(c.completedOn));
    studyDates.forEach((d) => activeDays.add(d));
    state.events
      .filter((e) => e.type === "task" && e.done)
      .forEach((e) => activeDays.add(e.date));

    // Tasks are unified: study tasks + calendar task-events both count.
    const calTaskEvents = state.events.filter((e) => e.type === "task");
    const tasksDone =
      state.studyTasks.filter((t) => t.done).length +
      calTaskEvents.filter((e) => e.done).length;
    const tasksTotal = state.studyTasks.length + calTaskEvents.length;

    return {
      trainLogs,
      trainConsistency: activeDaysConsistency(
        trainLogs.map((l) => localDateOf(l.loggedAt)),
        30
      ),
      studyConsistency: taskConsistency(state.studyTasks, todayStr(), 30),
      habitConsistency: habitConsistency(state.habits, state.completions, 30),
      completions: state.completions.length,
      longestStreak: state.habits.reduce(
        (mx, h) => Math.max(mx, h.longestStreak),
        0
      ),
      goalsDone: state.goals.filter((g) => g.status === "done").length,
      goalsActive: state.goals.filter((g) => g.status === "active").length,
      tasksDone,
      tasksTotal,
      meetings: state.events.filter((e) => e.type === "meeting").length,
      eventsKind: state.events.filter((e) => e.type === "event").length,
      goalDeadlines: state.goals.filter((g) => g.deadline).length,
      onCalendar: allCalendarItems(state).length,
      activeDays: activeDays.size,
    };
  }, [state]);

  if (!hydrated) return <Loading />;

  const prog = levelProgress(state.profile.totalXp);
  const rank = rankForCount(state.achievements.length);

  return (
    <div>
      <PageHeader
        title="Stats"
        icon={<BarChart3 size={22} aria-hidden />}
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
        <StatCard label="Level" value={prog.level} accent="text-brand-400" />
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
        <StatCard
          label="Tasks done"
          value={`${m.tasksDone}/${m.tasksTotal}`}
          accent="text-brand-400"
        />
        <StatCard label="Days active" value={m.activeDays} />
        <StatCard
          label="Habits completed"
          value={m.completions}
          accent="text-brand-400"
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
        <StatCard label="Meetings" value={m.meetings} />
        <StatCard label="Events" value={m.eventsKind} />
        <StatCard label="Goal deadlines" value={m.goalDeadlines} />
        <StatCard label="On calendar" value={m.onCalendar} />
      </section>
    </div>
  );
}
