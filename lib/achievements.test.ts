import { describe, it, expect } from "vitest";
import { evaluateNewAchievements, ACHIEVEMENTS } from "./achievements";
import type {
  Activity,
  ActivityLog,
  AppState,
  CalendarEvent,
  Goal,
  HabitCompletion,
} from "./types";

function emptyState(): AppState {
  return {
    profile: { displayName: "P", totalXp: 0 },
    activities: [],
    logs: [],
    habits: [],
    completions: [],
    goals: [],
    events: [],
    achievements: [],
  };
}

function activity(id: string, type: Activity["type"]): Activity {
  return { id, type, title: id, unit: "x", xpPerLog: 10, createdAt: "2026-06-01T00:00:00Z" };
}
function logFor(id: string, activityId: string, value = 10): ActivityLog {
  return { id, activityId, value, xpAwarded: 10, loggedAt: "2026-06-01T10:00:00Z" };
}

describe("achievements catalog", () => {
  it("stays in sync with the seed migration count (36)", () => {
    expect(ACHIEVEMENTS.length).toBe(36);
  });
  it("has unique keys", () => {
    const keys = ACHIEVEMENTS.map((a) => a.key);
    expect(new Set(keys).size).toBe(keys.length);
  });
});

describe("evaluateNewAchievements", () => {
  it("returns nothing for an empty state", () => {
    expect(evaluateNewAchievements(emptyState())).toEqual([]);
  });

  it("unlocks first_workout after a training log", () => {
    const s = emptyState();
    s.activities.push(activity("t1", "training"));
    s.logs.push(logFor("l1", "t1"));
    expect(evaluateNewAchievements(s)).toContain("first_workout");
  });

  it("does not re-return an already-unlocked achievement", () => {
    const s = emptyState();
    s.activities.push(activity("t1", "training"));
    s.logs.push(logFor("l1", "t1"));
    s.achievements.push({ key: "first_workout", unlockedAt: "2026-06-01T00:00:00Z" });
    expect(evaluateNewAchievements(s)).not.toContain("first_workout");
  });

  it("unlocks all_rounder only with training+study logs, a completion, a done goal, and a done task", () => {
    const s = emptyState();
    s.activities.push(activity("t1", "training"), activity("s1", "study"));
    s.logs.push(logFor("l1", "t1"), logFor("l2", "s1"));
    s.completions.push({ id: "c1", habitId: "h1", completedOn: "2026-06-01" } as HabitCompletion);
    s.goals.push({
      id: "g1",
      title: "G",
      targetValue: 1,
      currentValue: 1,
      unit: "x",
      deadline: null,
      status: "done",
      createdAt: "2026-06-01T00:00:00Z",
    } as Goal);
    s.events.push({
      id: "e1",
      title: "Task",
      type: "task",
      date: "2026-06-01",
      startTime: null,
      endTime: null,
      done: true,
      createdAt: "2026-06-01T00:00:00Z",
    } as CalendarEvent);
    expect(evaluateNewAchievements(s)).toContain("all_rounder");
  });
});
