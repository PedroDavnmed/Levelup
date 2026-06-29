import type { AppState } from "./types";
import { levelForXp } from "./gamification";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  /** Returns true when the user has earned this achievement. */
  earned: (s: AppState) => boolean;
}

/** Static catalog (mirrors supabase/migrations/0003_seed_achievements.sql). */
export const ACHIEVEMENTS: AchievementDef[] = [
  {
    key: "first_workout",
    name: "First Rep",
    description: "Log your first training session.",
    icon: "💪",
    earned: (s) =>
      s.logs.some((l) =>
        s.activities.find((a) => a.id === l.activityId && a.type === "training")
      ),
  },
  {
    key: "first_study",
    name: "Open Book",
    description: "Log your first study session.",
    icon: "📚",
    earned: (s) =>
      s.logs.some((l) =>
        s.activities.find((a) => a.id === l.activityId && a.type === "study")
      ),
  },
  {
    key: "first_habit",
    name: "Day One",
    description: "Complete a habit for the first time.",
    icon: "✅",
    earned: (s) => s.completions.length > 0,
  },
  {
    key: "streak_7",
    name: "Week Warrior",
    description: "Reach a 7-day streak on any habit.",
    icon: "🔥",
    earned: (s) => s.habits.some((h) => h.longestStreak >= 7),
  },
  {
    key: "streak_30",
    name: "Unbreakable",
    description: "Reach a 30-day streak on any habit.",
    icon: "⛓️",
    earned: (s) => s.habits.some((h) => h.longestStreak >= 30),
  },
  {
    key: "study_10h",
    name: "Scholar",
    description: "Accumulate 10 hours (600 min) of study.",
    icon: "🎓",
    earned: (s) => {
      const studyIds = new Set(
        s.activities.filter((a) => a.type === "study").map((a) => a.id)
      );
      const total = s.logs
        .filter((l) => studyIds.has(l.activityId))
        .reduce((sum, l) => sum + l.value, 0);
      return total >= 600;
    },
  },
  {
    key: "train_25",
    name: "Iron Will",
    description: "Log 25 training sessions.",
    icon: "🏋️",
    earned: (s) => {
      const trainIds = new Set(
        s.activities.filter((a) => a.type === "training").map((a) => a.id)
      );
      return s.logs.filter((l) => trainIds.has(l.activityId)).length >= 25;
    },
  },
  {
    key: "level_5",
    name: "Rising Star",
    description: "Reach level 5.",
    icon: "⭐",
    earned: (s) => levelForXp(s.profile.totalXp) >= 5,
  },
  {
    key: "level_10",
    name: "Double Digits",
    description: "Reach level 10.",
    icon: "🌟",
    earned: (s) => levelForXp(s.profile.totalXp) >= 10,
  },
  {
    key: "xp_1000",
    name: "Grinder",
    description: "Earn 1,000 total XP.",
    icon: "⚡",
    earned: (s) => s.profile.totalXp >= 1000,
  },
  {
    key: "goal_crushed",
    name: "Goal Crusher",
    description: "Complete your first custom goal.",
    icon: "🎯",
    earned: (s) => s.goals.some((g) => g.status === "done"),
  },
];

/** Returns keys newly earned that aren't already unlocked in state. */
export function evaluateNewAchievements(state: AppState): string[] {
  const unlocked = new Set(state.achievements.map((a) => a.key));
  return ACHIEVEMENTS.filter(
    (def) => !unlocked.has(def.key) && def.earned(state)
  ).map((def) => def.key);
}
