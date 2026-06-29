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
  unit: string;
  deadline: string | null; // YYYY-MM-DD
  status: "active" | "done";
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
  achievements: UnlockedAchievement[];
}

export const XP_REWARDS = {
  habitCompletion: 5,
  goalCompletion: 50,
} as const;
