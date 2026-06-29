# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev          # Start dev server at http://localhost:3000
npm run build        # Production build
npm run lint         # ESLint (next lint)
npm test             # Run Vitest once
npm run test:watch   # Vitest in watch mode
npx vitest run lib/gamification.test.ts   # Run a single test file
node scripts/generate-icons.mjs           # One-time: generate PWA icons
```

Note: Node was installed via winget and may not be on PATH in fresh shells. If `node`/`npm` aren't found, invoke via the full path `"$env:ProgramFiles\nodejs\node.exe"` (PowerShell).

## Two run modes (important)

The whole app is gated by `NEXT_PUBLIC_LOCAL_MODE` in `.env.local`:

- **Local mode (`=true`, the current default):** no auth, no Supabase. All data lives in the browser via `localStorage`. This is how the app runs today.
- **Cloud mode (`=false`):** requires Supabase auth + Postgres; enables login and cross-device sync.

The flag is read in three places that all branch on it — keep them in sync when touching auth/routing: `middleware.ts` → `lib/supabase/middleware.ts` (lets all requests through in local mode), `app/(app)/layout.tsx` (skips the `getUser()` guard), and `app/page.tsx` (landing redirect).

**Cloud sync is not yet wired.** The Supabase scaffolding (`lib/supabase/*`, `supabase/migrations/*`) and auth pages exist, but the trackers read/write only the local store. Wiring the store to Supabase is the next planned chunk — do not assume cloud persistence works.

## Architecture

Next.js App Router + TypeScript + Tailwind + Recharts. Path alias `@/*` maps to the repo root.

**Single client-side store is the heart of the app.** `lib/store.tsx` exposes a React context (`StoreProvider` / `useStore`) holding the entire `AppState` (profile, activities, logs, habits, completions, goals, events, achievements — see `lib/types.ts`). It hydrates from `localStorage` key `levelup:v1` once on mount and persists on every change. All feature pages are client components that call `useStore()`; there is no server data layer in local mode.

**The `commit` pipeline is where all gamification side-effects happen.** XP-bearing actions (`logActivity`, `toggleHabitToday`, `addGoalProgress`, `toggleEventDone`) read a synchronous snapshot via `stateRef`, compute the full next state, then call `commit(prev, next, xpToast?)`. `commit` is the only place that:
- evaluates newly-earned achievements (`evaluateNewAchievements`) and appends them,
- fires toasts for XP gains, level-ups, new badges, and rank-ups.

When adding any action that grants XP or could unlock achievements, route it through `commit` rather than calling `setState` directly — otherwise achievements/toasts won't trigger. Simple non-XP mutations (add/delete entities) use `setState` or `mutate` directly.

**Derived data is computed by pure functions in `lib/`, never stored.** Levels, streaks, ranks, aggregates, calendar layout, and consistency are all derived from `AppState`:
- `gamification.ts` — XP↔level curve (reaching level L costs `50*L*(L-1)` cumulative XP) and `levelProgress`.
- `streaks.ts` — `streakStats` recomputes a habit's current/longest streak from its completion dates (the source of truth `toggleHabitToday` uses); `nextStreak`/`liveStreak` are incremental/display helpers. Activity-log timestamps are UTC ISO, so convert to local with `localDateOf` (in `date.ts`) before bucketing by day — never `iso.slice(0,10)`.
- `achievements.ts` — static `ACHIEVEMENTS` catalog + `metricsOf`/`evaluateNewAchievements`. The catalog mirrors `supabase/migrations/0003_seed_achievements.sql`; **keep both in sync** when adding badges.
- `ranks.ts` — rank derived from count of unlocked achievements.
- `aggregate.ts`, `consistency.ts`, `calendar.ts`, `date.ts` — chart/calendar/date helpers.

These pure modules are the unit-tested ones (`*.test.ts` alongside them).

**Routing.** Two App Router groups: `app/(app)/*` are the protected feature pages (dashboard, training, study, habits, goals, calendar, stats, achievements) wrapped by `AppShell`; `app/(auth)/*` are login/signup (cloud mode only). `app/auth/callback/route.ts` handles the Supabase magic-link/OAuth callback.

**XP values** are centralized in `XP_REWARDS` in `lib/types.ts`. `xpPerLog` is per-activity (chosen at creation).

## Conventions

- This is the user's first project; they prefer a **phased build with review between stages** — ship a runnable slice, then pause for feedback before continuing.
- `AppState` is treated immutably everywhere (spread to new objects/arrays). Preserve this so the persist-on-change effect and `stateRef` snapshots stay correct.
