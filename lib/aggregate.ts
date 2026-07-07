import type {
  ActivityLog,
  CalendarEvent,
  FocusSession,
  Goal,
  HabitCompletion,
  StudyTask,
} from "./types";
import { XP_REWARDS } from "./types";
import { addDays, localDateOf, shortLabel, todayStr } from "./date";
import type { ChartPoint } from "@/components/TrendChart";

/** The last `n` calendar dates (YYYY-MM-DD), oldest first, ending today. */
export function lastNDates(n: number): string[] {
  const today = todayStr();
  return Array.from({ length: n }, (_, i) => addDays(today, -(n - 1 - i)));
}

const dateOf = localDateOf;

/** Sum a numeric field of logs per day over the last `n` days. */
export function sumByDay(
  logs: ActivityLog[],
  n: number,
  field: "value" | "xpAwarded" = "value"
): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const log of logs) {
    const d = dateOf(log.loggedAt);
    if (totals.has(d)) totals.set(d, totals.get(d)! + log[field]);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}

/** Count logs per day over the last `n` days. */
export function countByDay(logs: ActivityLog[], n: number): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const log of logs) {
    const d = dateOf(log.loggedAt);
    if (totals.has(d)) totals.set(d, totals.get(d)! + 1);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}

/** Count occurrences per day over the last `n` days from a list of already
 *  local `YYYY-MM-DD` date strings. */
export function countDatesByDay(dateStrs: string[], n: number): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const d of dateStrs) {
    if (totals.has(d)) totals.set(d, totals.get(d)! + 1);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}

/** Habit completions per day over the last `n` days. */
export function completionsByDay(
  completions: HabitCompletion[],
  n: number
): ChartPoint[] {
  return countDatesByDay(
    completions.map((c) => c.completedOn),
    n
  );
}

/** Local completion dates (YYYY-MM-DD) of every finished study task. */
export function studyTaskDates(tasks: StudyTask[]): string[] {
  return tasks
    .filter((t) => t.done && t.completedAt)
    .map((t) => localDateOf(t.completedAt!));
}

/** Due date of a study task (YYYY-MM-DD): the explicit `date`, or a fallback to
 *  the task's creation day for tasks made before scheduling existed. */
export function studyTaskDate(t: StudyTask): string {
  return t.date ?? localDateOf(t.createdAt);
}

/** Eisenhower quadrant of a pending task. Importance is the stored flag;
 *  urgency is derived from the due date. */
export type Quadrant = "do" | "schedule" | "next" | "later";
export function taskQuadrant(t: StudyTask, today: string): Quadrant {
  const urgent = studyTaskDate(t) <= today; // ponytail: tunable threshold
  if (t.important) return urgent ? "do" : "schedule";
  return urgent ? "next" : "later";
}

/** Study tasks completed on a given local day (YYYY-MM-DD). */
export function studyTasksCompletedOn(
  tasks: StudyTask[],
  date: string
): StudyTask[] {
  return tasks.filter(
    (t) => t.done && t.completedAt && localDateOf(t.completedAt) === date
  );
}

/** Focus minutes per day over the last `n` days (bucketed by completion day). */
export function focusMinutesByDay(
  sessions: FocusSession[],
  n: number
): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const s of sessions) {
    const d = dateOf(s.completedAt);
    if (totals.has(d)) totals.set(d, totals.get(d)! + s.minutes);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}

/** Total focus minutes, optionally limited to the last `sinceDays` days. */
export function totalFocusMinutes(
  sessions: FocusSession[],
  sinceDays?: number
): number {
  if (sinceDays === undefined) {
    return sessions.reduce((sum, s) => sum + s.minutes, 0);
  }
  const window = new Set(lastNDates(sinceDays));
  return sessions.reduce(
    (sum, s) => (window.has(dateOf(s.completedAt)) ? sum + s.minutes : sum),
    0
  );
}

/** Combined XP earned per day: activity logs, habit completions, completed
 *  study tasks, completed goals, and completed calendar tasks — every XP
 *  source, so the chart always reconciles with the profile total. Focus
 *  sessions grant no XP, so they don't appear here. Goals/events completed
 *  before their completion timestamps existed can't be day-bucketed and are
 *  skipped (they still count toward totalXp). */
export function xpByDay(
  logs: ActivityLog[],
  completions: HabitCompletion[],
  studyTasks: StudyTask[],
  goals: Goal[],
  events: CalendarEvent[],
  n: number
): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  const add = (d: string, xp: number) => {
    if (totals.has(d)) totals.set(d, totals.get(d)! + xp);
  };
  for (const log of logs) add(dateOf(log.loggedAt), log.xpAwarded);
  for (const c of completions) add(c.completedOn, XP_REWARDS.habitCompletion);
  for (const d of studyTaskDates(studyTasks))
    add(d, XP_REWARDS.taskCompletion);
  for (const g of goals) {
    if (g.status === "done" && g.completedAt)
      add(dateOf(g.completedAt), XP_REWARDS.goalCompletion);
  }
  for (const e of events) {
    if (e.type === "task" && e.done && e.doneAt)
      add(dateOf(e.doneAt), XP_REWARDS.taskCompletion);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}
