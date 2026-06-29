-- Static achievements catalog. Criteria are evaluated in app code
-- (lib/achievements.ts) and unlocks are written to user_achievements.

insert into public.achievements (key, name, description, icon, sort_order) values
  ('first_workout', 'First Rep',      'Log your first training session.',                  '💪', 10),
  ('first_study',   'Open Book',      'Log your first study session.',                     '📚', 20),
  ('first_habit',   'Day One',        'Complete a habit for the first time.',              '✅', 30),
  ('well_rounded',  'Well Rounded',   'Have both a training and a study activity.',        '🧭', 40),
  ('goal_setter',   'Goal Setter',    'Create your first goal.',                           '📝', 50),
  ('level_3',       'Getting Going',  'Reach level 3.',                                    '✨', 60),
  ('streak_7',      'Week Warrior',   'Reach a 7-day streak on any habit.',                '🔥', 70),
  ('train_25',      'Iron Will',      'Log 25 training sessions.',                         '🏋️', 80),
  ('study_10h',     'Scholar',        'Accumulate 10 hours (600 min) of study.',           '🎓', 90),
  ('level_5',       'Rising Star',    'Reach level 5.',                                    '⭐', 100),
  ('xp_1000',       'Grinder',        'Earn 1,000 total XP.',                              '⚡', 110),
  ('goal_crushed',  'Goal Crusher',   'Complete your first custom goal.',                  '🎯', 120),
  ('habit_50',      'Consistent',     'Complete habits 50 times in total.',                '📅', 130),
  ('logs_100',      'Logger',         'Log 100 activities in total.',                      '📈', 140),
  ('streak_14',     'Fortnight',      'Reach a 14-day streak on any habit.',               '🌗', 150),
  ('streak_30',     'Unbreakable',    'Reach a 30-day streak on any habit.',               '⛓️', 160),
  ('train_50',      'Powerhouse',     'Log 50 training sessions.',                         '🦾', 170),
  ('study_25h',     'Deep Thinker',   'Accumulate 25 hours (1500 min) of study.',          '🧠', 180),
  ('level_10',      'Double Digits',  'Reach level 10.',                                   '🌟', 190),
  ('xp_5000',       'Relentless',     'Earn 5,000 total XP.',                              '💥', 200),
  ('goals_5',       'Achiever',       'Complete 5 custom goals.',                          '🏅', 210),
  ('habit_100',     'Habitual',       'Complete habits 100 times in total.',               '🗓️', 220),
  ('streak_100',    'Centurion',      'Reach a 100-day streak on any habit.',              '🛡️', 230),
  ('train_100',     'Unstoppable',    'Log 100 training sessions.',                        '🥇', 240),
  ('level_20',      'Veteran',        'Reach level 20.',                                   '👑', 250),
  ('xp_10000',      'Legend',         'Earn 10,000 total XP.',                             '🚀', 260)
on conflict (key) do update set
  name = excluded.name,
  description = excluded.description,
  icon = excluded.icon,
  sort_order = excluded.sort_order;
