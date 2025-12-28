# Performance Budget Check Command

Run Lighthouse audits and apply PASS/FAIL thresholds for quality gates.

## Objective

Enforce minimum performance standards before deployment:
- Performance: >= 85 (Mobile)
- Accessibility: >= 90
- Best Practices: >= 90
- SEO: >= 90

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Mode**: Mobile (stricter, more representative of user experience)
- **Pages**: Critical paths only

---

## Thresholds

| Category | Threshold | Reasoning |
|----------|-----------|-----------|
| Performance | >= 85 | Good user experience, reasonable for content sites |
| Accessibility | >= 90 | WCAG AA compliance expectation |
| Best Practices | >= 90 | Security and modern standards |
| SEO | >= 90 | Search visibility requirements |

---

## Execution Steps

### Phase 1: Define Critical Pages

Test these pages (minimum viable set):
1. `/` (Homepage - entry point)
2. `/register.html` (Registration - conversion page)

### Phase 2: Run Mobile Audits

Using Lighthouse MCP:

For each page:
1. Run Lighthouse in Mobile mode (throttled)
2. Collect all four category scores
3. Compare against thresholds

### Phase 3: Evaluate Results

For each page and category:
- **PASS**: Score >= threshold
- **FAIL**: Score < threshold

### Phase 4: Report Generation

```
# Performance Budget Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Mode**: Mobile (throttled)

---

## Thresholds
| Category | Threshold |
|----------|-----------|
| Performance | 85 |
| Accessibility | 90 |
| Best Practices | 90 |
| SEO | 90 |

---

## Results

### Page: / (Homepage)
| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | 78 | 85 | FAIL |
| Accessibility | 92 | 90 | PASS |
| Best Practices | 95 | 90 | PASS |
| SEO | 90 | 90 | PASS |

**Page Status**: FAIL (Performance below threshold)

**Why it failed**:
- Performance: 78 (need 85, short by 7 points)

**Top fixes for Performance**:
1. Optimize LCP (Largest Contentful Paint) - currently 3.8s, need <2.5s
2. Eliminate render-blocking resources - potential 1.2s savings
3. Resize hero image - potential 0.8s savings

---

### Page: /register.html
| Category | Score | Threshold | Status |
|----------|-------|-----------|--------|
| Performance | 88 | 85 | PASS |
| Accessibility | 96 | 90 | PASS |
| Best Practices | 100 | 90 | PASS |
| SEO | 88 | 90 | FAIL |

**Page Status**: FAIL (SEO below threshold)

**Why it failed**:
- SEO: 88 (need 90, short by 2 points)

**Top fixes for SEO**:
1. Add meta description (currently missing)
2. Improve heading structure

---

## Overall Status: FAIL

**Summary**:
- Pages tested: 2
- Pages passing all thresholds: 0
- Pages failing: 2

**Blocking Issues**:
1. Homepage Performance: 78 (need 85)
2. Register SEO: 88 (need 90)

---

## Required Fixes Before Deployment

### Priority 1: Homepage Performance
- [ ] Optimize hero image (resize, WebP format)
- [ ] Defer non-critical JavaScript
- [ ] Inline critical CSS

### Priority 2: Register SEO
- [ ] Add meta description tag
- [ ] Review heading hierarchy

---

## Exit Criteria

To pass this check:
1. All pages must score >= 85 on Performance
2. All pages must score >= 90 on Accessibility
3. All pages must score >= 90 on Best Practices
4. All pages must score >= 90 on SEO

Re-run this command after making fixes.
```

---

## Output

Display results inline (no file saved for quick feedback).

If all pass:
```
Performance Budget Check: PASS

All thresholds met:
  / : Perf 87, A11y 92, BP 95, SEO 91
  /register.html : Perf 88, A11y 96, BP 100, SEO 92

Ready for deployment!
```

If any fail:
```
Performance Budget Check: FAIL

Threshold failures:
  / : Performance 78 < 85 (FAIL)
  /register.html : SEO 88 < 90 (FAIL)

See fixes above. Re-run after addressing issues.
```

---

## Exit Code Behavior

- **PASS (0)**: All pages meet all thresholds
- **FAIL (1)**: Any page fails any threshold

This allows integration with CI/CD pipelines:
```bash
# In CI, this would fail the build
npm run qa:perf-budget || exit 1
```

---

## Guardrails

1. **Mobile only**: Desktop is typically easier to pass; mobile is the real test
2. **Consistent runs**: Run 2-3 times if scores are borderline
3. **No excuses mode**: No "close enough" - either pass or fail
4. **Actionable feedback**: Every failure includes fix suggestions

---

## Adjusting Thresholds

If thresholds need adjustment (temporarily or permanently):

**Temporary relaxation** (for specific releases):
- Document the exception in the PR
- Include plan to fix

**Permanent change** (if thresholds are unrealistic):
- Update this file
- Document reasoning
- Consider site type (e-commerce needs higher perf, blogs can be lower)

---

## When to Run

- **Before merge**: Required for all PRs with CSS/JS/image changes
- **Before release**: Required for all production deployments
- **After performance work**: To verify improvements
