-- LevelUp initial schema: tables, RLS, profile trigger.
-- Run this in the Supabase SQL editor (or `supabase db push`).

-- =====================================================================
-- profiles: one row per auth user, holds XP / level aggregates.
-- =====================================================================
create table if not exists public.profiles (
  id            uuid primary key references auth.users(id) on delete cascade,
  display_name  text,
  total_xp      integer not null default 0,
  current_level integer not null default 1,
  created_at    timestamptz not null default now()
);

-- =====================================================================
-- activities: user-defined trackers for training / study (and habits live
-- in their own table). type constrains the tracker category.
-- =====================================================================
create table if not exists public.activities (
  id         uuid primary key default gen_random_uuid(),
  user_id    uuid not null references auth.users(id) on delete cascade,
  type       text not null check (type in ('training', 'study')),
  title      text not null,
  unit       text not null default 'min',
  xp_per_log integer not null default 10,
  archived   boolean not null default false,
  created_at timestamptz not null default now()
);
create index if not exists activities_user_idx on public.activities (user_id);

-- =====================================================================
-- activity_logs: every logged entry. Powers history, charts, XP ledger.
-- =====================================================================
create table if not exists public.activity_logs (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references auth.users(id) on delete cascade,
  activity_id uuid not null references public.activities(id) on delete cascade,
  value       numeric not null default 0,
  note        text,
  xp_awarded  integer not null default 0,
  logged_at   timestamptz not null default now()
);
create index if not exists activity_logs_user_idx on public.activity_logs (user_id);
create index if not exists activity_logs_activity_idx on public.activity_logs (activity_id);
create index if not exists activity_logs_logged_at_idx on public.activity_logs (logged_at);

-- =====================================================================
-- habits + completions: daily check-off trackers with streaks.
-- =====================================================================
create table if not exists public.habits (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references auth.users(id) on delete cascade,
  title               text not null,
  frequency           text not null default 'daily',
  current_streak      integer not null default 0,
  longest_streak      integer not null default 0,
  last_completed_date date,
  archived            boolean not null default false,
  created_at          timestamptz not null default now()
);
create index if not exists habits_user_idx on public.habits (user_id);

create table if not exists public.habit_completions (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references auth.users(id) on delete cascade,
  habit_id     uuid not null references public.habits(id) on delete cascade,
  completed_on date not null default current_date,
  unique (habit_id, completed_on)
);
create index if not exists habit_completions_user_idx on public.habit_completions (user_id);

-- =====================================================================
-- goals: custom goals with target / progress / deadline.
-- =====================================================================
create table if not exists public.goals (
  id            uuid primary key default gen_random_uuid(),
  user_id       uuid not null references auth.users(id) on delete cascade,
  title         text not null,
  target_value  numeric not null default 1,
  current_value numeric not null default 0,
  unit          text not null default '',
  deadline      date,
  status        text not null default 'active' check (status in ('active', 'done')),
  created_at    timestamptz not null default now()
);
create index if not exists goals_user_idx on public.goals (user_id);

-- =====================================================================
-- achievements (static catalog) + user_achievements (unlocks).
-- =====================================================================
create table if not exists public.achievements (
  key         text primary key,
  name        text not null,
  description text not null,
  icon        text not null default '🏆',
  sort_order  integer not null default 0
);

create table if not exists public.user_achievements (
  user_id         uuid not null references auth.users(id) on delete cascade,
  achievement_key text not null references public.achievements(key) on delete cascade,
  unlocked_at     timestamptz not null default now(),
  primary key (user_id, achievement_key)
);

-- =====================================================================
-- Auto-create a profile row when a new auth user signs up.
-- =====================================================================
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer set search_path = public
as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', split_part(new.email, '@', 1)))
  on conflict (id) do nothing;
  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
