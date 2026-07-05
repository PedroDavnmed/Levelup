"use client";

import { useEffect, useRef, useState } from "react";
import { useStore } from "@/lib/store";
import { isSoundEnabled, playChime } from "@/lib/sound";

const MAX_MINUTES = 180;

/** mm:ss for a millisecond remaining value. */
function fmt(ms: number): string {
  const total = Math.max(0, Math.ceil(ms / 1000));
  const m = Math.floor(total / 60);
  const s = total % 60;
  return `${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
}

/** A Pomodoro-style focus timer with a custom duration. Finishing a session
 *  records the focused minutes for stats (no XP; the task's own completion is
 *  the reward) and never closes the linked task. Optionally tied to a pending
 *  study task. */
export default function FocusTimer() {
  const { state, logFocusSession } = useStore();
  const [minutes, setMinutes] = useState<number>(25);
  const [remainingMs, setRemainingMs] = useState(25 * 60_000);
  const [running, setRunning] = useState(false);
  const [taskId, setTaskId] = useState("");
  // Target end-timestamp while running; deriving remaining from this keeps the
  // clock accurate even if the tab is backgrounded (setInterval throttles).
  const endAtRef = useRef<number | null>(null);

  const pending = state.studyTasks.filter((t) => !t.done);

  // Drop a stale task selection if it was completed/deleted elsewhere.
  useEffect(() => {
    if (taskId && !pending.some((t) => t.id === taskId)) setTaskId("");
  }, [pending, taskId]);

  // The running clock. minutes/taskId are locked (inputs disabled) while
  // running, so the closure below stays correct for the whole session.
  useEffect(() => {
    if (!running) return;
    const tick = () => {
      // Null once completed — guards against a stray tick firing before React
      // has torn the interval down, which would log the session twice.
      if (endAtRef.current === null) return;
      const left = endAtRef.current - Date.now();
      if (left <= 0) {
        endAtRef.current = null;
        setRunning(false);
        setRemainingMs(minutes * 60_000);
        logFocusSession(minutes, taskId || null);
        if (isSoundEnabled()) playChime();
      } else {
        setRemainingMs(left);
      }
    };
    const id = setInterval(tick, 250);
    return () => clearInterval(id);
  }, [running, minutes, taskId, logFocusSession]);

  const totalMs = minutes * 60_000;
  const pct = totalMs > 0 ? (1 - remainingMs / totalMs) * 100 : 0;
  const linkedTitle = pending.find((t) => t.id === taskId)?.title;

  function start() {
    if (minutes < 1) return;
    endAtRef.current = Date.now() + remainingMs;
    setRunning(true);
  }
  function pause() {
    if (endAtRef.current)
      setRemainingMs(Math.max(0, endAtRef.current - Date.now()));
    endAtRef.current = null;
    setRunning(false);
  }
  function reset() {
    endAtRef.current = null;
    setRunning(false);
    setRemainingMs(minutes * 60_000);
  }
  function changeMinutes(v: string) {
    const n = parseInt(v, 10);
    const m = Number.isNaN(n) ? 0 : Math.min(MAX_MINUTES, Math.max(0, n));
    setMinutes(m);
    setRemainingMs(m * 60_000);
  }

  return (
    <section className="card p-5">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-ink">Focus timer</h2>
        <div className="flex items-center gap-2">
          <input
            type="number"
            min={1}
            max={MAX_MINUTES}
            value={minutes || ""}
            onChange={(e) => changeMinutes(e.target.value)}
            disabled={running}
            className="input w-20 text-center disabled:opacity-40"
            aria-label="Session length in minutes"
          />
          <span className="text-sm text-muted">min</span>
        </div>
      </div>

      <p className="mt-4 text-center font-mono text-5xl font-bold tabular-nums text-ink">
        {fmt(remainingMs)}
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
          value={taskId}
          onChange={(e) => setTaskId(e.target.value)}
          disabled={running}
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
        {!running ? (
          <button
            onClick={start}
            disabled={minutes < 1}
            className="btn-primary flex-1 disabled:opacity-40"
            aria-label="Start focus session"
          >
            {remainingMs < totalMs ? "Resume" : "▶ Start"}
          </button>
        ) : (
          <button
            onClick={pause}
            className="btn-primary flex-1"
            aria-label="Pause focus session"
          >
            Pause
          </button>
        )}
        <button
          onClick={reset}
          disabled={!running && remainingMs === totalMs}
          className="btn-ghost border border-line px-4 disabled:opacity-40"
          aria-label="Reset focus session"
        >
          Reset
        </button>
      </div>

      <p className="mt-3 text-center text-xs text-muted">
        {linkedTitle
          ? `Focusing on “${linkedTitle}” — it stays in your to-do list until you check it off.`
          : "Tracked toward your focus time. No XP — checking off tasks is the reward."}
      </p>
    </section>
  );
}
