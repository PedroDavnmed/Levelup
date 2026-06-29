import { dayDiff, addDays, isScheduled } from "./date";

/**
 * Given a habit's last completion date and current streak, return the streak
 * after completing it again on `today`.
 *  - never completed       -> 1
 *  - already done today     -> unchanged
 *  - completed yesterday    -> +1
 *  - older gap              -> reset to 1
 */
export function nextStreak(
  lastDate: string | null,
  current: number,
  today: string
): number {
  if (!lastDate) return 1;
  if (lastDate === today) return current;
  const diff = dayDiff(lastDate, today);
  if (diff === 1) return current + 1;
  return 1;
}

export interface StreakStats {
  current: number; // consecutive-day run ending at the latest completion
  longest: number; // longest consecutive-day run ever
  last: string | null; // latest completion date, or null if none
}

/**
 * Recompute a habit's streak fields directly from its completion dates.
 *
 * This is the source-of-truth derivation used when completions change (e.g.
 * un-checking a day), so the stored streak can never drift from the actual
 * completion history. `current` is the run of consecutive days ending at the
 * most recent completion; `longest` is the longest such run overall.
 */
export function streakStats(completionDates: string[]): StreakStats {
  if (completionDates.length === 0) {
    return { current: 0, longest: 0, last: null };
  }
  const days = Array.from(new Set(completionDates)).sort();
  let longest = 1;
  let run = 1;
  for (let i = 1; i < days.length; i++) {
    run = dayDiff(days[i - 1], days[i]) === 1 ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  // `run` now holds the length of the final run, which ends at the latest day.
  return { current: run, longest, last: days[days.length - 1] };
}

/**
 * A streak is "alive" if the last completion was today or yesterday; otherwise
 * it has lapsed and should display as 0.
 */
export function liveStreak(
  lastDate: string | null,
  current: number,
  today: string
): number {
  if (!lastDate) return 0;
  const diff = dayDiff(lastDate, today);
  if (diff <= 0) return current; // completed today
  if (diff === 1) return current; // completed yesterday, still alive today
  return 0;
}

// --- Weekday-aware variants -------------------------------------------------
// These reduce exactly to the daily versions above when every day is scheduled.

/** The most recent scheduled day strictly before `date`. */
function prevScheduledDay(date: string, days?: number[]): string {
  let d = addDays(date, -1);
  for (let i = 0; i < 7 && !isScheduled(d, days); i++) d = addDays(d, -1);
  return d;
}

/** The next scheduled day strictly after `date`. */
function nextScheduledDay(date: string, days?: number[]): string {
  let d = addDays(date, 1);
  for (let i = 0; i < 7 && !isScheduled(d, days); i++) d = addDays(d, 1);
  return d;
}

/**
 * Like `streakStats`, but only scheduled days count toward the streak: two
 * scheduled completions are consecutive when no scheduled day was skipped
 * between them. Off-schedule completions don't extend or break the streak.
 */
export function scheduledStreakStats(
  completionDates: string[],
  days?: number[]
): StreakStats {
  if (completionDates.length === 0) {
    return { current: 0, longest: 0, last: null };
  }
  const all = Array.from(new Set(completionDates)).sort();
  const last = all[all.length - 1];
  const sched = all.filter((d) => isScheduled(d, days));
  if (sched.length === 0) return { current: 0, longest: 0, last };

  let longest = 1;
  let run = 1;
  for (let i = 1; i < sched.length; i++) {
    run = prevScheduledDay(sched[i], days) === sched[i - 1] ? run + 1 : 1;
    longest = Math.max(longest, run);
  }
  return { current: run, longest, last };
}

/**
 * Schedule-aware `liveStreak`: the streak is still alive unless a scheduled day
 * has passed (strictly before today) without a completion since `lastDate`.
 */
export function liveScheduledStreak(
  lastDate: string | null,
  current: number,
  days: number[] | undefined,
  today: string
): number {
  if (!lastDate) return 0;
  if (lastDate >= today) return current; // completed today (or later)
  return nextScheduledDay(lastDate, days) >= today ? current : 0;
}
