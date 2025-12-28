# Broken Links Crawler Command

Crawl all same-origin links and identify broken links, anchors, and assets.

## Objective

Find all broken:
- Internal page links (404s)
- Anchor references (#id that don't exist on the target page)
- Empty or javascript: href links
- Asset references (images, CSS, JS returning 4xx/5xx)

## Configuration

- **Base URL**: http://localhost:3000 (vercel dev)
- **Crawl Depth**: 3 levels
- **Same-Origin Only**: Never leave localhost:3000
- **Timeout**: 10 seconds per request

---

## Execution Steps

### Phase 1: Seed URLs

Start crawling from these pages:
1. http://localhost:3000/
2. http://localhost:3000/register.html
3. http://localhost:3000/about-us
4. http://localhost:3000/program-schedule
5. http://localhost:3000/featured-programs
6. http://localhost:3000/programs/employee-relations-law.html

### Phase 2: Crawl Process

For each page using Playwright MCP:

1. **Navigate** to page with hard reload
2. **Extract all links**:
   - `<a href="...">` - internal page links
   - `<link href="...">` - stylesheets
   - `<script src="...">` - scripts
   - `<img src="...">` - images
   - `<source src="...">` - media sources
3. **Classify each link**:
   - Same-origin page link
   - Same-origin asset link
   - Anchor link (#id)
   - External link (skip but log)
   - Empty/invalid link (flag)
4. **For anchor links** (#id):
   - Navigate to target page
   - Check if element with that ID exists
5. **For same-origin links**:
   - Request the URL
   - Record status code
6. **Queue** new internal pages for crawling (up to depth 3)
7. **Track visited URLs** to avoid infinite loops

### Phase 3: Issue Detection

Flag the following issues:

1. **Broken Page Links (404)**
   - Page returns 404 status

2. **Server Errors (5xx)**
   - Page returns 500, 502, 503, etc.

3. **Empty href**
   - `href=""` or `href` attribute missing

4. **Hash-only href**
   - `href="#"` that doesn't link to anything meaningful

5. **javascript: href**
   - `href="javascript:void(0)"` and similar

6. **Broken Anchors**
   - `href="#section-id"` where `#section-id` doesn't exist on page

7. **Missing Assets**
   - Images, CSS, JS files returning 404/5xx

### Phase 4: Report Generation

```
# Broken Links Report
**Date**: [YYYY-MM-DD HH:MM:SS]
**Base URL**: http://localhost:3000
**Pages Crawled**: [count]
**Total Links Checked**: [count]

---

## Summary
| Issue Type | Count |
|------------|-------|
| Broken Page Links | 2 |
| Broken Anchors | 1 |
| Missing Assets | 3 |
| Empty/Invalid hrefs | 4 |
| External Links (skipped) | 15 |

---

## Broken Page Links (404)
| Source Page | Broken Link | Status | Selector |
|-------------|-------------|--------|----------|
| /index.html | /old-page.html | 404 | a[href="/old-page.html"] |
| /about-us | /team.html | 404 | footer a:nth-child(3) |

## Broken Anchors (missing #id)
| Source Page | Anchor | Target Page | Issue |
|-------------|--------|-------------|-------|
| /index.html | #team-section | /about-us | Element #team-section not found |

## Missing Assets
| Source Page | Asset URL | Type | Status | Selector |
|-------------|-----------|------|--------|----------|
| /index.html | /images/old-logo.png | image | 404 | img.logo |
| /register.html | /js/deprecated.js | script | 404 | script[src*="deprecated"] |

## Empty/Invalid hrefs
| Source Page | Issue | Selector |
|-------------|-------|----------|
| /index.html | Empty href | a.nav-link:nth-child(2) |
| /featured-programs | javascript:void(0) | button.cta |

## External Links (skipped - not checked)
- https://fonts.googleapis.com/... (12 occurrences)
- https://cdn.jsdelivr.net/... (3 occurrences)

---

## Fix Priority

### High Priority (breaks navigation)
1. [specific fix with selector]

### Medium Priority (missing assets)
1. [specific fix with selector]

### Low Priority (best practice)
1. [specific fix with selector]
```

---

## Output

Save report to: `qa/reports/links-YYYYMMDD-HHMMSS.md`

Display summary:
```
Links Check Complete
====================
Pages Crawled: 12
Links Checked: 156
Issues Found: 10

- Broken Links: 2
- Missing Assets: 3
- Empty hrefs: 4
- Broken Anchors: 1

Full report: qa/reports/links-20251218-143022.md
```

---

## Guardrails

1. **Same-origin enforcement**: Log but skip external URLs
2. **Avoid infinite loops**: Track visited URLs in a Set
3. **Rate limiting**: 100ms delay between requests
4. **Depth limit**: Stop at 3 levels deep
5. **Timeout**: Skip URLs that take >10s to respond
6. **No HTML dumps**: Only report URLs, status codes, and selectors
