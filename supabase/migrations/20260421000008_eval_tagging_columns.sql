-- Structured tagging on program_evaluations — derived from stored answers and
-- recomputed after every phase submit. Per the brief's §4.1 requirements, these
-- fields power downstream action-trigger workflows and fast cohort queries:
--   * hot-lead queue (acute pain + IAML Intelligence interest)
--   * testimonial pipeline (public consent tier + video flag)
--   * referral pipeline (entries in Q21)
-- Date: 2026-04-21

-- ============================================
-- ALTER — add the derived columns
-- ============================================
ALTER TABLE iaml_evaluations.program_evaluations
  ADD COLUMN IF NOT EXISTS has_acute_pain             BOOLEAN,
  ADD COLUMN IF NOT EXISTS testimonial_consent_tier   TEXT
    CHECK (testimonial_consent_tier IS NULL
           OR testimonial_consent_tier IN ('public_full', 'public_name_title', 'public_anonymous', 'internal_only')),
  ADD COLUMN IF NOT EXISTS video_testimonial_ok       BOOLEAN,
  ADD COLUMN IF NOT EXISTS referral_count             INTEGER,
  ADD COLUMN IF NOT EXISTS iaml_intelligence_interest TEXT,
  ADD COLUMN IF NOT EXISTS decision_maker_tier        TEXT,
  ADD COLUMN IF NOT EXISTS budget_cycle_quarter       TEXT;

COMMENT ON COLUMN iaml_evaluations.program_evaluations.testimonial_consent_tier IS
  'Highest public-share consent from Q27a. public_full > public_name_title > public_anonymous > internal_only. NULL if not answered.';

-- Indexes for the downstream workflow queries
CREATE INDEX IF NOT EXISTS program_evaluations_acute_pain_idx
  ON iaml_evaluations.program_evaluations (has_acute_pain) WHERE has_acute_pain = TRUE;
CREATE INDEX IF NOT EXISTS program_evaluations_consent_tier_idx
  ON iaml_evaluations.program_evaluations (testimonial_consent_tier) WHERE testimonial_consent_tier IS NOT NULL;
CREATE INDEX IF NOT EXISTS program_evaluations_video_ok_idx
  ON iaml_evaluations.program_evaluations (video_testimonial_ok) WHERE video_testimonial_ok = TRUE;

-- ============================================
-- Helper: recompute tags from stored answers.
-- Called by eval_submit_phase at the end of every submission; also reusable
-- for backfill or when answers are amended out-of-band.
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_recompute_tags(p_eval_id UUID)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_q14 JSONB;
  v_q21 JSONB;
  v_q22 TEXT;
  v_q23 TEXT;
  v_q24 TEXT;
  v_q27 JSONB;
  v_q27_sel JSONB;
  v_acute BOOLEAN;
  v_consent TEXT;
  v_video BOOLEAN;
  v_ref_count INTEGER;
BEGIN
  -- Pull answer rows once
  SELECT answer_json INTO v_q14 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q14';
  SELECT answer_json INTO v_q21 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q21';
  SELECT answer_enum INTO v_q22 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q22';
  SELECT answer_enum INTO v_q23 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q23';
  SELECT answer_enum INTO v_q24 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q24';
  SELECT answer_json INTO v_q27 FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = 'q27a';

  -- has_acute_pain: Q14 'selected' contains any item NOT in {'none', 'prefer_not_to_say'}
  v_acute := NULL;
  IF v_q14 IS NOT NULL AND jsonb_typeof(v_q14 -> 'selected') = 'array' THEN
    v_acute := EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_q14 -> 'selected') x
       WHERE x.value NOT IN ('none', 'prefer_not_to_say')
    );
  END IF;

  -- Testimonial consent tier + video flag from Q27a
  v_consent := NULL;
  v_video   := NULL;
  IF v_q27 IS NOT NULL AND jsonb_typeof(v_q27 -> 'selected') = 'array' THEN
    v_q27_sel := v_q27 -> 'selected';
    v_video := EXISTS (
      SELECT 1 FROM jsonb_array_elements_text(v_q27_sel) x WHERE x.value = 'video_testimonial'
    );
    v_consent := CASE
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_q27_sel) x WHERE x.value = 'name_title_company')
        THEN 'public_full'
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_q27_sel) x WHERE x.value = 'name_title')
        THEN 'public_name_title'
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_q27_sel) x WHERE x.value = 'anonymous')
        THEN 'public_anonymous'
      WHEN EXISTS (SELECT 1 FROM jsonb_array_elements_text(v_q27_sel) x WHERE x.value = 'internal_only')
        THEN 'internal_only'
      ELSE NULL
    END;
  END IF;

  -- referral_count: length of Q21 entries array
  v_ref_count := NULL;
  IF v_q21 IS NOT NULL AND jsonb_typeof(v_q21 -> 'entries') = 'array' THEN
    v_ref_count := jsonb_array_length(v_q21 -> 'entries');
  END IF;

  UPDATE iaml_evaluations.program_evaluations
     SET has_acute_pain             = v_acute,
         testimonial_consent_tier   = v_consent,
         video_testimonial_ok       = v_video,
         referral_count             = v_ref_count,
         iaml_intelligence_interest = v_q24,
         decision_maker_tier        = v_q22,
         budget_cycle_quarter       = v_q23
   WHERE id = p_eval_id;
END;
$$;

COMMENT ON FUNCTION public.eval_recompute_tags IS
  'Recomputes program_evaluations tagging columns from stored answers. Called by eval_submit_phase; also reusable for backfill.';

GRANT EXECUTE ON FUNCTION public.eval_recompute_tags(UUID) TO service_role;

-- ============================================
-- eval_submit_phase — call recompute_tags at the end of every submission
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_submit_phase(
  p_token   UUID,
  p_phase   INTEGER,
  p_answers JSONB
)
RETURNS TABLE (
  ok              BOOLEAN,
  submitted_phase INTEGER,
  next_phase      INTEGER,
  status          TEXT,
  total_phases    INTEGER,
  error_code      TEXT,
  error_detail    JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_eval          iaml_evaluations.program_evaluations%ROWTYPE;
  v_total_phases  CONSTANT INTEGER := 5;
  v_qid           TEXT;
  v_reg           iaml_evaluations.question_registry%ROWTYPE;
  v_raw           JSONB;
  v_int           INTEGER;
  v_txt           TEXT;
  v_missing       TEXT[] := ARRAY[]::TEXT[];
  v_nps_in        INTEGER;
  v_attend_in     TEXT;
  v_completed_at  TIMESTAMPTZ;
  v_first_submit  TIMESTAMPTZ;
BEGIN
  SELECT * INTO v_eval
    FROM iaml_evaluations.program_evaluations
   WHERE resume_token = p_token
   FOR UPDATE;
  IF NOT FOUND THEN
    RETURN QUERY SELECT FALSE, NULL::INTEGER, NULL::INTEGER, NULL::TEXT, v_total_phases,
                        'not_found'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  IF v_eval.status = 'complete' THEN
    RETURN QUERY SELECT FALSE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                        'already_complete'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  IF p_phase IS NULL OR p_phase <> v_eval.current_phase THEN
    RETURN QUERY SELECT FALSE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                        'phase_mismatch'::TEXT,
                        jsonb_build_object('expected_phase', v_eval.current_phase);
    RETURN;
  END IF;

  IF p_answers IS NULL OR jsonb_typeof(p_answers) <> 'object' THEN
    RETURN QUERY SELECT FALSE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                        'invalid_answers'::TEXT, NULL::JSONB;
    RETURN;
  END IF;

  -- Persist each answer, routed by answer_type. Branch-restricted questions
  -- (nps_branch IS NOT NULL) only accept the answer if the eval's NPS tier matches.
  FOR v_qid IN SELECT jsonb_object_keys(p_answers) LOOP
    SELECT * INTO v_reg
      FROM iaml_evaluations.question_registry
     WHERE question_id = v_qid AND is_active = TRUE;
    IF NOT FOUND THEN CONTINUE; END IF;
    IF v_reg.phase <> p_phase THEN CONTINUE; END IF;
    IF v_reg.framework = 'program_specific' AND v_reg.program_code IS DISTINCT FROM v_eval.program_code THEN
      CONTINUE;
    END IF;
    IF v_reg.nps_branch IS NOT NULL THEN
      IF v_reg.nps_branch <> (
        CASE
          WHEN v_eval.nps_score IS NULL THEN NULL
          WHEN v_eval.nps_score >= 9 THEN 'promoter'
          WHEN v_eval.nps_score >= 7 THEN 'passive'
          ELSE 'detractor'
        END
      ) THEN
        CONTINUE;
      END IF;
    END IF;

    v_raw := p_answers -> v_qid;
    IF v_raw IS NULL OR v_raw = 'null'::jsonb THEN CONTINUE; END IF;

    DELETE FROM iaml_evaluations.evaluation_responses
     WHERE evaluation_id = v_eval.id AND question_id = v_qid;

    IF v_reg.answer_type = 'integer' THEN
      BEGIN v_int := (v_raw #>> '{}')::INTEGER;
      EXCEPTION WHEN OTHERS THEN v_int := NULL; END;
      IF v_int IS NOT NULL THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_integer)
        VALUES (v_eval.id, v_qid, v_int);
      END IF;

    ELSIF v_reg.answer_type = 'enum' THEN
      v_txt := v_raw #>> '{}';
      IF v_txt IS NOT NULL AND v_txt <> '' THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_enum)
        VALUES (v_eval.id, v_qid, v_txt);
      END IF;

    ELSIF v_reg.answer_type = 'open_text' THEN
      v_txt := v_raw #>> '{}';
      IF v_txt IS NOT NULL AND TRIM(v_txt) <> '' THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_text)
        VALUES (v_eval.id, v_qid, TRIM(v_txt));
      END IF;

    ELSE
      INSERT INTO iaml_evaluations.evaluation_responses
        (evaluation_id, question_id, answer_json)
      VALUES (v_eval.id, v_qid, v_raw);
    END IF;
  END LOOP;

  -- Required-field check (honoring conditional_on AND nps_branch).
  SELECT COALESCE(array_agg(q.question_id), ARRAY[]::TEXT[]) INTO v_missing
    FROM iaml_evaluations.question_registry q
   WHERE q.phase = p_phase
     AND q.is_active = TRUE
     AND q.is_required = TRUE
     AND (q.framework = 'shared' OR q.program_code = v_eval.program_code)
     AND (q.nps_branch IS NULL OR q.nps_branch = (
       CASE
         WHEN v_eval.nps_score IS NULL THEN NULL
         WHEN v_eval.nps_score >= 9 THEN 'promoter'
         WHEN v_eval.nps_score >= 7 THEN 'passive'
         ELSE 'detractor'
       END
     ))
     AND public.eval_conditional_applies(q.conditional_on, v_eval.id)
     AND NOT EXISTS (
       SELECT 1 FROM iaml_evaluations.evaluation_responses r
        WHERE r.evaluation_id = v_eval.id AND r.question_id = q.question_id
     );
  IF array_length(v_missing, 1) > 0 THEN
    RAISE EXCEPTION 'missing_required'
      USING DETAIL = jsonb_build_object('missing', v_missing)::TEXT;
  END IF;

  -- Mirror Phase-1 router fields.
  IF p_phase = 1 THEN
    BEGIN v_nps_in := (p_answers -> 'q1' #>> '{}')::INTEGER;
    EXCEPTION WHEN OTHERS THEN v_nps_in := NULL; END;
    v_attend_in := p_answers -> 'q2' #>> '{}';
  END IF;

  IF v_eval.status = 'pending' THEN v_first_submit := NOW(); ELSE v_first_submit := v_eval.first_submitted_at; END IF;
  IF p_phase >= v_total_phases THEN v_completed_at := NOW(); ELSE v_completed_at := NULL; END IF;

  UPDATE iaml_evaluations.program_evaluations
     SET current_phase      = LEAST(p_phase + 1, v_total_phases + 1),
         status             = CASE WHEN p_phase >= v_total_phases THEN 'complete' ELSE 'in_progress' END,
         first_submitted_at = v_first_submit,
         completed_at       = v_completed_at,
         nps_score          = CASE WHEN p_phase = 1 AND v_nps_in BETWEEN 0 AND 10 THEN v_nps_in ELSE nps_score END,
         likely_to_return   = CASE
                                WHEN p_phase = 1 AND v_attend_in IN ('Very likely','Likely','Unsure','Unlikely')
                                  THEN v_attend_in
                                ELSE likely_to_return
                              END
   WHERE id = v_eval.id
   RETURNING * INTO v_eval;

  -- Recompute derived tagging columns from stored answers.
  PERFORM public.eval_recompute_tags(v_eval.id);

  RETURN QUERY SELECT TRUE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                      NULL::TEXT, NULL::JSONB;
END;
$$;
