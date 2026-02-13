-- Sales Playbook Schema Extensions
-- Migration: 20260211_sales_playbook_schema
-- Adds tier classification, pipeline stages, platform sync IDs,
-- offer tracking, phone call logs, referral tracking, and sequence position
-- to support the IAML tiered outreach playbook

-- ============================================================
-- 1. CONTACTS: Add playbook-specific columns
-- ============================================================

-- Tier classification (Tier 1: Directors, Tier 2: Executives, Tier 3: Managers)
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS tier TEXT
  CHECK (tier IN ('tier_1', 'tier_2', 'tier_3'));

-- Pipeline stage tracking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS pipeline_stage TEXT DEFAULT 'new'
  CHECK (pipeline_stage IN (
    'new',                -- Just imported, not yet in any sequence
    'smartlead_active',   -- In SmartLead cold email sequence
    'heyreach_active',    -- In HeyReach LinkedIn sequence
    'replied',            -- Replied on any channel
    'ai_classified',      -- Gemini AI has classified the reply
    'ghl_branch_a',       -- Positive reply, in GHL confirmation sequence
    'ghl_branch_a_plus',  -- Wants training, receiving program options
    'ghl_branch_b',       -- "Not now", in GHL value nurture sequence
    'ghl_branch_c',       -- No contact after full sequence, fresh iaml.com approach
    'phone_followup',     -- Escalated to phone outreach
    'opportunity',        -- Active sales opportunity
    'registered',         -- Registered for a program
    'alumni',             -- Completed a program
    'exhausted',          -- All sequences completed, no engagement
    'unsubscribed',       -- Opted out
    'do_not_contact'      -- Manually flagged
  ));

-- AI reply classification from Gemini
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reply_classification TEXT
  CHECK (reply_classification IN (
    'positive',           -- Interested, wants more info
    'wants_training',     -- Explicitly wants to attend/send team
    'not_now',            -- Interested but timing is wrong
    'not_interested',     -- Clear no
    'out_of_office',      -- OOO auto-reply
    'wrong_person',       -- Not the right contact
    'unsubscribe',        -- Wants to be removed
    'question',           -- Asked a question (needs human response)
    'referral'            -- Referred someone else
  ));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS reply_classified_at TIMESTAMPTZ;

-- Platform sync IDs
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS smartlead_lead_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS heyreach_lead_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ghl_contact_id TEXT;

-- Sequence position tracking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS smartlead_campaign_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS smartlead_sequence_step INTEGER;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS smartlead_status TEXT;  -- 'active', 'paused', 'completed', 'bounced'
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS heyreach_campaign_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS heyreach_sequence_step INTEGER;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS heyreach_status TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ghl_pipeline_id TEXT;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS ghl_pipeline_stage TEXT;

-- Outreach channel that generated first engagement
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_engaged_channel TEXT
  CHECK (first_engaged_channel IN ('smartlead', 'heyreach', 'ghl', 'phone', 'website', 'referral', 'event'));
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS first_engaged_at TIMESTAMPTZ;

-- Phone outreach tracking
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS phone_eligible BOOLEAN DEFAULT false;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS last_called_at TIMESTAMPTZ;
ALTER TABLE public.contacts ADD COLUMN IF NOT EXISTS call_count INTEGER DEFAULT 0;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_contacts_tier ON public.contacts(tier);
CREATE INDEX IF NOT EXISTS idx_contacts_pipeline_stage ON public.contacts(pipeline_stage);
CREATE INDEX IF NOT EXISTS idx_contacts_reply_classification ON public.contacts(reply_classification);
CREATE INDEX IF NOT EXISTS idx_contacts_smartlead_id ON public.contacts(smartlead_lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_heyreach_id ON public.contacts(heyreach_lead_id);
CREATE INDEX IF NOT EXISTS idx_contacts_ghl_id ON public.contacts(ghl_contact_id);

-- ============================================================
-- 2. OFFERS TABLE
-- Track offer progression per the playbook's tier-specific sequences
-- ============================================================
CREATE TABLE IF NOT EXISTS public.offers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  -- What was offered
  offer_type TEXT NOT NULL CHECK (offer_type IN (
    'quarterly_update',       -- Free Quarterly Employment Law Update
    'free_virtual_block',     -- Free virtual block attendance
    'paid_block',             -- Single block registration
    'paid_certificate',       -- Full certificate program
    'alumni_discount',        -- 15% alumni discount
    'colleague_referral',     -- Referral discount for colleague
    'corporate_training',     -- On-site corporate training proposal
    'annual_training_plan'    -- Long-term partnership plan
  )),

  -- Which program (if applicable)
  program_id UUID REFERENCES public.programs(id),
  program_name TEXT,

  -- Offer details
  offer_channel TEXT CHECK (offer_channel IN ('smartlead', 'heyreach', 'ghl', 'phone', 'in_person')),
  offer_value NUMERIC(10,2),         -- Dollar value of the offer/discount
  discount_code TEXT,

  -- Status
  status TEXT DEFAULT 'extended' CHECK (status IN (
    'extended',    -- Offer has been made
    'viewed',      -- Contact opened/viewed the offer
    'accepted',    -- Contact accepted
    'declined',    -- Contact explicitly declined
    'expired',     -- Offer window passed
    'converted'    -- Offer led to a registration/sale
  )),

  -- Timing
  extended_at TIMESTAMPTZ DEFAULT NOW(),
  responded_at TIMESTAMPTZ,
  expires_at TIMESTAMPTZ,

  -- Conversion tracking
  opportunity_id UUID REFERENCES public.opportunities(id),
  registration_id UUID,  -- FK to future registrations table
  revenue_attributed NUMERIC(10,2),

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_offers_contact_id ON public.offers(contact_id);
CREATE INDEX IF NOT EXISTS idx_offers_type ON public.offers(offer_type);
CREATE INDEX IF NOT EXISTS idx_offers_status ON public.offers(status);
CREATE INDEX IF NOT EXISTS idx_offers_extended_at ON public.offers(extended_at DESC);

-- ============================================================
-- 3. PHONE CALLS TABLE
-- Structured call logging per the phone playbook
-- ============================================================
CREATE TABLE IF NOT EXISTS public.phone_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  contact_id UUID NOT NULL REFERENCES public.contacts(id) ON DELETE CASCADE,

  -- Call details
  call_type TEXT NOT NULL CHECK (call_type IN (
    'first_outreach',     -- First phone contact attempt
    'follow_up',          -- Follow-up to previous conversation
    'voicemail',          -- Left voicemail
    'inbound',            -- Contact called us
    'scheduled',          -- Pre-scheduled call
    'post_event'          -- Follow-up after program attendance
  )),

  -- Trigger that prompted the call
  call_trigger TEXT CHECK (call_trigger IN (
    'positive_reply_no_registration',  -- Replied positively but hasn't registered
    'high_engagement_no_reply',        -- 3+ opens/clicks but no reply
    'fortune_500',                     -- High-value target company
    'not_now_followup',                -- "Not now" reply, 30-day follow-up
    'referral_followup',               -- Following up on a referral
    'manual'                           -- Manually triggered
  )),

  -- Outcome
  outcome TEXT CHECK (outcome IN (
    'connected',          -- Spoke with the contact
    'voicemail_left',     -- Left a voicemail
    'no_answer',          -- No answer, no voicemail
    'wrong_number',       -- Number is wrong
    'gatekeeper',         -- Couldn't get past gatekeeper
    'callback_requested', -- Contact asked to call back
    'not_available'       -- Contact not available
  )),

  -- Conversation details (when connected)
  disposition TEXT CHECK (disposition IN (
    'interested',           -- Expressed interest
    'will_register',        -- Committed to registering
    'needs_approval',       -- Interested but needs manager/budget approval
    'send_info',            -- Asked for more information
    'not_now',              -- Not the right time
    'not_interested',       -- Not interested
    'referral_given',       -- Referred us to someone else
    'corporate_interest'    -- Interested in corporate/team training
  )),

  -- Details
  duration_seconds INTEGER,
  summary TEXT,                  -- Brief call summary
  next_action TEXT,              -- What to do next
  next_action_date DATE,         -- When to take next action
  script_used TEXT,              -- Which script was used

  -- Metadata
  called_by TEXT,                -- Who made the call
  called_at TIMESTAMPTZ DEFAULT NOW(),

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_phone_calls_contact_id ON public.phone_calls(contact_id);
CREATE INDEX IF NOT EXISTS idx_phone_calls_called_at ON public.phone_calls(called_at DESC);
CREATE INDEX IF NOT EXISTS idx_phone_calls_outcome ON public.phone_calls(outcome);
CREATE INDEX IF NOT EXISTS idx_phone_calls_next_action_date ON public.phone_calls(next_action_date);

-- ============================================================
-- 4. REFERRALS TABLE
-- Track referral relationships and referral campaigns
-- ============================================================
CREATE TABLE IF NOT EXISTS public.referrals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Who referred
  referrer_contact_id UUID NOT NULL REFERENCES public.contacts(id),

  -- Who was referred
  referred_contact_id UUID REFERENCES public.contacts(id),  -- NULL until the referred person is in the system
  referred_name TEXT,
  referred_email TEXT,
  referred_title TEXT,
  referred_company TEXT,

  -- Referral context
  referral_source TEXT CHECK (referral_source IN (
    'post_program',           -- Referred after attending a program
    'colleague_campaign',     -- invitationtohrtraining.com campaign
    'phone_conversation',     -- Gave referral during a call
    'email_reply',            -- Mentioned colleague in email reply
    'linkedin',               -- LinkedIn introduction
    'manual'                  -- Manually entered
  )),

  -- Status
  status TEXT DEFAULT 'received' CHECK (status IN (
    'received',       -- Referral received but not yet contacted
    'contacted',      -- Referred person has been contacted
    'engaged',        -- Referred person is engaging
    'registered',     -- Referred person registered for a program
    'converted',      -- Referred person completed a program
    'declined'        -- Referred person not interested
  )),

  -- Tracking
  campaign_id TEXT,                  -- invitationtohrtraining.com campaign ID
  discount_code TEXT,                -- Referral discount code used
  revenue_attributed NUMERIC(10,2), -- Revenue from the referred contact

  -- Notes
  notes TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_referrals_referrer ON public.referrals(referrer_contact_id);
CREATE INDEX IF NOT EXISTS idx_referrals_referred ON public.referrals(referred_contact_id);
CREATE INDEX IF NOT EXISTS idx_referrals_status ON public.referrals(status);

-- ============================================================
-- 5. FUNCTION: Auto-assign tier based on title
-- ============================================================
CREATE OR REPLACE FUNCTION public.assign_contact_tier()
RETURNS TRIGGER AS $$
BEGIN
  -- Only auto-assign if tier is not already set
  IF NEW.tier IS NULL AND NEW.title IS NOT NULL THEN
    CASE
      -- Tier 2: Executives
      WHEN NEW.title ~* '(^VP|Vice President|SVP|Senior Vice President|CHRO|Chief (People|Human|HR)|EVP|Executive Vice President)' THEN
        NEW.tier := 'tier_2';
      -- Tier 1: Directors
      WHEN NEW.title ~* '(Director|Senior.*Manager|Head of)' THEN
        NEW.tier := 'tier_1';
      -- Tier 3: Managers and below
      WHEN NEW.title ~* '(Manager|Generalist|Business Partner|Specialist|Coordinator|Analyst|Associate)' THEN
        NEW.tier := 'tier_3';
      ELSE
        NULL; -- Leave unclassified for manual review
    END CASE;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_assign_tier ON public.contacts;
CREATE TRIGGER auto_assign_tier
  BEFORE INSERT OR UPDATE OF title ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.assign_contact_tier();

-- ============================================================
-- 6. FUNCTION: Determine phone eligibility
-- ============================================================
CREATE OR REPLACE FUNCTION public.update_phone_eligibility()
RETURNS TRIGGER AS $$
BEGIN
  -- Phone eligible: Tier 1 or Tier 2, has phone number, and meets engagement criteria
  IF NEW.tier IN ('tier_1', 'tier_2') AND NEW.phone IS NOT NULL THEN
    NEW.phone_eligible := true;
  ELSE
    NEW.phone_eligible := false;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS auto_phone_eligibility ON public.contacts;
CREATE TRIGGER auto_phone_eligibility
  BEFORE INSERT OR UPDATE OF tier, phone ON public.contacts
  FOR EACH ROW EXECUTE FUNCTION public.update_phone_eligibility();

-- ============================================================
-- 7. VIEW: Pipeline summary by tier and stage
-- ============================================================
CREATE OR REPLACE VIEW public.pipeline_by_tier AS
SELECT
  tier,
  pipeline_stage,
  COUNT(*) AS contact_count,
  COUNT(*) FILTER (WHERE engagement_score > 0) AS engaged_count,
  ROUND(AVG(engagement_score), 1) AS avg_engagement,
  COUNT(*) FILTER (WHERE phone_eligible) AS phone_eligible_count,
  COUNT(*) FILTER (WHERE last_activity_at > NOW() - INTERVAL '7 days') AS active_last_7d
FROM public.contacts
WHERE tier IS NOT NULL
GROUP BY tier, pipeline_stage
ORDER BY
  CASE tier WHEN 'tier_1' THEN 1 WHEN 'tier_2' THEN 2 WHEN 'tier_3' THEN 3 END,
  pipeline_stage;

-- ============================================================
-- 8. VIEW: Offer conversion funnel
-- ============================================================
CREATE OR REPLACE VIEW public.offer_conversion_funnel AS
SELECT
  offer_type,
  COUNT(*) AS total_extended,
  COUNT(*) FILTER (WHERE status = 'viewed') AS viewed,
  COUNT(*) FILTER (WHERE status = 'accepted') AS accepted,
  COUNT(*) FILTER (WHERE status = 'converted') AS converted,
  COUNT(*) FILTER (WHERE status = 'declined') AS declined,
  COUNT(*) FILTER (WHERE status = 'expired') AS expired,
  CASE WHEN COUNT(*) > 0
    THEN ROUND((COUNT(*) FILTER (WHERE status = 'converted')::numeric / COUNT(*)::numeric) * 100, 1)
    ELSE 0
  END AS conversion_rate_pct,
  COALESCE(SUM(revenue_attributed), 0) AS total_revenue
FROM public.offers
GROUP BY offer_type
ORDER BY total_extended DESC;

-- ============================================================
-- 9. UPDATED_AT TRIGGERS for new tables
-- ============================================================
DROP TRIGGER IF EXISTS set_updated_at ON public.offers;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.offers
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

DROP TRIGGER IF EXISTS set_updated_at ON public.referrals;
CREATE TRIGGER set_updated_at
  BEFORE UPDATE ON public.referrals
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============================================================
-- 10. GRANTS
-- ============================================================
GRANT SELECT, INSERT, UPDATE, DELETE ON public.offers TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.phone_calls TO anon, authenticated, service_role;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.referrals TO anon, authenticated, service_role;
GRANT SELECT ON public.pipeline_by_tier TO anon, authenticated, service_role;
GRANT SELECT ON public.offer_conversion_funnel TO anon, authenticated, service_role;

-- ============================================================
-- COMMENTS
-- ============================================================
COMMENT ON TABLE public.offers IS 'Tracks offer progression per the sales playbook tier-specific sequences';
COMMENT ON TABLE public.phone_calls IS 'Structured phone call logging with triggers, outcomes, and next actions';
COMMENT ON TABLE public.referrals IS 'Referral relationships between contacts and referral campaign tracking';
COMMENT ON VIEW public.pipeline_by_tier IS 'Pipeline summary grouped by contact tier and stage';
COMMENT ON VIEW public.offer_conversion_funnel IS 'Offer-to-conversion funnel metrics by offer type';
