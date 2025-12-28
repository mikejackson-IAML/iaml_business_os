# Deployed Smoke Test Command

Run smoke tests against a deployed Vercel URL.

## Objective

Run the same smoke tests as `/smoke` but against a deployed environment instead of localhost.

## Configuration

- **Default**: Latest production URL
- **Options**: --prod, --preview, --url <specific-url>
- **Same-Origin Rule**: Stay within the deployed domain

---

## Execution Steps

### Phase 1: Determine Target URL

Using Vercel MCP:

1. If `--url <url>` provided, use that URL
2. If `--preview`, get latest preview deployment URL
3. Otherwise (default), get production URL

Validate the URL is accessible before proceeding.

### Phase 2: Define Test Pages

Same pages as local smoke test, but relative to deployed URL:
1. `/` (Homepage)
2. `/register.html` (Registration)
3. `/about-us` (About Us)
4. `/program-schedule` (Program Schedule)
5. `/featured-programs` (Featured Programs)
6. `/faculty` (Faculty)
7. `/programs/employee-relations-law.html` (Program page)

### Phase 3: Run Tests

Using Playwright MCP, for each page:

1. **Navigate** with cache bypass
2. **Wait** for page load
3. **Collect console errors/warnings**
4. **Monitor network failures** (4xx/5xx)
5. **Take screenshot** at 1440x900
6. **Test navigation links** (same-origin only)
7. **Check API health** (for /api/ endpoints)

### Phase 4: API Health Checks

Additional checks for deployed environment:

1. **API Endpoints**:
   - GET `/api/airtable-programs` - Should return 200
   - POST `/api/create-payment-intent` - Should return 400 (no body) or 401

2. **Response Times**:
   - Flag if any page takes >3s to load
   - Flag if any API takes >1s to respond

### Phase 5: Report Generation

```
# Deployed Smoke Test Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Target**: https://iaml.vercel.app (production)
**Deployment ID**: dpl_xxxxxxxx

---

## Summary
| Page | Status | Console Errors | Network Failures | Load Time |
|------|--------|----------------|------------------|-----------|
| / | PASS | 0 | 0 | 850ms |
| /register.html | PASS | 0 | 0 | 1.2s |
| /about-us | PASS | 0 | 0 | 780ms |
| /featured-programs | PASS | 0 | 0 | 920ms |
| /faculty | PASS | 0 | 0 | 850ms |
| /programs/employee-relations-law.html | PASS | 0 | 0 | 1.1s |

**Pages Tested**: 7
**Total Errors**: 0
**Status**: PASS

---

## API Health
| Endpoint | Status | Response Time | Notes |
|----------|--------|---------------|-------|
| /api/airtable-programs | 200 OK | 156ms | Programs data loaded |
| /api/create-payment-intent | 400 | 45ms | Expected (no body) |

---

## Performance
| Page | Load Time | Status |
|------|-----------|--------|
| / | 850ms | GOOD |
| /register.html | 1.2s | GOOD |
| /featured-programs | 920ms | GOOD |

All pages loaded in <3s (threshold).

---

## Console Messages

### Warnings (non-blocking)
- / : "Third-party cookie will be blocked" (Google Analytics)

### Errors
None

---

## Network Failures
None

---

## Navigation Tests
- Clicked 5 nav links, all resolved correctly
- External links skipped (3 total)

---

## Screenshots
- qa/screenshots/deployed/home-prod-[ts].png
- qa/screenshots/deployed/register-prod-[ts].png
- qa/screenshots/deployed/about-prod-[ts].png
...

---

## Comparison with Local

| Metric | Local | Deployed | Diff |
|--------|-------|----------|------|
| Homepage Load | 450ms | 850ms | +400ms |
| Errors | 0 | 0 | - |

Note: Deployed is slower due to network latency (expected).
```

---

## Output

Save screenshots to: `qa/screenshots/deployed/`
Save report to: `qa/reports/deployed-smoke-YYYYMMDD-HHMMSS.md`

Display summary:
```
Deployed Smoke Test Complete
============================
Target: https://iaml.vercel.app (production)
Deployment: dpl_xxxxx

Pages: 7 tested
Errors: 0 console, 0 network
API Health: All OK

Status: PASS

Full report: qa/reports/deployed-smoke-20251218-143022.md
```

---

## Options

- `--prod`: Test production URL (default)
- `--preview`: Test latest preview URL
- `--url <url>`: Test specific URL

Examples:
```
/deployed-smoke              # Test production
/deployed-smoke --preview    # Test latest preview
/deployed-smoke --url https://iaml-abc123.vercel.app  # Test specific
```

---

## Differences from Local Smoke

1. **Network latency**: Expect slower load times
2. **API health checks**: Added for deployed environment
3. **CDN caching**: May see cached responses
4. **Environment differences**: Production env vars, etc.

---

## Guardrails

1. **Same-origin enforcement**: Stay within deployed domain
2. **No mutations**: This is a read-only smoke test
3. **Rate limiting**: Add delays if hitting deployed rate limits
4. **Timeout handling**: Gracefully handle slow deployed responses

---

## When to Run

- **After deployment**: Verify deployment is healthy
- **Daily health check**: Part of daily prod health workflow
- **Before release**: Final verification of production
- **Incident response**: Quick check of production health
