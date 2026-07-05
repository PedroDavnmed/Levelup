import { describe, it, expect } from "vitest";
import {
  todayStr,
  localDateOf,
  dayDiff,
  addDays,
  dayOfWeek,
  isScheduled,
} from "./date";

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

describe("dayOfWeek / isScheduled", () => {
  it("dayOfWeek maps dates to 0=Sun..6=Sat", () => {
    expect(dayOfWeek("2026-06-01")).toBe(1); // Mon
    expect(dayOfWeek("2026-06-03")).toBe(3); // Wed
    expect(dayOfWeek("2026-06-07")).toBe(0); // Sun
  });
  it("isScheduled treats absent/empty/all-seven as every day", () => {
    expect(isScheduled("2026-06-02", undefined)).toBe(true);
    expect(isScheduled("2026-06-02", [])).toBe(true);
    expect(isScheduled("2026-06-02", [0, 1, 2, 3, 4, 5, 6])).toBe(true);
  });
  it("isScheduled respects a Mon/Wed/Fri schedule", () => {
    const mwf = [1, 3, 5];
    expect(isScheduled("2026-06-01", mwf)).toBe(true); // Mon
    expect(isScheduled("2026-06-02", mwf)).toBe(false); // Tue
    expect(isScheduled("2026-06-03", mwf)).toBe(true); // Wed
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
