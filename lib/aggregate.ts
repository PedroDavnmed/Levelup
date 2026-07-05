import type { ActivityLog, HabitCompletion, StudyTask } from "./types";
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

/** Study tasks completed on a given local day (YYYY-MM-DD). */
export function studyTasksCompletedOn(
  tasks: StudyTask[],
  date: string
): StudyTask[] {
  return tasks.filter(
    (t) => t.done && t.completedAt && localDateOf(t.completedAt) === date
  );
}

/** Combined XP earned per day (activity logs + habit completions + completed
 *  study tasks). */
export function xpByDay(
  logs: ActivityLog[],
  completions: HabitCompletion[],
  studyTasks: StudyTask[],
  n: number
): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const log of logs) {
    const d = dateOf(log.loggedAt);
    if (totals.has(d)) totals.set(d, totals.get(d)! + log.xpAwarded);
  }
  for (const c of completions) {
    if (totals.has(c.completedOn))
      totals.set(
        c.completedOn,
        totals.get(c.completedOn)! + XP_REWARDS.habitCompletion
      );
  }
  for (const d of studyTaskDates(studyTasks)) {
    if (totals.has(d))
      totals.set(d, totals.get(d)! + XP_REWARDS.taskCompletion);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}
