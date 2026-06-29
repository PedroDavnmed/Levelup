import type { AppState } from "./types";

/** Baseline used to fill any keys missing from an imported file (mirrors the
 *  store's hydrate-time merge). Kept local so this module stays React-free. */
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

const ARRAY_KEYS = [
  "activities",
  "logs",
  "habits",
  "completions",
  "goals",
  "events",
  "achievements",
] as const;

/** Serialize the whole app state into a portable, human-readable backup blob. */
export function serializeBackup(state: AppState): string {
  return JSON.stringify(
    {
      app: "levelup",
      version: 1,
      exportedAt: new Date().toISOString(),
      state,
    },
    null,
    2
  );
}

/**
 * Parse a backup file's text back into an AppState, or return null if it
 * doesn't look like LevelUp data. Accepts both the wrapped `{ ...meta, state }`
 * shape and a bare AppState, and fills any missing keys from EMPTY_STATE.
 */
export function parseBackup(text: string): AppState | null {
  let data: unknown;
  try {
    data = JSON.parse(text);
  } catch {
    return null;
  }
  if (!data || typeof data !== "object") return null;

  // Unwrap the { app, version, state } envelope if present.
  const maybeWrapped = data as Record<string, unknown>;
  const raw =
    "state" in maybeWrapped && typeof maybeWrapped.state === "object"
      ? maybeWrapped.state
      : data;
  if (!raw || typeof raw !== "object") return null;

  const obj = raw as Record<string, unknown>;
  // Must at least carry a profile object…
  if (!obj.profile || typeof obj.profile !== "object") return null;
  // …and any present collection must actually be an array.
  for (const k of ARRAY_KEYS) {
    if (k in obj && !Array.isArray(obj[k])) return null;
  }

  return { ...EMPTY_STATE, ...(obj as Partial<AppState>) } as AppState;
}
