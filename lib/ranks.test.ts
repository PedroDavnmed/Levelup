import { describe, it, expect } from "vitest";
import { rankForCount, RANKS } from "./ranks";

describe("rankForCount", () => {
  it("0 achievements -> Bronze, progressing toward Silver", () => {
    const r = rankForCount(0);
    expect(r.rank.name).toBe("Bronze");
    expect(r.next?.name).toBe("Silver");
    expect(r.toNext).toBe(4);
    expect(r.pct).toBe(0);
  });

  it("picks the highest tier at or below the count", () => {
    expect(rankForCount(3).rank.name).toBe("Bronze");
    expect(rankForCount(4).rank.name).toBe("Silver");
    expect(rankForCount(7).rank.name).toBe("Silver");
    expect(rankForCount(8).rank.name).toBe("Gold");
  });

  it("computes mid-tier progress", () => {
    // Silver(4) -> Gold(8): span 4. count 6 -> into 2 -> 50%, 2 to go.
    const r = rankForCount(6);
    expect(r.rank.name).toBe("Silver");
    expect(r.pct).toBe(50);
    expect(r.toNext).toBe(2);
  });

  it("maxes out at the top tier", () => {
    const top = RANKS[RANKS.length - 1];
    const r = rankForCount(top.minAchievements);
    expect(r.rank.name).toBe(top.name);
    expect(r.next).toBeNull();
    expect(r.toNext).toBe(0);
    expect(r.pct).toBe(100);
  });

  it("stays at the top tier when count exceeds the max", () => {
    const r = rankForCount(999);
    expect(r.next).toBeNull();
    expect(r.pct).toBe(100);
  });
});
