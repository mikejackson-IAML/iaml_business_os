-- Eval email delivery — scheduling + idempotency.
-- n8n runs an hourly cron that calls eval_get_ready_to_send(), which atomically
-- (a) mints program_evaluations rows for every confirmed registration of any
-- program instance whose "4 PM local time on end_date" has passed, and
-- (b) returns only evals whose email hasn't been sent yet. After the HTTP
-- SendGrid call, n8n calls eval_mark_email_sent(eval_id, ok, err) to record
-- the result and take the row out of the queue.
-- Date: 2026-04-21

-- ============================================
-- Columns on program_instances
--   local_timezone: IANA tz name. Default America/New_York (IAML HQ).
--                   Admins can override per-instance via a simple UPDATE.
-- ============================================
ALTER TABLE public.program_instances
  ADD COLUMN IF NOT EXISTS local_timezone TEXT NOT NULL DEFAULT 'America/New_York';

COMMENT ON COLUMN public.program_instances.local_timezone IS
  'IANA timezone for the program. Used to compute "4 PM on end_date local" for eval email scheduling.';

-- ============================================
-- Columns on program_evaluations — email tracking
-- ============================================
ALTER TABLE iaml_evaluations.program_evaluations
  ADD COLUMN IF NOT EXISTS email_sent_at       TIMESTAMPTZ,
  ADD COLUMN IF NOT EXISTS email_send_attempts INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS email_last_error    TEXT;

CREATE INDEX IF NOT EXISTS program_evaluations_email_queue_idx
  ON iaml_evaluations.program_evaluations (email_sent_at)
  WHERE email_sent_at IS NULL;

-- ============================================
-- Uniqueness: one eval per (registration, program, block).
-- NULL registration_id allowed (for walk-ins or manual evals).
-- ============================================
CREATE UNIQUE INDEX IF NOT EXISTS program_evaluations_reg_prog_block_uniq
  ON iaml_evaluations.program_evaluations (registration_id, program_code, block_code)
  WHERE registration_id IS NOT NULL;

-- ============================================
-- Helper: is this program_instance's "4 PM local on end_date" in the past?
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_instance_send_due(p_instance_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
AS $$
  SELECT
    -- Construct the instance's send target in its local timezone, then compare to NOW().
    -- Example: end_date 2026-04-20, tz America/New_York → 2026-04-20 16:00 EDT → 2026-04-20 20:00 UTC
    (pi.end_date::timestamp + INTERVAL '16 hours') AT TIME ZONE pi.local_timezone <= NOW()
  FROM public.program_instances pi
  WHERE pi.id = p_instance_id
    AND pi.end_date IS NOT NULL;
$$;

GRANT EXECUTE ON FUNCTION public.eval_instance_send_due(UUID) TO service_role;

-- ============================================
-- public.eval_get_ready_to_send
-- For every program instance whose "4 PM local time on end_date" has passed:
--   1. Mint program_evaluations for every confirmed registration that doesn't already have one
--      for (program_code, block_code). Currently hardcoded to ('clr', 'block1') — will expand
--      as Block 2/3 and other programs ship.
--   2. Return the set of unsent evals ready for a SendGrid call.
--
-- n8n calls this hourly. Safe to call repeatedly (minting is idempotent via the unique index).
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_get_ready_to_send(p_limit INTEGER DEFAULT 500)
RETURNS TABLE (
  evaluation_id     UUID,
  resume_token      UUID,
  email             TEXT,
  first_name        TEXT,
  last_name         TEXT,
  program_name      TEXT,
  instance_name     TEXT,
  end_date          DATE,
  registration_code TEXT,
  send_attempts     INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
BEGIN
  -- Mint evals for any confirmed CLR Block-1 registration whose instance is past send-time
  -- and doesn't already have an eval row.
  INSERT INTO iaml_evaluations.program_evaluations
    (contact_id, registration_id, program_instance_id, program_code, block_code)
  SELECT
    c.id,
    r.id,
    r.program_instance_id,
    'clr',
    'block1'
  FROM public.registrations r
  JOIN public.program_instances pi ON pi.id = r.program_instance_id
  LEFT JOIN public.contacts c ON LOWER(c.email) = LOWER(r.email)
  WHERE r.registration_status IN ('Confirmed', 'Pending')
    AND pi.program_name ILIKE '%comprehensive labor relations%'
    AND public.eval_instance_send_due(pi.id) = TRUE
  ON CONFLICT (registration_id, program_code, block_code) WHERE registration_id IS NOT NULL
  DO NOTHING;

  -- Return the unsent queue.
  RETURN QUERY
  SELECT
    e.id,
    e.resume_token,
    r.email,
    r.first_name,
    r.last_name,
    pi.program_name,
    pi.instance_name,
    pi.end_date,
    r.registration_code,
    e.email_send_attempts
  FROM iaml_evaluations.program_evaluations e
  JOIN public.registrations       r  ON r.id  = e.registration_id
  JOIN public.program_instances   pi ON pi.id = e.program_instance_id
  WHERE e.email_sent_at IS NULL
    AND e.email_send_attempts < 3    -- give up after 3 failed attempts; log for manual review
    AND r.registration_status IN ('Confirmed', 'Pending')
    AND r.email IS NOT NULL
    AND public.eval_instance_send_due(pi.id) = TRUE
  ORDER BY pi.end_date DESC, e.created_at
  LIMIT p_limit;
END;
$$;

COMMENT ON FUNCTION public.eval_get_ready_to_send IS
  'Hourly n8n cron entry point. Mints evals + returns unsent queue. Idempotent.';

GRANT EXECUTE ON FUNCTION public.eval_get_ready_to_send(INTEGER) TO service_role;

-- ============================================
-- public.eval_mark_email_sent
-- Record the outcome of a SendGrid send attempt.
-- If success: sets email_sent_at (removes from queue), clears error.
-- If failure: increments attempt counter, stores error. Row stays in queue
--             until attempts >= 3 (then it falls out via the LIMIT in the RPC above).
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_mark_email_sent(
  p_evaluation_id UUID,
  p_success       BOOLEAN,
  p_error         TEXT DEFAULT NULL
)
RETURNS VOID
LANGUAGE sql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
  UPDATE iaml_evaluations.program_evaluations
     SET email_sent_at       = CASE WHEN p_success THEN NOW() ELSE email_sent_at END,
         email_send_attempts = email_send_attempts + 1,
         email_last_error    = CASE WHEN p_success THEN NULL ELSE p_error END
   WHERE id = p_evaluation_id;
$$;

COMMENT ON FUNCTION public.eval_mark_email_sent IS
  'Records SendGrid send outcome. Called by n8n after the HTTP request to SendGrid.';

GRANT EXECUTE ON FUNCTION public.eval_mark_email_sent(UUID, BOOLEAN, TEXT) TO service_role;
