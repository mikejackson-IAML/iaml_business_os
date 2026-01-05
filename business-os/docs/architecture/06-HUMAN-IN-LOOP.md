# Human-in-the-Loop Patterns & Learning

## Overview

The Business OS operates autonomously but maintains human oversight at critical decision points. This document defines:

1. **Approval Levels** — When human input is required
2. **Approval Queue** — How decisions are surfaced
3. **Feedback Capture** — How to record decisions and reasoning
4. **Learning Loop** — How the system improves over time

---

## Approval Levels

### Level 1: Autonomous

**When:** Routine, low-risk operations with no external impact

**Flow:**
```
Worker executes → Logs to Supabase → Dashboard shows activity
```

**Examples:**
- Monitoring and data collection
- Internal calculations
- Sync operations between platforms
- Scheduled tests running
- Report generation

**CEO Action:** None required. Review in activity log if interested.

---

### Level 2: Post-Hoc Review

**When:** Medium-risk actions that are reversible or correctable

**Flow:**
```
Worker executes → Logs decision + outcome → CEO can course-correct
```

**Examples:**
- A/B test variant selection
- Automated segment assignments
- Domain rotation decisions
- Lead scoring adjustments

**CEO Action:** Review periodically. Override if pattern is wrong.

**Feedback captured:** If CEO overrides, log the correction with reasoning.

---

### Level 3: Pre-Approval Required

**When:** High-risk or external-facing actions

**Flow:**
```
Worker recommends → Queued for approval → CEO approves/modifies/rejects → Executes
```

**Examples:**
- Email campaign launches
- Social media posts
- Large lead imports (>1,000)
- Domain strategy changes
- Budget allocation changes
- New automation sequences

**CEO Action:** Required before execution.

---

### Level 4: Immediate Escalation

**When:** Critical issues requiring immediate attention

**Flow:**
```
Issue detected → Alert (dashboard + notification) → CEO responds → Action taken
```

**Examples:**
- Site outage
- Registration flow broken
- Security incident
- Platform ban/restriction
- Deliverability crisis
- Payment processing failure

**CEO Action:** Immediate response required. System may take protective action automatically (e.g., pause sending).

---

## Approval Queue

*Note: The visual approval queue is planned for the future dashboard. Initially, approvals will be handled conversationally via Claude Code.*

### Queue Interface (Future)

All items requiring approval appear in a unified queue:

```
┌─────────────────────────────────────────────────────────────────┐
│ APPROVAL QUEUE                                      3 pending    │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📧 EMAIL CAMPAIGN                              2 hours ago  │ │
│ │ "California Employment Law Update"                          │ │
│ │                                                             │ │
│ │ Marketing Director recommends launch                        │ │
│ │ Audience: 1,200 contacts    Domains: 4                     │ │
│ │ Lead Intel confirms capacity available                     │ │
│ │                                                             │ │
│ │ [APPROVE] [MODIFY] [REJECT] [VIEW DETAILS]                 │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 📝 SOCIAL CONTENT                              5 hours ago  │ │
│ │ 3 LinkedIn posts for this week                             │ │
│ │                                                             │ │
│ │ [APPROVE ALL] [REVIEW INDIVIDUALLY]                        │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │ 🔧 DEPENDENCY UPDATE                           1 day ago   │ │
│ │ 2 security patches available                               │ │
│ │                                                             │ │
│ │ Digital Director recommends immediate update               │ │
│ │ Risk: Medium (known vulnerabilities)                       │ │
│ │                                                             │ │
│ │ [APPROVE] [SCHEDULE FOR WEEKEND] [VIEW DETAILS]            │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Queue Item Structure

Each approval item includes:

```json
{
  "id": "uuid",
  "department": "Marketing",
  "type": "email_campaign",
  "title": "California Employment Law Update",
  "summary": "Email campaign to 1,200 CA HR professionals",
  "recommendation": {
    "action": "approve",
    "confidence": 0.85,
    "reasoning": [
      "Similar campaign achieved 38% open rate",
      "Lead Intelligence confirms capacity",
      "Segment engagement is high"
    ]
  },
  "details": {
    "audience_size": 1200,
    "domains": ["domain1.com", "domain2.com", "domain3.com", "domain4.com"],
    "send_time": "2024-12-16T09:00:00Z",
    "subject_line": "2024 California Employment Law Changes"
  },
  "created_at": "2024-12-15T14:30:00Z",
  "status": "pending",
  "priority": "normal"
}
```

### CEO Actions

| Action | What Happens | Feedback Captured |
|--------|--------------|-------------------|
| **Approve** | Executes as recommended | Decision + timestamp |
| **Modify** | Opens edit interface, then executes modified version | Original, modification, reasoning |
| **Reject** | Does not execute, archived | Rejection + reasoning |
| **Defer** | Moves to scheduled time | New timing |

---

## Feedback Capture

Every decision generates a feedback record for learning:

### Decision Record Schema

```sql
CREATE TABLE decisions (
  id UUID PRIMARY KEY,
  department_id UUID REFERENCES departments(id),
  worker_id UUID REFERENCES workers(id),

  -- The recommendation
  recommendation TEXT,
  recommendation_reasoning JSONB,
  confidence NUMERIC,

  -- CEO response
  ceo_action TEXT,  -- 'approved', 'modified', 'rejected', 'deferred'
  ceo_modification TEXT,
  ceo_reasoning TEXT,

  -- Outcome (filled in later)
  outcome JSONB,
  outcome_vs_prediction TEXT,  -- 'better', 'as_expected', 'worse'

  -- Timestamps
  created_at TIMESTAMPTZ,
  resolved_at TIMESTAMPTZ,
  outcome_recorded_at TIMESTAMPTZ
);
```

### Example Decision Record

```json
{
  "id": "decision-123",
  "department": "Marketing",
  "worker": "Campaign Analyst",

  "recommendation": "Launch CA Employment Law campaign to 1,200 contacts",
  "recommendation_reasoning": {
    "historical_performance": "Similar campaigns: 38% avg open rate",
    "capacity_check": "Lead Intelligence confirmed 1,200 capacity",
    "segment_health": "Segment engagement score: 82/100"
  },
  "confidence": 0.85,

  "ceo_action": "modified",
  "ceo_modification": "Reduce to 800 contacts, use only top 3 domains",
  "ceo_reasoning": "Want to test smaller first, protect newer domains",

  "outcome": {
    "sent": 800,
    "open_rate": 0.41,
    "click_rate": 0.052,
    "bounces": 12,
    "conversions": 8
  },
  "outcome_vs_prediction": "better",

  "created_at": "2024-12-15T14:30:00Z",
  "resolved_at": "2024-12-15T16:45:00Z",
  "outcome_recorded_at": "2024-12-18T10:00:00Z"
}
```

---

## Learning Loop

### How the System Learns

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Action    │ ──→ │   Outcome   │ ──→ │  Compare    │
│  Executed   │     │  Measured   │     │ to Target   │
└─────────────┘     └─────────────┘     └──────┬──────┘
                                               │
                    ┌──────────────────────────┴──────────┐
                    │                                     │
                    ▼                                     ▼
             ┌─────────────┐                      ┌─────────────┐
             │   Success   │                      │   Below     │
             │ (Reinforce) │                      │  Target     │
             └─────────────┘                      └──────┬──────┘
                                                        │
                                                        ▼
                                                 ┌─────────────┐
                                                 │  Analyze &  │
                                                 │   Adjust    │
                                                 └─────────────┘
```

### Learning Categories

#### 1. Decision Pattern Learning

**What:** Learn from CEO approval patterns

**How:**
- Track approval/reject/modify rates by recommendation type
- Identify patterns in modifications
- Adjust confidence thresholds

**Example:**
> CEO has approved 12 of last 15 email campaigns without modification.
> Campaigns with >35% predicted open rate: 100% approval rate.
>
> Learning: Can increase confidence threshold for auto-suggesting
> campaigns with >35% predicted open rate.

#### 2. Performance Baseline Learning

**What:** Calibrate expectations based on actual outcomes

**How:**
- Track metrics over time by segment, channel, domain
- Update "normal" ranges
- Detect trend changes

**Example:**
> Historical open rate for CA HR segment: 34%
> Last 5 campaigns: 38%, 41%, 39%, 42%, 40%
>
> Learning: Update baseline to 40% for this segment.
> Adjust "below target" threshold accordingly.

#### 3. Threshold Calibration

**What:** Optimize alert and warning thresholds

**How:**
- Track false positive rate on alerts
- Track missed issues (false negatives)
- Adjust thresholds to optimize signal-to-noise

**Example:**
> Bounce rate warning threshold: 3%
> Last 30 days: 8 warnings triggered, 2 led to actual issues
>
> Learning: Threshold may be too sensitive. Consider raising to 4%
> or adding trend component (rising vs. stable).

#### 4. Domain Knowledge Accumulation

**What:** Build institutional knowledge about what works

**How:**
- Store successful patterns in Director knowledge base
- Record failed experiments
- Update playbooks

**Example:**
> Email subject lines with "[First Name]" personalization: +8% open rate
> Subject lines with "Update:" prefix: +5% open rate
> Subject lines over 60 characters: -12% open rate
>
> Learning: Add to email best practices in Marketing Director context.

---

## Confidence Scoring

Workers and Directors include confidence in recommendations:

### Confidence Components

```
Recommendation: Launch email campaign to CA HR Directors
Confidence: 85%

Breakdown:
├── Historical data strength: 90%
│   └── 12 similar campaigns to reference
├── Capacity verification: 95%
│   └── Lead Intelligence confirmed availability
├── Segment health: 85%
│   └── Good engagement, some recent bounces
├── Timing factors: 70%
│   └── Tuesday send (good) but holiday week (uncertain)
└── Novel elements: 75%
    └── New subject line approach being tested
```

### Confidence Calibration

Over time, track how confidence scores correlate with outcomes:

| Confidence Range | Predicted Success | Actual Success |
|------------------|-------------------|----------------|
| 90-100% | 95% | 92% | ✓ Well calibrated |
| 80-89% | 85% | 84% | ✓ Well calibrated |
| 70-79% | 75% | 68% | Slightly overconfident |
| 60-69% | 65% | 71% | Slightly underconfident |

Adjust confidence calculations based on calibration data.

---

## Autonomy Graduation

As the system proves reliable, autonomy can increase:

### Graduation Criteria

| Level | Criteria | Example |
|-------|----------|---------|
| Manual → Auto-recommend | Worker demonstrates good judgment | 10 consecutive accurate recommendations |
| Recommend → Auto-execute | CEO approves without modification | 15 consecutive approvals, no modifications |
| Auto-execute → Full autonomy | Outcomes meet targets | 30 days of target-meeting performance |

### Autonomy Settings (per decision type)

```json
{
  "email_campaign_launch": {
    "current_level": "pre_approval",
    "graduation_progress": {
      "consecutive_approvals": 8,
      "required_for_graduation": 15
    },
    "constraints": {
      "max_auto_audience": 500,
      "require_approval_above": 500
    }
  },
  "social_post": {
    "current_level": "post_hoc_review",
    "constraints": {
      "auto_approve_types": ["industry_news", "content_share"],
      "require_approval_types": ["opinion", "promotional"]
    }
  }
}
```

### CEO Override

CEO can always:
- Demote any decision type back to higher oversight
- Set hard constraints that cannot be graduated past
- Pause autonomy during uncertain periods

---

## Feedback Interface

*Note: Visual feedback interfaces are planned for the future dashboard. Initially, feedback will be captured conversationally via Claude Code.*

### Quick Feedback (In-line)

After any autonomous or post-hoc action:

```
┌─────────────────────────────────────────────────────────────────┐
│ Recent Action: Email campaign "CA Update" sent to 800           │
│                                                                  │
│ Was this the right decision?                                    │
│ [👍 Yes] [👎 No] [🤔 Discuss]                                   │
└─────────────────────────────────────────────────────────────────┘
```

### Detailed Feedback (Post-Outcome)

When outcomes are measured:

```
┌─────────────────────────────────────────────────────────────────┐
│ CAMPAIGN RESULTS: CA Employment Law Update                       │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ Predicted: 35% open rate                                        │
│ Actual: 41% open rate  ✅ Better than expected                  │
│                                                                  │
│ What contributed to the success?                                │
│ ○ Subject line was effective                                    │
│ ○ Timing was good                                               │
│ ○ Audience segment was well-targeted                            │
│ ○ Email content resonated                                       │
│ ○ Other: [________________]                                     │
│                                                                  │
│ Should we apply any learnings?                                  │
│ □ Save subject line pattern as template                         │
│ □ Update segment targeting criteria                             │
│ □ Adjust baseline expectations for this segment                 │
│                                                                  │
│ [SUBMIT FEEDBACK]                                               │
└─────────────────────────────────────────────────────────────────┘
```

---

## Summary: The Learning Flywheel

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                  │
│                    ┌─────────────────┐                          │
│                    │   System Makes  │                          │
│         ┌─────────→│  Recommendation │──────────┐               │
│         │          └─────────────────┘          │               │
│         │                                       ▼               │
│  ┌──────┴──────┐                        ┌──────────────┐        │
│  │   System    │                        │  CEO Reviews │        │
│  │  Improves   │                        │  & Decides   │        │
│  └──────┬──────┘                        └──────┬───────┘        │
│         │                                      │                │
│         │          ┌─────────────────┐         │                │
│         │          │    Feedback     │         │                │
│         └──────────│   Captured &    │◄────────┘                │
│                    │    Analyzed     │                          │
│                    └─────────────────┘                          │
│                                                                  │
│  Each cycle: System gets smarter, CEO oversight becomes lighter │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```
