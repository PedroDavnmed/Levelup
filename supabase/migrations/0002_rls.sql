-- Row-Level Security: each user can only touch their own rows.
-- Achievements catalog is world-readable; everything else is user-scoped.

alter table public.profiles          enable row level security;
alter table public.activities        enable row level security;
alter table public.activity_logs     enable row level security;
alter table public.habits            enable row level security;
alter table public.habit_completions enable row level security;
alter table public.goals             enable row level security;
alter table public.achievements      enable row level security;
alter table public.user_achievements enable row level security;

-- profiles (id IS the user id)
create policy "profiles_select_own" on public.profiles
  for select using (auth.uid() = id);
create policy "profiles_update_own" on public.profiles
  for update using (auth.uid() = id);
create policy "profiles_insert_own" on public.profiles
  for insert with check (auth.uid() = id);

-- Helper macro pattern applied per user-scoped table below.
create policy "activities_all_own" on public.activities
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "activity_logs_all_own" on public.activity_logs
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habits_all_own" on public.habits
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "habit_completions_all_own" on public.habit_completions
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "goals_all_own" on public.goals
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

create policy "user_achievements_all_own" on public.user_achievements
  for all using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- Achievements catalog: readable by any authenticated user, no writes.
create policy "achievements_select_all" on public.achievements
  for select using (auth.role() = 'authenticated');
