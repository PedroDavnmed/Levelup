import { describe, it, expect } from "vitest";
import { serializeBackup, parseBackup } from "./backup";
import type { AppState } from "./types";

function sampleState(): AppState {
  return {
    profile: { displayName: "Pedro", totalXp: 320 },
    activities: [
      { id: "a1", type: "training", title: "Gym", unit: "reps", xpPerLog: 10, createdAt: "2026-06-01T00:00:00Z" },
    ],
    logs: [
      { id: "l1", activityId: "a1", value: 20, xpAwarded: 10, loggedAt: "2026-06-01T10:00:00Z" },
    ],
    habits: [
      { id: "h1", title: "Water", currentStreak: 3, longestStreak: 5, lastCompletedDate: "2026-06-28", createdAt: "2026-06-01T00:00:00Z" },
    ],
    completions: [{ id: "c1", habitId: "h1", completedOn: "2026-06-28" }],
    goals: [
      { id: "g1", title: "Run 50km", targetValue: 50, currentValue: 12, deadline: null, status: "active", createdAt: "2026-06-01T00:00:00Z" },
    ],
    events: [],
    studyTasks: [
      { id: "t1", title: "Read ch. 4", note: "4.1–4.3", done: true, createdAt: "2026-06-01T00:00:00Z", completedAt: "2026-06-02T09:00:00Z" },
      { id: "t2", title: "Practice", done: false, createdAt: "2026-06-03T00:00:00Z", completedAt: null },
    ],
    achievements: [{ key: "first_workout", unlockedAt: "2026-06-01T10:00:00Z" }],
  };
}

describe("backup round-trip", () => {
  it("serialize -> parse recovers the same state", () => {
    const s = sampleState();
    const parsed = parseBackup(serializeBackup(s));
    expect(parsed).toEqual(s);
  });

  it("accepts a bare AppState (no envelope)", () => {
    const s = sampleState();
    expect(parseBackup(JSON.stringify(s))).toEqual(s);
  });

  it("fills missing collection keys from the empty baseline", () => {
    const parsed = parseBackup(
      JSON.stringify({ profile: { displayName: "X", totalXp: 0 }, habits: [] })
    );
    expect(parsed).not.toBeNull();
    expect(parsed!.activities).toEqual([]);
    expect(parsed!.achievements).toEqual([]);
    expect(parsed!.studyTasks).toEqual([]);
  });
});

describe("parseBackup rejects bad input", () => {
  it("returns null for non-JSON", () => {
    expect(parseBackup("not json {")).toBeNull();
  });
  it("returns null when profile is missing", () => {
    expect(parseBackup(JSON.stringify({ activities: [] }))).toBeNull();
  });
  it("returns null when profile lacks a numeric totalXp", () => {
    expect(parseBackup(JSON.stringify({ profile: { displayName: "X" } }))).toBeNull();
    expect(
      parseBackup(JSON.stringify({ profile: { totalXp: "lots" } }))
    ).toBeNull();
  });
  it("returns null when a collection key is not an array", () => {
    expect(
      parseBackup(JSON.stringify({ profile: {}, habits: "nope" }))
    ).toBeNull();
  });
});
