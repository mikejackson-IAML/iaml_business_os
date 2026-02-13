# LinkedIn Content Engine — Build Prompt

Paste everything below into a fresh Claude Code session.

---

## PROJECT: LinkedIn Content Engine for IAML Business OS

I'm building a LinkedIn content automation engine for my personal LinkedIn profile (Mike Van Horn, CEO of IAML — Institute for Applied Management & Law). The system handles research, topic scoring, content generation, publishing, engagement optimization, and analytics. It integrates into my existing Business OS dashboard (Next.js 16 + React 19 + Supabase + Tailwind).

Read these files for full context before doing anything:

1. `.planning/linkedin-content-engine/HANDOFF.md` — Decisions, costs, architecture summary
2. `WEB-INTEL-WORKFLOWS-REFERENCE.md` — Reference of my existing Web Intel workflow patterns
3. `business-os/knowledge/CHANNEL_PLAYBOOKS/LINKEDIN_ORGANIC.md` — Existing LinkedIn playbook
4. `dashboard/src/app/dashboard/marketing/marketing-content.tsx` — Existing marketing dashboard (integration point)
5. `dashboard/package.json` — Dashboard tech stack

---

## POSITIONING & BRAND VOICE

I position myself as **"The HR Technologist"** — the person who doesn't just teach the rules but builds the tools that enforce them. I sit at the intersection of genuine AI expertise (n8n workflows, Claude Code, multi-agent orchestration) and IAML's 45+ year track record in employment law training (established 1979). I am NOT an attorney or HR practitioner. I bridge expert HR instruction (from IAML's faculty of practicing attorneys) and AI-driven operational efficiency.

**The Hook:** "I don't just teach the rules; I build the tools that enforce them."

**Unique Moat:** Access to deep-domain expertise (IAML instructors/attorneys) + technical rapid prototyping (Claude Code).

**Tone:** Innovative, grounded in IAML's institutional legacy, technically curious, and radically focused on efficiency over "fluff." "Smart friend at a conference" who happens to be in the trenches building AI tools — observer and builder, never prescriber. NEVER give legal advice. NEVER use: "delve," "landscape," "in today's rapidly evolving," "I'm excited to share," or corporate jargon.

**Target audience:** HR Directors, VP of HR, CHRO, HR Managers at companies with 500+ employees. Secondary: employment law attorneys, HR consultants, HR tech vendors. Tertiary: AI-curious business leaders watching the HR+AI intersection.

---

## CONTENT SERIES (Post 3-4x/week, Tue-Fri)

| Day | Series | Format | Description |
|-----|--------|--------|-------------|
| Tuesday | "AI in HR: What You're Not Being Told" | Text-only | Flagship. Takes trending AI+HR topic, reveals the angle others miss |
| Wednesday | "The HR Compliance Radar" | Carousel or Text | Quick-hit regulatory roundup with AI implications highlighted |
| Thursday | "Ask the AI Guy" | Text or Carousel | Real question from HR pros, Mike breaks down the AI angle |
| Friday | Flex/Bonus | Varies | Breaking news, personal observations, amplification |

---

## CONTENT FRAMING PILLARS

Each post is framed through one of three strategic pillars that balance the existing series with the HR Technologist positioning. Rotate pillars across the week — every post belongs to a series (topic) AND a pillar (frame).

| Pillar | Code | Focus | Example CTA |
|--------|------|-------|-------------|
| **A: Legacy & Future** | `legacy_future` | Contrast IAML's 45+ years of employment law training (est. 1979) with 2026 Agentic AI capabilities. Show how institutional knowledge meets modern tooling. | "How is your team adapting to [Specific Change]?" |
| **B: Building in Public** | `building_in_public` | Show code snippets, logic flows, or terminal screenshots from Claude Code. Demonstrate real automation being built for HR compliance. | "Would this automation save your team 5 hours a week?" |
| **C: Partnered Authority** | `partnered_authority` | Highlights from IAML instructor/attorney "Logic Sessions" — translating expert legal knowledge into AI-ready rules. | "Comment 'AUDIT' to see how we automate this rule." |

### Pillar × Series Mapping (Default Rotation)

| Day | Series (What) | Pillar (How) | Rationale |
|-----|---------------|--------------|-----------|
| Tuesday | "What You're Not Being Told" | A or C | Authority-driven framing fits the flagship reveal format |
| Wednesday | "Compliance Radar" | C | Partnered authority is natural for regulatory content |
| Thursday | "Ask the AI Guy" | B | Show-the-build format — answer questions with code |
| Friday | Flex | B or A | Behind-the-scenes builds or legacy contrast stories |

### Pillar Guidelines

- **Legacy & Future (A):** Reference IAML's institutional track record (est. 1979, 80,000+ professionals trained). Frame the contrast as "what we've always done well" vs "what AI now makes possible." Keep it about the business and its mission — not personal history.
- **Building in Public (B):** Show real terminal output, workflow screenshots, or automation logic. Be specific about what you're building and why. Audiences should see the HR Technologist identity in action.
- **Partnered Authority (C):** Credit IAML's faculty and attorneys. Show the translation process: "Our attorneys flagged this edge case → here's how we encoded it into an AI guardrail."

### Product Roadmap Context (for Building in Public posts)

Reference whichever phase is currently active:

1. **Phase 1 (Current): The Ingestion Engine** — Building an agent that takes messy HR policy documents and outputs structured AI logic.
2. **Phase 2: Mid-Market Partnership** — Partnering with 50-200 person law firms to validate the logic and distribute to their clients.
3. **Phase 3: The Scale-Up** — Subscription-based, self-serve portal with zero manual implementation.

---

## SYSTEM ARCHITECTURE

### 8 n8n Workflows

| # | Workflow | Trigger | What It Does |
|---|----------|---------|-------------|
| 1 | **Daily RSS Monitor** | Schedule (daily 6 AM CST) | Monitors SHRM, HR Dive, EEOC, DOL, employment law firm blogs via RSS. Stores signals in Supabase |
| 2 | **Weekly Deep Research** | Schedule (Sunday 8 PM CST) | Scrapes Reddit (7 subreddits) + LinkedIn top posts via Apify. Extracts trending topics, pain points, hooks |
| 3 | **Topic Scoring Engine** | Schedule (Monday 5 AM CST, after research completes) | Scores topics 0-100 across 5 dimensions: engagement signal (0-25), freshness (0-25), content gap (0-20), positioning fit (0-15), format potential (0-15). Sends ranked brief to dashboard |
| 4 | **Content Generation Pipeline** | Event (topics approved in dashboard) | Assembles context package, generates 3 hook variations per post, writes full draft, generates first comment. Sends to dashboard for review |
| 5 | **Publishing & First Comment** | Schedule (Tue-Fri 8 AM CST) | Publishes approved post via Buffer API, posts first comment 30-60 sec later, logs to Supabase, notifies Slack |
| 6 | **Engagement Engine** | Schedule (daily 7 AM + 20 min pre-post) | Two modes: (a) daily digest of 5-7 high-value posts to comment on, (b) pre-post warming alerts. Generates comment suggestions via Claude |
| 7 | **Post-Publish Monitor** | Schedule (every 10 min for 2 hrs, then decreasing) | Polls LinkedIn for comments on published posts. Classifies comments, generates reply suggestions, tracks engagement velocity |
| 8 | **Analytics Feedback Loop** | Schedule (Sunday 6 PM CST) | Captures post performance, generates weekly report, feeds insights back into topic scoring weights, hook library scores, format preferences |

### Tech Stack

| Component | Technology | Credential in n8n-brain |
|-----------|-----------|------------------------|
| Workflow orchestration | n8n (self-hosted at n8n.realtyamp.ai) | n8n-api |
| Database | Supabase (PostgreSQL) | supabase-rest (Dy6aCSbL5Tup4TnE) |
| AI generation | Claude API (Sonnet) | anthropic-api |
| Reddit/LinkedIn scraping | Apify | hardcoded_in_workflow (apify_api_KN1g...) |
| LinkedIn publishing | Buffer API | NEW — needs setup |
| Notifications | Slack webhook | slack-web-intel (needs new channel/webhook for LinkedIn) |
| Dashboard | Next.js 16 + React 19 + Tailwind + Radix UI + Tremor | Supabase SSR client |
| Error handling | Canary pattern | canary_error_handling (Dy6aCSbL5Tup4TnE) |

### Dashboard Integration

New page at `/dashboard/marketing/linkedin-content` with these tabs:

| Tab | Features |
|-----|----------|
| **This Week** | Recommended topics with scores, pick 3-4 to approve, see scheduled post status |
| **Drafts** | Review generated posts, pick hook A/B/C, approve/edit/reject, preview carousel |
| **Content Calendar** | Visual calendar of posts by pillar/status (open, generated, approved, published) |
| **Analytics** | Post performance metrics, engagement trends, follower growth, hook performance, format comparison, best posting times |
| **Engagement** | Daily comment digest, engagement network management, comment ROI tracking |

The dashboard follows existing patterns:
- `page.tsx` → `data-loader.tsx` → `content.tsx` + `skeleton.tsx`
- Supabase queries in `@/lib/supabase/queries`
- Reusable components: MetricCard, HealthScore, AlertList, ActivityFeed, Card
- Existing marketing page already has a LinkedIn section showing HeyReach data

---

## DATABASE SCHEMA (Supabase — `linkedin_engine` schema)

### Tables

```sql
-- Schema
CREATE SCHEMA IF NOT EXISTS linkedin_engine;

-- Raw research data from daily RSS + weekly deep research
CREATE TABLE linkedin_engine.research_signals (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  source TEXT NOT NULL, -- reddit, linkedin, shrm, hr_dive, eeoc, dol, rss
  source_url TEXT,
  title TEXT,
  body_text TEXT,
  author TEXT,
  platform_engagement JSONB, -- {upvotes, comments, likes, shares, etc.}
  keywords TEXT[],
  topic_category TEXT, -- ai_compliance, ai_hiring, surveillance, employment_law, hr_tech, legacy_pivot, build_in_public
  sentiment TEXT, -- positive, negative, neutral, concerned, confused
  collected_date TIMESTAMPTZ DEFAULT NOW(),
  signal_week DATE, -- Monday of the week this signal belongs to
  processed BOOLEAN DEFAULT FALSE
);

-- Scored and recommended topics
CREATE TABLE linkedin_engine.topic_recommendations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE NOT NULL,
  topic_title TEXT NOT NULL,
  angle TEXT,
  total_score INT,
  engagement_score INT,
  freshness_score INT,
  gap_score INT,
  positioning_score INT,
  format_score INT,
  recommended_format TEXT, -- text, carousel, data_graphic
  recommended_series TEXT, -- not_being_told, compliance_radar, ask_ai_guy, flex
  hook_suggestion TEXT,
  key_data_points JSONB,
  source_signal_ids UUID[],
  status TEXT DEFAULT 'pending', -- pending, approved, rejected
  approved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Generated and published posts
CREATE TABLE linkedin_engine.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  topic_id UUID REFERENCES linkedin_engine.topic_recommendations(id),
  linkedin_post_id TEXT, -- from LinkedIn after publishing
  hook_text TEXT,
  hook_category TEXT, -- data, contrarian, observation, question, story
  hook_variation TEXT, -- A, B, or C
  full_text TEXT NOT NULL,
  first_comment_text TEXT,
  format TEXT, -- text, carousel, data_graphic
  series TEXT, -- content series (not_being_told, compliance_radar, ask_ai_guy, flex)
  pillar TEXT, -- content framing pillar (legacy_future, building_in_public, partnered_authority)
  carousel_pdf_url TEXT,
  hashtags TEXT[],
  tagged_people TEXT[],
  status TEXT DEFAULT 'draft', -- draft, approved, scheduled, published, failed
  scheduled_for TIMESTAMPTZ,
  published_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Post performance analytics
CREATE TABLE linkedin_engine.post_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id UUID REFERENCES linkedin_engine.posts(id),
  captured_at TIMESTAMPTZ DEFAULT NOW(),
  impressions INT,
  reactions_total INT,
  reactions_by_type JSONB, -- {like: X, celebrate: X, support: X, etc.}
  comments_count INT,
  shares_count INT,
  engagement_rate FLOAT,
  profile_views_day INT,
  new_followers_day INT,
  click_through_rate FLOAT,
  hours_since_publish FLOAT
);

-- Hook library
CREATE TABLE linkedin_engine.hooks (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  hook_text TEXT NOT NULL,
  hook_category TEXT, -- data, contrarian, observation, question, story
  character_count INT,
  source TEXT, -- mike_original, external_linkedin, ai_generated
  source_post_url TEXT,
  source_engagement JSONB,
  times_used INT DEFAULT 0,
  avg_engagement_rate FLOAT,
  best_engagement_rate FLOAT,
  last_used_date DATE,
  topic_category TEXT,
  post_id UUID REFERENCES linkedin_engine.posts(id),
  score FLOAT DEFAULT 50.0,
  status TEXT DEFAULT 'active', -- active, retired
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Engagement network (people to monitor and engage with)
CREATE TABLE linkedin_engine.engagement_network (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  linkedin_name TEXT NOT NULL,
  linkedin_url TEXT,
  linkedin_headline TEXT,
  follower_count INT,
  tier TEXT, -- tier_1, tier_2
  category TEXT, -- hr_leader, employment_attorney, ai_policy, hr_tech, journalist
  engagement_history JSONB,
  last_monitored TIMESTAMPTZ,
  last_engaged TIMESTAMPTZ,
  avg_post_engagement FLOAT,
  notes TEXT,
  active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Comment tracking (Mike's comments on others' posts)
CREATE TABLE linkedin_engine.comment_activity (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  target_post_url TEXT,
  target_author TEXT,
  target_author_followers INT,
  comment_text TEXT,
  commented_at TIMESTAMPTZ,
  likes_received INT DEFAULT 0,
  replies_received INT DEFAULT 0,
  profile_visits_driven INT,
  connection_requests_driven INT,
  roi_score FLOAT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Content calendar
CREATE TABLE linkedin_engine.content_calendar (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE,
  post_date DATE NOT NULL,
  day_of_week TEXT, -- tuesday, wednesday, thursday, friday
  series TEXT, -- not_being_told, compliance_radar, ask_ai_guy, flex
  pillar TEXT, -- legacy_future, building_in_public, partnered_authority
  recommended_format TEXT,
  topic_id UUID REFERENCES linkedin_engine.topic_recommendations(id),
  post_id UUID REFERENCES linkedin_engine.posts(id),
  status TEXT DEFAULT 'open', -- open, assigned, generated, approved, published
  notes TEXT
);

-- Weekly analytics summaries
CREATE TABLE linkedin_engine.weekly_analytics (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  week_of DATE NOT NULL,
  total_posts INT,
  total_impressions INT,
  total_reactions INT,
  total_comments INT,
  total_shares INT,
  avg_engagement_rate FLOAT,
  best_post_id UUID REFERENCES linkedin_engine.posts(id),
  worst_post_id UUID REFERENCES linkedin_engine.posts(id),
  new_followers INT,
  total_profile_views INT,
  format_performance JSONB, -- {text: X%, carousel: X%}
  topic_performance JSONB, -- {ai_compliance: X%, ai_hiring: X%}
  hook_performance JSONB, -- {data: X%, contrarian: X%}
  recommendations TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Workflow execution tracking
CREATE TABLE linkedin_engine.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_name TEXT NOT NULL,
  n8n_execution_id TEXT,
  status TEXT DEFAULT 'running', -- running, completed, failed
  started_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  items_processed INT,
  error_message TEXT,
  metadata JSONB
);

-- Indexes
CREATE INDEX idx_le_signals_week ON linkedin_engine.research_signals(signal_week);
CREATE INDEX idx_le_signals_source ON linkedin_engine.research_signals(source);
CREATE INDEX idx_le_signals_processed ON linkedin_engine.research_signals(processed);
CREATE INDEX idx_le_topics_week ON linkedin_engine.topic_recommendations(week_of);
CREATE INDEX idx_le_topics_status ON linkedin_engine.topic_recommendations(status);
CREATE INDEX idx_le_posts_status ON linkedin_engine.posts(status);
CREATE INDEX idx_le_posts_published ON linkedin_engine.posts(published_at);
CREATE INDEX idx_le_hooks_category ON linkedin_engine.hooks(hook_category);
CREATE INDEX idx_le_hooks_score ON linkedin_engine.hooks(score DESC);
CREATE INDEX idx_le_hooks_status ON linkedin_engine.hooks(status);
CREATE INDEX idx_le_analytics_post ON linkedin_engine.post_analytics(post_id);
CREATE INDEX idx_le_calendar_date ON linkedin_engine.content_calendar(post_date);
CREATE INDEX idx_le_calendar_week ON linkedin_engine.content_calendar(week_of);
CREATE INDEX idx_le_engagement_tier ON linkedin_engine.engagement_network(tier);
CREATE INDEX idx_le_workflow_runs_name ON linkedin_engine.workflow_runs(workflow_name);
```

---

## TOPIC SCORING ALGORITHM (0-100)

### Engagement Signal Strength (0-25 points)
- Reddit post 100+ upvotes: +5
- Reddit post 50+ comments: +5
- X post 500+ likes from HR account: +5
- 3+ sources covering same topic: +5
- Google Trends "rising" for keyword: +5

### Freshness & Timing (0-25 points)
- Regulatory announcement in past 48 hrs: +10
- Court decision in past 7 days: +8
- Trending in past 3 days: +7
- 4-7 days old but still growing: +5
- Evergreen with new data/angle: +3

### Content Gap Analysis (0-20 points)
- No LinkedIn posts found on this angle: +10
- Existing posts are low-quality/surface: +7
- Topic covered but Mike's AI angle is unique: +5
- Well-covered by multiple leaders: +0

### Positioning Alignment (0-15 points)
- Directly AI + HR/employment law: +15
- AI-adjacent with clear HR implications: +10
- HR topic where AI angle can be added: +7
- General HR without AI connection: +3
- **AEO bonus:** +3 if topic naturally allows use of AEO terms (Agentic RAG, Compliance Guardrails, Multi-Agent Orchestration, HR Agentic Systems)

### Format Potential (0-15 points)
- Complex topic perfect for carousel: +10
- Contrarian angle ideal for text-only: +8
- Data-heavy for visual: +7
- Story/narrative opportunity: +5
- Simple topic: +2

---

## CONTENT GENERATION PROMPT TEMPLATE

```
You are writing a LinkedIn post for Mike Van Horn, "The HR Technologist." Mike runs IAML (est. 1979), a 45-year employment law training company, and has genuine expertise in AI and automation — he builds HR compliance tools using Claude Code and multi-agent systems. He is NOT an attorney or HR practitioner. His unique position: access to deep-domain expertise (IAML's practicing attorneys) + technical rapid prototyping capability.

BRAND VOICE: Innovative, grounded, technically curious, and radically focused on efficiency. "Smart friend at a conference who happens to be in the trenches building AI tools." Observer and builder, never prescriber.

TOPIC: {topic_title}
ANGLE: {angle}
FORMAT: {format}
SERIES: {series_name}
PILLAR: {pillar} -- legacy_future | building_in_public | partnered_authority
KEY DATA POINTS: {data_points}
RESEARCH CONTEXT: {research_summary}
PRODUCT PHASE: {current_product_phase} -- What Mike is currently building (for Building in Public posts)

HOOK PATTERNS TO CONSIDER: {top_5_hooks_from_library}

PILLAR-SPECIFIC FRAMING:
- If pillar is "legacy_future": Contrast IAML's institutional track record (est. 1979, 80,000+ trained) with what Agentic AI now makes possible. Frame as business evolution, not personal history.
- If pillar is "building_in_public": Include a specific technical detail — a code snippet, workflow logic, or automation result. Show the build, not just the theory.
- If pillar is "partnered_authority": Reference IAML faculty/attorney expertise. Show the translation: legal knowledge → AI guardrail or automated rule.

AEO (AI ENGINE OPTIMIZATION) — Weave these terms naturally where relevant:
- "Agentic RAG" (when discussing AI that retrieves and reasons over documents)
- "Compliance Guardrails" (when discussing AI safety/rules for HR)
- "Multi-Agent Orchestration" (when discussing automated workflows)
- "HR Agentic Systems" (when discussing AI tools for HR operations)
Do NOT force these terms. Use them only when they fit the topic naturally.

RULES:
- Target 1,800-2,000 characters
- Generate 3 hook variations (data, contrarian, observation)
- First 2 lines MUST be a punchy hook, followed by 2 lines of white space
- Break text every 2-3 lines for mobile (short, scannable paragraphs)
- End with a "binary" or "low-friction" question (e.g., "Do you prefer A or B?") to drive comment volume
- NO links in post body (put in first comment)
- NO emojis in body text
- Maximum 3-5 hashtags at the very end
- NEVER give legal advice
- NEVER use: "delve," "landscape," "in today's rapidly evolving," "it's important to note," "I'm excited to share"
- NEVER use corporate jargon: "leverage," "synergize," "paradigm shift"
- Use concrete specifics, not vague claims
- One idea per post — go deep, not wide

Also generate:
- A first comment (link to relevant resource, extended thought, or seeding question)
- If format is carousel: an outline of 5-8 slides with title and key point per slide

OUTPUT FORMAT:
[HOOK A - Data/Statistic]
[hook text]

[HOOK B - Contrarian]
[hook text]

[HOOK C - Observation]
[hook text]

[FULL POST using Hook A]
[complete post text]

[FIRST COMMENT]
[comment text]

[CAROUSEL OUTLINE] (if applicable)
Slide 1: [title] — [key point]
Slide 2: ...
```

---

## LINKEDIN ALGORITHM RULES (Bake Into All Workflows)

1. First 60-90 minutes determine 70% of reach — pre-post warming and quick replies matter enormously
2. Comments weighted 8x more than likes — optimize for comments, end with debatable question
3. Dwell time is a primary quality signal — longer, well-structured posts that hold attention win
4. **Zero-Click Framework:** Provide full value inside the post. External links kill reach (up to 50% penalty) — ALWAYS put links in first comment
5. **Dwell Time Optimization:** Use a punchy hook (first 2 lines), 2 lines of white space, and short scannable paragraphs
6. Personal profiles >> company pages for reach
7. Post Tue-Thu 7-8 AM CST for decision-maker planning windows
8. High-performing posts get resurfaced for 2-3 weeks on LinkedIn
9. Carousel/document posts drive extended dwell time (each swipe = engagement)
10. Reply to comments quickly — each reply doubles comment count for algorithm
11. 3-4 posts/week, same days = ideal consistency
12. Don't edit posts within first hour (can reset distribution)
13. Don't use LinkedIn's native scheduler (evidence of lower initial distribution — use API instead)
14. **AEO (AI Engine Optimization):** Use specific terms like "Agentic RAG," "Compliance Guardrails," and "Multi-Agent Orchestration" naturally so AI search engines index the profile correctly
15. **Engagement-First CTAs:** End with a "binary" or "low-friction" question (e.g., "Do you prefer A or B?") to drive comment volume

---

## EXISTING n8n-BRAIN CREDENTIALS (Already Configured)

Use these exact credential IDs when building workflows:

| Service | Credential ID | Type | Notes |
|---------|--------------|------|-------|
| Supabase REST API | Dy6aCSbL5Tup4TnE | httpHeaderAuth | USE THIS for all Supabase. HTTP Request nodes only. |
| Anthropic/Claude | anthropic-api | httpHeaderAuth | Claude API for content generation |
| Apify | hardcoded in workflow | api_token | Token: apify_api_KN1g... |
| Slack (#web-intel) | https://hooks.slack.com/services/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 | webhook | Need new channel/webhook for LinkedIn |
| n8n API | eyJhbG... (see n8n-brain) | apiKey | For workflow management |
| Error handling | Dy6aCSbL5Tup4TnE | httpHeaderAuth | POST to /rest/v1/workflow_errors |

**IMPORTANT n8n patterns from brain:**
- DO NOT use n8n Postgres nodes — they're broken. Use HTTP Request + Supabase REST API
- DO NOT use n8n Supabase native nodes for complex queries — use HTTP Request + REST API
- Use canary error handling pattern: POST to workflow_errors table on error
- Use Apify queue pattern for scraping (webhook adds to queue, schedule processes)

---

## BUILD SEQUENCE (Step by Step)

### Phase 1: Foundation (Start Here)
1. Run Supabase migration to create `linkedin_engine` schema + all tables + indexes
2. Create new Slack channel #linkedin-content + webhook
3. Register Buffer account, get API key, register credential in n8n-brain
4. Scaffold dashboard page at `/dashboard/marketing/linkedin-content`
5. Create content calendar entries for next 4 weeks (empty slots)

### Phase 2: Research Workflows
6. Build Workflow 1: Daily RSS Monitor (SHRM, HR Dive, EEOC, DOL, law firm blogs)
7. Build Workflow 2: Weekly Deep Research (Reddit via Apify + LinkedIn post scraping)
8. Test both workflows, verify data lands in `research_signals` table
9. Store patterns in n8n-brain

### Phase 3: Scoring & Generation
10. Build Workflow 3: Topic Scoring Engine
11. Build Workflow 4: Content Generation Pipeline
12. Build dashboard "This Week" tab (topic selection UI)
13. Build dashboard "Drafts" tab (review/approve UI)
14. Test end-to-end: research → score → generate → approve in dashboard

### Phase 4: Publishing & Engagement
15. Build Workflow 5: Publishing & First Comment (via Buffer API)
16. Build Workflow 6: Engagement Engine (daily digest + pre-post warming)
17. Build Workflow 7: Post-Publish Monitor
18. Build dashboard "Engagement" tab
19. Test end-to-end automation

### Phase 5: Analytics & Feedback
20. Build Workflow 8: Analytics Feedback Loop
21. Build dashboard "Analytics" tab (post performance, trends, hook performance)
22. Build dashboard "Content Calendar" tab
23. Connect analytics back to topic scoring weights
24. Implement hook library collection and scoring

### Phase 6: Enrichment (Future)
25. Add X/Twitter monitoring to research sprint
26. Add Google Trends monitoring
27. Build carousel/PDF generator
28. Expand engagement network database
29. A/B test hook variations systematically
30. Optimize posting times based on actual data

---

## IMPORTANT NOTES

- Use n8n-brain tools (`store_pattern`, `find_similar_patterns`, `register_credential`, `calculate_confidence`) throughout the build
- Follow existing dashboard patterns (page.tsx → data-loader → content.tsx + skeleton.tsx)
- Follow IAML Business OS documentation standards (CEO summary at top of all docs)
- Register all workflows in n8n-brain after building
- Tag all workflows with `linkedin-content-engine` in n8n
- Run Supabase migrations automatically via CLI (`supabase db push`)
- The Supabase project is `business-os-production` (already linked)

**Start with Phase 1, Step 1: Create the Supabase migration file and run it.**
