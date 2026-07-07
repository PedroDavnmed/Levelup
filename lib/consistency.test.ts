import { describe, it, expect } from "vitest";
import {
  activeDaysConsistency,
  habitConsistency,
  taskConsistency,
} from "./consistency";
import { todayStr, addDays } from "./date";
import type { Habit, HabitCompletion, StudyTask } from "./types";

const today = todayStr();

/** Minimal StudyTask for consistency tests. */
function task(p: Partial<StudyTask> & { id: string }): StudyTask {
  return {
    title: "T",
    done: false,
    createdAt: `${today}T08:00:00.000Z`,
    completedAt: null,
    ...p,
  };
}

describe("activeDaysConsistency", () => {
  it("is null with no logs (nothing to measure)", () => {
    expect(activeDaysConsistency([], 30)).toBeNull();
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
  it("is null with no habits (nothing to measure)", () => {
    expect(habitConsistency([], [], 30)).toBeNull();
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

describe("taskConsistency", () => {
  it("is null with no tasks (nothing has come due)", () => {
    expect(taskConsistency([], today, 30)).toBeNull();
  });

  it("does not drop on idle days — the reported bug", () => {
    // One task completed 3 days ago, none since. Old metric gave 25% (1/4 days);
    // deadline metric sees 1 due, 1 done -> 100.
    const tasks = [
      task({
        id: "a",
        date: addDays(today, -3),
        done: true,
        completedAt: `${addDays(today, -3)}T09:00:00.000Z`,
      }),
    ];
    expect(taskConsistency(tasks, today, 30)).toBe(100);
  });

  it("only an overdue, undone task lowers it", () => {
    // 4 due (<= today), 3 done, 1 overdue-and-open -> 3/4.
    const tasks = [
      task({ id: "a", date: addDays(today, -4), done: true, completedAt: `${addDays(today, -4)}T09:00:00.000Z` }),
      task({ id: "b", date: addDays(today, -3), done: true, completedAt: `${addDays(today, -3)}T09:00:00.000Z` }),
      task({ id: "c", date: addDays(today, -2), done: true, completedAt: `${addDays(today, -2)}T09:00:00.000Z` }),
      task({ id: "d", date: addDays(today, -1), done: false }), // overdue, open
    ];
    expect(taskConsistency(tasks, today, 30)).toBe(75);
  });

  it("ignores future tasks and treats due-today-open as neutral", () => {
    const tasks = [
      task({ id: "future", date: addDays(today, 5), done: false }), // not yet due
      task({ id: "todayOpen", date: today, done: false }), // day isn't over
    ];
    expect(taskConsistency(tasks, today, 30)).toBeNull(); // nothing has come due
  });

  it("ignores tasks whose due date is outside the window", () => {
    const tasks = [
      task({ id: "old", date: addDays(today, -40), done: false }), // overdue but > 30d ago
    ];
    expect(taskConsistency(tasks, today, 30)).toBeNull();
  });
});
