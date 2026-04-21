-- Link program_evaluations directly to block_attendance so one attendance row
-- ↔ at most one evaluation row. Closes the idempotency hole for walk-ins
-- whose block_attendance row has no linked registration (Trevor Fandale case).
-- Date: 2026-04-21

ALTER TABLE iaml_evaluations.program_evaluations
  ADD COLUMN IF NOT EXISTS block_attendance_id UUID
    REFERENCES iaml_evaluations.block_attendance(id) ON DELETE SET NULL;

-- One eval per attendance row.
CREATE UNIQUE INDEX IF NOT EXISTS program_evaluations_block_attendance_uniq
  ON iaml_evaluations.program_evaluations (block_attendance_id)
  WHERE block_attendance_id IS NOT NULL;

-- Backfill: link any existing evals to their attendance row by email.
UPDATE iaml_evaluations.program_evaluations e
   SET block_attendance_id = ba.id
  FROM iaml_evaluations.block_attendance ba,
       public.registrations r
 WHERE e.block_attendance_id IS NULL
   AND ba.registration_id IS NOT NULL
   AND ba.program_instance_id = e.program_instance_id
   AND ba.block_code = e.block_code
   AND r.id = e.registration_id
   AND LOWER(r.email) = LOWER(ba.email);

-- ============================================
-- Rewrite eval_get_ready_to_send to dedupe on block_attendance_id.
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
  -- Mint one eval per attended block_attendance row that doesn't already have one.
  INSERT INTO iaml_evaluations.program_evaluations
    (contact_id, registration_id, program_instance_id, program_code, block_code, block_attendance_id)
  SELECT
    ba.contact_id,
    ba.registration_id,
    ba.program_instance_id,
    'clr',
    ba.block_code,
    ba.id
  FROM iaml_evaluations.block_attendance ba
  JOIN public.program_instances pi ON pi.id = ba.program_instance_id
  WHERE ba.attended = TRUE
    AND ba.block_code = 'block1'
    AND pi.program_name ILIKE '%comprehensive labor relations%'
    AND public.eval_instance_send_due(pi.id) = TRUE
  ON CONFLICT (block_attendance_id) WHERE block_attendance_id IS NOT NULL
    DO NOTHING;

  -- Return unsent queue, joining through block_attendance for contact details.
  RETURN QUERY
  SELECT
    e.id,
    e.resume_token,
    ba.email,
    ba.first_name,
    ba.last_name,
    pi.program_name,
    pi.instance_name,
    pi.end_date,
    r.registration_code,
    e.email_send_attempts
  FROM iaml_evaluations.program_evaluations e
  JOIN iaml_evaluations.block_attendance ba ON ba.id = e.block_attendance_id
  JOIN public.program_instances          pi ON pi.id = e.program_instance_id
  LEFT JOIN public.registrations         r  ON r.id = e.registration_id
  WHERE e.email_sent_at IS NULL
    AND e.email_send_attempts < 3
    AND ba.attended = TRUE
    AND ba.email IS NOT NULL
    AND ba.email <> ''
    AND public.eval_instance_send_due(pi.id) = TRUE
  ORDER BY pi.end_date DESC, e.created_at
  LIMIT p_limit;
END;
$$;
