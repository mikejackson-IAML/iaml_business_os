# Knowledge - Institutional Knowledge Management

Capture, search, and review institutional knowledge: decisions, lessons, tribal knowledge, constraints, and dependencies.

## Usage

```
/knowledge                      # Interactive - scan session for knowledge to capture
/knowledge capture              # Interactive knowledge capture flow
/knowledge search <query>       # Search existing knowledge
/knowledge review               # Show stale knowledge needing review
/knowledge onboard <domain>     # Get essential knowledge for a domain
/knowledge stats                # Show knowledge base statistics
```

## Workflow: Session Scan (Default)

When invoked without arguments, analyze the current session for potential knowledge to capture.

### Step 1: Scan Session for Knowledge Signals

Look for these patterns in the conversation:

**Decision Signals:**
- "Let's use X because..."
- "We chose X over Y"
- "The decision was..."
- "After considering... we went with..."
- Trade-off discussions
- Option comparisons

**Lesson Signals:**
- "The problem was..."
- "That didn't work because..."
- "We learned that..."
- "It turns out..."
- "The fix was..."
- Error → resolution patterns
- "Don't do X" or "Always do Y"

**Tribal Knowledge Signals:**
- "Mike prefers..."
- "We always..."
- "The convention is..."
- "You have to..." (workarounds)
- "The trick is..."
- Undocumented shortcuts

**Constraint Signals:**
- "The API limits..."
- "We can't because..."
- "The rate limit is..."
- "Due to X, we have to..."
- External limitations mentioned

**Dependency Signals:**
- "X depends on Y"
- "If we change X, it breaks Y"
- "This has to happen before that"
- Webhook → workflow connections
- Data flow discussions

### Step 2: Present Detected Knowledge

```
=== SESSION KNOWLEDGE DETECTED ===

DECISIONS (2 found):
1. Use Smartlead over Lemlist for cold email
   Context: Needed inbox rotation for 5k+ emails/week
   Rationale: Built-in inbox rotation beats cobbling together...
   [Capture] [Edit] [Skip]

2. Implement webhook → n8n → Supabase pattern
   Context: Need reliable data sync from external services
   Rationale: Decouples sources from database, easier debugging...
   [Capture] [Edit] [Skip]

LESSONS (1 found):
1. Gemini free tier rate limits too strict for production
   Type: failure
   Situation: Using Gemini 1.5 Flash free tier for batch classification
   Result: Hit limits after 60 requests
   Lesson: Need paid tier or chunking for batches >100
   [Capture] [Edit] [Skip]

CONSTRAINTS (1 found):
1. Smartlead API allows max 1000 leads per import
   Type: technical
   Impact: Must batch large imports
   [Capture] [Edit] [Skip]

>>> Actions:
[A] Capture all
[S] Select which to capture
[N] None / Skip all
```

### Step 3: Capture Selected Knowledge

For each item to capture, use the knowledge-brain MCP tools:

**For decisions:**
```
capture_decision({
  title: "Use Smartlead over Lemlist for cold email",
  domain: "tooling",
  department: "marketing",
  context: "Needed to send 5000+ cold emails/week...",
  options: [
    { name: "Smartlead", pros: ["Inbox rotation"], cons: ["Learning curve"] },
    { name: "Lemlist", pros: ["Better UI"], cons: ["No native rotation"] }
  ],
  decision: "Smartlead",
  rationale: "Inbox rotation is critical for deliverability at our volume...",
  tradeoffs_accepted: ["Clunkier UI"],
  review_date: "2026-07-01",
  source: "claude_session",
  source_reference: "<session_id>"
})
```

**For lessons:**
```
capture_lesson({
  title: "Gemini free tier rate limits too strict for production",
  lesson_type: "failure",
  domain: "n8n",
  situation: "Using Gemini 1.5 Flash free tier for lead classification",
  action: "Ran workflow against 500 leads batch",
  result: "Hit rate limits after 60 requests, workflow failed",
  lesson: "Gemini free tier allows ~60 RPM. For batch processing >100 items, need paid tier or implement chunking with delays.",
  applies_when: "Any n8n workflow using Gemini for batch processing",
  does_not_apply_when: "Real-time single-request use cases",
  impact_level: "medium",
  source: "claude_session"
})
```

**For tribal knowledge:**
```
capture_tribal({
  title: "Always run /smoke before deploy",
  knowledge_type: "convention",
  domain: "deployment",
  content: "Run /smoke command before every production deploy to catch issues",
  context: "Prevents deploying broken code to production",
  example: "/smoke && /deploy production",
  source: "claude_session"
})
```

**For constraints:**
```
capture_constraint({
  title: "Smartlead API max 1000 leads per import",
  constraint_type: "technical",
  domain: "email",
  description: "Smartlead API limits imports to 1000 leads per request",
  reason: "API rate limiting by vendor",
  impact: "Must batch large imports into chunks of 1000",
  limit_value: "1000 leads",
  limit_type: "volume",
  source: "claude_session"
})
```

### Step 4: Confirm and Summarize

```
=== KNOWLEDGE CAPTURED ===

Captured 4 items:
- 2 decisions
- 1 lesson
- 1 constraint

All items have been embedded for semantic search.

Run /knowledge search <topic> to find this knowledge later.
Run /knowledge review to check for stale knowledge.
```

## Workflow: Manual Capture

```
/knowledge capture
```

Interactive flow:

```
=== CAPTURE KNOWLEDGE ===

What type of knowledge?
[D] Decision - A choice that was made
[L] Lesson - Something learned from experience
[T] Tribal - Preference, convention, workaround
[C] Constraint - Limitation or restriction
[P] Dependency - What depends on what

>>> Selection: D

--- CAPTURE DECISION ---

Title: [user input]
Domain (tooling/process/architecture/vendor/strategy): [user input]
Context (what problem prompted this?): [user input]
What options were considered? [user input]
What was decided? [user input]
Why? (the rationale): [user input]
Trade-offs accepted: [user input]
When should this be reviewed? (YYYY-MM-DD or blank): [user input]

>>> Capturing decision...
>>> Decision captured: "Use X over Y for Z"
>>> Embedding generated for semantic search.
```

## Workflow: Search

```
/knowledge search deliverability
```

Uses hybrid search (semantic + keyword):

```
=== KNOWLEDGE SEARCH: "deliverability" ===

Found 5 results:

DECISIONS:
1. [0.89] Use Smartlead over Lemlist for cold email
   Domain: tooling | Decided: 2026-01-10
   "Inbox rotation is critical for deliverability at our volume..."

2. [0.75] Implement email warmup before campaigns
   Domain: process | Decided: 2025-12-15
   "New inboxes need 2-week warmup for optimal deliverability..."

LESSONS:
3. [0.82] Cold email deliverability drops below 90% without warmup
   Type: discovery | Domain: email
   "Running cold campaigns on unwarmem inboxes..."

CONSTRAINTS:
4. [0.78] Smartlead inbox rotation requires 3+ inboxes
   Type: technical | Domain: email
   "Inbox rotation feature requires minimum 3 active inboxes..."

5. [0.71] GHL email sending limit 5000/day per sub-account
   Type: technical | Domain: ghl
   "Each GHL sub-account limited to 5000 emails per day..."

>>> [number] View full details
>>> [Q] Quit search
```

## Workflow: Review Stale Knowledge

```
/knowledge review
```

Shows knowledge needing verification:

```
=== STALE KNOWLEDGE REVIEW ===

DECISIONS PAST REVIEW DATE (2):
1. Use Lemlist for email templates [47 days overdue]
   Domain: tooling | Review date: 2025-12-01
   [R] Mark reviewed | [S] Supersede | [D] Deprecate

2. Airtable for campaign tracking [12 days overdue]
   Domain: tooling | Review date: 2026-01-05
   [R] Mark reviewed | [S] Supersede | [D] Deprecate

CONSTRAINTS NOT VERIFIED IN 90+ DAYS (3):
1. GHL webhook retry limit: 3 attempts [102 days]
   Domain: ghl
   [V] Verify still valid | [I] Invalidate

2. Smartlead API rate limit: 100 req/min [95 days]
   Domain: email
   [V] Verify still valid | [I] Invalidate

3. n8n memory limit: 256MB per execution [91 days]
   Domain: n8n
   [V] Verify still valid | [I] Invalidate

TRIBAL KNOWLEDGE NOT VERIFIED IN 180+ DAYS (1):
1. Always restart n8n after credential changes [195 days]
   Type: workaround | Domain: n8n
   [V] Verify still accurate | [U] Update | [D] Delete

>>> Total stale: 6 items
>>> [A] Review all interactively
>>> [number] Review specific item
```

## Workflow: Onboarding Pack

```
/knowledge onboard n8n
```

Returns essential knowledge for a domain:

```
=== ONBOARDING: n8n Domain ===

KEY DECISIONS (3):
1. Use webhook → n8n → Supabase pattern
   Rationale: Decouples sources from database...

2. Gemini for AI classification over OpenAI
   Rationale: Better cost/performance for structured output...

3. Store workflow patterns in n8n-brain
   Rationale: Enables learning and reuse...

HIGH-IMPACT LESSONS (2):
1. [FAILURE] Gemini free tier rate limits too strict for production
   → Need paid tier or chunking for batches >100

2. [BEST_PRACTICE] Always test workflows with small batches first
   → Catches errors before processing thousands of records

ACTIVE CONSTRAINTS (4):
1. n8n execution timeout: 60 seconds default
2. Memory limit: 256MB per execution
3. Supabase RPC timeout: 10 seconds
4. Webhook response must be under 6MB

TRIBAL KNOWLEDGE (2):
1. [WORKAROUND] Restart n8n after credential changes
2. [CONVENTION] Prefix workflow names with domain: n8n-brain-sync

CRITICAL DEPENDENCIES (1):
1. Supabase → n8n webhooks
   If Supabase is down, all webhooks fail silently
```

## Workflow: Statistics

```
/knowledge stats
```

Shows knowledge base health:

```
=== KNOWLEDGE BASE STATISTICS ===

TOTALS:
- Decisions: 15 (12 active, 2 superseded, 1 deprecated)
- Lessons: 28 (8 failures, 12 discoveries, 8 best practices)
- Tribal: 22 (5 preferences, 8 conventions, 6 workarounds, 3 contacts)
- Constraints: 19 (16 active, 3 invalidated)
- Dependencies: 11 (all active)
- Vendors: 8 evaluations
- Processes: 4 documented

HEALTH:
- Stale decisions: 2 past review date
- Stale constraints: 3 not verified in 90+ days
- Stale tribal: 1 not verified in 180+ days

TOP DOMAINS:
1. n8n (34 items)
2. email (18 items)
3. ghl (15 items)
4. marketing (12 items)

EMBEDDING COVERAGE:
- 98% of knowledge has embeddings
- 2 items pending embedding generation
```

## Knowledge-Brain MCP Tools Reference

The `/knowledge` command uses these MCP tools from knowledge-brain:

| Tool | Purpose |
|------|---------|
| `search_knowledge` | Hybrid semantic + keyword search |
| `get_knowledge_context` | Get all knowledge about a topic |
| `get_onboarding_pack` | Essential knowledge for a domain |
| `get_stale_knowledge` | Items needing review |
| `capture_decision` | Save a decision |
| `capture_lesson` | Save a lesson |
| `capture_tribal` | Save tribal knowledge |
| `capture_constraint` | Save a constraint |
| `capture_dependency` | Save a dependency |
| `verify_*` | Mark knowledge as verified |

## Integration with /done

When `/done` is invoked, offer to scan for knowledge:

```
=== SESSION COMPLETE ===

Accomplishments logged: 3

>>> Knowledge detected in this session:
- 1 potential decision
- 2 potential lessons

Would you like to capture this knowledge before ending?
[Y] Yes, review and capture
[N] No, skip
```

## Related Commands

- `/done` - Log accomplishments (integrates with knowledge capture)
- `/goals` - View and manage goals
- `search_knowledge` MCP tool - Direct search access
