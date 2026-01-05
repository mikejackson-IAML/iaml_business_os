# A/B Test Manager

## Purpose
Automatically monitor running A/B tests, detect when statistical significance is reached, analyze results, and recommend winners for human approval.

## Type
Hybrid (Autonomous analysis + human approval gate)

## Trigger
- **Schedule:** Every 6 hours
- **Event:** When test reaches minimum sample threshold
- **Manual:** On-demand analysis request

---

## Inputs

### Data Sources

**Smartlead MCP:**
- Active A/B tests
- Variant metrics (sends, opens, clicks, replies)
- Test configuration (what's being tested)

**Supabase:**
- Historical test results
- Baseline benchmarks by test type
- Learning patterns

**Business OS Knowledge:**
- `EMAIL_COLD_OUTREACH.md` — A/B Testing Framework section

---

## Process

### Step 1: Identify Active Tests

Query Smartlead for tests that are:
- Currently running
- Have not been concluded
- Have at least 50 sends per variant

### Step 2: Collect Test Data

For each test:
```
{
  test_id: string,
  test_name: string,
  variable_tested: "subject_line" | "send_time" | "content" | "cta",
  campaign_type: "cold_abm" | "cold_general" | "alumni",
  start_date: datetime,
  variants: [
    {
      name: "A",
      description: "Original subject line",
      sent: number,
      opens: number,
      clicks: number,
      replies: number
    },
    {
      name: "B",
      description: "New subject line with question",
      sent: number,
      opens: number,
      clicks: number,
      replies: number
    }
  ]
}
```

### Step 3: Check Minimum Sample Size

Minimum requirements from playbook:
- **Open rate tests:** 100 per variant
- **Click rate tests:** 200 per variant
- **Reply rate tests:** 300 per variant

If below minimum: Continue monitoring, don't analyze yet.

### Step 4: Calculate Statistical Significance

For each metric being tested:

**Calculate Z-score:**
```
pooled_rate = (success_A + success_B) / (n_A + n_B)
standard_error = sqrt(pooled_rate × (1 - pooled_rate) × (1/n_A + 1/n_B))
z_score = (rate_A - rate_B) / standard_error
```

**Determine Confidence:**
- |Z| > 2.58 → 99% confidence
- |Z| > 1.96 → 95% confidence
- |Z| > 1.65 → 90% confidence
- |Z| < 1.65 → Not significant

### Step 5: Determine Readiness

Test is ready for conclusion when:
- Minimum sample size met AND
- Statistical significance reached (≥95%) OR
- Maximum test duration exceeded (14 days for most tests)

### Step 6: Generate Recommendation

If test is ready:
```
{
  recommendation: "Variant B",
  confidence: "95%",
  lift: "+18% open rate",
  supporting_metrics: {
    open_rate_a: 28,
    open_rate_b: 33,
    click_rate_a: 3.2,
    click_rate_b: 3.8
  },
  action: "Implement Variant B subject line pattern",
  learning: "Question-based subject lines outperform statements for this audience"
}
```

If test is inconclusive:
```
{
  recommendation: "No clear winner",
  confidence: "68%",
  action: "Continue with Variant A (original) or extend test",
  suggestion: "Consider testing a more differentiated variable"
}
```

### Step 7: Await Human Approval

**Do NOT auto-implement.** Present recommendation and wait for:
- Approval to implement winner
- Request to extend test
- Decision to abandon test

---

## Outputs

### To Dashboard

**Active Tests Summary:**
```json
{
  "active_tests": 3,
  "ready_for_decision": 1,
  "awaiting_data": 2,
  "tests": [
    {
      "name": "Q1 ABM Subject Line",
      "status": "ready",
      "recommendation": "Variant B",
      "confidence": "95%",
      "lift": "+18%"
    }
  ]
}
```

### To Supabase

Store in `marketing_ab_tests` table:
- test_id
- test_name
- variable_tested
- campaign_type
- start_date
- end_date (when concluded)
- variant_a_metrics (JSON)
- variant_b_metrics (JSON)
- winner
- confidence_level
- lift_percent
- learning_captured
- decision_by (human who approved)
- decision_date

### Alerts

| Condition | Level | Action |
|-----------|-------|--------|
| Test reached significance | Info | Dashboard notification |
| Test ready for decision | Action Required | Dashboard + highlight |
| Test running >14 days without significance | Warning | Dashboard notification |
| Clear winner with 99% confidence | Info | Dashboard highlight |

---

## Integration Requirements

### APIs Needed
- Smartlead API (test data)
- Supabase (storage, history)

### Credentials
- `SMARTLEAD_API_KEY`
- `SUPABASE_TOKEN`

---

## Human-in-the-Loop

This worker requires human approval before implementing any changes.

**Approval Options:**
1. **Implement Winner** — Apply winning variant to future sends
2. **Extend Test** — Continue gathering data
3. **Abandon Test** — Neither variant shows meaningful difference
4. **Manual Override** — Human chooses different action

**Who Can Approve:**
- Marketing Director
- CEO

---

## n8n Implementation Notes

**Workflow Structure:**
1. Trigger: Schedule (every 6 hours)
2. Node: Fetch active tests from Smartlead
3. Node: Check sample sizes
4. Node: Calculate statistics (Code node)
5. Node: Determine readiness
6. Node: Generate recommendations
7. Node: Store analysis to Supabase
8. Node: Send notification if decision ready
9. **Wait for human approval** (separate workflow or manual trigger)
10. Node: Implement approved decision

**Estimated Runtime:** 2-5 minutes

---

## Learning Capture

When tests conclude, capture learnings:

**Categories:**
- Subject line patterns that work
- Optimal send times by segment
- CTA language effectiveness
- Content length preferences

**Storage:** `marketing_test_learnings` table in Supabase

**Use:** Feed learnings back to Email Campaign Specialist commands

---

## Status
- [ ] Spec complete
- [ ] n8n workflow created
- [ ] Approval workflow designed
- [ ] Testing complete
- [ ] Production enabled
