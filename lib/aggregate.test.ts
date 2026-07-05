import { describe, it, expect } from "vitest";
import {
  sumByDay,
  countByDay,
  countDatesByDay,
  xpByDay,
  studyTaskDates,
  studyTaskDate,
  studyTasksCompletedOn,
  focusMinutesByDay,
  totalFocusMinutes,
} from "./aggregate";
import { todayStr } from "./date";
import type {
  ActivityLog,
  FocusSession,
  HabitCompletion,
  StudyTask,
} from "./types";
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

function focus(daysAgo: number, hour: number, minutes: number): FocusSession {
  return {
    id: `f${daysAgo}-${hour}`,
    taskId: null,
    minutes,
    startedAt: isoAtLocal(daysAgo, hour),
    completedAt: isoAtLocal(daysAgo, hour),
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

  it("xpByDay combines activity, habit, and study-task XP on the same LOCAL day", () => {
    const today = todayStr();
    const logs = [log(0, 10, 20, 20)];
    const comps: HabitCompletion[] = [
      { id: "c1", habitId: "h1", completedOn: today },
    ];
    const tasks: StudyTask[] = [
      {
        id: "t1",
        title: "Read",
        done: true,
        createdAt: isoAtLocal(0, 8),
        completedAt: isoAtLocal(0, 11),
      },
    ];
    const points = xpByDay(logs, comps, tasks, 7);
    expect(points[points.length - 1].value).toBe(
      20 + XP_REWARDS.habitCompletion + XP_REWARDS.taskCompletion
    );
  });
});

describe("focus session aggregation", () => {
  it("focusMinutesByDay sums minutes into the correct LOCAL day", () => {
    const points = focusMinutesByDay([focus(0, 23, 25), focus(0, 9, 50)], 7);
    expect(points).toHaveLength(7);
    expect(points[points.length - 1].value).toBe(75); // both today
    expect(points.slice(0, -1).every((p) => p.value === 0)).toBe(true);
  });

  it("focusMinutesByDay excludes sessions outside the window", () => {
    const points = focusMinutesByDay([focus(30, 12, 50)], 7);
    expect(points.every((p) => p.value === 0)).toBe(true);
  });

  it("totalFocusMinutes sums all sessions, or only those within sinceDays", () => {
    const sessions = [focus(0, 9, 25), focus(1, 9, 50), focus(30, 9, 40)];
    expect(totalFocusMinutes(sessions)).toBe(115); // all
    expect(totalFocusMinutes(sessions, 7)).toBe(75); // last 7 days only
  });
});

describe("study task aggregation", () => {
  it("studyTaskDates returns local completion dates for done tasks only", () => {
    const today = todayStr();
    const tasks: StudyTask[] = [
      { id: "t1", title: "A", done: true, createdAt: isoAtLocal(0, 8), completedAt: isoAtLocal(0, 23) },
      { id: "t2", title: "B", done: false, createdAt: isoAtLocal(0, 8), completedAt: null },
    ];
    expect(studyTaskDates(tasks)).toEqual([today]); // 11pm local stays "today"
  });

  it("countDatesByDay counts completed study tasks per day", () => {
    const today = todayStr();
    const points = countDatesByDay([today, today], 7);
    expect(points[points.length - 1].value).toBe(2);
    expect(points.slice(0, -1).every((p) => p.value === 0)).toBe(true);
  });

  it("studyTaskDate uses the explicit date, else the createdAt local day", () => {
    const withDate: StudyTask = {
      id: "a", title: "A", done: false,
      createdAt: "2026-06-01T12:00:00", completedAt: null, date: "2026-06-05",
    };
    const noDate: StudyTask = {
      id: "b", title: "B", done: false,
      createdAt: "2026-06-01T12:00:00", completedAt: null,
    };
    expect(studyTaskDate(withDate)).toBe("2026-06-05");
    expect(studyTaskDate(noDate)).toBe("2026-06-01");
  });

  it("studyTasksCompletedOn returns done tasks finished on the given LOCAL day", () => {
    const today = todayStr();
    const tasks: StudyTask[] = [
      // done today at 11pm local — must count as today, not tomorrow (UTC)
      { id: "a", title: "A", done: true, createdAt: isoAtLocal(0, 8), completedAt: isoAtLocal(0, 23) },
      { id: "b", title: "B", done: true, createdAt: isoAtLocal(1, 8), completedAt: isoAtLocal(1, 10) }, // yesterday
      { id: "c", title: "C", done: false, createdAt: isoAtLocal(0, 8), completedAt: null }, // not done
    ];
    expect(studyTasksCompletedOn(tasks, today).map((t) => t.id)).toEqual(["a"]);
  });
});
