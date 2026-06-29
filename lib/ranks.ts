/**
 * Rank tiers driven by how many achievements the user has unlocked.
 * More achievements -> higher rank.
 */

export interface Rank {
  name: string;
  icon: string;
  color: string; // accent used for the rank badge
  minAchievements: number;
}

export const RANKS: Rank[] = [
  { name: "Bronze", icon: "🥉", color: "#cd9b6a", minAchievements: 0 },
  { name: "Silver", icon: "🥈", color: "#9aa3b2", minAchievements: 3 },
  { name: "Gold", icon: "🥇", color: "#f6c66b", minAchievements: 6 },
  { name: "Platinum", icon: "💎", color: "#7fd1ae", minAchievements: 10 },
  { name: "Diamond", icon: "🔷", color: "#5b7cfa", minAchievements: 15 },
  { name: "Master", icon: "👑", color: "#c3b4f5", minAchievements: 20 },
  { name: "Grandmaster", icon: "🏆", color: "#ffb59e", minAchievements: 26 },
];

export interface RankProgress {
  rank: Rank;
  next: Rank | null;
  /** Achievements still needed to reach the next rank (0 if maxed). */
  toNext: number;
  /** 0-100 progress through the current tier toward the next. */
  pct: number;
}

export function rankForCount(count: number): RankProgress {
  let index = 0;
  for (let i = 0; i < RANKS.length; i++) {
    if (count >= RANKS[i].minAchievements) index = i;
  }
  const rank = RANKS[index];
  const next = RANKS[index + 1] ?? null;

  if (!next) {
    return { rank, next: null, toNext: 0, pct: 100 };
  }

  const span = next.minAchievements - rank.minAchievements;
  const into = count - rank.minAchievements;
  return {
    rank,
    next,
    toNext: Math.max(0, next.minAchievements - count),
    pct: span > 0 ? Math.round((into / span) * 100) : 0,
  };
}
