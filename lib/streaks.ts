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
