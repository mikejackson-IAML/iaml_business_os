# Post QA Summary on PR Command

Run QA suite and post results as a PR comment.

## Objective

Provide QA visibility on pull requests:
1. Run comprehensive QA checks
2. Format results for PR review
3. Post comment on the PR
4. Help reviewers assess quality

---

## Execution Steps

### Phase 1: Identify PR

1. If `--pr <number>` provided, use that PR
2. Otherwise, detect current branch and find associated PR
3. Verify PR exists and is open

### Phase 2: Run QA Suite

Run these checks against the PR's preview deployment or local:

1. **`/fullqa`** - Smoke, links, responsive, a11y
2. **`/lighthouse-local`** - Performance audit
3. **`/semgrep-quick`** - Security scan of changed files

### Phase 3: Format Results

Create markdown comment suitable for PR:

```markdown
## QA Report Summary

| Check | Status | Details |
|-------|--------|---------|
| Smoke Test | ✅ PASS | 0 errors, 0 warnings |
| Broken Links | ✅ PASS | 0 broken, 156 checked |
| Responsive | ⚠️ WARN | 1 overflow issue |
| Accessibility | ✅ PASS | 0 critical, 1 medium |
| Lighthouse (Mobile) | 🔵 85 | Perf: 85, A11y: 92, BP: 95, SEO: 90 |
| Semgrep | ✅ PASS | 0 security issues |

### Overall: ⚠️ Review Recommended

---

### Issues Found

#### Responsive (1 warning)

**Horizontal overflow on mobile**
- Page: `/register.html`
- Viewport: 390x844
- Element: `.stepper-container`
- Overflow: 30px

**Suggested fix**: Add `max-width: 100%` or `overflow-x: auto` to stepper container.

---

### Lighthouse Scores

| Page | Performance | Accessibility | Best Practices | SEO |
|------|-------------|---------------|----------------|-----|
| / | 85 | 92 | 95 | 90 |
| /register.html | 88 | 96 | 100 | 88 |

**Top Opportunity**: Optimize hero image (potential 0.8s savings)

---

### Screenshots

<details>
<summary>View responsive screenshots</summary>

- [Homepage Mobile](qa/screenshots/responsive/home-mobile.png)
- [Homepage Tablet](qa/screenshots/responsive/home-tablet.png)
- [Homepage Desktop](qa/screenshots/responsive/home-desktop.png)
- [Register Mobile](qa/screenshots/responsive/register-mobile.png) ⚠️

</details>

---

### Recommendations

1. **Before merge**: Fix responsive overflow on register page
2. **Consider**: Optimize hero image for better mobile performance
3. **Optional**: Address medium-priority a11y finding

---

*QA run by Claude Code • [timestamp]*
*Target: [preview URL or localhost]*
*Duration: 45.2 seconds*
```

### Phase 4: Post Comment

Using GitHub MCP:

1. Post comment on the PR
2. Return comment URL

---

## Output Format

Display summary and confirmation:

```
PR Comment Posted
=================
PR: #123 - Add new registration flow
Comment URL: https://github.com/user/IAML-1/pull/123#issuecomment-xxx

QA Summary:
- Smoke: PASS
- Links: PASS
- Responsive: WARN (1 issue)
- A11y: PASS
- Lighthouse: 85 mobile
- Semgrep: PASS

Recommendation: Review responsive issue before merge
```

---

## Options

- `--pr <number>`: Specific PR number
- `--preview`: Run against preview deployment
- `--local`: Run against localhost (default)
- `--skip-lighthouse`: Skip Lighthouse (faster)
- `--update`: Update existing comment instead of new

Examples:
```
/pr-comment-qa --pr 123
/pr-comment-qa --pr 123 --preview
/pr-comment-qa --pr 123 --skip-lighthouse
```

---

## Comment Formatting

### Status Icons
- ✅ PASS - All checks passed
- ⚠️ WARN - Minor issues, review recommended
- ❌ FAIL - Blocking issues found
- 🔵 Score - Numeric score (Lighthouse)

### Collapsible Sections
Use `<details>` for verbose output:

```markdown
<details>
<summary>View full console output</summary>

[detailed output here]

</details>
```

### Screenshots
Reference local paths (reviewers can request uploads if needed):
```markdown
- [Screenshot name](qa/screenshots/path.png)
```

---

## Update Mode

With `--update`, find and update existing QA comment:

```
/pr-comment-qa --pr 123 --update

Updating existing QA comment...
Previous comment: https://github.com/.../issuecomment-abc
Updated with latest results.
```

This prevents multiple QA comments on the same PR.

---

## Automated Usage

Can be triggered from CI:

```yaml
- name: Post QA comment
  run: |
    # Run QA and post comment
    # (In practice, would use the command or script)
```

Or manually after pushing changes:
```
git push
/pr-comment-qa --pr 123 --preview
```

---

## Best Practices

1. **Run against preview**: More representative than local
2. **Update, don't spam**: Use `--update` for subsequent runs
3. **Link to artifacts**: Reference screenshot paths
4. **Clear recommendations**: Tell reviewers what to do
5. **Include timing**: Helps understand test duration

---

## Error Handling

### PR Not Found
```
PR #123 not found or is closed.
Please verify the PR number and try again.
```

### Permission Error
```
Unable to post comment on PR #123.
Check GitHub token permissions (needs write access to issues).
```

### QA Failure
```
QA suite encountered errors:
- Lighthouse failed: Network error

Partial results will be posted with error note.
```

---

## Notes

- Requires GitHub token with PR comment permissions
- Large comments may be truncated by GitHub
- Screenshots are local paths (not uploaded)
- Consider linking to Vercel preview for full context
