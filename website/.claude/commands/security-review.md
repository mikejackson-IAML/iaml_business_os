# Security Review Command

Perform a comprehensive daily security review of the IAML vanilla JavaScript website codebase. Generate a severity-based report identifying potential security vulnerabilities and configuration issues.

## Objective

Scan the entire IAML codebase for:
- Exposed API keys and secrets in frontend code
- Legacy direct API calls that should use proxy endpoints
- Configuration mismanagement
- XSS vulnerabilities
- Insecure data handling

Output a clear severity-based report with specific fix recommendations.

---

## Execution Steps

### Phase 1: Setup & Discovery

Start timing and gather baseline information:

```bash
# Timing for performance report
START_TIME=$(date +%s)

# Identify all files to scan
echo "Scanning project structure..."
```

Notify user: "Starting security review scan..."

### Phase 2: Critical Security Checks

#### Check 1️⃣: Exposed API Keys in Frontend Code

**What to scan:** All `.js` and `.html` files EXCEPT `/api/*` functions (server-side is OK)

**Files to search:**
- `/js/*.js` (client-side JavaScript)
- `/components/*.html` (HTML components)
- `/programs/*.html` (program pages)
- `/pages/*.html` (page templates)
- `index.html`
- Root-level `.html` files

**Search patterns:**

Use Grep tool for each pattern (run in parallel if possible):

1. **Airtable Personal Access Tokens** (high entropy pattern)
   - Pattern: `pat[A-Za-z0-9]{14,}`
   - Exclude: `/api/*` files
   - Sample match: `patXaBcDeFgHiJkL`

2. **Authorization Bearer Headers** (should not be in frontend)
   - Pattern: `Authorization:\s*Bearer\s+[A-Za-z0-9]`
   - Context: Look for actual bearer token values, not template strings
   - Sample match: `Authorization: Bearer pat...`

3. **API Key Assignments**
   - Pattern: `(api[_-]?key|apiKey|API_KEY)\s*[:=]\s*['\"]`
   - Exclude: Comments and variable declarations like `const API_KEY = ENV_CONFIG.API_KEY`
   - Sample match: `apiKey: "pat..."`

4. **AIRTABLE_API_KEY References** (should only be in /api, not frontend)
   - Pattern: `AIRTABLE_API_KEY`
   - Exclude: `/api/*` files
   - Check context: Is it being passed to fetch() or headers?

**Analysis:**
- If any matches found in frontend (NOT /api), flag as 🚨 CRITICAL
- Note file path, line number, and exact pattern match
- Suggest replacement with proxy endpoint

---

#### Check 2️⃣: Direct External API Calls from Frontend

**What to scan:** All `.js` and `.html` files EXCEPT `/api/*`

**Search for direct API endpoints:**

1. **Direct Airtable API Calls**
   - Pattern: `api\.airtable\.com`
   - Full pattern: `https?://api\.airtable\.com`
   - Impact: Frontend exposing Airtable secrets

2. **Direct GoHighLevel Calls**
   - Pattern: `leadconnectorhq\.com`
   - Impact: Webhook URLs and data exposed to client

3. **Generic Authorization Headers in Fetch**
   - Pattern: `fetch\([^)]*,\s*{[^}]*Authorization[^}]*}`
   - Impact: API keys being sent from frontend

**Analysis:**
- If any matches found in frontend code, flag as 🚨 CRITICAL
- Provide specific fix: "Use `/api/airtable-programs` proxy instead"
- Check if serverless proxy exists for this endpoint
- List exact file paths and line numbers

---

#### Check 3️⃣: Secrets Properly Gitignored

**What to check:** Git configuration and tracked files

**Gitignore verification:**

1. Read `.gitignore` file
2. Verify it contains:
   - `.env` (all variations)
   - `.env.*` (all env files)
   - `env-config.local.js`
   - `env-config.*.js`
   - `node_modules/` (if applicable)

**Git tracking verification:**

Run bash command:
```bash
git ls-files | grep -E '\\.env|\\.env\\.|env-config' || echo "No env files tracked"
```

**Analysis:**
- If gitignore is missing entries, flag as ⚠️ HIGH
- If env files are accidentally tracked in git, flag as 🚨 CRITICAL
- Suggest which entries need to be added to .gitignore

---

#### Check 4️⃣: No Secrets in Recent Git History (Optional Deep Scan)

**What to scan:** Recent commits for secrets in diffs

**Command:**
```bash
git log --all --oneline -10 | head -10
git diff HEAD~10 HEAD -- ':!.gitignore' | grep -i -E 'pat[A-Za-z0-9]{14,}|Authorization.*Bearer'
```

**Analysis:**
- If secrets found in commit diffs, flag as 🚨 CRITICAL
- Note: This is a surface-level check; serious compromise requires deeper audit
- Suggest using `git-filter-repo` for removal if needed

---

### Phase 3: High Priority Checks

#### Check 5️⃣: Legacy env-config Loading

**What to scan:** HTML files loading environment configuration

**Search pattern:** `env-config`

**Specific checks:**
1. Look for `<script src="js/env-config.local.js"></script>` in HTML files
2. Look for `ENV_CONFIG` variable usage in frontend
3. Check if this file is still needed (now that proxies handle API calls)

**Analysis:**
- If any HTML file loads `env-config.local.js`, flag as ⚠️ HIGH
- File paths: `index.html`, `programs/employee-relations-law.html`, any others
- Recommendation: "Remove env-config loading once all API calls use proxy endpoints"

---

#### Check 6️⃣: Console.log Exposure

**What to scan:** JavaScript files for debug logging

**Search pattern:** `console\.(log|error|warn|debug)\(`

**Analysis:**
- Search in `/js/` folder for console statements
- Check if they log sensitive data (API responses, form data, user info)
- Sample false positive: `console.log('Page loaded')` - this is OK
- Sample issue: `console.log('API Key:', apiKey)` - flag as ⚠️ HIGH
- Recommendation: "Remove or conditionally log only in development"

**Note:** Don't flag console.logs that are already wrapped in `if (DEBUG)` or development checks.

---

### Phase 4: Medium Priority Checks

#### Check 7️⃣: CORS Configuration Review

**What to check:** Serverless functions in `/api/`

**Scan each file in `/api/*.js` for:**
- `Access-Control-Allow-Origin` headers
- Check if set to `*` (wildcard)

**Analysis:**
- If CORS is `*` (any origin), flag as ℹ️ MEDIUM
- Provide context: "Wildcard CORS works for this project but consider restricting to `https://iaml.vercel.app` in production"
- No action required for MVP, but good to track

---

#### Check 8️⃣: Production Placeholder Values

**What to scan:** All files for placeholder/temporary values

**Search patterns:**

1. **GA4 Placeholder**
   - Pattern: `G-XXXXXXXXXX`
   - Impact: Analytics not tracking

2. **Generic Placeholders**
   - Pattern: `YOUR_[A-Z_]+` (YOUR_BASE_ID, YOUR_API_KEY, etc.)
   - Impact: Code not properly configured

3. **TODOs/FIXMEs in API-related code**
   - Pattern: `(TODO|FIXME).*api` or `(TODO|FIXME).*key`
   - Impact: Security concerns not addressed

**Analysis:**
- Flag as ℹ️ MEDIUM priority
- List files and line numbers
- Context: Is this in production or development?

---

#### Check 9️⃣: Environment Variable Validation

**What to check:** Serverless functions in `/api/`

**For each file in `/api/*.js`:**
1. Check if it validates `process.env` variables before using
2. Look for error handling when env vars are missing
3. Example bad: `const key = process.env.API_KEY` without checking if undefined
4. Example good: `const key = process.env.API_KEY || throw new Error('Missing API_KEY')`

**Analysis:**
- If validation is missing, flag as ℹ️ MEDIUM
- Recommendation: "Add validation: `if (!process.env.AIRTABLE_API_KEY) throw new Error(...)`"

---

### Phase 5: Low Priority Checks

#### Check 🔟: Input Sanitization & XSS Prevention

**What to scan:** Form handlers for unsafe DOM operations

**Search patterns:**

1. **innerHTML with User Input**
   - Pattern: `innerHTML\s*=` (check context to see if user data)
   - Look for patterns: `innerHTML = userInput` or `innerHTML = response.data`
   - Safe pattern: `innerHTML = sanitize(data)` or `textContent =`

2. **eval() Usage**
   - Pattern: `eval\(`
   - Impact: Critical security risk
   - Flag as 🚨 CRITICAL if found

3. **Unsafe JSON Parsing**
   - Pattern: `Function\(` or `new Function\(`
   - Impact: Code injection risk

**Analysis:**
- If innerHTML with user data: flag as 📋 LOW
- If eval() found: flag as 🚨 CRITICAL
- Recommendation: "Use `textContent` instead of `innerHTML` for user data"

---

#### Check 1️⃣1️⃣: localStorage Security

**What to scan:** localStorage usage in JavaScript

**Search pattern:** `localStorage\.setItem|sessionStorage\.setItem|localStorage\.getItem`

**Analysis:**
- Check what data is being stored
- Safe examples: userId (if not sensitive), preferences, visit count
- Unsafe examples: API key, password, session token, PII
- Current status: modals.js uses localStorage for popup tracking (safe)
- Flag only if sensitive data found: 📋 LOW

---

### Phase 6: Report Generation

**Collect all findings and generate report:**

#### Report Structure

```
# Security Review Report
**Date:** [Current timestamp]
**Scan Duration:** [Time in seconds]
---

## ✅ PASSED CHECKS (X/11)
- Check 1: [Result]
- Check 2: [Result]
[...all passed checks...]

## 🚨 CRITICAL ISSUES (X found)
[List critical findings with file paths, line numbers, and fixes]

## ⚠️ HIGH PRIORITY ISSUES (X found)
[List high priority findings]

## ℹ️ MEDIUM PRIORITY ISSUES (X found)
[List medium priority findings]

## 📋 LOW PRIORITY ISSUES (X found)
[List low priority findings]

## Summary
**Security Status:** [ALL CLEAR / NEEDS ATTENTION / CRITICAL ISSUES]

**Next Steps:**
1. [Priority 1 fix]
2. [Priority 2 fix]
3. [Priority 3 fix]

**Recommended Actions:**
[Code snippets and specific fixes]
```

#### Severity Levels

**🚨 CRITICAL:** Must fix before deployment
- Exposed API keys in frontend
- Direct API calls with secrets
- eval() usage
- Tracked env files in git
- Secrets in git history

**⚠️ HIGH:** Fix soon (before next release)
- Legacy env-config loading
- Console.log with sensitive data
- Missing gitignore entries

**ℹ️ MEDIUM:** Nice to fix (production polish)
- Wildcard CORS
- Placeholder values
- Missing env var validation

**📋 LOW:** Consider fixing (best practices)
- Potential XSS (innerHTML)
- localStorage concerns
- Dev-related issues

---

## Key Differentiation Rules

**Do NOT flag serverless functions in `/api/*.js` as issues for:**
- Using `process.env` variables (expected)
- Authorization headers (server-side, secure)
- Direct API calls to external services (server-side proxy, secure)

**DO flag if found in frontend files (`.js` or `.html` OUTSIDE `/api/`):**
- Any exposed credentials
- Direct external API calls
- Authorization headers with real tokens

---

## Example Output

```
# Security Review Report
**Date:** 2025-12-05 17:45:30
**Scan Duration:** 14.2 seconds

---

## ✅ PASSED CHECKS (6/11)
- No exposed API keys in frontend
- No eval() usage detected
- .gitignore properly configured
- No secrets in recent git history
- localStorage usage is safe
- Input sanitization adequate

## 🚨 CRITICAL ISSUES (2 found)

**1. Direct Airtable API Calls with Exposed Keys**
- File: components/registration-modal.html:1985
- Code: `const url = new URL('https://api.airtable.com/v0/${AIRTABLE_BASE_ID}/${tableName}');`
- Issue: AIRTABLE_API_KEY being used in Authorization header from browser
- Fix: Replace with proxy endpoint `/api/airtable-programs`

**2. env-config.local.js Exposure**
- File: index.html:36
- Code: `<script src="js/env-config.local.js"></script>`
- Issue: Loads API keys into browser namespace (even if gitignored, exposes to DevTools)
- Fix: Remove this script tag once API calls use proxy endpoints

## ⚠️ HIGH PRIORITY ISSUES (1 found)

**1. Legacy env-config Loading**
- File: programs/employee-relations-law.html:36
- Code: Same env-config.local.js loading
- Fix: Remove env-config loading, migrate API calls to proxies

## ℹ️ MEDIUM PRIORITY ISSUES (1 found)

**1. CORS Wildcard Configuration**
- File: api/airtable-programs.js:12
- Code: `'Access-Control-Allow-Origin': '*'`
- Note: Works fine for this use case, but consider restricting to your domain in production

## 📋 LOW PRIORITY ISSUES (0 found)

All good!

---

## Summary
**Security Status:** NEEDS ATTENTION

**Next Steps:**
1. Migrate `registration-modal.html` API calls to use `/api/airtable-*` proxy endpoints
2. Remove `env-config.local.js` script loading from HTML files
3. Remove legacy `env-config.js` loading fallback once proxies are fully integrated

**Recommended Actions:**

### Fix 1: Replace Direct API Calls (registration-modal.html:1985)
```javascript
// ❌ OLD (INSECURE - exposes API key in browser)
async function airtableList(tableName, opts = {}) {
  const url = new URL(`https://api.airtable.com/v0/${encodeURIComponent(AIRTABLE_BASE_ID)}/${encodeURIComponent(tableName)}`);
  // ... uses AIRTABLE_API_KEY in Authorization header
}

// ✅ NEW (SECURE - uses serverless proxy)
async function airtableList(tableName, opts = {}) {
  const url = `/api/airtable-programs?table=${tableName}`;
  const res = await fetch(url);
  // No API key needed - proxy handles authentication
}
```

### Fix 2: Remove env-config Loading (index.html:36)
```html
<!-- ❌ REMOVE -->
<script src="js/env-config.local.js"></script>
<script>
  if (typeof ENV_CONFIG === 'undefined') {
    document.write('<script src="js/env-config.js"><\/script>');
  }
</script>

<!-- Once removed, update API calls to use proxy endpoints -->
```

---

**Report Generated:** [timestamp]
**Next Review Recommended:** Tomorrow before shipping changes
```

---

## Important Notes

- **Performance:** This scan should complete in under 30 seconds
- **Accuracy:** Focus on frontend exposure; serverless functions are expected to use env vars
- **False Positives:** Filter out comments, template literals, and variable references
- **Actionable:** Always provide specific file paths and line numbers
- **Context:** Explain the "why" behind each security concern, not just the "what"

---

## Quick Reference: Search Patterns

**Use these Grep patterns to scan (run in parallel):**

```bash
# Critical: Airtable tokens
grep -rn "pat[A-Za-z0-9]\{14,\}" js/ components/ programs/ --include="*.js" --include="*.html"

# Critical: Direct Airtable URLs
grep -rn "api\.airtable\.com" js/ components/ programs/ --include="*.js" --include="*.html"

# Critical: Authorization headers
grep -rn "Authorization.*Bearer" js/ components/ programs/ --include="*.js" --include="*.html"

# High: env-config loading
grep -rn "env-config" . --include="*.html"

# High: Console logs
grep -rn "console\.\(log\|error\|warn\)" js/ --include="*.js"

# Medium: Placeholders
grep -rn "G-XXXXXXXXXX\|YOUR_" . --include="*.js" --include="*.html"

# Low: eval usage
grep -rn "eval\(" js/ --include="*.js"

# Low: localStorage
grep -rn "localStorage\." js/ --include="*.js"
```

---

## When to Run This Command

**Recommended:** Daily before final commit
- Prevents accidental exposure of secrets
- Catches incomplete migrations (like proxy endpoint changes)
- Validates configuration consistency
- Takes < 30 seconds to run

**Integration:** Consider adding as a pre-commit hook or CI check for maximum protection
