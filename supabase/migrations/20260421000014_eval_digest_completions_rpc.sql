-- RPC that powers the morning digest email.
-- Returns one row per evaluation completed in the window, with everything the
-- digest endpoint needs to render a card: identity, program context, NPS router
-- fields, derived tagging flags, instructor score average, and the raw text of
-- every open-ended answer.
--
-- Date: 2026-04-21

CREATE OR REPLACE FUNCTION public.eval_digest_completions(
  p_since TIMESTAMPTZ,
  p_until TIMESTAMPTZ
)
RETURNS TABLE (
  evaluation_id               UUID,
  completed_at                TIMESTAMPTZ,
  full_name                   TEXT,
  email                       TEXT,
  job_title                   TEXT,
  company                     TEXT,
  program_name                TEXT,
  instance_name               TEXT,
  nps_score                   INTEGER,
  nps_tier                    TEXT,
  has_acute_pain              BOOLEAN,
  iaml_intelligence_interest  TEXT,
  decision_maker_tier         TEXT,
  budget_cycle_quarter        TEXT,
  testimonial_consent_tier    TEXT,
  video_testimonial_ok        BOOLEAN,
  referral_count              INTEGER,
  detractor_wants_callback    BOOLEAN,
  instructor_avg              NUMERIC,
  q4_expectations             TEXT,
  q6_pacing                   TEXT,
  q8_most_valuable            TEXT,
  q9_could_improve            TEXT,
  q10_missing_topic           TEXT,
  q12_instructor_feedback     TEXT,
  q16_hardest_situation       TEXT,
  q19_other_topics            TEXT,
  q25a_valuable               TEXT,
  q26a_work_plan              TEXT,
  q25b_better                 TEXT,
  q28_one_change              TEXT,
  q29_almost_stopped          TEXT,
  q31_anything_else           TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
STABLE
AS $$
  WITH text_answers AS (
    -- TEXT/enum columns aggregate cleanly with MAX since (eval_id, question_id) is UNIQUE.
    SELECT
      r.evaluation_id,
      MAX(CASE WHEN r.question_id = 'q4'   THEN r.answer_enum END) AS q4,
      MAX(CASE WHEN r.question_id = 'q6'   THEN r.answer_enum END) AS q6,
      MAX(CASE WHEN r.question_id = 'q8'   THEN r.answer_text END) AS q8,
      MAX(CASE WHEN r.question_id = 'q9'   THEN r.answer_text END) AS q9,
      MAX(CASE WHEN r.question_id = 'q10'  THEN r.answer_text END) AS q10,
      MAX(CASE WHEN r.question_id = 'q12'  THEN r.answer_text END) AS q12,
      MAX(CASE WHEN r.question_id = 'q16'  THEN r.answer_text END) AS q16,
      MAX(CASE WHEN r.question_id = 'q19'  THEN r.answer_text END) AS q19,
      MAX(CASE WHEN r.question_id = 'q25a' THEN r.answer_text END) AS q25a,
      MAX(CASE WHEN r.question_id = 'q26a' THEN r.answer_text END) AS q26a,
      MAX(CASE WHEN r.question_id = 'q25b' THEN r.answer_text END) AS q25b,
      MAX(CASE WHEN r.question_id = 'q26b' THEN r.answer_enum END) AS q26b,
      MAX(CASE WHEN r.question_id = 'q28'  THEN r.answer_text END) AS q28,
      MAX(CASE WHEN r.question_id = 'q29'  THEN r.answer_text END) AS q29,
      MAX(CASE WHEN r.question_id = 'q31'  THEN r.answer_text END) AS q31
    FROM iaml_evaluations.evaluation_responses r
    GROUP BY r.evaluation_id
  ),
  instructor_scores AS (
    -- Average of the Q11 instructor matrix values (each row is {row_id: 1..5}).
    SELECT
      r.evaluation_id,
      ROUND(AVG((v.value::TEXT)::NUMERIC), 2) AS avg_score
    FROM iaml_evaluations.evaluation_responses r
    JOIN LATERAL jsonb_each(COALESCE(r.answer_json, '{}'::jsonb)) AS v ON TRUE
    WHERE r.question_id = 'q11'
      AND jsonb_typeof(v.value) = 'number'
    GROUP BY r.evaluation_id
  )
  SELECT
    e.id                                        AS evaluation_id,
    e.completed_at,
    NULLIF(TRIM(COALESCE(ba.first_name,'') || ' ' || COALESCE(ba.last_name,'')), '') AS full_name,
    ba.email,
    reg.job_title,
    COALESCE(ba.company_name, reg.company_name) AS company,
    pi.program_name,
    pi.instance_name,
    e.nps_score,
    e.nps_tier,
    e.has_acute_pain,
    e.iaml_intelligence_interest,
    e.decision_maker_tier,
    e.budget_cycle_quarter,
    e.testimonial_consent_tier,
    e.video_testimonial_ok,
    e.referral_count,
    (t.q26b = 'Yes, please reach out')          AS detractor_wants_callback,
    ins.avg_score                               AS instructor_avg,
    t.q4,  t.q6,  t.q8,  t.q9,  t.q10, t.q12,
    t.q16, t.q19, t.q25a, t.q26a, t.q25b,
    t.q28, t.q29, t.q31
  FROM iaml_evaluations.program_evaluations e
  LEFT JOIN iaml_evaluations.block_attendance ba  ON ba.id = e.block_attendance_id
  LEFT JOIN public.program_instances          pi  ON pi.id = e.program_instance_id
  LEFT JOIN public.registrations              reg ON reg.id = e.registration_id
  LEFT JOIN text_answers                      t   ON t.evaluation_id = e.id
  LEFT JOIN instructor_scores                 ins ON ins.evaluation_id = e.id
  WHERE e.status = 'complete'
    AND e.completed_at >= p_since
    AND e.completed_at <  p_until
  ORDER BY e.completed_at DESC;
$$;

COMMENT ON FUNCTION public.eval_digest_completions IS
  'Returns all evaluations completed in (p_since, p_until]. Powers the morning digest email.';

GRANT EXECUTE ON FUNCTION public.eval_digest_completions(TIMESTAMPTZ, TIMESTAMPTZ) TO service_role;
