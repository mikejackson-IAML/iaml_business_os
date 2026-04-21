-- IAML Post-Program Evaluations Schema
-- Framework: shared questions reused across Blocks 1/2/3, program-specific swapped in by program_code.
-- Storage model: rows per (evaluation, question) in evaluation_responses so that matrix rows,
-- open-ended answers (with embeddings later), and aggregations are all queryable via plain SQL.
-- Date: 2026-04-21

CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE SCHEMA IF NOT EXISTS iaml_evaluations;

-- ============================================
-- QUESTION_REGISTRY
-- Catalog of every question across all programs. Seeded, not user-editable at runtime
-- except for config-driven option lists (e.g. Q15 NLRB developments).
-- ============================================
CREATE TABLE iaml_evaluations.question_registry (
  question_id       TEXT PRIMARY KEY,
  framework         TEXT NOT NULL CHECK (framework IN ('shared', 'program_specific')),
  program_code      TEXT,
  phase             INTEGER NOT NULL CHECK (phase BETWEEN 1 AND 5),
  display_order     INTEGER NOT NULL,
  prompt            TEXT NOT NULL,
  helper_text       TEXT,
  answer_type       TEXT NOT NULL CHECK (answer_type IN (
    'integer', 'enum', 'multi_enum', 'matrix', 'open_text', 'repeatable_block', 'consent_multi'
  )),
  options           JSONB NOT NULL DEFAULT '{}'::jsonb,
  conditional_on    JSONB,
  is_required       BOOLEAN NOT NULL DEFAULT TRUE,
  embeds_to_vector  BOOLEAN NOT NULL DEFAULT FALSE,
  nps_branch        TEXT CHECK (nps_branch IN ('promoter', 'passive', 'detractor')),
  is_active         BOOLEAN NOT NULL DEFAULT TRUE,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at        TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  CONSTRAINT program_specific_needs_program_code CHECK (
    (framework = 'shared' AND program_code IS NULL) OR
    (framework = 'program_specific' AND program_code IS NOT NULL)
  )
);

CREATE INDEX question_registry_phase_idx
  ON iaml_evaluations.question_registry (phase, display_order);
CREATE INDEX question_registry_program_idx
  ON iaml_evaluations.question_registry (program_code) WHERE program_code IS NOT NULL;

COMMENT ON TABLE iaml_evaluations.question_registry IS
  'Shared + program-specific question catalog. Block 2/3 launch by inserting rows with new program_code.';
COMMENT ON COLUMN iaml_evaluations.question_registry.nps_branch IS
  'Phase-5 branch restriction: promoter/passive/detractor only see questions matching their NPS tier.';

-- ============================================
-- PROGRAM_EVALUATIONS
-- One row per (participant, program_instance, block). Denormalizes the structured
-- router fields (NPS, attend-again) onto the row for fast aggregation + trigger routing.
-- ============================================
CREATE TABLE iaml_evaluations.program_evaluations (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  contact_id            UUID REFERENCES public.contacts(id) ON DELETE SET NULL,
  registration_id       UUID REFERENCES public.registrations(id) ON DELETE SET NULL,
  program_instance_id   UUID REFERENCES public.program_instances(id) ON DELETE SET NULL,

  program_code          TEXT NOT NULL,
  block_code            TEXT,

  resume_token          UUID NOT NULL UNIQUE DEFAULT gen_random_uuid(),

  status                TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'in_progress', 'complete', 'abandoned')),
  current_phase         INTEGER NOT NULL DEFAULT 1 CHECK (current_phase BETWEEN 1 AND 6),

  -- Denormalized Phase-1 router fields
  nps_score             INTEGER CHECK (nps_score BETWEEN 0 AND 10),
  nps_tier              TEXT GENERATED ALWAYS AS (
    CASE
      WHEN nps_score IS NULL THEN NULL
      WHEN nps_score >= 9 THEN 'promoter'
      WHEN nps_score >= 7 THEN 'passive'
      ELSE 'detractor'
    END
  ) STORED,
  likely_to_return      TEXT CHECK (likely_to_return IN ('Very likely', 'Likely', 'Unsure', 'Unlikely')),

  -- Request metadata
  ip_address            INET,
  user_agent            TEXT,

  created_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  first_submitted_at    TIMESTAMPTZ,
  completed_at          TIMESTAMPTZ
);

CREATE INDEX program_evaluations_contact_idx
  ON iaml_evaluations.program_evaluations (contact_id);
CREATE INDEX program_evaluations_registration_idx
  ON iaml_evaluations.program_evaluations (registration_id);
CREATE INDEX program_evaluations_instance_idx
  ON iaml_evaluations.program_evaluations (program_instance_id);
CREATE INDEX program_evaluations_status_idx
  ON iaml_evaluations.program_evaluations (status);
CREATE INDEX program_evaluations_nps_tier_idx
  ON iaml_evaluations.program_evaluations (nps_tier) WHERE nps_tier IS NOT NULL;

COMMENT ON TABLE iaml_evaluations.program_evaluations IS
  'One evaluation session per participant/program_instance/block. resume_token drives URL access.';
COMMENT ON COLUMN iaml_evaluations.program_evaluations.current_phase IS
  '1–5 are eval phases; 6 = confirmation screen (post-submit).';

-- ============================================
-- EVALUATION_RESPONSES
-- One row per (evaluation, question). Stores answer in the column matching the
-- question's answer_type; open-ended answers carry an embedding (filled later).
-- ============================================
CREATE TABLE iaml_evaluations.evaluation_responses (
  id               UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  evaluation_id    UUID NOT NULL REFERENCES iaml_evaluations.program_evaluations(id) ON DELETE CASCADE,
  question_id      TEXT NOT NULL REFERENCES iaml_evaluations.question_registry(question_id),

  answer_integer   INTEGER,
  answer_enum      TEXT,
  answer_text      TEXT,
  answer_json      JSONB,

  embedding        VECTOR(1536),

  created_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at       TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (evaluation_id, question_id)
);

CREATE INDEX evaluation_responses_eval_idx
  ON iaml_evaluations.evaluation_responses (evaluation_id);
CREATE INDEX evaluation_responses_question_idx
  ON iaml_evaluations.evaluation_responses (question_id);
CREATE INDEX evaluation_responses_embedding_idx
  ON iaml_evaluations.evaluation_responses
  USING hnsw (embedding vector_cosine_ops)
  WHERE embedding IS NOT NULL;

COMMENT ON TABLE iaml_evaluations.evaluation_responses IS
  'Per-question answers. answer_* columns selected by registry.answer_type. Embeddings populate in Phase 2+.';

-- ============================================
-- TRIGGERS — updated_at maintenance
-- ============================================
CREATE OR REPLACE FUNCTION iaml_evaluations.touch_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER program_evaluations_touch
  BEFORE UPDATE ON iaml_evaluations.program_evaluations
  FOR EACH ROW EXECUTE FUNCTION iaml_evaluations.touch_updated_at();

CREATE TRIGGER evaluation_responses_touch
  BEFORE UPDATE ON iaml_evaluations.evaluation_responses
  FOR EACH ROW EXECUTE FUNCTION iaml_evaluations.touch_updated_at();

CREATE TRIGGER question_registry_touch
  BEFORE UPDATE ON iaml_evaluations.question_registry
  FOR EACH ROW EXECUTE FUNCTION iaml_evaluations.touch_updated_at();

-- ============================================
-- RLS — lock everything down; service role (API) is the only path in
-- ============================================
ALTER TABLE iaml_evaluations.question_registry     ENABLE ROW LEVEL SECURITY;
ALTER TABLE iaml_evaluations.program_evaluations    ENABLE ROW LEVEL SECURITY;
ALTER TABLE iaml_evaluations.evaluation_responses   ENABLE ROW LEVEL SECURITY;

-- No anon/authenticated policies = no access from browser Supabase clients.
-- Service role bypasses RLS, so the Vercel serverless functions continue to work.

-- ============================================
-- SEED — Phase 1 questions (shared framework, reused across Blocks 1/2/3)
-- Q1 prompt uses {{program_name}} placeholder that the API resolves per-eval
-- against the linked program_instance so Block 2/3 reuse verbatim.
-- ============================================
INSERT INTO iaml_evaluations.question_registry
  (question_id, framework, program_code, phase, display_order, prompt, answer_type, options, is_required, embeds_to_vector)
VALUES
  (
    'q1',
    'shared',
    NULL,
    1,
    1,
    'On a scale of 0–10, how likely are you to recommend IAML''s {{program_name}} program to a colleague?',
    'integer',
    '{"min": 0, "max": 10, "scale_labels": {"0": "Not at all likely", "10": "Extremely likely"}}'::jsonb,
    TRUE,
    FALSE
  ),
  (
    'q2',
    'shared',
    NULL,
    1,
    2,
    'How likely are you to attend another IAML program in the next 12 months?',
    'enum',
    '{"choices": ["Very likely", "Likely", "Unsure", "Unlikely"]}'::jsonb,
    TRUE,
    FALSE
  );

-- ============================================
-- CONVENIENCE FUNCTION — fetch an eval by token with the current phase's questions
-- Used by the website API to render a phase in one round-trip.
-- Keeps program_name substitution and question ordering in the DB layer.
-- ============================================
CREATE OR REPLACE FUNCTION iaml_evaluations.get_eval_by_token(p_token UUID)
RETURNS TABLE (
  evaluation_id         UUID,
  status                TEXT,
  current_phase         INTEGER,
  program_code          TEXT,
  block_code            TEXT,
  program_name          TEXT,
  instance_name         TEXT,
  questions             JSONB,
  existing_answers      JSONB
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
DECLARE
  v_eval    iaml_evaluations.program_evaluations%ROWTYPE;
  v_prog    TEXT;
  v_inst    TEXT;
BEGIN
  SELECT * INTO v_eval FROM iaml_evaluations.program_evaluations WHERE resume_token = p_token;
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
          'question_id',   q.question_id,
          'prompt',        REPLACE(q.prompt, '{{program_name}}', COALESCE(v_prog, 'the')),
          'helper_text',   q.helper_text,
          'answer_type',   q.answer_type,
          'options',       q.options,
          'conditional_on',q.conditional_on,
          'is_required',   q.is_required,
          'display_order', q.display_order
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

COMMENT ON FUNCTION iaml_evaluations.get_eval_by_token IS
  'Returns one eval + the current phase''s questions (with program_name substituted) + any existing answers. Used by /api/eval-load.';

-- ============================================
-- GRANTS — only the service role (via Vercel) needs direct access.
-- Browser clients cannot bypass RLS via anon/authenticated.
-- ============================================
GRANT USAGE ON SCHEMA iaml_evaluations TO service_role;
GRANT ALL   ON ALL TABLES    IN SCHEMA iaml_evaluations TO service_role;
GRANT ALL   ON ALL SEQUENCES IN SCHEMA iaml_evaluations TO service_role;
GRANT EXECUTE ON FUNCTION iaml_evaluations.get_eval_by_token(UUID) TO service_role;
