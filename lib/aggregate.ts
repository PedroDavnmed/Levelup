import type { ActivityLog, HabitCompletion } from "./types";
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

/** Habit completions per day over the last `n` days. */
export function completionsByDay(
  completions: HabitCompletion[],
  n: number
): ChartPoint[] {
  const dates = lastNDates(n);
  const totals = new Map(dates.map((d) => [d, 0]));
  for (const c of completions) {
    if (totals.has(c.completedOn))
      totals.set(c.completedOn, totals.get(c.completedOn)! + 1);
  }
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}

/** Combined XP earned per day (activity logs + habit completions). */
export function xpByDay(
  logs: ActivityLog[],
  completions: HabitCompletion[],
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
  return dates.map((d) => ({ label: shortLabel(d), value: totals.get(d)! }));
}
