"use client";

import { useEffect, useState } from "react";
import { Pause, Play, RotateCcw } from "lucide-react";
import { useStore, MAX_FOCUS_MINUTES } from "@/lib/store";

/** mm:ss for a millisecond remaining value. */
export function fmtClock(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** Re-render on an interval while `active`, returning the current time. Lets
 *  components derive the countdown from the store's `endAt` locally, so the
 *  ticking never touches the shared store context. */
export function useNow(active: boolean, everyMs = 250): number {
  const [now, setNow] = useState(() => Date.now());
  useEffect(() => {
    if (!active) return;
    setNow(Date.now());
    const id = setInterval(() => setNow(Date.now()), everyMs);
    return () => clearInterval(id);
  }, [active, everyMs]);
  return now;
}

/** A Pomodoro-style focus timer with a custom duration. Finishing a session
 *  records the focused minutes for stats (no XP; the task's own completion is
 *  the reward) and never closes the linked task. The timer itself lives in the
 *  store, so it survives navigating away and page reloads. */
export default function FocusTimer() {
  const {
    state,
    focus,
    startFocus,
    pauseFocus,
    resetFocus,
    setFocusMinutes,
    setFocusTask,
  } = useStore();

  const pending = state.studyTasks.filter((t) => !t.done);

  // Drop a stale task selection if it was completed/deleted elsewhere
  // (no-ops while running; the session keeps its original link).
  useEffect(() => {
    if (
      !focus.running &&
      focus.taskId &&
      !pending.some((t) => t.id === focus.taskId)
    ) {
      setFocusTask(null);
    }
  }, [pending, focus.running, focus.taskId, setFocusTask]);

  const now = useNow(focus.running);
  const remainingMs =
    focus.running && focus.endAt !== null
      ? Math.max(0, focus.endAt - now)
      : focus.remainingMs;
  const totalMs = focus.minutes * 60_000;
  const atRest = !focus.running && focus.remainingMs === totalMs;
  const pct = totalMs > 0 ? (1 - remainingMs / totalMs) * 100 : 0;
  const linkedTitle = pending.find((t) => t.id === focus.taskId)?.title;

  return (
    // Running = earned light: the card breathes a soft brand glow (static
    // glow under prefers-reduced-motion via the global animation kill).
    <section
      className={`card p-5 transition-colors duration-300 ${
        focus.running ? "border-brand-500/50 animate-breathe" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Focus timer</h2>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={MAX_FOCUS_MINUTES}
            value={focus.minutes || ""}
            onChange={(e) => setFocusMinutes(parseInt(e.target.value, 10))}
            disabled={!atRest}
            className="input w-20 text-center disabled:opacity-40"
            aria-label="Session length in minutes"
            title={
              atRest ? undefined : "Reset the session to change its length"
            }
          />
          <span className="text-sm text-muted">min</span>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-5xl font-bold tabular-nums text-ink">
        {fmtClock(remainingMs)}
      </p>

      <div className="mt-3 h-1.5 w-full overflow-hidden rounded-full bg-line">
        <div
          className="h-full rounded-full bg-brand-500 transition-[width] duration-300"
          style={{ width: `${pct}%` }}
        />
      </div>

      <div className="mt-4">
        <label className="label" htmlFor="focus-task">
          Focus on (optional)
        </label>
        <select
          id="focus-task"
          className="input"
          value={focus.taskId ?? ""}
          onChange={(e) => setFocusTask(e.target.value || null)}
          disabled={focus.running}
        >
          <option value="">No task — just focus</option>
          {pending.map((t) => (
            <option key={t.id} value={t.id}>
              {t.title}
            </option>
          ))}
        </select>
      </div>

      <div className="mt-4 flex gap-2">
        {!focus.running ? (
          <button
            onClick={startFocus}
            disabled={focus.minutes < 1}
            className="btn-primary flex-1 disabled:opacity-40"
            aria-label="Start focus session"
          >
            <Play size={15} aria-hidden />
            {remainingMs < totalMs ? "Resume" : "Start"}
          </button>
        ) : (
          <button
            onClick={pauseFocus}
            className="btn-primary flex-1"
            aria-label="Pause focus session"
          >
            <Pause size={15} aria-hidden />
            Pause
          </button>
        )}
        <button
          onClick={resetFocus}
          disabled={atRest}
          className="btn-ghost border border-line px-4 disabled:opacity-40"
          aria-label="Reset focus session"
        >
          <RotateCcw size={15} aria-hidden />
          Reset
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        {linkedTitle
          ? `Focusing on “${linkedTitle}” — it stays in your to-do list until you check it off.`
          : "Tracked toward your focus time. No XP — checking off tasks is the reward. Keeps running if you leave this page."}
      </p>
    </section>
  );
}
