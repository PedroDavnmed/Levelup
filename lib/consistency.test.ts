import { describe, it, expect } from "vitest";
import { activeDaysConsistency, habitConsistency } from "./consistency";
import { todayStr, addDays } from "./date";
import type { Habit, HabitCompletion } from "./types";

const today = todayStr();

describe("activeDaysConsistency", () => {
  it("is 0 with no logs", () => {
    expect(activeDaysConsistency([], 30)).toBe(0);
  });

  it("measures active days from the first log to today", () => {
    // First log 4 days ago -> window of 5 days (incl today). Active on 3 of them.
    const dates = [addDays(today, -4), addDays(today, -2), today];
    expect(activeDaysConsistency(dates, 30)).toBe(60); // 3 / 5
  });

  it("is 100 when every day since the first log is active", () => {
    const dates = [addDays(today, -2), addDays(today, -1), today];
    expect(activeDaysConsistency(dates, 30)).toBe(100);
  });
});

describe("habitConsistency", () => {
  it("is 0 with no habits", () => {
    expect(habitConsistency([], [], 30)).toBe(0);
  });

  it("counts completed days out of days the habit has existed", () => {
    const habit: Habit = {
      id: "h1",
      title: "Water",
      currentStreak: 0,
      longestStreak: 0,
      lastCompletedDate: null,
      createdAt: `${addDays(today, -2)}T08:00:00.000Z`, // 3-day window incl today
    };
    const completions: HabitCompletion[] = [
      { id: "c1", habitId: "h1", completedOn: addDays(today, -2) },
      { id: "c2", habitId: "h1", completedOn: today },
    ];
    expect(habitConsistency([habit], completions, 30)).toBe(67); // 2 / 3
  });
});
