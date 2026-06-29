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
} from "./types";
import { XP_REWARDS } from "./types";
import { levelForXp } from "./gamification";
import { evaluateNewAchievements, ACHIEVEMENTS } from "./achievements";
import { rankForCount } from "./ranks";
import { nextStreak } from "./streaks";
import { todayStr } from "./date";

const STORAGE_KEY = "levelup:v1";

const EMPTY_STATE: AppState = {
  profile: { displayName: "Player", totalXp: 0 },
  activities: [],
  logs: [],
  habits: [],
  completions: [],
  goals: [],
  events: [],
  achievements: [],
};

export interface Toast {
  id: string;
  kind: "level" | "badge" | "xp" | "rank";
  title: string;
  detail?: string;
  icon: string;
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
  logActivity: (activityId: string, value: number, note?: string) => void;
  addHabit: (title: string) => void;
  deleteHabit: (id: string) => void;
  toggleHabitToday: (habitId: string) => void;
  addGoal: (
    title: string,
    targetValue: number,
    unit: string,
    deadline: string | null
  ) => void;
  addGoalProgress: (goalId: string, delta: number) => void;
  deleteGoal: (id: string) => void;
  addEvent: (input: {
    title: string;
    type: EventType;
    date: string;
    startTime: string | null;
    endTime: string | null;
    notes?: string;
  }) => void;
  deleteEvent: (id: string) => void;
  toggleEventDone: (id: string) => void;
  resetAll: () => void;
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

  const deleteActivity = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      activities: s.activities.filter((a) => a.id !== id),
      logs: s.logs.filter((l) => l.activityId !== id),
    }));
  }, []);

  const addHabit = useCallback(
    (title: string) => {
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
          } satisfies Habit,
        ],
      }));
    },
    [mutate]
  );

  const deleteHabit = useCallback((id: string) => {
    setState((s) => ({
      ...s,
      habits: s.habits.filter((h) => h.id !== id),
      completions: s.completions.filter((c) => c.habitId !== id),
    }));
  }, []);

  const addGoal = useCallback<StoreApi["addGoal"]>(
    (title, targetValue, unit, deadline) => {
      mutate((prev) => ({
        ...prev,
        goals: [
          ...prev.goals,
          {
            id: genId(),
            title,
            targetValue,
            currentValue: 0,
            unit,
            deadline,
            status: "active",
            createdAt: new Date().toISOString(),
          } satisfies Goal,
        ],
      }));
    },
    [mutate]
  );

  const deleteGoal = useCallback((id: string) => {
    setState((s) => ({ ...s, goals: s.goals.filter((g) => g.id !== id) }));
  }, []);

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
            date: input.date,
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

  const deleteEvent = useCallback((id: string) => {
    setState((s) => ({ ...s, events: s.events.filter((e) => e.id !== id) }));
  }, []);

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
          e.id === id ? { ...e, done: nowDone } : e
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

  // Full account reset — clears every stat back to a fresh account.
  const resetAll = useCallback(() => {
    stateRef.current = EMPTY_STATE;
    setState(EMPTY_STATE);
  }, []);

  // --- XP-bearing actions (read snapshot, commit once) ----------------

  const logActivity = useCallback<StoreApi["logActivity"]>(
    (activityId, value, note) => {
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

  const toggleHabitToday = useCallback<StoreApi["toggleHabitToday"]>(
    (habitId) => {
      const prev = stateRef.current;
      const today = todayStr();
      const habit = prev.habits.find((h) => h.id === habitId);
      if (!habit) return;
      const doneToday = prev.completions.some(
        (c) => c.habitId === habitId && c.completedOn === today
      );

      if (doneToday) {
        // Un-check today: remove completion, roll streak back, refund XP.
        const newStreak = Math.max(0, habit.currentStreak - 1);
        const next: AppState = {
          ...prev,
          completions: prev.completions.filter(
            (c) => !(c.habitId === habitId && c.completedOn === today)
          ),
          habits: prev.habits.map((h) =>
            h.id === habitId
              ? {
                  ...h,
                  currentStreak: newStreak,
                  lastCompletedDate:
                    newStreak === 0 ? null : h.lastCompletedDate,
                }
              : h
          ),
          profile: {
            ...prev.profile,
            totalXp: Math.max(
              0,
              prev.profile.totalXp - XP_REWARDS.habitCompletion
            ),
          },
        };
        commit(prev, next);
        return;
      }

      // Check today: advance streak and award XP.
      const streak = nextStreak(
        habit.lastCompletedDate,
        habit.currentStreak,
        today
      );
      const next: AppState = {
        ...prev,
        completions: [
          ...prev.completions,
          { id: genId(), habitId, completedOn: today },
        ],
        habits: prev.habits.map((h) =>
          h.id === habitId
            ? {
                ...h,
                currentStreak: streak,
                longestStreak: Math.max(h.longestStreak, streak),
                lastCompletedDate: today,
              }
            : h
        ),
        profile: {
          ...prev.profile,
          totalXp: prev.profile.totalXp + XP_REWARDS.habitCompletion,
        },
      };
      commit(prev, next, XP_REWARDS.habitCompletion);
    },
    [commit]
  );

  const addGoalProgress = useCallback<StoreApi["addGoalProgress"]>(
    (goalId, delta) => {
      const prev = stateRef.current;
      const goal = prev.goals.find((g) => g.id === goalId);
      if (!goal || goal.status === "done") return;
      const newValue = Math.max(0, goal.currentValue + delta);
      const justDone = newValue >= goal.targetValue;
      let next: AppState = {
        ...prev,
        goals: prev.goals.map((g) =>
          g.id === goalId
            ? {
                ...g,
                currentValue: newValue,
                status: justDone ? "done" : "active",
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
    logActivity,
    addHabit,
    deleteHabit,
    toggleHabitToday,
    addGoal,
    addGoalProgress,
    deleteGoal,
    addEvent,
    deleteEvent,
    toggleEventDone,
    resetAll,
  };

  return <StoreContext.Provider value={api}>{children}</StoreContext.Provider>;
}

export function useStore(): StoreApi {
  const ctx = useContext(StoreContext);
  if (!ctx) throw new Error("useStore must be used within a StoreProvider");
  return ctx;
}
