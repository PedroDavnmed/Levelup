import type { Habit, HabitCompletion, StudyTask } from "./types";
import { todayStr, dayDiff, addDays, localDateOf, isScheduled } from "./date";
import { studyTaskDate } from "./aggregate";

/**
 * "Show-up" consistency for activity trackers (training / study):
 * the share of days you actually logged something, measured from your first
 * log (or `n` days ago, whichever is later) up to today.
 *
 * @param logDates  YYYY-MM-DD strings, one per log
 */
export function activeDaysConsistency(logDates: string[], n = 30): number {
  if (logDates.length === 0) return 0;
  const today = todayStr();
  const windowStart = addDays(today, -(n - 1));
  const firstLog = logDates.reduce((min, d) => (d < min ? d : min), today);
  const start = firstLog > windowStart ? firstLog : windowStart;
  const totalDays = dayDiff(start, today) + 1;
  if (totalDays <= 0) return 0;
  const active = new Set(logDates.filter((d) => d >= start && d <= today));
  return Math.round((active.size / totalDays) * 100);
}

/**
 * Daily consistency for habits: across every day each habit has existed
 * (within the last `n` days), the share that were actually completed.
 * Planning a daily habit and skipping a day lowers this number.
 */
export function habitConsistency(
  habits: Habit[],
  completions: HabitCompletion[],
  n = 30
): number {
  if (habits.length === 0) return 0;
  const today = todayStr();
  const windowStart = addDays(today, -(n - 1));
  const done = new Set(completions.map((c) => `${c.habitId}|${c.completedOn}`));

  let expected = 0;
  let completed = 0;
  for (const h of habits) {
    const created = localDateOf(h.createdAt);
    const start = created > windowStart ? created : windowStart;
    const days = dayDiff(start, today) + 1;
    for (let i = 0; i < days; i++) {
      const d = addDays(start, i);
      if (!isScheduled(d, h.days)) continue; // only scheduled days are expected
      expected++;
      if (done.has(`${h.id}|${d}`)) completed++;
    }
  }
  return expected > 0 ? Math.round((completed / expected) * 100) : 0;
}

/**
 * Deadline consistency for one-off study tasks: of the tasks that have come due
 * within the last `n` days, the share completed. A task counts against you only
 * once it's overdue and still undone — idle days and future/not-yet-due tasks
 * never lower it. A late completion still counts as done. Returns 100 when
 * nothing has come due yet (a clean record).
 */
export function taskConsistency(
  tasks: StudyTask[],
  today: string,
  n = 30
): number {
  const windowStart = addDays(today, -(n - 1));
  let done = 0;
  let missed = 0;
  for (const t of tasks) {
    const due = studyTaskDate(t);
    if (due < windowStart || due > today) continue; // outside window / not yet due
    if (t.done) done++;
    else if (due < today) missed++; // overdue and still open (due today = neutral)
  }
  const total = done + missed;
  return total === 0 ? 100 : Math.round((done / total) * 100);
}

/** A friendly colour for a consistency percentage. */
export function consistencyColor(pct: number): string {
  if (pct >= 80) return "#3DD68C"; // mint
  if (pct >= 50) return "#FFB454"; // amber
  return "#FF8A7A"; // peach
}
