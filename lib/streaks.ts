import { dayDiff } from "./date";

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
