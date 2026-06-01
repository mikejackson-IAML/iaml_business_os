-- Approval request capture for website "Create Approval Request" modal submissions.
-- Keeps the generated approval-request data in Supabase before routing the lead to GoHighLevel.

CREATE TABLE IF NOT EXISTS public.approval_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL,
  name TEXT,
  organization TEXT,
  program_slug TEXT NOT NULL,
  program_name TEXT,
  attendance_preference TEXT,
  business_reason TEXT,
  context TEXT,
  approval_text TEXT,
  page_url TEXT,
  page_path TEXT,
  referrer TEXT,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  utm_content TEXT,
  utm_term TEXT,
  tags TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
  drip_campaign TEXT NOT NULL DEFAULT 'approval_support',
  submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  metadata JSONB NOT NULL DEFAULT '{}'::JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_approval_requests_email ON public.approval_requests (lower(email));
CREATE INDEX IF NOT EXISTS idx_approval_requests_program_slug ON public.approval_requests (program_slug);
CREATE INDEX IF NOT EXISTS idx_approval_requests_submitted_at ON public.approval_requests (submitted_at DESC);
CREATE INDEX IF NOT EXISTS idx_approval_requests_tags ON public.approval_requests USING GIN (tags);

CREATE OR REPLACE FUNCTION public.update_approval_requests_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS approval_requests_updated_at ON public.approval_requests;
CREATE TRIGGER approval_requests_updated_at
  BEFORE UPDATE ON public.approval_requests
  FOR EACH ROW EXECUTE FUNCTION public.update_approval_requests_updated_at();

COMMENT ON TABLE public.approval_requests IS 'Website approval-request modal submissions persisted before GoHighLevel routing.';
COMMENT ON COLUMN public.approval_requests.tags IS 'GoHighLevel tags sent with the contact payload, including drip trigger tags.';
COMMENT ON COLUMN public.approval_requests.drip_campaign IS 'Internal drip campaign key expected to be started by the GHL tag/workflow layer.';
