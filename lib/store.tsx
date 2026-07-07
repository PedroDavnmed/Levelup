"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
} from "react";
import type {
  Activity,
  ActivityType,
  AppState,
  CalendarEvent,
  EventType,
  Goal,
  Habit,
  StudyTask,
} from "./types";
import { XP_REWARDS } from "./types";
import { levelForXp } from "./gamification";
import { evaluateNewAchievements, ACHIEVEMENTS } from "./achievements";
import { rankForCount } from "./ranks";
import { scheduledStreakStats } from "./streaks";
import { normalizeDay, todayStr } from "./date";
import { isSoundEnabled, playChime } from "./sound";

const STORAGE_KEY = "levelup:v1";
const FOCUS_KEY = "levelup:focus";

export const MAX_FOCUS_MINUTES = 180;

/** The focus (Pomodoro) timer. Lives beside AppState — not inside it — so a
 *  ticking clock never enters backups/exports, but survives navigation and
 *  reloads via its own localStorage key. `endAt` is the single source of truth
 *  while running; components derive the countdown from it locally. */
export interface FocusState {
  minutes: number; // chosen session length
  taskId: string | null; // optional linked study task
  running: boolean;
  endAt: number | null; // epoch ms; set only while running
  remainingMs: number; // authoritative while paused / at rest
}

const DEFAULT_FOCUS: FocusState = {
  minutes: 25,
  taskId: null,
  running: false,
  endAt: null,
  remainingMs: 25 * 60_000,
};

const EMPTY_STATE: AppState = {
  profile: { displayName: "Player", totalXp: 0 },
  activities: [],
  logs: [],
  habits: [],
  completions: [],
  goals: [],
  events: [],
  studyTasks: [],
  focusSessions: [],
  achievements: [],
};

export interface Toast {
  id: string;
  kind: "level" | "badge" | "xp" | "rank" | "info";
  title: string;
  detail?: string;
  icon: string;
  /** Optional inline action (e.g. Undo a delete). Clicking it runs `onAct`
   *  and dismisses the toast. */
  action?: { label: string; onAct: () => void };
}

/** A "big moment" signal the <Celebration> component reacts to (confetti/sound).
 *  `nonce` changes every time so repeats of the same kind still fire. */
export interface Celebration {
  nonce: number;
  kind: "level" | "badge" | "rank";
  label?: string;
}

interface StoreApi {
  state: AppState;
  hydrated: boolean;
  toasts: Toast[];
  dismissToast: (id: string) => void;
  setDisplayName: (name: string) => void;
  addActivity: (
    type: ActivityType,
    title: string,
    unit: string,
    xpPerLog: number
  ) => void;
  deleteActivity: (id: string) => void;
  updateActivity: (
    id: string,
    patch: { title: string; unit: string; xpPerLog: number }
  ) => void;
  logActivity: (activityId: string, value: number, note?: string) => void;
  addHabit: (title: string, days?: number[]) => void;
  deleteHabit: (id: string) => void;
  updateHabit: (
    id: string,
    patch: { title: string; days?: number[] }
  ) => void;
  toggleHabitToday: (habitId: string) => void;
  addGoal: (
    title: string,
    targetValue: number,
    deadline: string | null
  ) => void;
  addGoalProgress: (goalId: string, delta: number) => void;
  deleteGoal: (id: string) => void;
  updateGoal: (
    id: string,
    patch: {
      title: string;
      targetValue: number;
      deadline: string | null;
    }
  ) => void;
  addEvent: (input: {
    title: string;
    type: EventType;
    date: string;
    startTime: string | null;
    endTime: string | null;
    notes?: string;
  }) => void;
  deleteEvent: (id: string) => void;
  updateEvent: (
    id: string,
    patch: {
      title: string;
      type: EventType;
      date: string;
      startTime: string | null;
      endTime: string | null;
      notes?: string;
    }
  ) => void;
  toggleEventDone: (id: string) => void;
  addStudyTask: (
    title: string,
    note?: string,
    date?: string,
    important?: boolean
  ) => void;
  toggleStudyTaskDone: (id: string) => void;
  deleteStudyTask: (id: string) => void;
  updateStudyTask: (
    id: string,
    patch: { title?: string; note?: string; date?: string; important?: boolean }
  ) => void;
  logFocusSession: (minutes: number, taskId?: string | null) => void;
  focus: FocusState;
  startFocus: () => void;
  pauseFocus: () => void;
  resetFocus: () => void;
  setFocusMinutes: (m: number) => void;
  setFocusTask: (id: string | null) => void;
  resetAll: () => void;
  importData: (next: AppState) => void;
  celebration: Celebration | null;
}

const StoreContext = createContext<StoreApi | null>(null);

function genId(): string {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36);
}

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const [state, setState] = useState<AppState>(EMPTY_STATE);
  const [hydrated, setHydrated] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastSeq = useRef(0);
  const [celebration, setCelebration] = useState<Celebration | null>(null);
  const celebrationSeq = useRef(0);

  // stateRef always mirrors the latest state so action creators can read a
  // synchronous snapshot, compute the full next state, and commit once.
  const stateRef = useRef(state);
  stateRef.current = state;

  // Hydrate from localStorage once on mount.
  useEffect(() => {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (raw) {
        const loaded = { ...EMPTY_STATE, ...JSON.parse(raw) };
        stateRef.current = loaded;
        setState(loaded);
      }
    } catch {
      /* ignore corrupt storage */
    }
    setHydrated(true);
  }, []);

  // Persist on every change (after hydration).
  useEffect(() => {
    if (!hydrated) return;
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      /* storage full / unavailable */
    }
  }, [state, hydrated]);

  const pushToast = useCallback((t: Omit<Toast, "id">) => {
    const id = `t${toastSeq.current++}`;
    setToasts((prev) => [...prev, { ...t, id }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((x) => x.id !== id));
    }, 4500);
  }, []);

  const dismissToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((x) => x.id !== id));
  }, []);

  /**
   * Persist a computed next state: unlock newly-earned achievements and fire
   * toasts for XP gains, level-ups, and new badges (compared against prev).
   */
  const commit = useCallback(
    (prev: AppState, draft: AppState, xpToast?: number) => {
      let next = draft;
      const newKeys = evaluateNewAchievements(next);
      if (newKeys.length) {
        next = {
          ...next,
          achievements: [
            ...next.achievements,
            ...newKeys.map((key) => ({
              key,
              unlockedAt: new Date().toISOString(),
            })),
          ],
        };
      }

      stateRef.current = next;
      setState(next);

      if (xpToast && xpToast > 0) {
        pushToast({ kind: "xp", icon: "⚡", title: `+${xpToast} XP` });
      }

      const before = levelForXp(prev.profile.totalXp);
      const after = levelForXp(next.profile.totalXp);
      if (after > before) {
        pushToast({
          kind: "level",
          icon: "🎉",
          title: `Level ${after}!`,
          detail: "You leveled up",
        });
      }

      for (const key of newKeys) {
        const def = ACHIEVEMENTS.find((a) => a.key === key);
        if (def) {
          pushToast({
            kind: "badge",
            icon: def.icon,
            title: "Achievement unlocked",
            detail: def.name,
          });
        }
      }

      // Rank up (driven by total achievements unlocked).
      const rankBefore = rankForCount(prev.achievements.length).rank;
      const rankAfter = rankForCount(next.achievements.length).rank;
      if (rankAfter.name !== rankBefore.name) {
        pushToast({
          kind: "rank",
          icon: rankAfter.icon,
          title: `Rank up — ${rankAfter.name}!`,
          detail: "Keep unlocking achievements",
        });
      }

      // Fire one celebration for the biggest moment this commit (confetti +
      // optional sound; a level-up also gets the centered banner).
      const bump = (kind: Celebration["kind"], label?: string) =>
        setCelebration({ nonce: ++celebrationSeq.current, kind, label });
      if (after > before) bump("level", `Level ${after}`);
      else if (rankAfter.name !== rankBefore.name) bump("rank", rankAfter.name);
      else if (newKeys.length) bump("badge");
    },
    [pushToast]
  );

  // Apply a pure change and run achievement/rank evaluation (no XP toast).
  const mutate = useCallback(
    (producer: (prev: AppState) => AppState) => {
      const prev = stateRef.current;
      commit(prev, producer(prev));
    },
    [commit]
  );

  // --- simple (non-XP) actions ----------------------------------------

  const setDisplayName = useCallback((name: string) => {
    setState((s) => ({ ...s, profile: { ...s.profile, displayName: name } }));
  }, []);

  const addActivity = useCallback<StoreApi["addActivity"]>(
    (type, title, unit, xpPerLog) => {
      mutate((prev) => ({
        ...prev,
        activities: [
          ...prev.activities,
          {
            id: genId(),
            type,
            title,
            unit,
            xpPerLog,
            createdAt: new Date().toISOString(),
          } satisfies Activity,
        ],
      }));
    },
    [mutate]
  );

  // Soft delete: remove now (UI updates immediately) but offer a 4.5s Undo.
  // Restore uses setState directly — not commit — so it never re-fires XP or
  // achievement side-effects. If the toast expires, the delete is permanent.
  const softDelete = useCallback(
    (opts: {
      icon: string;
      name: string;
      remove: (s: AppState) => AppState;
      restore: (s: AppState) => AppState;
    }) => {
      setState(opts.remove);
      pushToast({
        kind: "info",
        icon: opts.icon,
        title: "Deleted",
        detail: opts.name,
        action: { label: "Undo", onAct: () => setState(opts.restore) },
      });
    },
    [pushToast]
  );

  const deleteActivity = useCallback(
    (id: string) => {
      const s = stateRef.current;
      const activity = s.activities.find((a) => a.id === id);
      if (!activity) return;
      const logs = s.logs.filter((l) => l.activityId === id);
      softDelete({
        icon: "🗑️",
        name: activity.title,
        remove: (st) => ({
          ...st,
          activities: st.activities.filter((a) => a.id !== id),
          logs: st.logs.filter((l) => l.activityId !== id),
        }),
        restore: (st) => ({
          ...st,
          activities: [...st.activities, activity],
          logs: [...st.logs, ...logs],
        }),
      });
    },
    [softDelete]
  );

  // Edits update user-entered fields only — no XP awarded (that stays with
  // logActivity). Past logs keep the xp they were awarded at log time.
  const updateActivity = useCallback<StoreApi["updateActivity"]>(
    (id, patch) => {
      mutate((prev) => ({
        ...prev,
        activities: prev.activities.map((a) =>
          a.id === id ? { ...a, ...patch } : a
        ),
      }));
    },
    [mutate]
  );

  const addHabit = useCallback<StoreApi["addHabit"]>(
    (title, days) => {
      mutate((prev) => ({
        ...prev,
        habits: [
          ...prev.habits,
          {
            id: genId(),
            title,
            currentStreak: 0,
            longestStreak: 0,
            lastCompletedDate: null,
            createdAt: new Date().toISOString(),
            days,
          } satisfies Habit,
        ],
      }));
    },
    [mutate]
  );

  const deleteHabit = useCallback(
    (id: string) => {
      const s = stateRef.current;
      const habit = s.habits.find((h) => h.id === id);
      if (!habit) return;
      const completions = s.completions.filter((c) => c.habitId === id);
      softDelete({
        icon: "🗑️",
        name: habit.title,
        remove: (st) => ({
          ...st,
          habits: st.habits.filter((h) => h.id !== id),
          completions: st.completions.filter((c) => c.habitId !== id),
        }),
        restore: (st) => ({
          ...st,
          habits: [...st.habits, habit],
          completions: [...st.completions, ...completions],
        }),
      });
    },
    [softDelete]
  );

  const updateHabit = useCallback<StoreApi["updateHabit"]>(
    (id, patch) => {
      mutate((prev) => ({
        ...prev,
        habits: prev.habits.map((h) => {
          if (h.id !== id) return h;
          const merged = { ...h, ...patch };
          // Only the schedule affects the streak, so skip the recompute on
          // title-only edits. Compare normalized (undefined ~ every day).
          const scheduleChanged =
            JSON.stringify(h.days ?? null) !== JSON.stringify(merged.days ?? null);
          if (!scheduleChanged) return merged;
          // Re-derive the streak under the new schedule so it stays consistent
          // with the completion history.
          const stats = scheduledStreakStats(
            prev.completions
              .filter((c) => c.habitId === id)
              .map((c) => c.completedOn),
            merged.days
          );
          return {
            ...merged,
            currentStreak: stats.current,
            longestStreak: stats.longest,
            lastCompletedDate: stats.last,
          };
        }),
      }));
    },
    [mutate]
  );

  const addGoal = useCallback<StoreApi["addGoal"]>(
    (title, targetValue, deadline) => {
      if (!Number.isFinite(targetValue) || targetValue <= 0) return;
      mutate((prev) => ({
        ...prev,
        goals: [
          ...prev.goals,
          {
            id: genId(),
            title,
            targetValue,
            currentValue: 0,
            deadline,
            status: "active",
            createdAt: new Date().toISOString(),
          } satisfies Goal,
        ],
      }));
    },
    [mutate]
  );

  const deleteGoal = useCallback(
    (id: string) => {
      const goal = stateRef.current.goals.find((g) => g.id === id);
      if (!goal) return;
      softDelete({
        icon: "🗑️",
        name: goal.title,
        remove: (st) => ({ ...st, goals: st.goals.filter((g) => g.id !== id) }),
        restore: (st) => ({ ...st, goals: [...st.goals, goal] }),
      });
    },
    [softDelete]
  );

  // Edit goal fields only. We deliberately don't flip status or award XP here:
  // lowering a target below current progress just shows 100% (the ring clamps),
  // and completion XP stays tied to addGoalProgress.
  const updateGoal = useCallback<StoreApi["updateGoal"]>(
    (id, patch) => {
      if (!Number.isFinite(patch.targetValue) || patch.targetValue <= 0)
        return; // guard, mirrors addGoal
      mutate((prev) => ({
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === id ? { ...g, ...patch } : g
        ),
      }));
    },
    [mutate]
  );

  const addEvent = useCallback<StoreApi["addEvent"]>(
    (input) => {
      mutate((prev) => ({
        ...prev,
        events: [
          ...prev.events,
          {
            id: genId(),
            title: input.title,
            type: input.type,
            date: normalizeDay(input.date),
            startTime: input.startTime,
            endTime: input.endTime,
            notes: input.notes,
            done: false,
            createdAt: new Date().toISOString(),
          } satisfies CalendarEvent,
        ],
      }));
    },
    [mutate]
  );

  const deleteEvent = useCallback(
    (id: string) => {
      const event = stateRef.current.events.find((e) => e.id === id);
      if (!event) return;
      softDelete({
        icon: "🗑️",
        name: event.title,
        remove: (st) => ({
          ...st,
          events: st.events.filter((e) => e.id !== id),
        }),
        restore: (st) => ({ ...st, events: [...st.events, event] }),
      });
    },
    [softDelete]
  );

  const updateEvent = useCallback<StoreApi["updateEvent"]>(
    (id, patch) => {
      const clean = { ...patch, date: normalizeDay(patch.date) };
      mutate((prev) => ({
        ...prev,
        events: prev.events.map((e) =>
          e.id === id ? { ...e, ...clean } : e
        ),
      }));
    },
    [mutate]
  );

  const toggleEventDone = useCallback<StoreApi["toggleEventDone"]>(
    (id) => {
      const prev = stateRef.current;
      const ev = prev.events.find((e) => e.id === id);
      if (!ev) return;
      const nowDone = !ev.done;
      // Only tasks award XP on completion (and refund when un-done).
      const xpDelta =
        ev.type === "task"
          ? nowDone
            ? XP_REWARDS.taskCompletion
            : -XP_REWARDS.taskCompletion
          : 0;
      const next: AppState = {
        ...prev,
        events: prev.events.map((e) =>
          e.id === id
            ? {
                ...e,
                done: nowDone,
                doneAt: nowDone ? new Date().toISOString() : null,
              }
            : e
        ),
        profile: {
          ...prev.profile,
          totalXp: Math.max(0, prev.profile.totalXp + xpDelta),
        },
      };
      commit(prev, next, xpDelta > 0 ? xpDelta : undefined);
    },
    [commit]
  );

  // --- Study tasks (one-off to-dos) -----------------------------------

  const addStudyTask = useCallback<StoreApi["addStudyTask"]>(
    (title, note, date, important) => {
      mutate((prev) => ({
        ...prev,
        studyTasks: [
          ...prev.studyTasks,
          {
            id: genId(),
            title,
            note,
            done: false,
            createdAt: new Date().toISOString(),
            completedAt: null,
            date: normalizeDay(date),
            important,
          } satisfies StudyTask,
        ],
      }));
    },
    [mutate]
  );

  const toggleStudyTaskDone = useCallback<StoreApi["toggleStudyTaskDone"]>(
    (id) => {
      const prev = stateRef.current;
      const task = prev.studyTasks.find((t) => t.id === id);
      if (!task) return;
      const nowDone = !task.done;
      const xpDelta = nowDone
        ? XP_REWARDS.taskCompletion
        : -XP_REWARDS.taskCompletion;
      const next: AppState = {
        ...prev,
        studyTasks: prev.studyTasks.map((t) =>
          t.id === id
            ? {
                ...t,
                done: nowDone,
                completedAt: nowDone ? new Date().toISOString() : null,
              }
            : t
        ),
        profile: {
          ...prev.profile,
          totalXp: Math.max(0, prev.profile.totalXp + xpDelta),
        },
      };
      commit(prev, next, xpDelta > 0 ? xpDelta : undefined);
    },
    [commit]
  );

  const deleteStudyTask = useCallback(
    (id: string) => {
      const task = stateRef.current.studyTasks.find((t) => t.id === id);
      if (!task) return;
      softDelete({
        icon: "🗑️",
        name: task.title,
        remove: (st) => ({
          ...st,
          studyTasks: st.studyTasks.filter((t) => t.id !== id),
        }),
        restore: (st) => ({ ...st, studyTasks: [...st.studyTasks, task] }),
      });
    },
    [softDelete]
  );

  const updateStudyTask = useCallback<StoreApi["updateStudyTask"]>(
    (id, patch) => {
      const clean =
        patch.date !== undefined
          ? { ...patch, date: normalizeDay(patch.date) }
          : patch;
      mutate((prev) => ({
        ...prev,
        studyTasks: prev.studyTasks.map((t) =>
          t.id === id ? { ...t, ...clean } : t
        ),
      }));
    },
    [mutate]
  );

  // Full account reset — clears every stat back to a fresh account.
  const resetAll = useCallback(() => {
    stateRef.current = EMPTY_STATE;
    setState(EMPTY_STATE);
  }, []);

  // Replace all data from an imported backup (normalized by lib/backup.ts).
  const importData = useCallback((next: AppState) => {
    stateRef.current = next;
    setState(next);
  }, []);

  // --- XP-bearing actions (read snapshot, commit once) ----------------

  const logActivity = useCallback<StoreApi["logActivity"]>(
    (activityId, value, note) => {
      // Reject empty/absurd amounts: a 0-value log would still pay XP, and a
      // non-finite value corrupts persisted state (Infinity → null via JSON).
      if (!Number.isFinite(value) || value <= 0) return;
      const prev = stateRef.current;
      const activity = prev.activities.find((a) => a.id === activityId);
      if (!activity) return;
      const xp = activity.xpPerLog;
      const next: AppState = {
        ...prev,
        logs: [
          ...prev.logs,
          {
            id: genId(),
            activityId,
            value,
            note,
            xpAwarded: xp,
            loggedAt: new Date().toISOString(),
          },
        ],
        profile: { ...prev.profile, totalXp: prev.profile.totalXp + xp },
      };
      commit(prev, next, xp);
    },
    [commit]
  );

  // Record a completed focus session. Grants no XP (the task's own completion is
  // the reward) and never touches the task's done-state — it's tracked purely
  // for focus-time stats. Still routed through commit so the XP-free focus
  // achievements evaluate and their badge celebration fires.
  const logFocusSession = useCallback<StoreApi["logFocusSession"]>(
    (minutes, taskId = null) => {
      if (minutes <= 0) return;
      const prev = stateRef.current;
      const now = new Date();
      const next: AppState = {
        ...prev,
        focusSessions: [
          ...prev.focusSessions,
          {
            id: genId(),
            taskId: taskId ?? null,
            minutes,
            startedAt: new Date(now.getTime() - minutes * 60_000).toISOString(),
            completedAt: now.toISOString(),
          },
        ],
      };
      commit(prev, next);
    },
    [commit]
  );

  // --- Focus timer (lives beside AppState; survives navigation/reload) --

  const [focus, setFocus] = useState<FocusState>(DEFAULT_FOCUS);
  const [focusHydrated, setFocusHydrated] = useState(false);

  // Hydrate the timer after the app state is in (so a session that elapsed
  // while the app was closed logs against the real state, not EMPTY_STATE).
  useEffect(() => {
    if (!hydrated || focusHydrated) return;
    try {
      const raw = localStorage.getItem(FOCUS_KEY);
      if (raw) {
        const f = { ...DEFAULT_FOCUS, ...JSON.parse(raw) } as FocusState;
        if (f.running && f.endAt !== null && f.endAt <= Date.now()) {
          // Finished while the app was closed: count it (no chime — a
          // surprise sound on page load is hostile) and rest the timer.
          logFocusSession(f.minutes, f.taskId);
          setFocus({
            ...DEFAULT_FOCUS,
            minutes: f.minutes,
            remainingMs: f.minutes * 60_000,
          });
        } else {
          setFocus(f);
        }
      }
    } catch {
      /* ignore corrupt storage */
    }
    setFocusHydrated(true);
  }, [hydrated, focusHydrated, logFocusSession]);

  // Persist the timer on every change (after its own hydration).
  useEffect(() => {
    if (!focusHydrated) return;
    try {
      localStorage.setItem(FOCUS_KEY, JSON.stringify(focus));
    } catch {
      /* storage full / unavailable */
    }
  }, [focus, focusHydrated]);

  // Completion watcher: one timeout armed for the exact end moment. Display
  // ticking happens in the components (derived from endAt), so this is the
  // only place a session completes — no double-logging.
  useEffect(() => {
    if (!focus.running || focus.endAt === null) return;
    const { minutes, taskId, endAt } = focus;
    const finish = () => {
      setFocus((f) => ({
        ...f,
        running: false,
        endAt: null,
        remainingMs: f.minutes * 60_000,
      }));
      logFocusSession(minutes, taskId);
      if (isSoundEnabled()) playChime();
    };
    const left = endAt - Date.now();
    if (left <= 0) {
      finish();
      return;
    }
    const id = setTimeout(finish, left + 50);
    return () => clearTimeout(id);
  }, [focus, logFocusSession]);

  const startFocus = useCallback(() => {
    setFocus((f) =>
      f.running || f.minutes < 1
        ? f
        : { ...f, running: true, endAt: Date.now() + f.remainingMs }
    );
  }, []);

  const pauseFocus = useCallback(() => {
    setFocus((f) =>
      !f.running || f.endAt === null
        ? f
        : {
            ...f,
            running: false,
            endAt: null,
            remainingMs: Math.max(0, f.endAt - Date.now()),
          }
    );
  }, []);

  const resetFocus = useCallback(() => {
    setFocus((f) => ({
      ...f,
      running: false,
      endAt: null,
      remainingMs: f.minutes * 60_000,
    }));
  }, []);

  // Duration is only editable at full rest — never mid-session (running or
  // paused), where changing it would silently discard elapsed progress.
  const setFocusMinutes = useCallback((m: number) => {
    const clamped = Math.min(
      MAX_FOCUS_MINUTES,
      Math.max(0, Math.floor(Number.isFinite(m) ? m : 0))
    );
    setFocus((f) =>
      f.running || f.remainingMs !== f.minutes * 60_000
        ? f
        : { ...f, minutes: clamped, remainingMs: clamped * 60_000 }
    );
  }, []);

  const setFocusTask = useCallback((id: string | null) => {
    setFocus((f) => (f.running ? f : { ...f, taskId: id }));
  }, []);

  const toggleHabitToday = useCallback<StoreApi["toggleHabitToday"]>(
    (habitId) => {
      const prev = stateRef.current;
      const today = todayStr();
      const habit = prev.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const doneToday = prev.completions.some(
        (c) => c.habitId === habitId && c.completedOn === today
      );

      // Toggle today's completion, then recompute the streak straight from the
      // resulting completion history so the stored streak can never drift from
      // what actually happened (un-check + re-check restores the same value).
      const completions = doneToday
        ? prev.completions.filter(
            (c) => !(c.habitId === habitId && c.completedOn === today)
          )
        : [...prev.completions, { id: genId(), habitId, completedOn: today }];

      const stats = scheduledStreakStats(
        completions
          .filter((c) => c.habitId === habitId)
          .map((c) => c.completedOn),
        habit.days
      );

      // Award on check, refund on un-check (floored at 0).
      const xpDelta = doneToday
        ? -XP_REWARDS.habitCompletion
        : XP_REWARDS.habitCompletion;

      const next: AppState = {
        ...prev,
        completions,
        habits: prev.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                currentStreak: stats.current,
                longestStreak: stats.longest,
                lastCompletedDate: stats.last,
              }
            : h
        ),
        profile: {
          ...prev.profile,
          totalXp: Math.max(0, prev.profile.totalXp + xpDelta),
        },
      };
      commit(prev, next, xpDelta > 0 ? xpDelta : undefined);
    },
    [commit]
  );

  const addGoalProgress = useCallback<StoreApi["addGoalProgress"]>(
    (goalId, delta) => {
      if (!Number.isFinite(delta) || delta === 0) return;
      const prev = stateRef.current;
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || goal.status === "done") return;
      const newValue = Math.max(0, goal.currentValue + delta);
      // Guard targetValue > 0 so a zero/negative target can't auto-complete and
      // hand out the 50 XP reward on the very first progress tick.
      const justDone = goal.targetValue > 0 && newValue >= goal.targetValue;
      let next: AppState = {
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentValue: newValue,
                status: justDone ? "done" : "active",
                ...(justDone ? { completedAt: new Date().toISOString() } : {}),
              }
            : g
        ),
      };
      let xp: number | undefined;
      if (justDone) {
        xp = XP_REWARDS.goalCompletion;
        next = {
          ...next,
          profile: { ...next.profile, totalXp: next.profile.totalXp + xp },
        };
      }
      commit(prev, next, xp);
    },
    [commit]
  );

  const api: StoreApi = {
    state,
    hydrated,
    toasts,
    dismissToast,
    setDisplayName,
    addActivity,
    deleteActivity,
    updateActivity,
    logActivity,
    addHabit,
    deleteHabit,
    updateHabit,
    toggleHabitToday,
    addGoal,
    addGoalProgress,
    deleteGoal,
    updateGoal,
    addEvent,
    deleteEvent,
    updateEvent,
    toggleEventDone,
    addStudyTask,
    toggleStudyTaskDone,
    deleteStudyTask,
    updateStudyTask,
    logFocusSession,
    focus,
    startFocus,
    pauseFocus,
    resetFocus,
    setFocusMinutes,
    setFocusTask,
    resetAll,
    importData,
    celebration,
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
