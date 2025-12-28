# Smoke Test Command

Run a comprehensive smoke test against the local development server using Playwright MCP.

## Objective

Verify basic site health by checking:
- Console errors/warnings
- Network request failures (4xx/5xx)
- Navigation link functionality
- Screenshot capture of key pages

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Same-Origin Rule**: NEVER navigate outside localhost:3000
- **Hard Reload**: Clear cache before each page

---

## Execution Steps

### Phase 1: Environment Check

1. Verify local server is running at http://localhost:3000
2. If not running, notify user: "Please start local server with `vercel dev`"

### Phase 2: Define Test Pages

Test the following pages in order:
1. `/` (Homepage)
2. `/register.html` (Registration)
3. `/about-us` (About Us - via Vercel rewrite)
4. `/program-schedule` (Program Schedule)
5. `/featured-programs` (Featured Programs)
6. `/faculty` (Faculty page)
7. `/programs/employee-relations-law.html` (Sample program page)

### Phase 3: For Each Page

Using Playwright MCP:

1. **Navigate** with hard reload (bypass cache)
2. **Wait** for load complete (networkidle or domcontentloaded)
3. **Collect console messages**:
   - Errors: `console.error`
   - Warnings: `console.warn`
4. **Monitor network requests** for failures:
   - 4xx responses (client errors)
   - 5xx responses (server errors)
   - Failed requests (network errors)
5. **Take screenshot** at 1440x900 viewport
6. **Test navigation links**:
   - Click 3-5 main nav links
   - Verify they resolve within localhost:3000
   - Skip external links (log them but don't click)
7. **Record load time** (DOMContentLoaded timing)

### Phase 4: Report Generation

Generate report grouped by page:

```
# Smoke Test Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Base URL**: http://localhost:3000
**Pages Tested**: 7

---

## Summary
| Page | Status | Console Errors | Network Failures | Load Time |
|------|--------|----------------|------------------|-----------|
| / | PASS/FAIL | 0 | 0 | 450ms |
| /register.html | PASS/FAIL | 2 | 1 | 1200ms |
...

---

## Page: / (Homepage)

**Status**: PASS / FAIL

### Console Messages
- [ERROR] Uncaught TypeError: Cannot read property... (main.js:123)
- [WARN] Deprecated API usage (components.js:45)

### Network Failures
- [404] GET /images/missing-logo.png
- [500] POST /api/broken-endpoint

### Navigation Links Tested
- /about-us - OK
- /featured-programs - OK
- https://fonts.google.com - SKIPPED (external)

### Screenshot
- qa/screenshots/smoke/homepage-[timestamp].png

### Load Time
- DOMContentLoaded: 450ms

---

## Page: /register.html
...
```

---

## Output

Save report to: `qa/reports/smoke-YYYYMMDD-HHMMSS.md`
Save screenshots to: `qa/screenshots/smoke/`

Display summary:
```
Smoke Test Complete
===================
Pages: 7 tested
Console Errors: 2 total
Network Failures: 1 total
Status: FAIL

Full report: qa/reports/smoke-20251218-143022.md
```

---

## Guardrails

1. **Same-origin only**: If any link points outside localhost:3000, skip it and log: "External link skipped: [URL]"
2. **Hard reload**: Use `page.reload({ waitUntil: 'networkidle' })` or equivalent cache bypass
3. **No HTML dumps**: Do not output full HTML content - only selectors and minimal snippets
4. **Minimal output**: Group issues by page, include only actionable information
5. **Screenshot paths**: Save to `qa/screenshots/smoke/` with descriptive names

---

## Success Criteria

- **PASS**: Zero console errors AND zero network failures on all pages
- **FAIL**: Any console error OR any network failure on any page
