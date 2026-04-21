-- Mint a test evaluation token so we can hit /evaluation.html?token=<uuid>
-- Run in the Supabase SQL editor (or via `supabase db execute`) after the
-- 20260421000000_create_iaml_evaluations_schema.sql migration has been applied.
--
-- Two paths are provided: pick the one that fits.

-- ============================================================================
-- PATH A — Auto-pick: most recent confirmed CLR Block-1 registration
-- ============================================================================
-- Looks for a program_instance whose program_name contains "Comprehensive Labor
-- Relations" and finds any confirmed registration linked to it. Creates a
-- program_evaluations row (or reuses an existing one) and returns the token +
-- the URL you can paste into a browser.

WITH target_instance AS (
  -- Most recent CLR cohort that actually has confirmed registrations
  -- (skips future-dated instances with no one enrolled yet).
  SELECT pi.id, pi.program_name, pi.instance_name, pi.start_date
    FROM public.program_instances pi
    JOIN public.registrations r ON r.program_instance_id = pi.id
   WHERE pi.program_name ILIKE '%comprehensive labor relations%'
     AND r.registration_status IN ('Confirmed', 'Pending')
   GROUP BY pi.id, pi.program_name, pi.instance_name, pi.start_date
   ORDER BY pi.start_date DESC NULLS LAST
   LIMIT 1
),
target_registration AS (
  SELECT r.id, r.email, r.first_name, r.last_name, r.program_instance_id
    FROM public.registrations r
    JOIN target_instance ti ON ti.id = r.program_instance_id
   WHERE r.registration_status IN ('Confirmed', 'Pending')
   ORDER BY r.registration_date ASC NULLS LAST
   LIMIT 1
),
target_contact AS (
  SELECT c.id AS contact_id, tr.id AS registration_id, tr.program_instance_id
    FROM target_registration tr
    LEFT JOIN public.contacts c ON LOWER(c.email) = LOWER(tr.email)
),
upserted_eval AS (
  INSERT INTO iaml_evaluations.program_evaluations
    (contact_id, registration_id, program_instance_id, program_code, block_code)
  SELECT contact_id, registration_id, program_instance_id, 'clr', 'block1'
    FROM target_contact
  ON CONFLICT DO NOTHING
  RETURNING id, resume_token, registration_id
)
SELECT
  e.id                                    AS evaluation_id,
  e.resume_token                          AS token,
  ti.program_name,
  ti.instance_name,
  tr.first_name || ' ' || tr.last_name    AS participant_name,
  tr.email                                AS participant_email,
  'https://iaml.com/evaluation.html?token=' || e.resume_token::text AS url_production,
  'http://localhost:3000/evaluation.html?token=' || e.resume_token::text AS url_local
FROM upserted_eval e
JOIN target_registration tr ON tr.id = e.registration_id
JOIN target_instance    ti ON ti.id = tr.program_instance_id;

-- ============================================================================
-- PATH B — Manual: mint against a specific registration_id you already know
-- ============================================================================
-- Replace the UUID below and run this block instead.

-- WITH manual AS (
--   INSERT INTO iaml_evaluations.program_evaluations
--     (contact_id, registration_id, program_instance_id, program_code, block_code)
--   SELECT
--     (SELECT c.id FROM public.contacts c
--        JOIN public.registrations r ON LOWER(c.email) = LOWER(r.email)
--       WHERE r.id = '00000000-0000-0000-0000-000000000000'::uuid),
--     r.id,
--     r.program_instance_id,
--     'clr',
--     'block1'
--   FROM public.registrations r
--   WHERE r.id = '00000000-0000-0000-0000-000000000000'::uuid
--   RETURNING id, resume_token
-- )
-- SELECT
--   id AS evaluation_id,
--   resume_token AS token,
--   'https://iaml.com/evaluation.html?token=' || resume_token::text AS url
-- FROM manual;
