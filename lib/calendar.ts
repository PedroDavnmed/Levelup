import type { AppState, CalendarEvent, Goal, StudyTask } from "./types";
import { todayStr } from "./date";
import { studyTaskDate } from "./aggregate";

export const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

export const EVENT_STYLE: Record<
  CalendarEvent["type"],
  { label: string; color: string; icon: string }
> = {
  task: { label: "Task", color: "#4D7CFF", icon: "📌" },
  meeting: { label: "Meeting", color: "#8FA8FF", icon: "👥" },
  event: { label: "Event", color: "#3DD68C", icon: "📅" },
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

// --- Unified calendar read-model -------------------------------------------
// The calendar renders more than its own events: study tasks (on their due
// date) and goal deadlines also show up. Rather than special-case three
// entities throughout the UI, normalize them all into one `CalendarItem`.

export type CalendarSource = "event" | "study" | "goal";

export interface CalendarItem {
  key: string; // `${source}:${id}` — stable React key
  source: CalendarSource;
  id: string; // underlying entity id
  title: string;
  date: string; // YYYY-MM-DD
  startTime: string | null; // study/goal are all-day (null)
  endTime: string | null;
  done: boolean;
  notes?: string;
  style: { label: string; color: string; icon: string };
  toggleable: boolean; // events + study tasks; false for goals
  href?: string; // goals link to their page instead of toggling
}

const STUDY_STYLE = { label: "Study", color: "#8FA8FF", icon: "📚" };
const GOAL_STYLE = { label: "Goal", color: "#FFB454", icon: "🎯" };

function eventItem(e: CalendarEvent): CalendarItem {
  return {
    key: `event:${e.id}`,
    source: "event",
    id: e.id,
    title: e.title,
    date: e.date,
    startTime: e.startTime,
    endTime: e.endTime,
    done: e.done,
    notes: e.notes,
    style: EVENT_STYLE[e.type],
    toggleable: true,
  };
}

function studyItem(t: StudyTask, date: string): CalendarItem {
  return {
    key: `study:${t.id}`,
    source: "study",
    id: t.id,
    title: t.title,
    date,
    startTime: null,
    endTime: null,
    done: t.done,
    notes: t.note,
    style: STUDY_STYLE,
    toggleable: true,
  };
}

function goalItem(g: Goal): CalendarItem {
  return {
    key: `goal:${g.id}`,
    source: "goal",
    id: g.id,
    title: `${g.title} · due`,
    date: g.deadline!,
    startTime: null,
    endTime: null,
    done: g.status === "done",
    notes: `${g.currentValue}/${g.targetValue}`,
    style: GOAL_STYLE,
    toggleable: false,
    href: "/goals",
  };
}

/** All-day first, then by start time (matches `eventsForDate`). */
function sortItems(items: CalendarItem[]): CalendarItem[] {
  return items.sort((a, b) => {
    if (!a.startTime && b.startTime) return -1;
    if (a.startTime && !b.startTime) return 1;
    return (a.startTime ?? "").localeCompare(b.startTime ?? "");
  });
}

/** Every calendar item landing on `date`: events, study tasks due that day,
 *  and goals whose deadline is that day. */
export function calendarItemsForDate(
  state: AppState,
  date: string
): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const e of state.events) if (e.date === date) items.push(eventItem(e));
  for (const t of state.studyTasks)
    if (studyTaskDate(t) === date) items.push(studyItem(t, date));
  for (const g of state.goals) if (g.deadline === date) items.push(goalItem(g));
  return sortItems(items);
}

/** Every item shown anywhere on the calendar, across all dates: all events, all
 *  study tasks (each on its due date), and goals that have a deadline. One
 *  source of truth for "what's on the calendar". */
export function allCalendarItems(state: AppState): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const e of state.events) items.push(eventItem(e));
  for (const t of state.studyTasks) items.push(studyItem(t, studyTaskDate(t)));
  for (const g of state.goals) if (g.deadline) items.push(goalItem(g));
  return items;
}

/** Hour (0-23) an item belongs to, or null for all-day. */
export function itemHour(item: CalendarItem): number | null {
  if (!item.startTime) return null;
  const h = Number(item.startTime.split(":")[0]);
  return Number.isNaN(h) ? null : h;
}

/** Upcoming, not-yet-done items from today onward (for the dashboard): future
 *  events, study tasks, and active goal deadlines, soonest first. */
export function upcomingItems(
  state: AppState,
  today: string,
  limit: number
): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const e of state.events)
    if (e.date >= today && !e.done) items.push(eventItem(e));
  for (const t of state.studyTasks) {
    const d = studyTaskDate(t);
    if (d >= today && !t.done) items.push(studyItem(t, d));
  }
  for (const g of state.goals)
    if (g.deadline && g.deadline >= today && g.status === "active")
      items.push(goalItem(g));
  items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
  return items.slice(0, limit);
}

/** Overdue, not-yet-done items strictly before today (for the dashboard):
 *  past-due events, study tasks, and active goal deadlines, most overdue
 *  first. The mirror image of `upcomingItems`. */
export function overdueItems(
  state: AppState,
  today: string,
  limit: number
): CalendarItem[] {
  const items: CalendarItem[] = [];
  for (const e of state.events)
    if (e.date < today && !e.done) items.push(eventItem(e));
  for (const t of state.studyTasks) {
    const d = studyTaskDate(t);
    if (d < today && !t.done) items.push(studyItem(t, d));
  }
  for (const g of state.goals)
    if (g.deadline && g.deadline < today && g.status === "active")
      items.push(goalItem(g));
  items.sort(
    (a, b) =>
      a.date.localeCompare(b.date) ||
      (a.startTime ?? "").localeCompare(b.startTime ?? "")
  );
  return items.slice(0, limit);
}
