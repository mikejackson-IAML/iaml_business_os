# Semgrep Quick Scan Command

Scan only changed files for security issues before commit.

## Objective

Fast security scan of modified files to catch issues before they're committed:
- DOM XSS vulnerabilities
- Dangerous sink usage
- Exposed secrets
- Insecure patterns

## Configuration

- **Target**: Changed files only (via Git MCP)
- **Rulesets**: auto, security, javascript
- **Exclusions**: See .semgrepignore

---

## Execution Steps

### Phase 1: Get Changed Files

Using Git MCP:

1. Get uncommitted changes:
   ```
   git diff --name-only HEAD
   ```

2. Get staged changes:
   ```
   git diff --name-only --cached
   ```

3. Combine and filter to relevant files:
   - Include: `*.js`, `*.html`, `*.css`
   - Include: `api/*.js` (serverless functions)
   - Exclude: Files in .semgrepignore

### Phase 2: Run Semgrep

Using Semgrep MCP:

1. Scan only the changed files
2. Apply rulesets:
   - `auto` - Auto-detected rules for the language
   - `p/security-audit` - Security-focused rules
   - `p/javascript` - JavaScript-specific rules

3. Focus on high-confidence findings:
   - Skip experimental rules
   - Skip info-level findings

### Phase 3: Triage Findings

Categorize each finding:

#### Must Fix Now (Blocking)
- Exposed API keys or secrets
- SQL injection
- Command injection
- Eval with user input
- Obvious XSS (innerHTML with unsanitized input)

#### Fix Soon (High Priority)
- Potential XSS patterns
- Insecure randomness
- Missing input validation
- Insecure HTTP usage

#### Likely Noise (Review)
- Pattern matches that are false positives
- Intentional patterns (e.g., innerHTML with sanitized content)
- Test code patterns

### Phase 4: Report

```
# Semgrep Quick Scan Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Files Scanned**: 3
**Time**: 2.3 seconds

---

## Changed Files
- js/register.js (+45, -12 lines)
- css/3-components.css (+23, -5 lines)
- pages/featured-programs.html (+8, -2 lines)

---

## Findings Summary
| Severity | Count |
|----------|-------|
| Critical | 0 |
| High | 1 |
| Medium | 2 |
| Low | 0 |

---

## Must Fix Now (Blocking)

None found.

---

## Fix Soon (High Priority)

### 1. Potential XSS via innerHTML
- **File**: js/register.js:234
- **Rule**: javascript.browser.security.insecure-document-method.insecure-document-method
- **Code**:
  ```javascript
  element.innerHTML = userResponse.message;
  ```
- **Issue**: Setting innerHTML with data from API response
- **Fix**: Use textContent instead, or sanitize with DOMPurify
  ```javascript
  element.textContent = userResponse.message;
  // OR
  element.innerHTML = DOMPurify.sanitize(userResponse.message);
  ```

---

## Likely Noise (Review)

### 1. Template literal with variable
- **File**: js/register.js:156
- **Rule**: javascript.lang.security.audit.unsafe-template-string
- **Code**:
  ```javascript
  const html = `<div class="${className}">...</div>`;
  ```
- **Assessment**: False positive - className is not user input
- **Action**: No fix needed (safe pattern)

### 2. Fetch to external URL
- **File**: js/register.js:89
- **Rule**: javascript.browser.security.audit.external-resource-load
- **Code**:
  ```javascript
  fetch('/api/airtable-programs')
  ```
- **Assessment**: False positive - this is our own API proxy
- **Action**: No fix needed

---

## Recommendations

1. **Review innerHTML usage** in register.js:234
   - Consider if the API response could contain malicious HTML
   - Use textContent if plain text is expected

2. **No blocking issues** - safe to commit after review

---

## Next Steps

If findings require fixes:
1. Address "Fix Soon" items
2. Re-run `/semgrep-quick` to verify
3. Proceed with commit

If all clear:
1. Safe to commit
2. Consider running `/semgrep-full` before release
```

---

## Output

Display inline (quick feedback, no file saved):

If issues found:
```
Semgrep Quick Scan
==================
Files: 3 scanned
Time: 2.3s

Findings:
- Critical: 0
- High: 1 (review required)
- Medium: 2 (likely noise)
- Low: 0

High Priority:
  js/register.js:234 - Potential XSS via innerHTML

Review the findings above. Address high priority items before commit.
```

If clean:
```
Semgrep Quick Scan
==================
Files: 3 scanned
Time: 2.1s

No security issues found in changed files.
Safe to commit!
```

---

## Guardrails

1. **Changed files only**: Don't scan entire repo (that's /semgrep-full)
2. **Fast feedback**: Should complete in <5 seconds
3. **Triage required**: Not all findings are real issues
4. **No secrets in output**: If secrets are found, redact in display
5. **Respect .semgrepignore**: Skip configured exclusions

---

## When to Run

- **Before every commit**: Quick check of your changes
- **In PR review**: Verify no new issues introduced
- **After code review**: Before addressing feedback

---

## Integration with Workflow

Recommended commit workflow:
1. Make changes
2. Run `/semgrep-quick`
3. Address any "Must Fix" items
4. Review "Fix Soon" items
5. Commit if clean or acceptable
