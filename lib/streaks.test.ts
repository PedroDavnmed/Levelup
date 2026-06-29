import { describe, it, expect } from "vitest";
import { nextStreak, liveStreak } from "./streaks";
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
