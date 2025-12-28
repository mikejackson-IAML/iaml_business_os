# QA Commit Summary Command

Analyze git diff and recommend QA commands before commit.

## Objective

Before committing changes:
1. Summarize what changed
2. Recommend relevant QA commands
3. Suggest commit message
4. Identify potential risks

---

## Execution Steps

### Phase 1: Get Changes

Using Git MCP:

1. Get staged changes: `git diff --cached --name-status`
2. Get unstaged changes: `git diff --name-status`
3. Get untracked files: `git status --porcelain`

### Phase 2: Analyze Changes

Categorize changed files:

| Category | Patterns | QA Impact |
|----------|----------|-----------|
| JavaScript | `*.js`, `js/*.js` | Security, functionality |
| CSS | `*.css`, `css/*.css` | Layout, responsive |
| HTML | `*.html` | Accessibility, structure |
| API | `api/*.js` | Security, integration |
| Config | `*.json`, `*.config.js` | Build, deployment |
| Tests | `qa/*.js`, `*.spec.js` | Test coverage |
| Docs | `*.md` | Documentation |

### Phase 3: Generate Recommendations

Based on what changed:

1. **JavaScript changes** → `/semgrep-quick`, `/smoke`
2. **CSS changes** → `/responsive`, `/lighthouse-local`
3. **HTML changes** → `/a11y`, `/smoke`
4. **API changes** → `/smoke`, `/semgrep-quick`
5. **Registration changes** → `/registration-payment-gate`
6. **Multiple areas** → `/fullqa`

### Phase 4: Generate Report

```
# QA Commit Summary

**Date**: [YYYY-MM-DD HH:MM:SS]
**Branch**: feature/new-registration

---

## Changed Files

### Staged (ready to commit)
| File | Change | Lines |
|------|--------|-------|
| js/register.js | Modified | +45, -12 |
| css/3-components.css | Modified | +23, -5 |
| register.html | Modified | +8, -2 |

### Unstaged (not yet staged)
| File | Change |
|------|--------|
| js/main.js | Modified |

### Untracked (new files)
None

---

## Change Summary

**Total Files**: 4 (3 staged, 1 unstaged)

**Categories**:
- JavaScript: 2 files (register.js, main.js)
- CSS: 1 file (3-components.css)
- HTML: 1 file (register.html)

**Areas Affected**:
- Registration flow (register.js, register.html)
- Component styling (3-components.css)
- Main initialization (main.js)

---

## Recommended QA Commands

### Required (based on changes)

1. **`/smoke`** - JavaScript and HTML changed
   - Verify no console errors introduced
   - Test registration page loads

2. **`/responsive`** - CSS changed
   - Check layout at mobile/tablet/desktop
   - Verify no overflow issues

3. **`/semgrep-quick`** - JavaScript modified
   - Scan for security issues in changed code
   - Check for XSS patterns

### Recommended

4. **`/a11y`** - HTML structure changed
   - Verify accessibility maintained
   - Check form labels and headings

### Optional (comprehensive)

5. **`/fullqa`** - Multiple areas changed
   - Full suite before merge

---

## Risk Assessment

| Risk | Level | Reason | Mitigation |
|------|-------|--------|------------|
| Registration breakage | HIGH | register.js modified | Run registration test |
| Layout regression | MEDIUM | CSS changed | Check responsive screenshots |
| Security issue | LOW | JS changed | Run semgrep-quick |

---

## Suggested Commit Message

Based on the changes, here's a suggested commit message:

```
feat: Enhance registration form validation

- Add real-time email validation in register.js
- Update form styling in 3-components.css
- Improve error message display in register.html

Tech: Vanilla JS/CSS
```

Or if it's a bug fix:

```
fix: Correct registration form validation

- Fix email validation regex in register.js
- Adjust error message styling
- Update form structure for accessibility
```

---

## Pre-Commit Checklist

- [ ] Run `/smoke` - verify no console errors
- [ ] Run `/responsive` - check CSS changes
- [ ] Run `/semgrep-quick` - security scan
- [ ] Stage all intended changes
- [ ] Review diff one more time

---

## Quick Commands

```bash
# Run recommended QA
/smoke && /responsive && /semgrep-quick

# Stage and commit
git add .
git commit -m "feat: Enhance registration form validation"
```
```

---

## Output Format

Display inline summary:

```
QA Commit Summary
=================
Branch: feature/new-registration
Files: 3 staged, 1 unstaged

Changes:
  js/register.js (+45, -12)
  css/3-components.css (+23, -5)
  register.html (+8, -2)

Recommended QA:
  1. /smoke (JS/HTML changed)
  2. /responsive (CSS changed)
  3. /semgrep-quick (JS security)

Risk: HIGH - Registration flow modified

Suggested commit:
  feat: Enhance registration form validation

Run QA before commit!
```

---

## Special Cases

### No Changes
```
QA Commit Summary
=================
No changes detected.

Nothing to commit. Make some changes first!
```

### Only Documentation
```
QA Commit Summary
=================
Files: 1 staged

Changes:
  README.md (+15, -3)

Recommended QA: None required (documentation only)

Suggested commit:
  docs: Update README with new instructions
```

### API Changes
```
QA Commit Summary
=================
Files: 2 staged

Changes:
  api/create-payment-intent.js (+20, -5)
  api/airtable-registrations.js (+10, -2)

Recommended QA:
  1. /semgrep-quick (API security critical)
  2. /smoke (verify API endpoints)
  3. /registration-payment-gate (payment flow)

Risk: HIGH - Payment and registration APIs modified

⚠️ Consider extra testing of payment flow!
```

---

## Notes

- This command helps prevent pushing broken code
- Recommendations are suggestions, not requirements
- Always use judgment based on change scope
- For large changes, prefer `/fullqa`
