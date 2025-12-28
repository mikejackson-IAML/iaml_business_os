# Semgrep Full Scan Command

Comprehensive security scan of the entire repository.

## Objective

Full security audit of the codebase:
- All JavaScript files (client and server)
- All HTML files
- All CSS files (for security-relevant patterns)
- Configuration files

## Configuration

- **Target**: Entire repository
- **Rulesets**: auto, security-audit, javascript, secrets
- **Exclusions**: See .semgrepignore
- **Output**: JSON (machine-readable) + Markdown (human summary)

---

## Execution Steps

### Phase 1: Prepare Scan

1. Verify .semgrepignore is in place
2. Identify all scannable files:
   - `/js/*.js` - Client-side JavaScript
   - `/api/*.js` - Serverless functions
   - `/*.html` - Root HTML pages
   - `/pages/*.html` - Page templates
   - `/programs/*.html` - Program pages
   - `/components/*.html` - Component templates

### Phase 2: Run Full Scan

Using Semgrep MCP:

1. Scan entire repository
2. Apply all relevant rulesets:
   - `auto` - Auto-detected rules
   - `p/security-audit` - Comprehensive security audit
   - `p/javascript` - JavaScript-specific patterns
   - `p/secrets` - Secret detection
   - `p/owasp-top-ten` - OWASP Top 10 vulnerabilities

3. Collect all findings regardless of confidence level

### Phase 3: Categorize and Triage

#### Critical (Block deployment)
- Exposed API keys, tokens, passwords
- SQL/NoSQL injection
- Command injection
- Remote code execution
- SSRF vulnerabilities

#### High (Fix before next release)
- XSS vulnerabilities (DOM-based, reflected)
- Authentication bypasses
- Authorization issues
- Insecure deserialization
- Path traversal

#### Medium (Fix in backlog)
- Insecure randomness
- Missing security headers (check server config)
- Weak cryptography
- Information disclosure

#### Low (Best practice)
- Code quality issues with security implications
- Deprecated API usage
- Missing input validation (non-critical paths)

#### Noise (False positives)
- Patterns that match but are intentional/safe
- Test code
- Documentation examples

### Phase 4: Generate Reports

#### JSON Report (machine-readable)
```json
{
  "scan_date": "2025-12-18T14:30:22Z",
  "files_scanned": 45,
  "total_findings": 12,
  "findings_by_severity": {
    "critical": 0,
    "high": 2,
    "medium": 5,
    "low": 3,
    "noise": 2
  },
  "findings": [
    {
      "rule_id": "javascript.browser.security.insecure-document-method",
      "severity": "high",
      "file": "js/register.js",
      "line": 234,
      "code": "element.innerHTML = data.message;",
      "message": "Potential XSS via innerHTML",
      "fix": "Use textContent or sanitize input"
    }
  ]
}
```

#### Markdown Report (human summary)

```
# Semgrep Full Scan Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Files Scanned**: 45
**Scan Duration**: 12.3 seconds

---

## Executive Summary

| Severity | Count | Action |
|----------|-------|--------|
| Critical | 0 | Block deployment |
| High | 2 | Fix before release |
| Medium | 5 | Backlog |
| Low | 3 | Best practice |
| Noise/FP | 2 | Ignore |

**Overall Status**: REVIEW REQUIRED (2 high-severity findings)

---

## Critical Findings (Action Required)

None found.

---

## High Severity Findings

### 1. Potential XSS in Registration Form
- **Rule**: javascript.browser.security.insecure-document-method
- **File**: [js/register.js:234](js/register.js#L234)
- **Confidence**: High
- **Code**:
  ```javascript
  summaryElement.innerHTML = state.programName;
  ```
- **Issue**: innerHTML used with state variable that could contain user input
- **Impact**: Cross-site scripting if program name contains malicious HTML
- **Fix**:
  ```javascript
  summaryElement.textContent = state.programName;
  ```
- **Triage**: REAL ISSUE - programName comes from user selection

### 2. Potential XSS in Error Display
- **Rule**: javascript.browser.security.insecure-document-method
- **File**: [js/register.js:567](js/register.js#L567)
- **Confidence**: High
- **Code**:
  ```javascript
  errorDiv.innerHTML = response.error;
  ```
- **Issue**: Error message from API displayed via innerHTML
- **Impact**: XSS if API returns malicious content (unlikely but possible)
- **Fix**:
  ```javascript
  errorDiv.textContent = response.error;
  ```
- **Triage**: REAL ISSUE - API response should not be trusted

---

## Medium Severity Findings

### 1. Console.log with Sensitive Data
- **Rule**: javascript.lang.security.audit.console-log-sensitive
- **File**: [js/register.js:123](js/register.js#L123)
- **Code**: `console.log('User data:', userData);`
- **Issue**: Logging potentially sensitive user information
- **Fix**: Remove or wrap in development check

### 2. Missing CSRF Token
- **Rule**: javascript.browser.security.audit.missing-csrf-token
- **File**: [js/register.js:890](js/register.js#L890)
- **Issue**: Form submission without CSRF protection
- **Fix**: Add CSRF token to form (or verify Vercel handles this)

[... more medium findings ...]

---

## Low Severity Findings

### 1. Use of eval-like Pattern
- **Rule**: javascript.lang.security.audit.eval-like-functions
- **File**: [js/carousel.js:45](js/carousel.js#L45)
- **Code**: `new Function('return ' + config);`
- **Issue**: Dynamic code execution
- **Triage**: FALSE POSITIVE - Splide.js library code

[... more low findings ...]

---

## Noise / False Positives

### 1. Template String in innerHTML (Safe)
- **File**: [js/components.js:89](js/components.js#L89)
- **Reason**: Template uses only static strings, no user input

### 2. Fetch to External URL
- **File**: [js/main.js:23](js/main.js#L23)
- **Reason**: Intentional fetch to our own API endpoint

---

## Files by Finding Count

| File | Critical | High | Medium | Low |
|------|----------|------|--------|-----|
| js/register.js | 0 | 2 | 3 | 0 |
| js/quiz.js | 0 | 0 | 1 | 1 |
| js/modals.js | 0 | 0 | 1 | 0 |

---

## Recommended Actions

### Immediate (Before Deploy)
1. Fix innerHTML usages in register.js (lines 234, 567)
2. Review console.log statements for sensitive data

### Soon (This Sprint)
1. Add CSRF protection or verify server-side handling
2. Review error message handling for XSS

### Backlog
1. Audit third-party scripts (Splide.js, etc.)
2. Consider Content Security Policy headers

---

## Comparison with Previous Scan

| Category | Previous | Current | Change |
|----------|----------|---------|--------|
| Critical | 0 | 0 | - |
| High | 3 | 2 | -1 (improved) |
| Medium | 7 | 5 | -2 (improved) |

---

## Next Scan

Schedule next full scan:
- Before major release
- After significant JavaScript changes
- Weekly for active development
```

---

## Output

Save to:
- `qa/reports/semgrep-full-YYYYMMDD-HHMMSS.json` (machine-readable)
- `qa/reports/semgrep-full-YYYYMMDD-HHMMSS.md` (human summary)

Display summary:
```
Semgrep Full Scan Complete
==========================
Files: 45 scanned
Time: 12.3 seconds

Findings:
- Critical: 0
- High: 2 (fix required)
- Medium: 5
- Low: 3
- Noise: 2

Status: REVIEW REQUIRED

Top Priority: Fix innerHTML XSS in js/register.js (lines 234, 567)

Reports saved:
- qa/reports/semgrep-full-20251218-143022.json
- qa/reports/semgrep-full-20251218-143022.md
```

---

## Guardrails

1. **Respect .semgrepignore**: Don't scan excluded files
2. **No secrets in output**: Redact any found secrets before display
3. **Triage guidance**: Every finding includes recommended action
4. **Track progress**: Compare with previous scans when available

---

## When to Run

- **Pre-release**: Before every production deployment
- **Weekly**: During active development
- **After major changes**: New features, refactors, dependency updates
- **Security review**: As part of security audit process
