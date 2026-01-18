# Done - Log Accomplishments

Log accomplishments before ending a session, with auto-detection of business impact from git activity.

## Usage

```
/done                           # Interactive - analyzes session and prompts
/done "Built lead scoring UI"   # Quick log with description
/done --review                  # Review today's accomplishments
```

## Workflow

### Step 1: Analyze Git Activity

Run these commands to understand what was accomplished:

```bash
# Get commits from today
git log --oneline --since="midnight" --author="$(git config user.email)" 2>/dev/null || echo "No commits today"

# Get uncommitted changes summary
git diff --stat HEAD 2>/dev/null || echo "No uncommitted changes"

# Get current branch
git branch --show-current 2>/dev/null || echo "unknown"
```

### Step 2: Auto-Detect Impact Category

For each commit and changed file, analyze using these rules:

**Commit Type Prefix Detection:**
| Prefix | Default Category |
|--------|------------------|
| `feat:` | customer_experience (or revenue if payment-related) |
| `fix:` | customer_experience |
| `perf:` | efficiency |
| `docs:` | team |
| `chore:` | foundation |
| `refactor:` | foundation |
| `style:` | customer_experience |
| `test:` | foundation |

**File Path Detection:**
| Path Pattern | Category |
|--------------|----------|
| `/migrations/`, `/schema/` | foundation |
| `/components/`, `/styles/`, `/ui/` | customer_experience |
| `/workflows/`, `/scripts/`, `/automation/` | efficiency |
| `/docs/`, `README`, `CHANGELOG` | team |
| `/auth/`, `/security/`, `/permissions/` | compliance |
| `/payments/`, `/pricing/`, `/billing/` | revenue |

**Keyword Detection (in commit messages):**
| Keywords | Category |
|----------|----------|
| payment, pricing, checkout, sales, invoice, billing, subscription, revenue, conversion, lead | revenue |
| performance, speed, optimize, cache, automation, workflow, script, batch, parallel, fast | efficiency |
| schema, migration, database, refactor, architecture, config, setup, infrastructure, deploy | foundation |
| ui, component, style, ux, accessibility, responsive, mobile, design, user | customer_experience |
| docs, documentation, readme, onboarding, process, training, guide, comment | team |
| security, auth, validation, audit, privacy, gdpr, compliance, permission, rls | compliance |

**Impact Level Detection:**
| Signal | Level |
|--------|-------|
| 50+ lines changed, multiple files | high |
| New feature (feat:) | high |
| Bug fix affecting users | medium |
| Documentation, comments | low |
| Critical path (payments, auth) | critical |

### Step 3: Present Detected Accomplishments

Display findings to the user:

```
=== SESSION ACCOMPLISHMENTS DETECTED ===

Based on your git activity today, I found:

1. [HIGH] feat: add lead scoring dashboard
   Category: customer_experience
   Files: 5 changed (+320 / -45)

2. [MEDIUM] perf: optimize PDF generation
   Category: efficiency
   Files: 2 changed (+50 / -30)

3. [LOW] docs: update README
   Category: team
   Files: 1 changed (+25 / -5)

>>> Suggested Summary:
"Built lead scoring dashboard with optimized PDF generation"

>>> Actions:
[S] Save all as-is
[E] Edit descriptions or categories
[A] Add manual accomplishment
[L] Link to goals
[C] Cancel
```

### Step 4: Link to Active Goals

Query active goals and offer linking:

```sql
SELECT * FROM accomplishments.get_active_goals();
```

Display:

```
=== ACTIVE GOALS ===

DAILY (Today):
  1. [ ] Review 3 pull requests [team]

WEEKLY (Jan 13-19):
  2. [===---] Q1 Dashboard MVP (40%) [customer_experience]
  3. [ ] Deploy lead intelligence feature [foundation]

MONTHLY (January):
  4. [======----] Ship 5 major features (3/5) [customer_experience]

QUARTERLY (Q1 2026):
  5. [=---------] Revenue dashboard live (10%) [revenue]

>>> Link accomplishment to goal? (enter numbers separated by comma, or 'skip')
```

### Step 5: Save to Database

Insert entries via Supabase MCP or direct SQL:

```sql
INSERT INTO accomplishments.entries (
  title,
  description,
  impact_category,
  impact_level,
  work_date,
  detection_source,
  git_metadata
) VALUES (
  $title,
  $description,
  $impact_category,
  $impact_level,
  CURRENT_DATE,
  $detection_source,
  $git_metadata::jsonb
);
```

If linking to goals:

```sql
INSERT INTO accomplishments.goal_entries (goal_id, entry_id, contribution_value)
VALUES ($goal_id, $entry_id, 1);
```

### Step 6: Confirm and Summarize

```
=== ACCOMPLISHMENTS LOGGED ===

3 entries saved for January 14, 2026

Today's Impact:
  - customer_experience: 1 high-impact
  - efficiency: 1 medium-impact
  - team: 1 low-impact

Goal Progress Updated:
  - Q1 Dashboard MVP: 40% -> 55% (+15%)

Run /email-summary to send a summary email now.
Run /goals to view all goals.
```

## Options

| Flag | Description |
|------|-------------|
| `--review` | View today's logged accomplishments without adding new ones |
| `--force` | Skip confirmation prompts |
| `--no-git` | Manual entry only, skip git analysis |
| `--yesterday` | Log accomplishments for yesterday |

## Quick Mode

If invoked with a description:

```
/done "Fixed the checkout bug that was blocking conversions"
```

Skip auto-detection and directly prompt:

```
Quick Log: "Fixed the checkout bug that was blocking conversions"

Suggested category: customer_experience (detected: checkout, bug, fix)
Suggested level: high (detected: blocking, conversions)

[Y] Accept and save
[E] Edit
[C] Cancel
```

## Review Mode

```
/done --review
```

Shows today's logged entries:

```
=== TODAY'S ACCOMPLISHMENTS (January 14, 2026) ===

1. [HIGH] Built lead scoring dashboard
   Category: customer_experience
   Logged: 2:30 PM
   Goals: Q1 Dashboard MVP, Ship 5 major features

2. [MEDIUM] Optimized PDF generation
   Category: efficiency
   Logged: 11:45 AM
   Goals: (none)

3. [LOW] Updated README
   Category: team
   Logged: 9:15 AM
   Goals: (none)

---
Total: 3 entries | High: 1 | Medium: 1 | Low: 1
Categories: customer_experience, efficiency, team
```

## Database Schema Reference

**accomplishments.entries columns:**
- `id` UUID
- `title` TEXT
- `description` TEXT
- `impact_category` TEXT (revenue, efficiency, foundation, customer_experience, team, compliance)
- `impact_level` TEXT (low, medium, high, critical)
- `work_date` DATE
- `detection_source` TEXT (git_commit, git_diff, session_activity, manual)
- `git_metadata` JSONB
- `session_metadata` JSONB
- `logged_at` TIMESTAMPTZ
- `user_id` TEXT

## Related Commands

- `/goals` - View and manage goals
- `/email-summary` - Send summary email
- `/goals add` - Add a new goal
