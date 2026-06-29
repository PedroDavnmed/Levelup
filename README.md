# LevelUp — Gamified Life & Goals Tracker

Turn training, studying, and habits into a game. Log real-life effort to earn XP,
build streaks, watch charts climb, and unlock badges. Built as an installable PWA
with cloud sync so your data follows you between phone and desktop.

**Stack:** Next.js (App Router) · TypeScript · Tailwind CSS · Supabase (Auth + Postgres) · Recharts · PWA

---

## Two ways to run

- **Local mode (default right now):** no login, no Supabase — the whole app runs
  in your browser and saves data in `localStorage`. Great for trying it instantly
  on your desktop. Controlled by `NEXT_PUBLIC_LOCAL_MODE=true` in `.env.local`.
- **Cloud mode:** set `NEXT_PUBLIC_LOCAL_MODE=false` and add your Supabase keys to
  get login + cross-device sync (phone ↔ desktop).

## Quick start (local mode)

```bash
npm install
npm run dev
```

Open <http://localhost:3000> and click **Enter app**. Add a training/study
activity, log it, check off habits, set goals — watch your XP, level, streaks,
charts, and badges respond. Use **Reset data** in the sidebar to start fresh.

## Build progress

- ✅ **Foundation**: scaffold, design system, Supabase clients, SQL schema + RLS,
  email/password + magic-link auth, protected routes, PWA shell.
- ✅ **Local app**: localStorage store, training/study/habits/goals trackers,
  logging flows, XP/level engine, streaks, charts, badges, achievements gallery.
- ⬜ **Cloud sync**: wire the trackers to Supabase so data syncs across devices.

---

## Setup

### 1. Install dependencies

```bash
npm install
```

### 2. Create a Supabase project

1. Go to <https://supabase.com> → **New project** (free tier is fine).
2. Once created, open **Project Settings → API** and copy:
   - **Project URL**
   - **anon public** key

### 3. Configure environment

```bash
cp .env.local.example .env.local
```

Fill in `.env.local`:

```
NEXT_PUBLIC_SUPABASE_URL=https://YOUR-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-public-key
```

### 4. Run the database migrations

In the Supabase dashboard, open **SQL Editor** and run these files in order
(copy-paste the contents of each):

1. `supabase/migrations/0001_init.sql` — tables + profile auto-create trigger
2. `supabase/migrations/0002_rls.sql` — Row-Level Security policies
3. `supabase/migrations/0003_seed_achievements.sql` — achievements catalog

> Tip: for local email/password testing without inbox confirmation, go to
> **Authentication → Providers → Email** and turn **Confirm email** off.

### 5. Generate PWA icons (one-time)

```bash
node scripts/generate-icons.mjs
```

### 6. Start the app

```bash
npm run dev
```

Open <http://localhost:3000>, create an account, and you'll land on your dashboard.

---

## Verify Stage 1

- Sign up → a row appears in the `profiles` table (Supabase → Table editor).
- You're redirected to `/dashboard` showing your name, Level 1, and 0 XP.
- Visiting `/dashboard` while signed out redirects to `/login`.
- On a phone browser, "Add to Home Screen" installs the app.

## Tests

```bash
npm test
```

(Gamification/streak unit tests are added in Stage 3.)
