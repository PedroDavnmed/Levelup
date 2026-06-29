import type { AppState } from "./types";
import { levelForXp } from "./gamification";

export interface AchievementDef {
  key: string;
  name: string;
  description: string;
  icon: string;
  /** Returns true when the user has earned this achievement. */
  earned: (m: Metrics) => boolean;
}

/** Pre-computed metrics so each predicate stays cheap and readable. */
interface Metrics {
  trainingLogs: number;
  studyLogs: number;
  studyMinutes: number;
  totalLogs: number;
  completions: number;
  goalsDone: number;
  goalsCount: number;
  longestStreak: number;
  level: number;
  xp: number;
  hasTraining: boolean;
  hasStudy: boolean;
  tasksDone: number;
  eventsCount: number;
  habitsCreated: number;
  allRounder: boolean;
}

function metricsOf(s: AppState): Metrics {
  const trainIds = new Set(
    s.activities.filter((a) => a.type === "training").map((a) => a.id)
  );
  const studyIds = new Set(
    s.activities.filter((a) => a.type === "study").map((a) => a.id)
  );
  let trainingLogs = 0;
  let studyLogs = 0;
  let studyMinutes = 0;
  for (const l of s.logs) {
    if (trainIds.has(l.activityId)) trainingLogs++;
    if (studyIds.has(l.activityId)) {
      studyLogs++;
      studyMinutes += l.value;
    }
  }
  const tasksDone = s.events.filter(
    (e) => e.type === "task" && e.done
  ).length;
  const completions = s.completions.length;
  const goalsDone = s.goals.filter((g) => g.status === "done").length;
  return {
    trainingLogs,
    studyLogs,
    studyMinutes,
    totalLogs: s.logs.length,
    completions,
    goalsDone,
    goalsCount: s.goals.length,
    longestStreak: s.habits.reduce((m, h) => Math.max(m, h.longestStreak), 0),
    level: levelForXp(s.profile.totalXp),
    xp: s.profile.totalXp,
    hasTraining: trainIds.size > 0,
    hasStudy: studyIds.size > 0,
    tasksDone,
    eventsCount: s.events.length,
    habitsCreated: s.habits.length,
    allRounder:
      trainingLogs > 0 &&
      studyLogs > 0 &&
      completions > 0 &&
      goalsDone > 0 &&
      tasksDone > 0,
  };
}

/** Static catalog (mirrors supabase/migrations/0003_seed_achievements.sql). */
export const ACHIEVEMENTS: AchievementDef[] = [
  { key: "first_workout", name: "First Rep", description: "Log your first training session.", icon: "💪", earned: (m) => m.trainingLogs >= 1 },
  { key: "first_study", name: "Open Book", description: "Log your first study session.", icon: "📚", earned: (m) => m.studyLogs >= 1 },
  { key: "first_habit", name: "Day One", description: "Complete a habit for the first time.", icon: "✅", earned: (m) => m.completions >= 1 },
  { key: "well_rounded", name: "Well Rounded", description: "Have both a training and a study activity.", icon: "🧭", earned: (m) => m.hasTraining && m.hasStudy },
  { key: "goal_setter", name: "Goal Setter", description: "Create your first goal.", icon: "📝", earned: (m) => m.goalsCount >= 1 },
  { key: "level_3", name: "Getting Going", description: "Reach level 3.", icon: "✨", earned: (m) => m.level >= 3 },

  { key: "streak_7", name: "Week Warrior", description: "Reach a 7-day streak on any habit.", icon: "🔥", earned: (m) => m.longestStreak >= 7 },
  { key: "train_25", name: "Iron Will", description: "Log 25 training sessions.", icon: "🏋️", earned: (m) => m.trainingLogs >= 25 },
  { key: "study_10h", name: "Scholar", description: "Accumulate 10 hours (600 min) of study.", icon: "🎓", earned: (m) => m.studyMinutes >= 600 },
  { key: "level_5", name: "Rising Star", description: "Reach level 5.", icon: "⭐", earned: (m) => m.level >= 5 },
  { key: "xp_1000", name: "Grinder", description: "Earn 1,000 total XP.", icon: "⚡", earned: (m) => m.xp >= 1000 },
  { key: "goal_crushed", name: "Goal Crusher", description: "Complete your first custom goal.", icon: "🎯", earned: (m) => m.goalsDone >= 1 },
  { key: "habit_50", name: "Consistent", description: "Complete habits 50 times in total.", icon: "📅", earned: (m) => m.completions >= 50 },
  { key: "logs_100", name: "Logger", description: "Log 100 activities in total.", icon: "📈", earned: (m) => m.totalLogs >= 100 },

  { key: "streak_14", name: "Fortnight", description: "Reach a 14-day streak on any habit.", icon: "🌗", earned: (m) => m.longestStreak >= 14 },
  { key: "streak_30", name: "Unbreakable", description: "Reach a 30-day streak on any habit.", icon: "⛓️", earned: (m) => m.longestStreak >= 30 },
  { key: "train_50", name: "Powerhouse", description: "Log 50 training sessions.", icon: "🦾", earned: (m) => m.trainingLogs >= 50 },
  { key: "study_25h", name: "Deep Thinker", description: "Accumulate 25 hours (1500 min) of study.", icon: "🧠", earned: (m) => m.studyMinutes >= 1500 },
  { key: "level_10", name: "Double Digits", description: "Reach level 10.", icon: "🌟", earned: (m) => m.level >= 10 },
  { key: "xp_5000", name: "Relentless", description: "Earn 5,000 total XP.", icon: "💥", earned: (m) => m.xp >= 5000 },
  { key: "goals_5", name: "Achiever", description: "Complete 5 custom goals.", icon: "🏅", earned: (m) => m.goalsDone >= 5 },
  { key: "habit_100", name: "Habitual", description: "Complete habits 100 times in total.", icon: "🗓️", earned: (m) => m.completions >= 100 },

  { key: "streak_100", name: "Centurion", description: "Reach a 100-day streak on any habit.", icon: "🛡️", earned: (m) => m.longestStreak >= 100 },
  { key: "train_100", name: "Unstoppable", description: "Log 100 training sessions.", icon: "🥇", earned: (m) => m.trainingLogs >= 100 },
  { key: "level_20", name: "Veteran", description: "Reach level 20.", icon: "👑", earned: (m) => m.level >= 20 },
  { key: "xp_10000", name: "Legend", description: "Earn 10,000 total XP.", icon: "🚀", earned: (m) => m.xp >= 10000 },

  // Calendar & cross-cutting achievements
  { key: "first_task", name: "Checklist", description: "Complete your first calendar task.", icon: "✔️", earned: (m) => m.tasksDone >= 1 },
  { key: "planner", name: "Planner", description: "Add 10 calendar entries.", icon: "📆", earned: (m) => m.eventsCount >= 10 },
  { key: "task_25", name: "Taskmaster", description: "Complete 25 tasks.", icon: "🗒️", earned: (m) => m.tasksDone >= 25 },
  { key: "organizer", name: "Organizer", description: "Add 50 calendar entries.", icon: "🗂️", earned: (m) => m.eventsCount >= 50 },
  { key: "habit_builder", name: "Habit Builder", description: "Create 5 habits.", icon: "🧱", earned: (m) => m.habitsCreated >= 5 },
  { key: "goals_10", name: "Visionary", description: "Complete 10 custom goals.", icon: "🌠", earned: (m) => m.goalsDone >= 10 },
  { key: "task_100", name: "Productivity Machine", description: "Complete 100 tasks.", icon: "⚙️", earned: (m) => m.tasksDone >= 100 },
  { key: "all_rounder", name: "All-Rounder", description: "Log training & study, and complete a habit, goal, and task.", icon: "🌈", earned: (m) => m.allRounder },
  { key: "level_30", name: "Ascendant", description: "Reach level 30.", icon: "🔱", earned: (m) => m.level >= 30 },
  { key: "xp_25000", name: "Mythic Grind", description: "Earn 25,000 total XP.", icon: "🌌", earned: (m) => m.xp >= 25000 },
];

/** Returns keys newly earned that aren't already unlocked in state. */
export function evaluateNewAchievements(state: AppState): string[] {
  const unlocked = new Set(state.achievements.map((a) => a.key));
  const m = metricsOf(state);
  return ACHIEVEMENTS.filter(
    (def) => !unlocked.has(def.key) && def.earned(m)
  ).map((def) => def.key);
}
