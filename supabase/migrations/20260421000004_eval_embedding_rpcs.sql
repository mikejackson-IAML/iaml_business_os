-- Phase 2 — embedding pipeline RPCs.
-- Open-ended answers (Q5, Q8, Q9, Q10, Q12) need VECTOR(1536) embeddings so
-- Phoebe can do semantic retrieval ("find every mention of Cemex..."). The
-- Vercel submit handler calls these two RPCs after a successful phase submit.
-- Date: 2026-04-21

-- ============================================
-- public.eval_pending_embeddings
-- Return any answer_text rows on this eval whose question has embeds_to_vector=true
-- and whose embedding is still NULL.
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_pending_embeddings(p_token UUID)
RETURNS TABLE (
  response_id  UUID,
  question_id  TEXT,
  answer_text  TEXT
)
LANGUAGE sql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
STABLE
AS $$
  SELECT r.id, r.question_id, r.answer_text
    FROM iaml_evaluations.evaluation_responses r
    JOIN iaml_evaluations.program_evaluations e ON e.id = r.evaluation_id
    JOIN iaml_evaluations.question_registry  q ON q.question_id = r.question_id
   WHERE e.resume_token = p_token
     AND q.embeds_to_vector = TRUE
     AND r.answer_text IS NOT NULL
     AND TRIM(r.answer_text) <> ''
     AND r.embedding IS NULL
   ORDER BY r.id;
$$;

COMMENT ON FUNCTION public.eval_pending_embeddings IS
  'Rows on this eval that still need a vector embedding. Called by /api/eval-phase-submit after DB write.';

GRANT EXECUTE ON FUNCTION public.eval_pending_embeddings(UUID) TO service_role;

-- ============================================
-- public.eval_apply_embeddings
-- Bulk-write embeddings for a set of response rows on a single eval.
-- p_embeddings is a JSON object: {"<response_uuid>": [float, float, ...], ...}
-- Only rows that belong to the eval and whose question is embeds_to_vector=true
-- are updated — defensive against someone passing arbitrary response_ids.
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_apply_embeddings(
  p_token      UUID,
  p_embeddings JSONB
)
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_eval_id UUID;
  v_key     TEXT;
  v_vec     JSONB;
  v_floats  FLOAT8[];
  v_count   INTEGER := 0;
BEGIN
  IF p_embeddings IS NULL OR jsonb_typeof(p_embeddings) <> 'object' THEN
    RETURN 0;
  END IF;

  SELECT id INTO v_eval_id
    FROM iaml_evaluations.program_evaluations
   WHERE resume_token = p_token;
  IF NOT FOUND THEN RETURN 0; END IF;

  FOR v_key, v_vec IN SELECT * FROM jsonb_each(p_embeddings) LOOP
    IF jsonb_typeof(v_vec) <> 'array' THEN CONTINUE; END IF;

    SELECT array_agg((x.value #>> '{}')::FLOAT8)
      INTO v_floats
      FROM jsonb_array_elements(v_vec) x;

    IF v_floats IS NULL OR array_length(v_floats, 1) <> 1536 THEN
      CONTINUE;
    END IF;

    UPDATE iaml_evaluations.evaluation_responses r
       SET embedding = v_floats::VECTOR(1536)
      FROM iaml_evaluations.question_registry q
     WHERE r.id = v_key::UUID
       AND r.evaluation_id = v_eval_id
       AND q.question_id = r.question_id
       AND q.embeds_to_vector = TRUE;

    IF FOUND THEN v_count := v_count + 1; END IF;
  END LOOP;

  RETURN v_count;
END;
$$;

COMMENT ON FUNCTION public.eval_apply_embeddings IS
  'Bulk-writes embeddings for response rows on a single eval. Called by /api/eval-phase-submit.';

GRANT EXECUTE ON FUNCTION public.eval_apply_embeddings(UUID, JSONB) TO service_role;
