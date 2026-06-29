import { describe, it, expect } from "vitest";
import { sumByDay, countByDay, xpByDay } from "./aggregate";
import { todayStr } from "./date";
import type { ActivityLog, HabitCompletion } from "./types";
import { XP_REWARDS } from "./types";

/** ISO timestamp for `daysAgo` ago at a given LOCAL hour. */
function isoAtLocal(daysAgo: number, hour: number): string {
  const d = new Date();
  d.setDate(d.getDate() - daysAgo);
  d.setHours(hour, 0, 0, 0);
  return d.toISOString();
}

function log(
  daysAgo: number,
  hour: number,
  value: number,
  xp = value
): ActivityLog {
  return {
    id: `${daysAgo}-${hour}`,
    activityId: "a1",
    value,
    xpAwarded: xp,
    loggedAt: isoAtLocal(daysAgo, hour),
  };
}

describe("aggregate bucketing", () => {
  it("buckets a late-evening log into the correct LOCAL day (regression for the UTC-slice bug)", () => {
    // 11pm local today. In negative-UTC zones its ISO date is *tomorrow* (UTC),
    // which the old `iso.slice(0,10)` would have misfiled or dropped.
    const points = sumByDay([log(0, 23, 45)], 7);
    expect(points).toHaveLength(7);
    expect(points[points.length - 1].value).toBe(45); // today's column
    expect(points.slice(0, -1).every((p) => p.value === 0)).toBe(true);
  });

  it("excludes logs outside the window", () => {
    const points = sumByDay([log(30, 12, 99)], 7);
    expect(points.every((p) => p.value === 0)).toBe(true);
  });

  it("countByDay counts logs per day", () => {
    const points = countByDay([log(0, 9, 10), log(0, 18, 5), log(1, 9, 7)], 7);
    expect(points[points.length - 1].value).toBe(2); // two logs today
    expect(points[points.length - 2].value).toBe(1); // one yesterday
  });

  it("xpByDay combines activity XP and habit XP on the same LOCAL day", () => {
    const today = todayStr();
    const logs = [log(0, 10, 20, 20)];
    const comps: HabitCompletion[] = [
      { id: "c1", habitId: "h1", completedOn: today },
    ];
    const points = xpByDay(logs, comps, 7);
    expect(points[points.length - 1].value).toBe(
      20 + XP_REWARDS.habitCompletion
    );
  });
});
