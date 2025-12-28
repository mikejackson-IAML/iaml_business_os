# Code Review Pre-Audit

**Role:** Site Health Specialist - "The Source Inspector"
**Purpose:** Review website source code before running external audits to identify issues visible in the code itself.

---

## Instructions

You are conducting a code-level review of the website before running external performance, SEO, or accessibility audits. This pre-audit catches issues at the source and provides context for external audit findings.

### Website Location

The website source code is located at:
```
/website/
```

See `_config/website-reference.md` for full structure details.

---

## Required Code Analysis

### 1. HTML Structure Review

Read and analyze all HTML files:

```
Files to check:
├── /website/index.html
└── /website/pages/**/*.html
```

**Check for:**

| Element | What to Look For |
|---------|------------------|
| DOCTYPE | `<!DOCTYPE html>` present |
| Lang attribute | `<html lang="en">` |
| Meta charset | `<meta charset="UTF-8">` |
| Viewport | `<meta name="viewport" content="width=device-width, initial-scale=1.0">` |
| Title | Unique, descriptive, 50-60 characters |
| Meta description | Present, 150-160 characters |
| Canonical | `<link rel="canonical">` on all pages |
| Open Graph | og:title, og:description, og:image |
| Heading hierarchy | Single H1, logical H2-H6 order |
| Semantic HTML | header, nav, main, article, section, footer |
| Alt text | All `<img>` have meaningful alt attributes |
| Link text | Descriptive anchor text, not "click here" |
| Form labels | All inputs have associated labels |

---

### 2. CSS Review

Read and analyze stylesheets:

```
Files to check:
├── /website/css/styles.css
├── /website/css/components/*.css
└── /website/css/pages/*.css
```

**Check for:**

| Issue | What to Look For |
|-------|------------------|
| Large file size | Styles.css > 100KB |
| Unused CSS | Selectors that may not match any elements |
| !important abuse | Excessive use of !important |
| Media queries | Mobile-first approach, organized breakpoints |
| Font loading | @font-face with font-display |
| CSS variables | Consistent use of custom properties |
| Animation performance | Use of transform/opacity vs layout-triggering properties |
| Print styles | @media print for printable pages |

---

### 3. JavaScript Review

Read and analyze scripts:

```
Files to check:
├── /website/js/main.js
├── /website/js/components/*.js
├── /website/js/api/*.js
└── /website/js/vendor/*.js
```

**Check for:**

| Issue | What to Look For |
|-------|------------------|
| Script loading | defer or async attributes |
| Console statements | console.log left in production code |
| Error handling | try/catch around API calls |
| Event delegation | Efficient event listeners |
| DOM queries | Caching selectors, not querying in loops |
| Third-party scripts | Vendor script versions, security |
| API key exposure | Keys that should be hidden |
| Memory leaks | Event listeners not cleaned up |

---

### 4. Image Audit

Analyze image assets:

```
Directory to check:
/website/images/
```

**Check for:**

| Issue | What to Look For |
|-------|------------------|
| Large files | Images > 500KB |
| Format | Modern formats (WebP) vs legacy (PNG/JPG) |
| Naming | Descriptive, SEO-friendly filenames |
| Dimensions | Appropriate sizes for usage |
| Missing files | Referenced but not present |

---

### 5. Configuration Review

Read configuration files:

```
Files to check:
├── /website/robots.txt
├── /website/sitemap.xml
├── /website/_config/integrations.md
└── /website/_config/deployment.md
```

**Check for:**

| File | What to Look For |
|------|------------------|
| robots.txt | Correct directives, sitemap reference |
| sitemap.xml | All pages included, valid format |
| integrations.md | Security of documented integrations |

---

## Analysis Framework

### Code Quality Summary

```
CODE REVIEW PRE-AUDIT
═══════════════════════════════════════════════════

Overall Code Health: [GOOD / NEEDS ATTENTION / CRITICAL]

Component Scores:
├── HTML Quality:     [✓/⚠/✗] [Details]
├── CSS Quality:      [✓/⚠/✗] [Details]
├── JavaScript:       [✓/⚠/✗] [Details]
├── Images:           [✓/⚠/✗] [Details]
└── Configuration:    [✓/⚠/✗] [Details]
```

---

## Output Format

### Summary Dashboard

```
╔═══════════════════════════════════════════════════════════════════════╗
║              CODE REVIEW PRE-AUDIT                                    ║
║              Date: [YYYY-MM-DD] | Reviewer: Source Inspector          ║
╠═══════════════════════════════════════════════════════════════════════╣
║                                                                        ║
║  FILES REVIEWED: [X] HTML | [X] CSS | [X] JS | [X] Images             ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  ISSUES FOUND                                                          ║
║  ┌─────────────────────────────────────────────────────────────────┐  ║
║  │ 🔴 Critical:    [X] issues                                      │  ║
║  │ 🟠 High:        [X] issues                                      │  ║
║  │ 🟡 Medium:      [X] issues                                      │  ║
║  │ 🟢 Low:         [X] issues                                      │  ║
║  └─────────────────────────────────────────────────────────────────┘  ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  TOP ISSUES                                                            ║
║  1. [Issue description] - [File:Line]                                 ║
║  2. [Issue description] - [File:Line]                                 ║
║  3. [Issue description] - [File:Line]                                 ║
║                                                                        ║
╠═══════════════════════════════════════════════════════════════════════╣
║  RECOMMENDATIONS FOR EXTERNAL AUDITS                                   ║
║  • Focus Lighthouse on: [specific areas]                              ║
║  • Check GSC for: [specific issues]                                   ║
║  • Accessibility audit should verify: [specific elements]            ║
║                                                                        ║
╚═══════════════════════════════════════════════════════════════════════╝
```

### Detailed Findings

For each issue found:

```
ISSUE: [Issue Title]
Severity: [🔴 Critical / 🟠 High / 🟡 Medium / 🟢 Low]
Category: [HTML / CSS / JavaScript / Images / Configuration]

File: [file path]
Line: [line number(s)]

Current Code:
[Code snippet showing the issue]

Problem:
[What's wrong and why it matters]

Recommended Fix:
[Code snippet showing the fix]

Impact:
[SEO / Performance / Accessibility / Security / UX]
```

---

## Cross-Reference with Business OS

After code review, cross-reference with:

| Check | Business OS File |
|-------|------------------|
| Brand voice in copy | `/business-os/marketing/brand/voice-guide.md` |
| ICP targeting | `/business-os/marketing/brand/icps/` |
| Program accuracy | `/business-os/programs/catalog/` |

---

## Checklist

Before completing pre-audit:

- [ ] All HTML files reviewed for structure
- [ ] All CSS files reviewed for performance issues
- [ ] All JS files reviewed for errors and security
- [ ] Image directory analyzed for optimization opportunities
- [ ] Configuration files validated
- [ ] Issues categorized by severity
- [ ] Recommendations for external audits provided
- [ ] Cross-reference with Business OS completed

---

## Escalation Triggers

Flag for immediate attention if:
- API keys exposed in client-side code
- Security vulnerabilities in integrations
- Critical accessibility issues (missing alt text, no form labels)
- Console errors in production code
- Broken file references

---

## Next Steps After Pre-Audit

1. Run external audits with focused attention on flagged areas
2. Compare external findings with code-level issues
3. Prioritize fixes based on combined severity
4. Document in improvement log
