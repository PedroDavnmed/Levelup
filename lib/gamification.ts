/**
 * XP & level math.
 *
 * Leveling curve: advancing from level L to L+1 costs L * 100 XP, so the
 * cumulative XP required to *reach* level L is 50 * L * (L - 1):
 *   L1=0, L2=100, L3=300, L4=600, L5=1000, L10=4500, ...
 */

export function totalXpForLevel(level: number): number {
  return 50 * level * (level - 1);
}

export function levelForXp(xp: number): number {
  let level = 1;
  while (totalXpForLevel(level + 1) <= xp) level++;
  return level;
}

export interface LevelProgress {
  level: number;
  into: number; // XP earned into the current level
  span: number; // XP needed to clear the current level
  toNext: number; // XP remaining until next level
  pct: number; // 0-100 progress through current level
}

export function levelProgress(xp: number): LevelProgress {
  const level = levelForXp(xp);
  const base = totalXpForLevel(level);
  const next = totalXpForLevel(level + 1);
  const into = xp - base;
  const span = next - base;
  return {
    level,
    into,
    span,
    toNext: span - into,
    pct: span > 0 ? Math.round((into / span) * 100) : 0,
  };
}
