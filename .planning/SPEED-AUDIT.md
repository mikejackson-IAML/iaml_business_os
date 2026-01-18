# Speed Optimization - Week of {{DATE}}

> Auto-generated template for weekly speed optimization planning.
> Update the date and fill in sections as the audit progresses.

## Audit Summary

| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| Mobile Score | {{MOBILE_SCORE}}/100 | > 85 | {{MOBILE_STATUS}} |
| Desktop Score | {{DESKTOP_SCORE}}/100 | > 90 | {{DESKTOP_STATUS}} |
| LCP | {{LCP}}ms | < 2500ms | {{LCP_STATUS}} |
| CLS | {{CLS}} | < 0.1 | {{CLS_STATUS}} |
| Pages Audited | {{PAGES_COUNT}} | - | - |

### Week-over-Week Comparison

| Metric | This Week | Last Week | Change |
|--------|-----------|-----------|--------|
| Mobile Score | {{MOBILE_SCORE}} | {{PREV_MOBILE}} | {{MOBILE_DELTA}} |
| Desktop Score | {{DESKTOP_SCORE}} | {{PREV_DESKTOP}} | {{DESKTOP_DELTA}} |
| LCP | {{LCP}}ms | {{PREV_LCP}}ms | {{LCP_DELTA}}ms |
| Total Issues | {{TOTAL_ISSUES}} | {{PREV_ISSUES}} | {{ISSUES_DELTA}} |

---

## Issues Breakdown

| Severity | Count | Description |
|----------|-------|-------------|
| Critical | {{CRITICAL_COUNT}} | Blocking issues affecting Core Web Vitals |
| High | {{HIGH_COUNT}} | Significant impact on performance |
| Medium | {{MEDIUM_COUNT}} | Moderate impact, should address |
| Low | {{LOW_COUNT}} | Minor optimizations |

---

## Approved Fixes

The following items have been approved for implementation:

### Critical Priority

- [ ] **[SPEED-001]** {{ITEM_TITLE}}
  - Impact: {{IMPACT}}
  - Files: {{FILES}}
  - Acceptance: {{ACCEPTANCE_CRITERIA}}

### High Priority

- [ ] **[SPEED-002]** {{ITEM_TITLE}}
  - Impact: {{IMPACT}}
  - Files: {{FILES}}

### Medium Priority

- [ ] **[SPEED-003]** {{ITEM_TITLE}}

---

## Deferred Items

Items deferred to future weeks:

| Code | Title | Reason |
|------|-------|--------|
| SPEED-XXX | {{TITLE}} | {{DEFER_REASON}} |

---

## Execution Plan

### Phase 1: Preparation
- [ ] Review PRD generated from audit
- [ ] Create feature branch: `feature/speed-opt-{{DATE_COMPACT}}`
- [ ] Set up baseline measurements

### Phase 2: Implementation
- [ ] Execute fixes via Ralph loop
- [ ] Run `/speed-optimize validate` after each fix
- [ ] Track improvements per item

### Phase 3: Validation
- [ ] Run full PageSpeed audit post-implementation
- [ ] Compare against baseline
- [ ] Document improvements

### Phase 4: Learning
- [ ] Store successful patterns in n8n-brain
- [ ] Update optimization playbook if needed

---

## Execution Status

| Phase | Status | Started | Completed | Notes |
|-------|--------|---------|-----------|-------|
| PRD Generated | Pending | - | - | - |
| Ralph Loop Started | Pending | - | - | - |
| Fixes Implemented | Pending | - | - | - |
| Validation Complete | Pending | - | - | - |
| Patterns Stored | Pending | - | - | - |

---

## Post-Execution Results

### Performance Improvement

| Metric | Before | After | Improvement |
|--------|--------|-------|-------------|
| Mobile Score | {{BEFORE_MOBILE}} | {{AFTER_MOBILE}} | {{MOBILE_IMPROVEMENT}} |
| Desktop Score | {{BEFORE_DESKTOP}} | {{AFTER_DESKTOP}} | {{DESKTOP_IMPROVEMENT}} |
| LCP | {{BEFORE_LCP}}ms | {{AFTER_LCP}}ms | {{LCP_IMPROVEMENT}}ms |
| CLS | {{BEFORE_CLS}} | {{AFTER_CLS}} | {{CLS_IMPROVEMENT}} |

### Items Completed

| Code | Title | Measured Improvement |
|------|-------|---------------------|
| SPEED-001 | {{TITLE}} | {{IMPROVEMENT}} |

---

## Lessons Learned

### What Worked Well
- {{LESSON}}

### What Could Be Improved
- {{IMPROVEMENT_AREA}}

### Patterns to Store
- **Pattern Name**: {{PATTERN_DESCRIPTION}}
- **Reusability**: High/Medium/Low

---

## Next Week's Focus

Based on this audit, prioritize:
1. {{PRIORITY_1}}
2. {{PRIORITY_2}}
3. {{PRIORITY_3}}

---

## References

- **Audit ID**: {{AUDIT_ID}}
- **PRD File**: `.planning/speed-prd-{{DATE}}.json`
- **Branch**: `feature/speed-opt-{{DATE_COMPACT}}`
- **Dashboard**: [Speed Audit Dashboard](https://iaml-dashboard.vercel.app/dashboard/digital/speed-audit)
