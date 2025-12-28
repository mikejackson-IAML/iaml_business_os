# Full QA Suite Command

Run all QA checks and generate a comprehensive dated report.

## Objective

Combine all QA checks into a single comprehensive audit:
1. Smoke tests (console errors, network failures, screenshots)
2. Broken link checks (404s, missing assets, bad anchors)
3. Responsive layout tests (mobile, tablet, desktop)
4. Accessibility audit (landmarks, headings, forms, images)

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Output Directory**: `qa/reports/fullqa-YYYYMMDD-HHMMSS/`

---

## Execution Steps

### Phase 1: Pre-flight Checks

1. Verify local server is running at http://localhost:3000
2. Create timestamped report directory: `qa/reports/fullqa-YYYYMMDD-HHMMSS/`
3. Start timing

### Phase 2: Run All Checks

Execute in sequence:

#### Step 1: Smoke Test
Run the `/smoke` command logic:
- Navigate to all key pages
- Capture console errors and warnings
- Monitor network for 4xx/5xx failures
- Take baseline screenshots

#### Step 2: Link Crawler
Run the `/links` command logic:
- Crawl from seed URLs (depth 3)
- Find broken links, anchors, assets
- Check for empty/invalid hrefs

#### Step 3: Responsive Test
Run the `/responsive` command logic:
- Test at 390x844, 768x1024, 1440x900
- Check for horizontal overflow
- Capture screenshots at each viewport

#### Step 4: Accessibility Audit
Run the `/a11y` command logic:
- Check landmarks, headings, images, forms
- Verify focus indicators
- Assess keyboard navigation

### Phase 3: Generate Master Report

Create a comprehensive report with all findings:

```
# Full QA Report
**Generated**: [YYYY-MM-DD HH:MM:SS]
**Duration**: [X.X seconds]
**Base URL**: http://localhost:3000

---

## Executive Summary

| Category | Status | Issues |
|----------|--------|--------|
| Smoke Test | PASS/FAIL | X console errors, Y network failures |
| Broken Links | PASS/FAIL | X broken links, Y missing assets |
| Responsive | PASS/WARN | X overflow issues |
| Accessibility | PASS/WARN | X issues found |

### Overall Status: READY / REVIEW NEEDED / BLOCKING ISSUES

---

## Top 5 Priority Fixes

1. **[Critical]** Description - Page - Selector
2. **[High]** Description - Page - Selector
3. **[Medium]** Description - Page - Selector
4. **[Medium]** Description - Page - Selector
5. **[Low]** Description - Page - Selector

---

## 1. Smoke Test Results

### Console Errors (X total)
| Page | Error | Source |
|------|-------|--------|
| /register.html | TypeError: Cannot read... | register.js:234 |

### Network Failures (X total)
| Page | URL | Status |
|------|-----|--------|
| / | /api/missing | 404 |

### Screenshots
- qa/reports/fullqa-[ts]/screenshots/smoke/...

---

## 2. Broken Links (X total)

### Broken Page Links
| Source | Target | Status |
|--------|--------|--------|
| /index.html | /old-page | 404 |

### Missing Assets
| Source | Asset | Type | Status |
|--------|-------|------|--------|
| /index.html | /images/old.png | image | 404 |

### Invalid hrefs
| Page | Issue | Selector |
|------|-------|----------|
| /about-us | Empty href | a.nav-link |

---

## 3. Responsive Issues (X total)

### Horizontal Overflow
| Page | Viewport | Element | Overflow |
|------|----------|---------|----------|
| /register.html | 390x844 | .stepper | 30px |

### Screenshots
- qa/reports/fullqa-[ts]/screenshots/responsive/...

---

## 4. Accessibility Issues (X total)

### High Priority
| Page | Issue | Selector | Fix |
|------|-------|----------|-----|
| / | Missing alt | img.hero | Add alt="" or description |

### Medium Priority
| Page | Issue | Selector | Fix |
|------|-------|----------|-----|
| / | Heading skip | .section h4 | Use h3 instead |

---

## Files Generated

```
qa/reports/fullqa-YYYYMMDD-HHMMSS/
├── SUMMARY.md (this file)
├── smoke.md
├── links.md
├── responsive.md
├── a11y.md
└── screenshots/
    ├── smoke/
    ├── responsive/
    └── a11y/
```

---

## Next Steps

### If READY:
- Safe to commit/deploy
- Run `/lighthouse-local` for performance check before release

### If REVIEW NEEDED:
- Address top 5 priority fixes
- Re-run `/fullqa` to verify

### If BLOCKING ISSUES:
- Must fix critical issues before proceeding
- Console errors and network failures are blocking
```

---

## Output

Create directory: `qa/reports/fullqa-YYYYMMDD-HHMMSS/`

Save files:
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/SUMMARY.md` (main report)
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/smoke.md`
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/links.md`
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/responsive.md`
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/a11y.md`
- `qa/reports/fullqa-YYYYMMDD-HHMMSS/screenshots/...`

Display summary:
```
Full QA Complete
================
Duration: 45.2 seconds

Smoke Test:     PASS (0 errors, 0 failures)
Broken Links:   PASS (0 broken)
Responsive:     WARN (1 overflow issue)
Accessibility:  WARN (2 issues)

Overall Status: REVIEW NEEDED

Top Priority: Fix horizontal overflow on /register.html mobile

Full report: qa/reports/fullqa-20251218-143022/SUMMARY.md
```

---

## Guardrails

1. **Same-origin only**: All checks stay within localhost:3000
2. **Hard reload**: Clear cache before each major check
3. **Minimal output**: Summarize findings, don't dump full data
4. **Actionable**: Every issue includes a suggested fix
5. **Prioritized**: Issues ranked by severity

---

## Success Criteria

- **READY**: All checks pass or have only low-priority issues
- **REVIEW NEEDED**: Has medium-priority issues that should be addressed
- **BLOCKING ISSUES**: Has critical issues that must be fixed
