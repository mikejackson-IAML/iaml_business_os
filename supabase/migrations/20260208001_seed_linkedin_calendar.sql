-- Seed content calendar with 4 weeks of empty slots (Tue-Fri)
-- Starting from the week of Feb 10, 2026

-- Week 1: Feb 10-14, 2026
INSERT INTO linkedin_engine.content_calendar (week_of, post_date, day_of_week, series, recommended_format, status)
VALUES
  ('2026-02-09', '2026-02-10', 'tuesday', 'not_being_told', 'text', 'open'),
  ('2026-02-09', '2026-02-11', 'wednesday', 'compliance_radar', 'text', 'open'),
  ('2026-02-09', '2026-02-12', 'thursday', 'ask_ai_guy', 'text', 'open'),
  ('2026-02-09', '2026-02-13', 'friday', 'flex', 'text', 'open'),

-- Week 2: Feb 17-21, 2026
  ('2026-02-16', '2026-02-17', 'tuesday', 'not_being_told', 'text', 'open'),
  ('2026-02-16', '2026-02-18', 'wednesday', 'compliance_radar', 'text', 'open'),
  ('2026-02-16', '2026-02-19', 'thursday', 'ask_ai_guy', 'text', 'open'),
  ('2026-02-16', '2026-02-20', 'friday', 'flex', 'text', 'open'),

-- Week 3: Feb 24-28, 2026
  ('2026-02-23', '2026-02-24', 'tuesday', 'not_being_told', 'text', 'open'),
  ('2026-02-23', '2026-02-25', 'wednesday', 'compliance_radar', 'text', 'open'),
  ('2026-02-23', '2026-02-26', 'thursday', 'ask_ai_guy', 'text', 'open'),
  ('2026-02-23', '2026-02-27', 'friday', 'flex', 'text', 'open'),

-- Week 4: Mar 3-7, 2026
  ('2026-03-02', '2026-03-03', 'tuesday', 'not_being_told', 'text', 'open'),
  ('2026-03-02', '2026-03-04', 'wednesday', 'compliance_radar', 'text', 'open'),
  ('2026-03-02', '2026-03-05', 'thursday', 'ask_ai_guy', 'text', 'open'),
  ('2026-03-02', '2026-03-06', 'friday', 'flex', 'text', 'open');
