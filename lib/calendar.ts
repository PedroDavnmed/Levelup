import type { CalendarEvent } from "./types";
import { todayStr } from "./date";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EVENT_STYLE: Record<
  CalendarEvent["type"],
  { label: string; color: string; icon: string }
> = {
  task: { label: "Task", color: "#5b7cfa", icon: "📌" },
  meeting: { label: "Meeting", color: "#c3b4f5", icon: "👥" },
  event: { label: "Event", color: "#7fd1ae", icon: "📅" },
};

/** 42 dates (6 weeks) covering the month grid for the given year/month (0-11). */
export function monthGrid(year: number, month: number): string[] {
  const first = new Date(year, month, 1);
  const startDow = first.getDay(); // 0 = Sunday
  const gridStart = new Date(year, month, 1 - startDow);
  return Array.from({ length: 42 }, (_, i) => {
    const d = new Date(
      gridStart.getFullYear(),
      gridStart.getMonth(),
      gridStart.getDate() + i
    );
    return todayStr(d);
  });
}

export function monthLabel(year: number, month: number): string {
  return new Date(year, month, 1).toLocaleDateString(undefined, {
    month: "long",
    year: "numeric",
  });
}

export function addMonths(year: number, month: number, delta: number) {
  const d = new Date(year, month + delta, 1);
  return { year: d.getFullYear(), month: d.getMonth() };
}

export function parseYMD(s: string) {
  const [year, month, day] = s.split("-").map(Number);
  return { year, month: month - 1, day };
}

export function isToday(date: string): boolean {
  return date === todayStr();
}

export function prettyDate(date: string): string {
  const { year, month, day } = parseYMD(date);
  return new Date(year, month, day).toLocaleDateString(undefined, {
    weekday: "long",
    month: "long",
    day: "numeric",
  });
}

export function shortDate(date: string): string {
  const { year, month, day } = parseYMD(date);
  return new Date(year, month, day).toLocaleDateString(undefined, {
    weekday: "short",
    month: "short",
    day: "numeric",
  });
}

/** "14:30" -> "2:30 PM" (falls back to raw on bad input). */
export function formatTime(hhmm: string | null): string {
  if (!hhmm) return "All day";
  const [h, m] = hhmm.split(":").map(Number);
  if (Number.isNaN(h)) return hhmm;
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12}:${String(m).padStart(2, "0")} ${ampm}`;
}

export function eventsForDate(
  events: CalendarEvent[],
  date: string
): CalendarEvent[] {
  return events
    .filter((e) => e.date === date)
    .sort((a, b) => {
      // All-day first, then by start time.
      if (!a.startTime && b.startTime) return -1;
      if (a.startTime && !b.startTime) return 1;
      return (a.startTime ?? "").localeCompare(b.startTime ?? "");
    });
}

/** Hour (0-23) an event belongs to, or null for all-day. */
export function eventHour(e: CalendarEvent): number | null {
  if (!e.startTime) return null;
  const h = Number(e.startTime.split(":")[0]);
  return Number.isNaN(h) ? null : h;
}

export function hourLabel(h: number): string {
  const ampm = h < 12 ? "AM" : "PM";
  const h12 = h % 12 === 0 ? 12 : h % 12;
  return `${h12} ${ampm}`;
}
