-- Phase 2 updates to the eval RPCs:
--   1. eval_get_by_token: matrix questions filter their rows by the instance
--      format (in-person/virtual/on-demand) so Q7 shows the right row.
--   2. eval_submit_phase: required-field check honors conditional_on predicates
--      so Q5 only becomes required when Q4 answer triggers it.
-- Date: 2026-04-21

-- ============================================
-- public.eval_get_by_token — format-aware matrix filtering
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
  v_eval    iaml_evaluations.program_evaluations%ROWTYPE;
  v_prog    TEXT;
  v_inst    TEXT;
  v_format  TEXT;
BEGIN
  SELECT * INTO v_eval
    FROM iaml_evaluations.program_evaluations
   WHERE resume_token = p_token;
  IF NOT FOUND THEN RETURN; END IF;

  SELECT pi.program_name, pi.instance_name, LOWER(COALESCE(pi.format, ''))
    INTO v_prog, v_inst, v_format
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
          'options',        CASE
                              WHEN q.answer_type = 'matrix'
                                THEN public.eval_filter_matrix_options(q.options, v_format)
                              ELSE q.options
                            END,
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

-- Helper: strip matrix rows whose applies_to_formats doesn't include the
-- instance format. Rows without applies_to_formats always apply.
CREATE OR REPLACE FUNCTION public.eval_filter_matrix_options(
  p_options JSONB,
  p_format  TEXT
)
RETURNS JSONB
LANGUAGE plpgsql
IMMUTABLE
AS $$
DECLARE
  v_rows   JSONB;
  v_row    JSONB;
  v_filt   JSONB := '[]'::jsonb;
  v_fmts   JSONB;
  v_keep   BOOLEAN;
BEGIN
  v_rows := p_options -> 'rows';
  IF v_rows IS NULL OR jsonb_typeof(v_rows) <> 'array' THEN
    RETURN p_options;
  END IF;

  FOR v_row IN SELECT value FROM jsonb_array_elements(v_rows) LOOP
    v_fmts := v_row -> 'applies_to_formats';
    IF v_fmts IS NULL OR jsonb_typeof(v_fmts) <> 'array' THEN
      v_keep := TRUE;
    ELSE
      v_keep := (
        SELECT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_fmts) x
           WHERE LOWER(x.value) = p_format
        )
      );
    END IF;
    IF v_keep THEN
      v_filt := v_filt || jsonb_build_array(v_row - 'applies_to_formats');
    END IF;
  END LOOP;

  RETURN jsonb_set(p_options, '{rows}', v_filt);
END;
$$;

GRANT EXECUTE ON FUNCTION public.eval_filter_matrix_options(JSONB, TEXT) TO service_role;

-- ============================================
-- public.eval_submit_phase — conditional_on in required-check
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

  -- Persist each answer, routed into the right column by answer_type.
  FOR v_qid IN SELECT jsonb_object_keys(p_answers) LOOP
    SELECT * INTO v_reg
      FROM iaml_evaluations.question_registry
     WHERE question_id = v_qid AND is_active = TRUE;
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
      -- multi_enum / matrix / repeatable_block / consent_multi → JSON blob
      INSERT INTO iaml_evaluations.evaluation_responses
        (evaluation_id, question_id, answer_json)
      VALUES (v_eval.id, v_qid, v_raw);
    END IF;
  END LOOP;

  -- Required-field check. For each required question in this phase, skip it if
  -- its conditional_on predicate evaluates to false against the stored answers.
  SELECT COALESCE(array_agg(q.question_id), ARRAY[]::TEXT[]) INTO v_missing
    FROM iaml_evaluations.question_registry q
   WHERE q.phase = p_phase
     AND q.is_active = TRUE
     AND q.is_required = TRUE
     AND (q.framework = 'shared' OR q.program_code = v_eval.program_code)
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

  RETURN QUERY SELECT TRUE, p_phase, v_eval.current_phase, v_eval.status, v_total_phases,
                      NULL::TEXT, NULL::JSONB;
END;
$$;

-- Helper: evaluate a conditional_on predicate against the eval's stored answers.
-- Supports operators: eq, in, not_in, is_set. Null predicate → always true.
CREATE OR REPLACE FUNCTION public.eval_conditional_applies(
  p_cond   JSONB,
  p_eval_id UUID
)
RETURNS BOOLEAN
LANGUAGE plpgsql
STABLE
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_qid   TEXT;
  v_op    TEXT;
  v_val   JSONB;
  v_ans   iaml_evaluations.evaluation_responses%ROWTYPE;
  v_str   TEXT;
BEGIN
  IF p_cond IS NULL OR jsonb_typeof(p_cond) <> 'object' THEN
    RETURN TRUE;
  END IF;

  v_qid := p_cond ->> 'question_id';
  v_op  := COALESCE(p_cond ->> 'operator', 'eq');
  v_val := p_cond -> 'value';

  SELECT * INTO v_ans
    FROM iaml_evaluations.evaluation_responses
   WHERE evaluation_id = p_eval_id AND question_id = v_qid;

  IF NOT FOUND THEN
    RETURN (v_op = 'is_not_set');
  END IF;

  -- Normalize the referenced answer to text for comparison.
  v_str := COALESCE(
    v_ans.answer_enum,
    v_ans.answer_text,
    CASE WHEN v_ans.answer_integer IS NOT NULL THEN v_ans.answer_integer::TEXT END,
    CASE WHEN v_ans.answer_json IS NOT NULL THEN v_ans.answer_json #>> '{}' END
  );

  IF v_op = 'is_set' THEN RETURN TRUE; END IF;
  IF v_op = 'is_not_set' THEN RETURN FALSE; END IF;

  IF v_op = 'eq' THEN
    RETURN v_str IS NOT NULL AND v_str = (v_val #>> '{}');
  END IF;

  IF v_op = 'in' OR v_op = 'not_in' THEN
    DECLARE
      v_hit BOOLEAN := FALSE;
    BEGIN
      IF jsonb_typeof(v_val) = 'array' THEN
        SELECT EXISTS (
          SELECT 1 FROM jsonb_array_elements_text(v_val) x WHERE x.value = v_str
        ) INTO v_hit;
      END IF;
      RETURN (v_op = 'in') = v_hit;
    END;
  END IF;

  -- Unknown operator → fail-safe: treat as always required.
  RETURN TRUE;
END;
$$;

GRANT EXECUTE ON FUNCTION public.eval_conditional_applies(JSONB, UUID) TO service_role;
