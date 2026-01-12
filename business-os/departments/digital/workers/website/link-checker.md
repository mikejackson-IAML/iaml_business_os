# Link Checker

## Purpose
Scans the website for broken internal and external links to maintain user experience and SEO health.

## Type
Monitor (Automated)

## Schedule
Daily at 6 AM (`0 6 * * *`)

## Scope

### Pages to Scan
- Homepage
- All program pages (14 programs)
- About, Faculty, FAQ, Corporate Training
- Featured Programs
- Program Schedule

### Link Types Checked
- Internal navigation links
- External resource links
- PDF download links
- Image sources
- Script and stylesheet references

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Broken internal link | Major | Add to fix queue |
| Broken external link | Minor | Log for review |
| Missing image | Major | Add to fix queue |
| 404 on program page | Critical | Immediate notification |

## Implementation

```javascript
// Uses Playwright to crawl and check links
const crawledPages = new Set();
const brokenLinks = [];

async function checkPage(url) {
  if (crawledPages.has(url)) return;
  crawledPages.add(url);

  const page = await browser.newPage();
  await page.goto(url);

  const links = await page.$$eval('a[href]', els =>
    els.map(el => el.href)
  );

  for (const link of links) {
    const response = await fetch(link, { method: 'HEAD' });
    if (!response.ok) {
      brokenLinks.push({ source: url, target: link, status: response.status });
    }
  }
}
```

## Output Report

Daily report includes:
- Total links checked
- Broken links found (grouped by source page)
- New broken links since last check
- Fixed links since last check

## Data Storage

Results stored in Supabase `link_checks` table:
- `check_date`
- `total_links`
- `broken_links` (JSON array)
- `pages_scanned`
