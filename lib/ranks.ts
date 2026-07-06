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

// Colors tuned for dark surfaces; each tier is distinct (no duplicates).
export const RANKS: Rank[] = [
  { name: "Bronze", icon: "🥉", color: "#D9A06A", minAchievements: 0 },
  { name: "Silver", icon: "🥈", color: "#A8B4C8", minAchievements: 4 },
  { name: "Gold", icon: "🥇", color: "#FFC94D", minAchievements: 8 },
  { name: "Platinum", icon: "💠", color: "#7FE3C4", minAchievements: 13 },
  { name: "Diamond", icon: "🔷", color: "#6FB6FF", minAchievements: 18 },
  { name: "Master", icon: "👑", color: "#A88FFF", minAchievements: 23 },
  { name: "Grandmaster", icon: "🏆", color: "#FF8A7A", minAchievements: 28 },
  { name: "Champion", icon: "🎖️", color: "#FFA51F", minAchievements: 32 },
  { name: "Immortal", icon: "🌟", color: "#66D9FF", minAchievements: 36 },
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
