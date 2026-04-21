-- Extend eval_get_ready_to_send to return the program city and the Block 1
-- instructor's first name + full credentials. The email template (Phoebe's voice)
-- uses these fields so every message references the specific cohort's location
-- and instructor rather than being generic.
--
-- Faculty for a program_instance is stored in public.faculty_assignments (free-text
-- faculty_name). First name is extracted via SPLIT_PART on the first space.
-- Date: 2026-04-21

-- Return shape changes (adding city/state/instructor columns), so drop first.
DROP FUNCTION IF EXISTS public.eval_get_ready_to_send(INTEGER);

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
  -- Mint an eval per attended=true block_attendance row whose hosting instance
  -- is past the 4pm-local send threshold. One eval per attendance row.
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

  -- Return queue with program city + instructor details from faculty_assignments.
  -- Only one instructor is expected per Block 1 per instance; if multiple rows
  -- exist, we pick the most recently created one.
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
    AND ba.email IS NOT NULL
    AND ba.email <> ''
    AND public.eval_instance_send_due(pi.id) = TRUE
  ORDER BY pi.end_date DESC, e.created_at
  LIMIT p_limit;
END;
$$;
