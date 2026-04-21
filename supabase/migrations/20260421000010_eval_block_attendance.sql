-- Block attendance — ground truth for "who was in the room" per block session.
-- Registrations live under whichever program_instance a participant PAID FOR
-- (Certificate in ERL, Certificate in EBL, Comprehensive Labor Relations, etc.)
-- but attendees for a given BLOCK may come from multiple program_instances
-- (e.g., everyone doing the full ERL certificate sits in Block 1 CLR, together
-- with people who registered only for Block 1 CLR standalone).
--
-- This table decouples "attendance at a block session" from "registration to a program".
-- Date: 2026-04-21

CREATE TABLE IF NOT EXISTS iaml_evaluations.block_attendance (
  id                  UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- The PRIMARY program_instance that hosts this block session.
  -- For "Block 1 CLR, April 2026, Atlanta" this is the CLR instance.
  program_instance_id UUID NOT NULL REFERENCES public.program_instances(id) ON DELETE CASCADE,
  block_code          TEXT NOT NULL,

  -- Participant identity. email is the canonical join key; contact_id/registration_id
  -- are best-effort links into the core tables. registration_id may point to a
  -- registration in a DIFFERENT program_instance (e.g., Certificate in ERL).
  email               TEXT NOT NULL,
  first_name          TEXT,
  last_name           TEXT,
  company_name        TEXT,
  contact_id          UUID REFERENCES public.contacts(id)      ON DELETE SET NULL,
  registration_id     UUID REFERENCES public.registrations(id) ON DELETE SET NULL,

  attended            BOOLEAN NOT NULL DEFAULT TRUE,
  notes               TEXT,
  source              TEXT NOT NULL DEFAULT 'manual',   -- 'roster_import' / 'manual' / 'ghl_check_in' / etc.

  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (program_instance_id, block_code, email)
);

CREATE INDEX IF NOT EXISTS block_attendance_instance_block_idx
  ON iaml_evaluations.block_attendance (program_instance_id, block_code);
CREATE INDEX IF NOT EXISTS block_attendance_email_idx
  ON iaml_evaluations.block_attendance (LOWER(email));
CREATE INDEX IF NOT EXISTS block_attendance_contact_idx
  ON iaml_evaluations.block_attendance (contact_id) WHERE contact_id IS NOT NULL;

CREATE TRIGGER block_attendance_touch
  BEFORE UPDATE ON iaml_evaluations.block_attendance
  FOR EACH ROW EXECUTE FUNCTION iaml_evaluations.touch_updated_at();

ALTER TABLE iaml_evaluations.block_attendance ENABLE ROW LEVEL SECURITY;
-- service role bypasses RLS; no public/anon policies (same pattern as other eval tables).

COMMENT ON TABLE iaml_evaluations.block_attendance IS
  'Who physically attended each block session. Decoupled from program_instances/registrations so full-program attendees and standalone-block attendees are captured in one list per block.';
COMMENT ON COLUMN iaml_evaluations.block_attendance.program_instance_id IS
  'The canonical program_instance hosting the block — for Block 1 CLR, this is the CLR standalone instance even if some attendees registered through Certificate in ERL.';
COMMENT ON COLUMN iaml_evaluations.block_attendance.registration_id IS
  'Attendee''s registration (optional). May reference a registration in a different program_instance than the block session.';

GRANT SELECT, INSERT, UPDATE, DELETE ON iaml_evaluations.block_attendance TO service_role;

-- ============================================
-- Update eval_get_ready_to_send to use block_attendance as the source of truth.
-- An eval is minted for each attended=true row whose program_instance is past 4pm local
-- on end_date. Skipped attendees (attended=false) never get an eval row.
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
  -- Mint evals for each attended row whose hosting instance is past send-time.
  -- Program_code is hardcoded to 'clr' while Block 1 CLR is the only block shipped;
  -- when Block 2/3 evaluations launch, the program_code lookup moves to a
  -- (block_code → program_code) config.
  INSERT INTO iaml_evaluations.program_evaluations
    (contact_id, registration_id, program_instance_id, program_code, block_code)
  SELECT
    ba.contact_id,
    ba.registration_id,
    ba.program_instance_id,
    'clr',
    ba.block_code
  FROM iaml_evaluations.block_attendance ba
  JOIN public.program_instances pi ON pi.id = ba.program_instance_id
  WHERE ba.attended = TRUE
    AND ba.block_code = 'block1'
    AND pi.program_name ILIKE '%comprehensive labor relations%'
    AND public.eval_instance_send_due(pi.id) = TRUE
    -- Idempotency: don't re-mint if an eval already exists for this registration+block.
    AND NOT EXISTS (
      SELECT 1 FROM iaml_evaluations.program_evaluations e
       WHERE e.registration_id = ba.registration_id
         AND e.program_code   = 'clr'
         AND e.block_code     = ba.block_code
         AND ba.registration_id IS NOT NULL
    )
    -- If no registration_id (rare — walk-in), dedupe on instance + email lookup.
    AND NOT EXISTS (
      SELECT 1 FROM iaml_evaluations.program_evaluations e
      JOIN public.registrations r2 ON r2.id = e.registration_id
       WHERE ba.registration_id IS NULL
         AND e.program_instance_id = ba.program_instance_id
         AND e.block_code = ba.block_code
         AND LOWER(r2.email) = LOWER(ba.email)
    );

  -- Return unsent queue, joining back through block_attendance for the contact details.
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
  JOIN public.program_instances          pi ON pi.id = e.program_instance_id
  JOIN iaml_evaluations.block_attendance ba
       ON ba.program_instance_id = e.program_instance_id
      AND ba.block_code          = e.block_code
      AND (ba.registration_id     = e.registration_id
           OR (ba.registration_id IS NULL AND e.registration_id IS NULL))
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

COMMENT ON FUNCTION public.eval_get_ready_to_send IS
  'Mints evals for each attended=true block_attendance row whose hosting instance is past send-time, then returns unsent queue. Idempotent.';
