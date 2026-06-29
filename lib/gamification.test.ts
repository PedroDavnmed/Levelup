import { describe, it, expect } from "vitest";
import { totalXpForLevel, levelForXp, levelProgress } from "./gamification";

describe("xp curve", () => {
  it("cumulative XP thresholds", () => {
    expect(totalXpForLevel(1)).toBe(0);
    expect(totalXpForLevel(2)).toBe(100);
    expect(totalXpForLevel(3)).toBe(300);
    expect(totalXpForLevel(5)).toBe(1000);
    expect(totalXpForLevel(10)).toBe(4500);
  });

  it("levelForXp finds the right level at and between boundaries", () => {
    expect(levelForXp(0)).toBe(1);
    expect(levelForXp(99)).toBe(1);
    expect(levelForXp(100)).toBe(2);
    expect(levelForXp(299)).toBe(2);
    expect(levelForXp(300)).toBe(3);
    expect(levelForXp(1000)).toBe(5);
  });

  it("levelProgress reports progress within a level", () => {
    const p = levelProgress(150); // level 2 (100..300), 50 into a 200 span
    expect(p.level).toBe(2);
    expect(p.into).toBe(50);
    expect(p.span).toBe(200);
    expect(p.toNext).toBe(150);
    expect(p.pct).toBe(25);
  });

  it("levelProgress at an exact threshold starts the next level", () => {
    const p = levelProgress(300);
    expect(p.level).toBe(3);
    expect(p.into).toBe(0);
    expect(p.pct).toBe(0);
  });
});
