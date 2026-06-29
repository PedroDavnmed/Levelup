-- Static achievements catalog. Criteria are evaluated in app code
-- (lib/achievements.ts) and unlocks are written to user_achievements.

insert into public.achievements (key, name, description, icon, sort_order) values
  ('first_workout', 'First Rep',        'Log your first training session.',        '💪', 10),
  ('first_study',   'Open Book',        'Log your first study session.',           '📚', 20),
  ('first_habit',   'Day One',          'Complete a habit for the first time.',    '✅', 30),
  ('streak_7',      'Week Warrior',     'Reach a 7-day streak on any habit.',      '🔥', 40),
  ('streak_30',     'Unbreakable',      'Reach a 30-day streak on any habit.',     '⛓️', 50),
  ('study_10h',     'Scholar',          'Accumulate 10 hours of study.',           '🎓', 60),
  ('train_25',      'Iron Will',        'Log 25 training sessions.',               '🏋️', 70),
  ('level_5',       'Rising Star',      'Reach level 5.',                          '⭐', 80),
  ('level_10',      'Double Digits',    'Reach level 10.',                         '🌟', 90),
  ('xp_1000',       'Grinder',          'Earn 1,000 total XP.',                    '⚡', 100),
  ('goal_crushed',  'Goal Crusher',     'Complete your first custom goal.',        '🎯', 110)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
