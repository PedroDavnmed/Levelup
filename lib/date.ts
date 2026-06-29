/** Local-calendar date helpers (avoid UTC drift by using local Y-M-D). */

export function todayStr(d: Date = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

/** Local-calendar Y-M-D for an ISO timestamp (avoids UTC-slice drift). */
export function localDateOf(iso: string): string {
  return todayStr(new Date(iso));
}

/** Whole-day difference (b - a) between two YYYY-MM-DD strings. */
export function dayDiff(a: string, b: string): number {
  const da = new Date(a + "T00:00:00");
  const db = new Date(b + "T00:00:00");
  return Math.round((db.getTime() - da.getTime()) / 86_400_000);
}

/** Add n days to a YYYY-MM-DD string. */
export function addDays(date: string, n: number): string {
  const d = new Date(date + "T00:00:00");
  d.setDate(d.getDate() + n);
  return todayStr(d);
}

/** Weekday index (0=Sun … 6=Sat) for a YYYY-MM-DD string, in local time. */
export function dayOfWeek(date: string): number {
  return new Date(date + "T00:00:00").getDay();
}

/** Whether a habit with the given weekday schedule applies on `date`.
 *  Absent / empty / all-seven schedules mean "every day". */
export function isScheduled(date: string, days?: number[]): boolean {
  if (!days || days.length === 0 || days.length >= 7) return true;
  return days.includes(dayOfWeek(date));
}

/** Short label like "Mon 12" for charts/axes. */
export function shortLabel(date: string): string {
  const d = new Date(date + "T00:00:00");
  return d.toLocaleDateString(undefined, { weekday: "short", day: "numeric" });
}
