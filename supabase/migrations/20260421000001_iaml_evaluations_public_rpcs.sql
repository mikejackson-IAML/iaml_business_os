-- IAML Evaluations — public-schema RPC wrappers.
-- The tables stay in iaml_evaluations for isolation + RLS. These SECURITY DEFINER
-- functions are the ONLY way the Vercel serverless functions interact with the
-- data, so we don't need to expose the schema to PostgREST.
-- Date: 2026-04-21

-- ============================================
-- public.eval_get_by_token
-- Fetch eval state + current-phase questions + existing answers in one round-trip.
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_get_by_token(p_token UUID)
RETURNS TABLE (
  evaluation_id      UUID,
  status             TEXT,
  current_phase      INTEGER,
  program_code       TEXT,
  block_code         TEXT,
  program_name       TEXT,
  instance_name      TEXT,
  questions          JSONB,
  existing_answers   JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_eval  iaml_evaluations.program_evaluations%ROWTYPE;
  v_prog  TEXT;
  v_inst  TEXT;
BEGIN
  SELECT * INTO v_eval
    FROM iaml_evaluations.program_evaluations
   WHERE resume_token = p_token;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT pi.program_name, pi.instance_name
    INTO v_prog, v_inst
    FROM public.program_instances pi
   WHERE pi.id = v_eval.program_instance_id;

  RETURN QUERY
  SELECT
    v_eval.id,
    v_eval.status,
    v_eval.current_phase,
    v_eval.program_code,
    v_eval.block_code,
    v_prog,
    v_inst,
    COALESCE((
      SELECT jsonb_agg(
        jsonb_build_object(
          'question_id',    q.question_id,
          'prompt',         REPLACE(q.prompt, '{{program_name}}', COALESCE(v_prog, 'the')),
          'helper_text',    q.helper_text,
          'answer_type',    q.answer_type,
          'options',        q.options,
          'conditional_on', q.conditional_on,
          'is_required',    q.is_required,
          'display_order',  q.display_order
        ) ORDER BY q.display_order
      )
      FROM iaml_evaluations.question_registry q
      WHERE q.is_active
        AND q.phase = v_eval.current_phase
        AND (q.framework = 'shared' OR q.program_code = v_eval.program_code)
        AND (q.nps_branch IS NULL OR q.nps_branch = (
          CASE
            WHEN v_eval.nps_score IS NULL THEN NULL
            WHEN v_eval.nps_score >= 9 THEN 'promoter'
            WHEN v_eval.nps_score >= 7 THEN 'passive'
            ELSE 'detractor'
          END
        ))
    ), '[]'::jsonb),
    COALESCE((
      SELECT jsonb_object_agg(r.question_id, jsonb_build_object(
        'integer', r.answer_integer,
        'enum',    r.answer_enum,
        'text',    r.answer_text,
        'json',    r.answer_json
      ))
      FROM iaml_evaluations.evaluation_responses r
      WHERE r.evaluation_id = v_eval.id
    ), '{}'::jsonb);
END;
$$;

COMMENT ON FUNCTION public.eval_get_by_token IS
  'Public RPC called by /api/eval-load. Returns eval state + current-phase questions + existing answers.';

-- ============================================
-- public.eval_submit_phase
-- Validate the submission, persist answers, mirror router fields, advance phase.
-- All-or-nothing via PL/pgSQL transaction.
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
  v_rows_touched  INTEGER := 0;
  v_missing       TEXT[] := ARRAY[]::TEXT[];
  v_nps_in        INTEGER;
  v_attend_in     TEXT;
  v_completed_at  TIMESTAMPTZ;
  v_first_submit  TIMESTAMPTZ;
BEGIN
  -- 1. Find eval
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

  -- 2. Write each answer, routing into the right column per registry.answer_type.
  --    Unknown or wrong-phase question_ids are ignored.
  FOR v_qid IN SELECT jsonb_object_keys(p_answers) LOOP
    SELECT * INTO v_reg
      FROM iaml_evaluations.question_registry
     WHERE question_id = v_qid
       AND is_active = TRUE;
    IF NOT FOUND THEN CONTINUE; END IF;
    IF v_reg.phase <> p_phase THEN CONTINUE; END IF;
    IF v_reg.framework = 'program_specific' AND v_reg.program_code IS DISTINCT FROM v_eval.program_code THEN
      CONTINUE;
    END IF;

    v_raw := p_answers -> v_qid;
    IF v_raw IS NULL OR v_raw = 'null'::jsonb THEN CONTINUE; END IF;

    DELETE FROM iaml_evaluations.evaluation_responses
     WHERE evaluation_id = v_eval.id AND question_id = v_qid;

    IF v_reg.answer_type = 'integer' THEN
      BEGIN
        v_int := (v_raw #>> '{}')::INTEGER;
      EXCEPTION WHEN OTHERS THEN v_int := NULL;
      END;
      IF v_int IS NOT NULL THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_integer)
        VALUES (v_eval.id, v_qid, v_int);
        v_rows_touched := v_rows_touched + 1;
      END IF;

    ELSIF v_reg.answer_type = 'enum' THEN
      v_txt := v_raw #>> '{}';
      IF v_txt IS NOT NULL AND v_txt <> '' THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_enum)
        VALUES (v_eval.id, v_qid, v_txt);
        v_rows_touched := v_rows_touched + 1;
      END IF;

    ELSIF v_reg.answer_type = 'open_text' THEN
      v_txt := v_raw #>> '{}';
      IF v_txt IS NOT NULL AND TRIM(v_txt) <> '' THEN
        INSERT INTO iaml_evaluations.evaluation_responses
          (evaluation_id, question_id, answer_text)
        VALUES (v_eval.id, v_qid, TRIM(v_txt));
        v_rows_touched := v_rows_touched + 1;
      END IF;

    ELSE
      -- multi_enum / matrix / repeatable_block / consent_multi all land as JSON blobs.
      INSERT INTO iaml_evaluations.evaluation_responses
        (evaluation_id, question_id, answer_json)
      VALUES (v_eval.id, v_qid, v_raw);
      v_rows_touched := v_rows_touched + 1;
    END IF;
  END LOOP;

  -- 3. Required-field check for this phase
  SELECT COALESCE(array_agg(q.question_id), ARRAY[]::TEXT[]) INTO v_missing
    FROM iaml_evaluations.question_registry q
   WHERE q.phase = p_phase
     AND q.is_active = TRUE
     AND q.is_required = TRUE
     AND (q.framework = 'shared' OR q.program_code = v_eval.program_code)
     AND NOT EXISTS (
       SELECT 1 FROM iaml_evaluations.evaluation_responses r
        WHERE r.evaluation_id = v_eval.id
          AND r.question_id = q.question_id
     );
  IF array_length(v_missing, 1) > 0 THEN
    -- roll back inserts by raising; caller gets a clean 400
    RAISE EXCEPTION 'missing_required'
      USING DETAIL = jsonb_build_object('missing', v_missing)::TEXT;
  END IF;

  -- 4. Mirror Phase-1 router fields onto the eval row.
  IF p_phase = 1 THEN
    BEGIN
      v_nps_in := (p_answers -> 'q1' #>> '{}')::INTEGER;
    EXCEPTION WHEN OTHERS THEN v_nps_in := NULL;
    END;
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

  RETURN QUERY SELECT TRUE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                      NULL::TEXT, NULL::JSONB;
END;
$$;

COMMENT ON FUNCTION public.eval_submit_phase IS
  'Public RPC called by /api/eval-phase-submit. Writes answers, mirrors router fields, advances phase.';

-- ============================================
-- GRANTS — both RPCs callable by the service role (via Vercel).
-- ============================================
GRANT EXECUTE ON FUNCTION public.eval_get_by_token(UUID) TO service_role;
GRANT EXECUTE ON FUNCTION public.eval_submit_phase(UUID, INTEGER, JSONB) TO service_role;
