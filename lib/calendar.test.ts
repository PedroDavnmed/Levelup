import { describe, it, expect } from "vitest";
import {
  calendarItemsForDate,
  upcomingItems,
  allCalendarItems,
} from "./calendar";
import type { AppState, CalendarEvent, Goal, StudyTask } from "./types";

function baseState(): AppState {
  return {
    profile: { displayName: "P", totalXp: 0 },
    activities: [],
    logs: [],
    habits: [],
    completions: [],
    goals: [],
    events: [],
    studyTasks: [],
    achievements: [],
  };
}

const D = "2026-06-10";

function event(over: Partial<CalendarEvent> = {}): CalendarEvent {
  return {
    id: "e1",
    title: "Standup",
    type: "task",
    date: D,
    startTime: "09:00",
    endTime: "10:00",
    done: false,
    createdAt: "2026-06-01T00:00:00Z",
    ...over,
  };
}
function studyTask(over: Partial<StudyTask> = {}): StudyTask {
  return {
    id: "s1",
    title: "Read ch.4",
    done: false,
    createdAt: "2026-06-10T12:00:00", // local noon — local date is 2026-06-10
    completedAt: null,
    ...over,
  };
}
function goal(over: Partial<Goal> = {}): Goal {
  return {
    id: "g1",
    title: "Run 50km",
    targetValue: 50,
    currentValue: 12,
    deadline: D,
    status: "active",
    createdAt: "2026-06-01T00:00:00Z",
    ...over,
  };
}

describe("calendarItemsForDate", () => {
  it("merges events, study tasks (by due date), and goal deadlines on a day", () => {
    const s = baseState();
    s.events.push(event(), event({ id: "e2", date: "2026-06-11" }));
    s.studyTasks.push(
      studyTask({ id: "s1", date: D }),
      studyTask({ id: "s2", date: undefined }), // falls back to createdAt (2026-06-10)
      studyTask({ id: "s3", date: "2026-06-12" })
    );
    s.goals.push(goal(), goal({ id: "g2", deadline: null }));

    const items = calendarItemsForDate(s, D);
    // e1 + s1 + s2 + g1
    expect(items.map((i) => i.id).sort()).toEqual(["e1", "g1", "s1", "s2"]);
  });

  it("puts all-day items (study/goal) before timed events, and sets action flags", () => {
    const s = baseState();
    s.events.push(event()); // timed 09:00
    s.studyTasks.push(studyTask({ id: "s1", date: D, done: true }));
    s.goals.push(goal());

    const items = calendarItemsForDate(s, D);
    // all-day first, timed event last
    expect(items[items.length - 1].source).toBe("event");

    const study = items.find((i) => i.source === "study")!;
    expect(study.done).toBe(true);
    expect(study.toggleable).toBe(true);

    const g = items.find((i) => i.source === "goal")!;
    expect(g.toggleable).toBe(false);
    expect(g.href).toBe("/goals");
  });
});

describe("upcomingItems", () => {
  it("returns not-done items from today onward, soonest first", () => {
    const s = baseState();
    s.events.push(
      event({ id: "past", date: "2026-06-09" }), // excluded (past)
      event({ id: "done", date: "2026-06-11", done: true }), // excluded (done)
      event({ id: "soon", date: "2026-06-11" })
    );
    s.studyTasks.push(studyTask({ id: "st", date: "2026-06-10" }));
    s.goals.push(goal({ deadline: "2026-06-15" }));

    const items = upcomingItems(s, D, 5);
    expect(items.map((i) => i.id)).toEqual(["st", "soon", "g1"]);
  });
});

describe("allCalendarItems", () => {
  it("includes every event + every study task + only goals with a deadline", () => {
    const s = baseState();
    s.events.push(event({ id: "e1" }), event({ id: "e2", date: "2026-07-01" }));
    s.studyTasks.push(
      studyTask({ id: "s1", date: D }),
      studyTask({ id: "s2", date: undefined }) // still on the calendar (createdAt fallback)
    );
    s.goals.push(
      goal({ id: "g1", deadline: D }),
      goal({ id: "g2", deadline: null }) // no deadline → not on the calendar
    );

    const items = allCalendarItems(s);
    expect(items.length).toBe(2 + 2 + 1); // events + studyTasks + goals-with-deadline
    expect(items.map((i) => i.id).sort()).toEqual(["e1", "e2", "g1", "s1", "s2"]);
  });
});
