export type ActivityType = "training" | "study";

export interface Activity {
  id: string;
  type: ActivityType;
  title: string;
  unit: string;
  xpPerLog: number;
  createdAt: string;
}

export interface ActivityLog {
  id: string;
  activityId: string;
  value: number;
  note?: string;
  xpAwarded: number;
  loggedAt: string; // ISO timestamp
}

export interface Habit {
  id: string;
  title: string;
  currentStreak: number;
  longestStreak: number;
  lastCompletedDate: string | null; // YYYY-MM-DD
  createdAt: string;
  /** Weekday numbers (0=Sun … 6=Sat) the habit is scheduled on. Absent / empty
   *  / all-seven means every day (backward compatible with older habits). */
  days?: number[];
}

export interface HabitCompletion {
  id: string;
  habitId: string;
  completedOn: string; // YYYY-MM-DD
}

export interface Goal {
  id: string;
  title: string;
  targetValue: number;
  currentValue: number;
  deadline: string | null; // YYYY-MM-DD
  status: "active" | "done";
  createdAt: string;
}

/** A one-off study to-do: created, completed once (awards XP), then kept in a
 *  "Done" list. Dateless, unlike CalendarEvent. */
export interface StudyTask {
  id: string;
  title: string;
  note?: string;
  done: boolean;
  createdAt: string; // ISO
  completedAt: string | null; // ISO, set on completion — drives stats/chart
  /** Due date (YYYY-MM-DD). Absent on older tasks — fall back to createdAt's
   *  local date via `studyTaskDate()`. */
  date?: string;
}

/** A completed focus (Pomodoro) session — timed work, optionally tied to a
 *  study task. Tracked for focus-time stats only; grants no XP (the task's own
 *  completion is the reward). Completing a session never closes the task. */
export interface FocusSession {
  id: string;
  taskId: string | null; // optional link to a StudyTask
  minutes: number; // focused minutes
  startedAt: string; // ISO
  completedAt: string; // ISO — drives day bucketing / stats
}

export type EventType = "task" | "meeting" | "event";

export interface CalendarEvent {
  id: string;
  title: string;
  type: EventType;
  date: string; // YYYY-MM-DD
  startTime: string | null; // HH:MM (24h) or null for all-day
  endTime: string | null; // HH:MM (24h) or null
  notes?: string;
  done: boolean; // mainly meaningful for tasks
  createdAt: string;
}

export interface UnlockedAchievement {
  key: string;
  unlockedAt: string;
}

export interface Profile {
  displayName: string;
  totalXp: number;
}

export interface AppState {
  profile: Profile;
  activities: Activity[];
  logs: ActivityLog[];
  habits: Habit[];
  completions: HabitCompletion[];
  goals: Goal[];
  events: CalendarEvent[];
  studyTasks: StudyTask[];
  focusSessions: FocusSession[];
  achievements: UnlockedAchievement[];
}

export const XP_REWARDS = {
  habitCompletion: 5,
  goalCompletion: 50,
  taskCompletion: 10,
} as const;
