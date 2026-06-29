import { describe, it, expect } from "vitest";
import { nextStreak, liveStreak, streakStats } from "./streaks";
import { dayDiff, addDays } from "./date";

describe("date helpers", () => {
  it("dayDiff counts whole days", () => {
    expect(dayDiff("2026-06-01", "2026-06-02")).toBe(1);
    expect(dayDiff("2026-06-01", "2026-06-01")).toBe(0);
    expect(dayDiff("2026-06-28", "2026-07-01")).toBe(3);
  });
  it("addDays crosses month boundaries", () => {
    expect(addDays("2026-06-30", 1)).toBe("2026-07-01");
  });
});

describe("nextStreak", () => {
  const today = "2026-06-28";
  it("first ever completion -> 1", () => {
    expect(nextStreak(null, 0, today)).toBe(1);
  });
  it("already completed today -> unchanged", () => {
    expect(nextStreak(today, 4, today)).toBe(4);
  });
  it("completed yesterday -> increment", () => {
    expect(nextStreak("2026-06-27", 4, today)).toBe(5);
  });
  it("gap of 2+ days -> reset to 1", () => {
    expect(nextStreak("2026-06-25", 4, today)).toBe(1);
  });
});

describe("liveStreak", () => {
  const today = "2026-06-28";
  it("never completed -> 0", () => {
    expect(liveStreak(null, 0, today)).toBe(0);
  });
  it("completed today -> current", () => {
    expect(liveStreak(today, 6, today)).toBe(6);
  });
  it("completed yesterday -> still alive", () => {
    expect(liveStreak("2026-06-27", 6, today)).toBe(6);
  });
  it("lapsed (2+ days) -> 0", () => {
    expect(liveStreak("2026-06-25", 6, today)).toBe(0);
  });
});

describe("streakStats", () => {
  it("no completions -> all zero/null", () => {
    expect(streakStats([])).toEqual({ current: 0, longest: 0, last: null });
  });
  it("single day -> 1", () => {
    expect(streakStats(["2026-06-28"])).toEqual({
      current: 1,
      longest: 1,
      last: "2026-06-28",
    });
  });
  it("consecutive run -> current and longest equal the run", () => {
    expect(
      streakStats(["2026-06-26", "2026-06-27", "2026-06-28"])
    ).toEqual({ current: 3, longest: 3, last: "2026-06-28" });
  });
  it("ignores duplicates and order", () => {
    expect(
      streakStats(["2026-06-28", "2026-06-26", "2026-06-27", "2026-06-28"])
    ).toEqual({ current: 3, longest: 3, last: "2026-06-28" });
  });
  it("gap resets current but keeps the longest past run", () => {
    // A 3-day run, a gap, then a 2-day run ending at the latest day.
    expect(
      streakStats([
        "2026-06-10",
        "2026-06-11",
        "2026-06-12",
        "2026-06-27",
        "2026-06-28",
      ])
    ).toEqual({ current: 2, longest: 3, last: "2026-06-28" });
  });

  it("check -> un-check -> re-check restores the same streak (the bug fix)", () => {
    const base = ["2026-06-26", "2026-06-27"]; // streak of 2 ending yesterday
    const today = "2026-06-28";
    // Check today.
    const checked = streakStats([...base, today]);
    expect(checked).toEqual({ current: 3, longest: 3, last: today });
    // Un-check today (remove it).
    const unchecked = streakStats(base);
    expect(unchecked).toEqual({ current: 2, longest: 2, last: "2026-06-27" });
    // Re-check today -> back to 3, not stuck at 2.
    const rechecked = streakStats([...base, today]);
    expect(rechecked).toEqual(checked);
  });
});
