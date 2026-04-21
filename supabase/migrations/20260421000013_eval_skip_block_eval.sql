-- Add skip_block_eval opt-out to block_attendance.
--
-- Use case: full-certificate attendees (e.g., Certificate in Employee Relations Law)
-- physically sit in Block 1/2/3 sessions, so they appear in block_attendance rows
-- for each block. But we don't want to email them three separate per-block evaluations
-- over the week — fatigue + they get a single consolidated certificate-experience eval
-- at the end of the program instead.
--
-- Setting skip_block_eval=true on an attendance row excludes it from
-- eval_get_ready_to_send's mint + queue. The attendance record is still preserved
-- for roster/analytics purposes.
--
-- Date: 2026-04-21

ALTER TABLE iaml_evaluations.block_attendance
  ADD COLUMN IF NOT EXISTS skip_block_eval BOOLEAN NOT NULL DEFAULT FALSE;

COMMENT ON COLUMN iaml_evaluations.block_attendance.skip_block_eval IS
  'When true, exclude this attendance row from per-block evaluations. Used for full-certificate attendees who receive one consolidated eval at program end.';

-- ============================================
-- eval_get_ready_to_send — honor skip_block_eval in both mint and queue phases.
-- ============================================
CREATE OR REPLACE FUNCTION public.eval_get_ready_to_send(p_limit INTEGER DEFAULT 500)
RETURNS TABLE (
  evaluation_id           UUID,
  resume_token            UUID,
  email                   TEXT,
  first_name              TEXT,
  last_name               TEXT,
  program_name            TEXT,
  instance_name           TEXT,
  end_date                DATE,
  city                    TEXT,
  state                   TEXT,
  instructor_first_name   TEXT,
  instructor_full_name    TEXT,
  registration_code       TEXT,
  send_attempts           INTEGER
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = iaml_evaluations, public
AS $$
BEGIN
  -- Mint evals for attended rows past send-due, excluding any skip_block_eval=true
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
    AND ba.skip_block_eval = FALSE
    AND ba.block_code = 'block1'
    AND pi.program_name ILIKE '%comprehensive labor relations%'
    AND public.eval_instance_send_due(pi.id) = TRUE
  ON CONFLICT (block_attendance_id) WHERE block_attendance_id IS NOT NULL
    DO NOTHING;

  -- Return queue with program city + instructor details
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
    pi.city,
    pi.state,
    TRIM(SPLIT_PART(fa.faculty_name, ' ', 1)) AS instructor_first_name,
    fa.faculty_name                            AS instructor_full_name,
    r.registration_code,
    e.email_send_attempts
  FROM iaml_evaluations.program_evaluations e
  JOIN iaml_evaluations.block_attendance ba ON ba.id = e.block_attendance_id
  JOIN public.program_instances          pi ON pi.id = e.program_instance_id
  LEFT JOIN LATERAL (
    SELECT fa2.faculty_name
      FROM public.faculty_assignments fa2
     WHERE fa2.program_instance_id = pi.id
       AND fa2.block_number = 1
     ORDER BY fa2.created_at DESC NULLS LAST
     LIMIT 1
  ) fa ON TRUE
  LEFT JOIN public.registrations r ON r.id = e.registration_id
  WHERE e.email_sent_at IS NULL
    AND e.email_send_attempts < 3
    AND ba.attended = TRUE
    AND ba.skip_block_eval = FALSE
    AND ba.email IS NOT NULL
    AND ba.email <> ''
    AND public.eval_instance_send_due(pi.id) = TRUE
  ORDER BY pi.end_date DESC, e.created_at
  LIMIT p_limit;
END;
$$;
