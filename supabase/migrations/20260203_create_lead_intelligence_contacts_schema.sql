-- Lead Intelligence System: Complete Schema
-- Migration: 20260203_create_lead_intelligence_contacts_schema
-- Creates/extends all 11 tables + 1 junction table + 1 view + triggers + indexes
-- Idempotent: handles pre-existing tables (companies, contacts, activity_log)

-- ============================================================
-- 1. COMPANIES (may already exist — create then add missing columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.companies (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Add all columns that may be missing
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS website text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS industry text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS employee_count integer;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS revenue_range text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enrichment_source text;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enrichment_data jsonb;
ALTER TABLE public.companies ADD COLUMN IF NOT EXISTS enriched_at timestamptz;

-- ============================================================
-- 2. CONTACTS (may already exist — create then add missing columns)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_name text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS title text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS department text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS seniority_level text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS company_id uuid REFERENCES public.companies(id);
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS city text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS state text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS country text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS status text DEFAULT 'lead';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS classification text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS lead_source text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS engagement_score integer DEFAULT 0;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS is_vip boolean DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email_status text DEFAULT 'unknown';
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS email_verified_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_activity_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_source text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enrichment_data jsonb;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS enriched_at timestamptz;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS profile_image_url text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_member_id text;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS linkedin_headline text;

-- Add unique constraint on email if not exists
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'contacts_email_key' AND conrelid = 'public.contacts'::regclass
  ) THEN
    ALTER TABLE public.contacts ADD CONSTRAINT contacts_email_key UNIQUE (email);
  END IF;
EXCEPTION WHEN undefined_table THEN NULL;
END $$;

-- ============================================================
-- 3. ATTENDANCE RECORDS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.attendance_records (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  program_name text NOT NULL,
  program_date date,
  rating integer CHECK (rating >= 1 AND rating <= 5),
  feedback text,
  attendance_status text DEFAULT 'attended',
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 4. EMAIL ACTIVITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.email_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  campaign_id text,
  campaign_name text,
  activity_type text NOT NULL,
  activity_data jsonb,
  occurred_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 5. OPPORTUNITIES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  type text,
  stage text,
  company_id uuid REFERENCES public.companies(id),
  contact_id uuid REFERENCES public.contacts(id),
  value numeric,
  expected_close_date date,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 6. OPPORTUNITY CONTACTS (junction table)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunity_contacts (
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  contact_id uuid NOT NULL REFERENCES public.contacts(id),
  role text,
  created_at timestamptz NOT NULL DEFAULT now(),
  PRIMARY KEY (opportunity_id, contact_id)
);

-- ============================================================
-- 7. OPPORTUNITY ATTACHMENTS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.opportunity_attachments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  opportunity_id uuid NOT NULL REFERENCES public.opportunities(id) ON DELETE CASCADE,
  file_name text NOT NULL,
  file_url text NOT NULL,
  file_type text,
  file_size integer,
  uploaded_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 8. CONTACT NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.contact_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,
  note_type text DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 9. COMPANY NOTES
-- ============================================================
CREATE TABLE IF NOT EXISTS public.company_notes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  company_id uuid NOT NULL REFERENCES public.companies(id) ON DELETE CASCADE,
  note_type text DEFAULT 'general',
  content text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 10. ACTIVITY LOG (polymorphic, no FKs — may already exist)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.activity_log (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  entity_type text NOT NULL,
  entity_id uuid NOT NULL,
  action text NOT NULL,
  details jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Ensure columns exist on pre-existing activity_log
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS entity_type text;
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS entity_id uuid;
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS action text;
ALTER TABLE public.activity_log ADD COLUMN IF NOT EXISTS details jsonb;

-- ============================================================
-- 11. FOLLOW-UP TASKS
-- ============================================================
CREATE TABLE IF NOT EXISTS public.follow_up_tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id uuid REFERENCES public.contacts(id),
  company_id uuid REFERENCES public.companies(id),
  opportunity_id uuid REFERENCES public.opportunities(id),
  title text NOT NULL,
  description text,
  due_date date NOT NULL,
  status text DEFAULT 'pending',
  priority text DEFAULT 'medium',
  action_center_task_id uuid,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- ============================================================
-- 12. DATA HEALTH METRICS VIEW
-- ============================================================
CREATE OR REPLACE VIEW public.data_health_metrics AS
SELECT
  count(*)::integer AS total_contacts,
  count(*) FILTER (WHERE email_status = 'valid')::integer AS valid_emails,
  count(*) FILTER (WHERE email_status = 'invalid')::integer AS invalid_emails,
  count(*) FILTER (WHERE email_status = 'unknown' OR email_status IS NULL)::integer AS unknown_emails,
  CASE WHEN count(*) > 0
    THEN round((count(*) FILTER (WHERE email_status = 'valid')::numeric / count(*)::numeric) * 100, 1)
    ELSE 0
  END AS email_health_pct,
  count(*) FILTER (WHERE enriched_at IS NOT NULL)::integer AS enriched_contacts,
  CASE WHEN count(*) > 0
    THEN round((count(*) FILTER (WHERE enriched_at IS NOT NULL)::numeric / count(*)::numeric) * 100, 1)
    ELSE 0
  END AS enrichment_pct,
  count(*) FILTER (WHERE last_activity_at < now() - interval '90 days' OR last_activity_at IS NULL)::integer AS stale_contacts,
  CASE WHEN count(*) > 0
    THEN round(((count(*) - count(*) FILTER (WHERE last_activity_at < now() - interval '90 days' OR last_activity_at IS NULL))::numeric / count(*)::numeric) * 100, 1)
    ELSE 0
  END AS freshness_pct,
  CASE WHEN count(*) > 0
    THEN round(
      avg(
        (CASE WHEN email IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN phone IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN title IS NOT NULL THEN 25 ELSE 0 END) +
        (CASE WHEN company_id IS NOT NULL THEN 25 ELSE 0 END)
      ), 1)
    ELSE 0
  END AS completeness_pct,
  CASE WHEN count(*) > 0
    THEN round((
      CASE WHEN count(*) > 0 THEN (count(*) FILTER (WHERE email_status = 'valid')::numeric / count(*)::numeric) * 100 ELSE 0 END +
      CASE WHEN count(*) > 0 THEN (count(*) FILTER (WHERE enriched_at IS NOT NULL)::numeric / count(*)::numeric) * 100 ELSE 0 END +
      CASE WHEN count(*) > 0 THEN ((count(*) - count(*) FILTER (WHERE last_activity_at < now() - interval '90 days' OR last_activity_at IS NULL))::numeric / count(*)::numeric) * 100 ELSE 0 END +
      CASE WHEN count(*) > 0
        THEN avg(
          (CASE WHEN email IS NOT NULL THEN 25 ELSE 0 END) +
          (CASE WHEN phone IS NOT NULL THEN 25 ELSE 0 END) +
          (CASE WHEN title IS NOT NULL THEN 25 ELSE 0 END) +
          (CASE WHEN company_id IS NOT NULL THEN 25 ELSE 0 END)
        )
        ELSE 0
      END
    ) / 4, 1)
    ELSE 0
  END AS overall_quality_score
FROM public.contacts;

-- ============================================================
-- 13. UPDATED_AT TRIGGER FUNCTION + TRIGGERS
-- ============================================================
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DO $$
DECLARE
  tbl text;
BEGIN
  FOR tbl IN SELECT unnest(ARRAY['contacts', 'companies', 'opportunities', 'contact_notes', 'company_notes', 'follow_up_tasks'])
  LOOP
    EXECUTE format(
      'DROP TRIGGER IF EXISTS set_updated_at ON public.%I; CREATE TRIGGER set_updated_at BEFORE UPDATE ON public.%I FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();',
      tbl, tbl
    );
  END LOOP;
END;
$$;

-- ============================================================
-- 14. INDEXES
-- ============================================================
-- contacts
CREATE INDEX IF NOT EXISTS idx_contacts_email ON public.contacts(email);
CREATE INDEX IF NOT EXISTS idx_contacts_company_id ON public.contacts(company_id);
CREATE INDEX IF NOT EXISTS idx_contacts_status ON public.contacts(status);
CREATE INDEX IF NOT EXISTS idx_contacts_engagement_score ON public.contacts(engagement_score);
CREATE INDEX IF NOT EXISTS idx_contacts_last_activity_at ON public.contacts(last_activity_at);
CREATE INDEX IF NOT EXISTS idx_contacts_linkedin_member_id ON public.contacts(linkedin_member_id);

-- companies
CREATE INDEX IF NOT EXISTS idx_companies_name ON public.companies(name);
CREATE INDEX IF NOT EXISTS idx_companies_industry ON public.companies(industry);

-- attendance_records
CREATE INDEX IF NOT EXISTS idx_attendance_records_contact_id ON public.attendance_records(contact_id);
CREATE INDEX IF NOT EXISTS idx_attendance_records_program_name ON public.attendance_records(program_name);

-- email_activities
CREATE INDEX IF NOT EXISTS idx_email_activities_contact_id ON public.email_activities(contact_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_campaign_id ON public.email_activities(campaign_id);
CREATE INDEX IF NOT EXISTS idx_email_activities_activity_type ON public.email_activities(activity_type);

-- opportunities
CREATE INDEX IF NOT EXISTS idx_opportunities_company_id ON public.opportunities(company_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_contact_id ON public.opportunities(contact_id);
CREATE INDEX IF NOT EXISTS idx_opportunities_stage ON public.opportunities(stage);
CREATE INDEX IF NOT EXISTS idx_opportunities_type ON public.opportunities(type);

-- activity_log
CREATE INDEX IF NOT EXISTS idx_activity_log_entity ON public.activity_log(entity_type, entity_id);
CREATE INDEX IF NOT EXISTS idx_activity_log_created_at ON public.activity_log(created_at);

-- follow_up_tasks
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_contact_id ON public.follow_up_tasks(contact_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_company_id ON public.follow_up_tasks(company_id);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_due_date ON public.follow_up_tasks(due_date);
CREATE INDEX IF NOT EXISTS idx_follow_up_tasks_status ON public.follow_up_tasks(status);
