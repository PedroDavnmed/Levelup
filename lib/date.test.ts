import { describe, it, expect } from "vitest";
import { todayStr, localDateOf, dayDiff, addDays } from "./date";

describe("todayStr", () => {
  it("formats a Date as local YYYY-MM-DD", () => {
    expect(todayStr(new Date(2026, 5, 9, 14, 30))).toBe("2026-06-09");
  });
  it("zero-pads month and day", () => {
    expect(todayStr(new Date(2026, 0, 3))).toBe("2026-01-03");
  });
});

describe("localDateOf", () => {
  it("recovers the LOCAL calendar day of an ISO timestamp", () => {
    // 11:30pm local. Round-tripping through ISO (UTC) must still yield the
    // original local day, regardless of the test runner's timezone.
    const local = new Date(2026, 5, 9, 23, 30);
    expect(localDateOf(local.toISOString())).toBe("2026-06-09");
  });
});

describe("dayDiff / addDays across a DST boundary", () => {
  it("counts whole days even when an interval spans spring-forward", () => {
    // Math.round absorbs the ±1h DST skew; lock that behavior in.
    expect(dayDiff("2026-03-07", "2026-03-09")).toBe(2);
    expect(dayDiff("2026-03-08", "2026-03-09")).toBe(1);
    expect(addDays("2026-03-07", 2)).toBe("2026-03-09");
  });
});
