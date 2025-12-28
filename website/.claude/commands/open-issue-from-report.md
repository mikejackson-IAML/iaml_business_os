# Open GitHub Issue from QA Report Command

Create a GitHub issue from a QA report file.

## Objective

Convert QA findings into actionable GitHub issues with:
- Clear title and description
- Reproduction steps
- Appropriate labels
- Priority indication

---

## Execution Steps

### Phase 1: Read Report

1. If `--report <path>` provided, read that file
2. Otherwise, use most recent report in `qa/reports/`
3. Parse report for issues and findings

### Phase 2: Extract Issues

From the report, extract:

1. **Issue title**: Summary of the problem
2. **Description**: What was found
3. **Reproduction**: Steps to reproduce
4. **Evidence**: Screenshots, selectors, error messages
5. **Severity**: Critical, High, Medium, Low
6. **Category**: a11y, perf, security, broken-link, payments

### Phase 3: Format Issue

Using GitHub MCP, create issue with template:

```markdown
## QA Report Finding

**Report**: fullqa-20251218-143022
**Generated**: 2025-12-18 14:30:22
**Severity**: High

---

### Summary

[Clear description of the issue]

### Details

**Category**: Accessibility
**Page(s) Affected**: /register.html
**Selector**: `#firstName`

### Evidence

```
[Error message or finding details]
```

**Screenshot**: qa/screenshots/a11y/register-a11y-20251218.png

### Reproduction Steps

1. Navigate to /register.html
2. Tab through form fields
3. Observe [specific issue]

### Suggested Fix

[Recommendation from report]

### Technical Details

- Browser: Chrome 120
- Viewport: 1440x900
- Environment: localhost:3000

---

*Generated from QA report by Claude Code*
```

### Phase 4: Apply Labels

Based on category:

| Category | Labels |
|----------|--------|
| Accessibility | `bug`, `accessibility`, `priority:high` |
| Performance | `bug`, `performance` |
| Security | `bug`, `security`, `priority:critical` |
| Broken links | `bug`, `broken-link` |
| Payments | `bug`, `payments`, `priority:high` |
| Responsive | `bug`, `responsive` |

### Phase 5: Create Issue

Using GitHub MCP:

1. Create issue in repository
2. Apply labels
3. Return issue URL

---

## Output Format

```
# Issue Created

**Issue Number**: #42
**Title**: QA: Missing form label on registration email field
**URL**: https://github.com/username/IAML-1/issues/42

Labels:
- bug
- accessibility
- priority:high

---

Issue content:

## QA Report Finding

**Report**: fullqa-20251218-143022
**Severity**: High

### Summary
The email input field in the registration form is missing an associated label,
causing accessibility issues for screen reader users.

### Details
**Category**: Accessibility
**Page(s) Affected**: /register.html
**Selector**: `#email`

[... rest of issue content ...]
```

---

## Options

- `--report <path>`: Specific report file to use
- `--severity <level>`: Only create issues for this severity or higher
- `--dry-run`: Preview issue without creating

Examples:
```
/open-issue-from-report
/open-issue-from-report --report qa/reports/fullqa-20251218-143022/SUMMARY.md
/open-issue-from-report --severity high
/open-issue-from-report --dry-run
```

---

## Multiple Issues

If report contains multiple findings:

```
/open-issue-from-report --report qa/reports/a11y-20251218.md

Found 3 issues in report:

1. Missing form label (#email) - High
2. Heading hierarchy skip (h2 -> h4) - Medium
3. Image missing alt text - Medium

Options:
  a) Create all as separate issues
  b) Create single issue with all findings
  c) Select specific findings to create

Choose option (a/b/c) or specific numbers (1,3):
```

---

## Issue Templates

### Accessibility Issue
```markdown
## Accessibility Issue

**WCAG Criterion**: [e.g., 1.1.1 Non-text Content]
**Impact**: [Screen reader users cannot...]

### Finding
[Description]

### Affected Element
- Page: [URL]
- Selector: [CSS selector]
- Current state: [What it is now]
- Expected state: [What it should be]

### Suggested Fix
[Code example or description]
```

### Performance Issue
```markdown
## Performance Issue

**Metric**: [e.g., LCP, FCP, TBT]
**Current Value**: [e.g., 3.8s]
**Target Value**: [e.g., <2.5s]

### Finding
[Description of performance problem]

### Affected Page(s)
[List of URLs]

### Suggested Optimizations
1. [Optimization 1]
2. [Optimization 2]

### Potential Savings
[e.g., 1.2s improvement]
```

### Security Issue
```markdown
## Security Finding

**Severity**: [Critical/High/Medium/Low]
**Category**: [XSS/Injection/Exposure/etc.]

### Finding
[Description without exposing sensitive details]

### Affected Code
- File: [path]
- Line: [number]

### Remediation
[How to fix]

### References
- [OWASP link if applicable]
```

---

## Integration with Workflow

After running QA:
```
1. Run /fullqa
2. Review report
3. Run /open-issue-from-report for actionable findings
4. Assign issues in GitHub
5. Track in project board
```

---

## Notes

- Issues link back to report for full context
- Screenshots referenced but not uploaded (stored locally)
- Consider linking to Vercel preview if applicable
- Use consistent labels for easier filtering
