# A/B Test Analysis

Analyze A/B test results and recommend winners with statistical confidence.

## Usage

```
/ab-test-analysis                                        # Interactive mode
/ab-test-analysis --campaign "Q1 ABM Sequence"           # Specify campaign
```

## Your Task

Analyze email A/B test results, determine statistical significance, and recommend winners with actionable next steps.

---

## STEP 1: Gather Test Data

### Interactive Mode

Ask these questions:

> **1. What was being tested?**
> - Subject lines
> - Send time
> - Email body/content
> - Call-to-action
> - Other: [specify]
>
> **2. Enter metrics for Variant A:**
> - Emails sent:
> - Opens:
> - Clicks:
> - Replies: (if applicable)
>
> **3. Enter metrics for Variant B:**
> - Emails sent:
> - Opens:
> - Clicks:
> - Replies: (if applicable)
>
> **4. What was the campaign/sequence name?** (for tracking)
>
> **5. What audience was this sent to?**
> - ABM (Senior HR)
> - General Prospects
> - Alumni
> - Other

---

## STEP 2: Calculate Metrics

### Calculate Rates

For each variant:
- **Open Rate** = Opens / Sent × 100
- **Click Rate** = Clicks / Sent × 100
- **Click-to-Open Rate** = Clicks / Opens × 100
- **Reply Rate** = Replies / Sent × 100 (if applicable)

### Calculate Lift

- **Lift** = (Winner Rate - Loser Rate) / Loser Rate × 100

---

## STEP 3: Determine Statistical Significance

Use a simplified significance calculation:

### Minimum Sample Size Check
- Need at least 100 sends per variant for meaningful results
- For reply rate analysis, need at least 200 sends per variant

### Significance Calculation

For open/click rates, use this simplified approach:

1. Calculate the pooled rate: p = (success_A + success_B) / (n_A + n_B)
2. Calculate standard error: SE = sqrt(p × (1-p) × (1/n_A + 1/n_B))
3. Calculate Z-score: Z = (rate_A - rate_B) / SE
4. Determine confidence:
   - |Z| > 2.58 → 99% confident
   - |Z| > 1.96 → 95% confident
   - |Z| > 1.65 → 90% confident
   - |Z| < 1.65 → Not statistically significant

---

## STEP 4: Compare to Benchmarks

Reference EMAIL_COLD_OUTREACH.md playbook benchmarks:

### Cold Outreach Benchmarks

| Metric | Below Average | Good | Great | Investigate |
|--------|---------------|------|-------|-------------|
| Open Rate | <15% | 25% | 35%+ | <15% |
| Click Rate | <1% | 3% | 5%+ | <1% |
| Reply Rate | <0.5% | 2% | 5%+ | <0.5% |
| Bounce Rate | >3% | <2% | <1% | >3% |

### Alumni Benchmarks (Warmer Audience)

| Metric | Below Average | Good | Great |
|--------|---------------|------|-------|
| Open Rate | <25% | 35% | 50%+ |
| Click Rate | <3% | 5% | 10%+ |

---

## STEP 5: Generate Analysis Report

Present the analysis in this format:

---

### A/B TEST ANALYSIS REPORT

**Campaign:** [Campaign Name]
**Test Variable:** [What was tested]
**Audience:** [Audience type]
**Analysis Date:** [Date]

---

### RESULTS SUMMARY

| Metric | Variant A | Variant B | Difference | Winner |
|--------|-----------|-----------|------------|--------|
| Sent | [n] | [n] | - | - |
| Open Rate | [%] | [%] | [+/- %] | [A/B] |
| Click Rate | [%] | [%] | [+/- %] | [A/B] |
| Click-to-Open | [%] | [%] | [+/- %] | [A/B] |
| Reply Rate | [%] | [%] | [+/- %] | [A/B] |

---

### STATISTICAL ANALYSIS

**Sample Size:** [n_A + n_B] total sends
**Minimum Required:** 200 (✅ Met / ⚠️ Marginal / ❌ Insufficient)

**Open Rate Analysis:**
- Z-score: [value]
- Confidence Level: [90% / 95% / 99% / Not significant]
- Interpretation: [Clear winner / Trending toward A/B / Too close to call]

**Click Rate Analysis:**
- Z-score: [value]
- Confidence Level: [90% / 95% / 99% / Not significant]
- Interpretation: [Clear winner / Trending toward A/B / Too close to call]

---

### RECOMMENDATION

**Winner:** [Variant A / Variant B / No clear winner]

**Confidence:** [High (99%) / Good (95%) / Moderate (90%) / Low]

**Lift:** [X]% improvement in [metric] with [variant]

**Action:**
- [ ] Implement [Variant X] as the new default
- [ ] Continue testing with larger sample
- [ ] Test a different variable next

---

### BENCHMARK COMPARISON

| Metric | This Test (Winner) | Playbook Benchmark | Status |
|--------|-------------------|-------------------|--------|
| Open Rate | [%] | [Good: X%, Great: Y%] | [✅ Great / ✅ Good / ⚠️ Below / ❌ Investigate] |
| Click Rate | [%] | [Good: X%, Great: Y%] | [✅ Great / ✅ Good / ⚠️ Below / ❌ Investigate] |

---

### NEXT TEST SUGGESTIONS

Based on this result, consider testing:

1. **[Suggestion based on what was learned]**
   - Hypothesis: [Why this might improve results]
   - Priority: High / Medium / Low

2. **[Alternative suggestion]**
   - Hypothesis: [Why this might improve results]
   - Priority: High / Medium / Low

---

### LEARNINGS TO CAPTURE

Document these insights for future campaigns:

- **What worked:** [Specific element that performed better]
- **Pattern:** [Any pattern this confirms or suggests]
- **Audience insight:** [What this tells us about the audience]

---

## STEP 6: Offer Follow-Up Actions

After presenting the analysis:

1. "Would you like me to log this result to Supabase for tracking?"
2. "Should I update the playbook with this learning?"
3. "Want me to generate the next A/B test based on these results?"

---

## Quick Analysis Mode

For quick decisions without full report:

```
/ab-test-analysis quick
```

Outputs only:
- Winner
- Confidence level
- Recommended action

---

## Batch Analysis

For analyzing multiple tests:

```
/ab-test-analysis batch
```

Will prompt for multiple test results and generate a summary report comparing all tests.
