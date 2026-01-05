# Implementation Guide

## Repository Structure

```
business-os/
├── docs/                    # Architecture documentation (this folder)
├── app/                     # Next.js dashboard application (future)
├── supabase/                # Database migrations and config
├── n8n/                     # Workflow definitions
├── departments/             # Department skills and configurations
│   ├── marketing/
│   ├── digital/
│   ├── lead-intelligence/
│   └── _template/
└── shared/                  # Shared utilities and types
```

---

## Supabase Schema

### Core Tables

```sql
-- Departments
CREATE TABLE departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  health_score INTEGER DEFAULT 100,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Sub-departments
CREATE TABLE sub_departments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  slug TEXT NOT NULL,
  config JSONB DEFAULT '{}',
  UNIQUE(department_id, slug)
);

-- Workers
CREATE TABLE workers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id) ON DELETE CASCADE,
  sub_department_id UUID REFERENCES sub_departments(id),
  name TEXT NOT NULL,
  type TEXT NOT NULL CHECK (type IN ('monitor', 'agent', 'skill', 'hybrid')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'paused', 'error')),
  last_run TIMESTAMPTZ,
  last_result JSONB,
  config JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Metrics (time-series)
CREATE TABLE metrics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  metric_name TEXT NOT NULL,
  metric_value NUMERIC,
  metadata JSONB DEFAULT '{}',
  recorded_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_metrics_dept_name ON metrics(department_id, metric_name);
CREATE INDEX idx_metrics_recorded ON metrics(recorded_at DESC);

-- Alerts
CREATE TABLE alerts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  worker_id UUID REFERENCES workers(id),
  severity TEXT NOT NULL CHECK (severity IN ('critical', 'warning', 'info')),
  title TEXT NOT NULL,
  description TEXT,
  acknowledged BOOLEAN DEFAULT FALSE,
  resolved BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  acknowledged_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ
);

CREATE INDEX idx_alerts_unresolved ON alerts(resolved, severity, created_at DESC);

-- Approval Queue
CREATE TABLE approval_queue (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  worker_id UUID REFERENCES workers(id),
  type TEXT NOT NULL,
  title TEXT NOT NULL,
  summary TEXT,
  details JSONB NOT NULL,
  recommendation JSONB,
  status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'modified', 'rejected', 'deferred')),
  ceo_notes TEXT,
  priority TEXT DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  execute_at TIMESTAMPTZ  -- For deferred items
);

CREATE INDEX idx_approval_pending ON approval_queue(status, priority, created_at);

-- Decisions (learning loop)
CREATE TABLE decisions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  approval_id UUID REFERENCES approval_queue(id),
  department_id UUID REFERENCES departments(id),
  worker_id UUID REFERENCES workers(id),
  recommendation TEXT,
  recommendation_reasoning JSONB,
  confidence NUMERIC,
  ceo_action TEXT CHECK (ceo_action IN ('approved', 'modified', 'rejected', 'deferred')),
  ceo_modification TEXT,
  ceo_reasoning TEXT,
  outcome JSONB,
  outcome_vs_prediction TEXT CHECK (outcome_vs_prediction IN ('better', 'as_expected', 'worse')),
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  outcome_recorded_at TIMESTAMPTZ
);

-- Activity Log
CREATE TABLE activity_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  department_id UUID REFERENCES departments(id),
  worker_id UUID REFERENCES workers(id),
  action TEXT NOT NULL,
  details JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_activity_recent ON activity_log(created_at DESC);
CREATE INDEX idx_activity_dept ON activity_log(department_id, created_at DESC);
```

### Lead Intelligence Specific Tables

```sql
-- Contacts (central source of truth)
CREATE TABLE contacts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT UNIQUE NOT NULL,
  first_name TEXT,
  last_name TEXT,
  company TEXT,
  title TEXT,
  phone TEXT,
  linkedin_url TEXT,
  source TEXT,  -- 'apollo', 'linkedin', 'apify', 'manual'
  source_id TEXT,  -- ID from source platform
  lifecycle_stage TEXT DEFAULT 'new' CHECK (lifecycle_stage IN (
    'new', 'validated', 'enriched', 'assigned', 'contacted', 'engaged', 'stale', 'archived'
  )),
  email_validated BOOLEAN DEFAULT FALSE,
  email_validation_date TIMESTAMPTZ,
  enrichment_data JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_contacts_email ON contacts(email);
CREATE INDEX idx_contacts_lifecycle ON contacts(lifecycle_stage);
CREATE INDEX idx_contacts_source ON contacts(source);

-- Domains (email sending)
CREATE TABLE domains (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  domain TEXT UNIQUE NOT NULL,
  platform TEXT NOT NULL,  -- 'smartlead', 'ghl', 'smtp'
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'warming', 'resting', 'retired')),
  daily_limit INTEGER DEFAULT 200,
  health_score INTEGER DEFAULT 100,
  last_health_check TIMESTAMPTZ,
  health_data JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Platform Limits (track scraping platform usage)
CREATE TABLE platform_limits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  platform TEXT UNIQUE NOT NULL,  -- 'phantombuster', 'apollo', 'linkedin', 'apify'
  daily_limit INTEGER,
  weekly_limit INTEGER,
  monthly_limit INTEGER,
  credits_remaining INTEGER,
  credits_reset_date DATE,
  current_daily_usage INTEGER DEFAULT 0,
  current_weekly_usage INTEGER DEFAULT 0,
  last_reset TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);
```

### Digital Department Specific Tables

```sql
-- Test Results (QA)
CREATE TABLE test_results (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  test_suite TEXT NOT NULL,  -- 'registration', 'smoke', 'links'
  test_name TEXT NOT NULL,
  passed BOOLEAN NOT NULL,
  duration_ms INTEGER,
  error_message TEXT,
  screenshot_url TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_test_results_recent ON test_results(test_suite, created_at DESC);

-- Uptime Records
CREATE TABLE uptime_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  url TEXT NOT NULL,
  status_code INTEGER,
  response_time_ms INTEGER,
  is_up BOOLEAN NOT NULL,
  checked_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX idx_uptime_recent ON uptime_records(url, checked_at DESC);
```

---

## n8n Workflow Patterns

### Monitor Pattern

```json
{
  "name": "Monitor: [Metric Name]",
  "nodes": [
    {
      "name": "Schedule Trigger",
      "type": "n8n-nodes-base.scheduleTrigger",
      "parameters": {
        "rule": { "interval": [{ "field": "minutes", "minutesInterval": 5 }] }
      }
    },
    {
      "name": "Fetch Data",
      "type": "n8n-nodes-base.httpRequest",
      "parameters": { "/* API call to fetch metric */" }
    },
    {
      "name": "Evaluate",
      "type": "n8n-nodes-base.if",
      "parameters": {
        "conditions": { "/* threshold checks */" }
      }
    },
    {
      "name": "Log to Supabase",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* insert metric record */" }
    },
    {
      "name": "Create Alert (if needed)",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* insert alert if threshold breached */" }
    }
  ]
}
```

### Agent Pattern (with approval)

```json
{
  "name": "Agent: [Task Name]",
  "nodes": [
    {
      "name": "Trigger",
      "type": "/* schedule or webhook */"
    },
    {
      "name": "Gather Context",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* fetch relevant data */" }
    },
    {
      "name": "Claude Decision",
      "type": "@n8n/n8n-nodes-langchain.lmChatAnthropic",
      "parameters": { "/* prompt with context, get recommendation */" }
    },
    {
      "name": "Check Approval Required",
      "type": "n8n-nodes-base.if",
      "parameters": { "/* based on confidence/threshold */" }
    },
    {
      "name": "Queue for Approval",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* insert to approval_queue */" }
    },
    {
      "name": "Execute Directly",
      "type": "/* action node */",
      "parameters": { "/* only if auto-approved */" }
    }
  ]
}
```

### Approval Executor Pattern

```json
{
  "name": "Execute Approved Items",
  "nodes": [
    {
      "name": "Webhook: Approval Received",
      "type": "n8n-nodes-base.webhook",
      "parameters": { "path": "approval-execute" }
    },
    {
      "name": "Fetch Approval Details",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* get full approval record */" }
    },
    {
      "name": "Route by Type",
      "type": "n8n-nodes-base.switch",
      "parameters": { "/* route to correct executor */" }
    },
    {
      "name": "Execute: Email Campaign",
      "type": "/* Smartlead/GHL API */"
    },
    {
      "name": "Execute: Social Post",
      "type": "/* LinkedIn/Buffer API */"
    },
    {
      "name": "Log Outcome",
      "type": "n8n-nodes-base.supabase",
      "parameters": { "/* update decisions table */" }
    }
  ]
}
```

---

## Integration Architecture

### External Tool Connections

| Tool | Department | Method | Credentials |
|------|------------|--------|-------------|
| Smartlead | Marketing, Lead Intel | REST API | API Key |
| GHL | Marketing, Lead Intel | REST API | API Key + Location ID |
| PhantomBuster | Lead Intel | REST API | API Key |
| Apollo | Lead Intel | REST API | API Key |
| Apify | Lead Intel | REST API | API Token |
| Stripe | Digital | REST API + Webhooks | Secret Key |
| Vercel | Digital | REST API | Token |
| Google Analytics | Digital, Marketing | REST API | OAuth |
| Google Search Console | Marketing | REST API | OAuth |

### Webhook Endpoints

```
/api/webhooks/
├── ghl/
│   ├── contact-created     # New contact in GHL
│   └── email-sent          # Email sent confirmation
├── stripe/
│   ├── payment-succeeded   # Registration payment
│   └── payment-failed      # Payment failure
├── vercel/
│   └── deployment          # New deployment completed
└── internal/
    ├── approval-execute    # Execute approved item
    └── alert-acknowledge   # Alert acknowledged
```

---

## Implementation Phases

*Note: Timeline estimates removed. Focus on sequential delivery of functionality.*

### Phase 1: Foundation

**Goal:** Core infrastructure and one department operational

1. Set up repository structure
2. Create Supabase schema (core tables)
3. Build basic Next.js dashboard shell (or conversational-only initially)
4. Implement Digital Department:
   - Uptime monitoring
   - Basic health score display
   - Playwright registration tests (manual trigger)

**Deliverables:**
- Dashboard shows Digital health score
- Registration tests can run and report results
- Alerts display when issues detected

### Phase 2: Digital Department Complete

**Goal:** Full Digital Department functionality

1. All Digital sub-departments operational:
   - Site Performance monitors
   - Database health monitoring
   - Security scanning
   - Analytics integration
   - QA automation (scheduled)
   - Development tracking

2. Dashboard features:
   - Digital department detail view
   - Alert management
   - Activity log

**Deliverables:**
- Daily automated registration testing
- All 20 paths tested and reported
- Security and performance monitoring live

### Phase 3: Marketing Department

**Goal:** Marketing Department operational

1. Marketing sub-departments:
   - Email monitoring (Smartlead integration)
   - LinkedIn automation monitoring
   - Basic SEO tracking

2. Approval queue implementation:
   - Queue UI (or conversational equivalent)
   - Approval workflow
   - Decision logging

**Deliverables:**
- Email campaign metrics visible
- LinkedIn automation status tracked
- First approval workflows functional

### Phase 4: Lead Intelligence

**Goal:** Lead Intelligence Department operational

1. Lead Intelligence sub-departments:
   - Platform monitoring (Apollo, PhantomBuster)
   - Capacity calculator
   - Domain health tracking
   - Contact database sync

2. Cross-department integration:
   - Lead Intelligence → Marketing data flow
   - Capacity checks for campaign approval

**Deliverables:**
- Capacity dashboard functional
- Domain health visible
- Platform limits tracked

### Phase 5: Board Meeting & Learning

**Goal:** Strategic layer and learning loop

1. Board Meeting implementation:
   - Dashboard button integration (or conversational)
   - Question routing
   - Synthesis prompt

2. Learning loop:
   - Decision tracking
   - Outcome recording
   - Feedback UI (or conversational)

**Deliverables:**
- Board Meeting generates briefings
- Decisions logged with outcomes
- System begins accumulating learnings

### Phase 6: Polish & Iterate

**Goal:** Refinement and reliability

1. Dashboard polish (when built)
2. Alert tuning (reduce noise)
3. Confidence calibration
4. Documentation update

**Deliverables:**
- Production-ready system
- Documented and maintainable
- First month of learning data

---

## Department Folder Structure

### Example: Digital Department

```
departments/digital/
├── DEPARTMENT.md              # Director knowledge base
├── config.json                # Thresholds, settings
├── sub-departments/
│   ├── site-performance/
│   │   ├── SKILL.md
│   │   └── workers/
│   │       ├── uptime-monitor.md
│   │       └── speed-tracker.md
│   ├── database/
│   │   ├── SKILL.md
│   │   └── workers/
│   │       ├── query-monitor.md
│   │       └── backup-verifier.md
│   ├── security/
│   │   └── ...
│   ├── analytics/
│   │   └── ...
│   ├── quality-assurance/
│   │   ├── SKILL.md
│   │   ├── workers/
│   │   │   └── registration-tester.md
│   │   └── tests/
│   │       └── registration-paths.json  # Test matrix config
│   └── development/
│       └── ...
└── dashboards/
    └── ceo-view.json
```

---

## Quick Start Commands

```bash
# Clone and setup
git clone [repo]
cd business-os
npm install

# Database
npx supabase start
npx supabase db push

# Development
npm run dev

# n8n (separate terminal)
docker-compose up n8n

# Run registration tests manually
npm run test:registration
```

---

## Environment Variables

```env
# Supabase
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=

# External APIs
SMARTLEAD_API_KEY=
GHL_API_KEY=
GHL_LOCATION_ID=
PHANTOMBUSTER_API_KEY=
APOLLO_API_KEY=
APIFY_TOKEN=
STRIPE_SECRET_KEY=
VERCEL_TOKEN=

# Google (OAuth)
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GOOGLE_REFRESH_TOKEN=

# n8n
N8N_WEBHOOK_URL=

# Claude API (for n8n)
ANTHROPIC_API_KEY=
```

---

## Next Steps

After completing this architecture:

1. **Start with Phase 1** — Get foundation running
2. **Build Digital first** — Most independent, easiest to test
3. **Add Marketing** — Introduces approval workflows
4. **Add Lead Intelligence** — Completes core trio
5. **Enable Board Meeting** — Strategic layer
6. **Iterate based on usage** — Tune thresholds, add features

The architecture is designed to be built incrementally. Each phase delivers working functionality while building toward the complete system.
