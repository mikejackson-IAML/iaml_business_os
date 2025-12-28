# Lighthouse Local Audit Command

Run Lighthouse performance audits on key pages using Lighthouse MCP.

## Objective

Audit performance, accessibility, best practices, and SEO for critical pages at both mobile and desktop configurations.

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Modes**: Mobile (throttled) and Desktop (unthrottled)
- **Categories**: Performance, Accessibility, Best Practices, SEO

---

## Execution Steps

### Phase 1: Define Target Pages

Test these pages (prioritized by traffic/importance):
1. `/` (Homepage - highest traffic)
2. `/register.html` (Registration - conversion critical)
3. `/programs/employee-relations-law.html` (Program page template)

### Phase 2: Run Audits

Using Lighthouse MCP, for each page:

#### Mobile Audit
- Emulate: Moto G4 / Mobile Chrome
- Network: Slow 4G throttling (1.6 Mbps down, 750 Kbps up)
- CPU: 4x slowdown
- Categories: All (Performance, Accessibility, Best Practices, SEO)

#### Desktop Audit
- Viewport: 1350x940
- Network: No throttling
- CPU: No slowdown
- Categories: All

### Phase 3: Collect Metrics

For each audit, capture:

**Performance Metrics**:
- First Contentful Paint (FCP)
- Largest Contentful Paint (LCP)
- Total Blocking Time (TBT)
- Cumulative Layout Shift (CLS)
- Speed Index

**Top Opportunities**:
- Render-blocking resources
- Image optimization
- Unused JavaScript/CSS
- Server response time
- Cache policy

**Top Diagnostics**:
- DOM size
- Main thread work
- JavaScript execution time
- Network requests

### Phase 4: Report Generation

```
# Lighthouse Audit Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Base URL**: http://localhost:3000
**Pages Tested**: 3
**Modes**: Mobile, Desktop

---

## Summary

### Mobile Scores
| Page | Perf | A11y | BP | SEO |
|------|------|------|-----|-----|
| / | 78 | 92 | 95 | 90 |
| /register.html | 82 | 96 | 100 | 88 |
| /programs/employee-relations-law.html | 85 | 94 | 100 | 92 |

### Desktop Scores
| Page | Perf | A11y | BP | SEO |
|------|------|------|-----|-----|
| / | 92 | 92 | 100 | 91 |
| /register.html | 95 | 96 | 100 | 88 |
| /programs/employee-relations-law.html | 97 | 94 | 100 | 92 |

---

## Page: / (Homepage)

### Mobile (Score: 78)

**Core Web Vitals**:
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | 2.1s | <1.8s | WARN |
| LCP | 3.8s | <2.5s | FAIL |
| TBT | 150ms | <200ms | PASS |
| CLS | 0.05 | <0.1 | PASS |

**Top 5 Opportunities**:
1. **Eliminate render-blocking resources** - Potential savings: 1.2s
   - /css/main.css (inline critical CSS)
   - /js/main.js (defer or async)

2. **Properly size images** - Potential savings: 0.8s
   - /images/hero-bg.jpg (serve 800px instead of 2000px)
   - /images/testimonial-1.jpg (serve 400px)

3. **Serve images in next-gen formats** - Potential savings: 0.5s
   - Convert hero-bg.jpg to WebP

4. **Enable text compression** - Potential savings: 0.3s
   - main.css, main.js not gzipped

5. **Remove unused CSS** - Potential savings: 0.2s
   - 35% of CSS unused on this page

**Diagnostics**:
- DOM size: 1,234 elements (good)
- Main thread work: 2.1s (needs improvement)
- JavaScript execution: 1.8s (high)

### Desktop (Score: 92)

**Core Web Vitals**:
| Metric | Value | Target | Status |
|--------|-------|--------|--------|
| FCP | 0.8s | <1.8s | PASS |
| LCP | 1.5s | <2.5s | PASS |
| TBT | 50ms | <200ms | PASS |
| CLS | 0.02 | <0.1 | PASS |

**Top Opportunities**:
1. Serve images in next-gen formats - 0.3s
2. Remove unused CSS - 0.1s

---

## Page: /register.html

### Mobile (Score: 82)
[Similar structure]

### Desktop (Score: 95)
[Similar structure]

---

## Page: /programs/employee-relations-law.html

### Mobile (Score: 85)
[Similar structure]

### Desktop (Score: 97)
[Similar structure]

---

## Key Recommendations

### High Impact (Do First)
1. **Inline critical CSS** for above-the-fold content
2. **Defer non-critical JavaScript** (add defer attribute)
3. **Resize hero images** to match display dimensions

### Medium Impact
1. Convert images to WebP format
2. Enable gzip/brotli compression
3. Add preload hints for critical fonts

### Low Impact (Nice to Have)
1. Remove unused CSS (tree shaking)
2. Lazy load below-fold images
3. Add resource hints (preconnect)

---

## Reports Saved

- qa/reports/lighthouse/home-mobile-[ts].html
- qa/reports/lighthouse/home-desktop-[ts].html
- qa/reports/lighthouse/register-mobile-[ts].html
- qa/reports/lighthouse/register-desktop-[ts].html
- qa/reports/lighthouse/program-mobile-[ts].html
- qa/reports/lighthouse/program-desktop-[ts].html
```

---

## Output

Save HTML reports to: `qa/reports/lighthouse/[page]-[mode]-YYYYMMDD-HHMMSS.html`
Save summary to: `qa/reports/lighthouse-YYYYMMDD-HHMMSS.md`

Display summary:
```
Lighthouse Audit Complete
=========================
Pages: 3 tested
Modes: Mobile + Desktop (6 audits)

Mobile Performance:
  / : 78
  /register.html : 82
  /programs/employee-relations-law.html : 85

Desktop Performance:
  / : 92
  /register.html : 95
  /programs/employee-relations-law.html : 97

Top Issue: Homepage LCP (3.8s) - optimize hero image

Full report: qa/reports/lighthouse-20251218-143022.md
```

---

## Guardrails

1. **Same-origin only**: Only audit localhost:3000 pages
2. **No production URLs**: This command is for local testing
3. **Consistent conditions**: Run multiple times if scores vary significantly
4. **Actionable output**: Focus on opportunities with measurable savings

---

## Notes

- Lighthouse scores can vary between runs (+/- 5 points)
- Mobile scores are typically lower due to throttling
- Focus on Core Web Vitals (LCP, FID/TBT, CLS) for Google ranking
- Best Practices and SEO scores are more stable
