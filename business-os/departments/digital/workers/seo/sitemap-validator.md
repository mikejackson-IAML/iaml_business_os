# Sitemap Validator

## Purpose
Validates the sitemap.xml file to ensure all pages are indexed correctly and no orphaned pages exist.

## Type
Monitor (Automated)

## Schedule
Daily at 8 AM (`0 8 * * *`)

## Validation Checks

### Sitemap Structure
- Valid XML format
- Correct namespace declarations
- All required elements present

### URL Validation
- All sitemap URLs return 200 status
- No redirect chains
- Canonical URLs match sitemap URLs
- No duplicate entries

### Completeness
- All program pages included
- No orphaned pages (pages not in sitemap but accessible)
- New pages added since last check

## Expected Pages (22 Total)

```
https://iaml.com/
https://iaml.com/about-us
https://iaml.com/faculty
https://iaml.com/featured-programs
https://iaml.com/corporate-training
https://iaml.com/program-schedule
https://iaml.com/faq
https://iaml.com/participating-organizations
https://iaml.com/privacy-policy
https://iaml.com/programs/employee-relations-law
https://iaml.com/programs/advanced-employment-law
... (14 program pages total)
```

## Alert Conditions

| Condition | Severity | Action |
|-----------|----------|--------|
| Sitemap parse error | Critical | Immediate notification |
| Page returns 404 | Critical | Remove from sitemap |
| Page returns 301 | Warning | Update sitemap URL |
| Missing program page | Major | Add to sitemap |
| Duplicate entry | Minor | Clean up sitemap |

## Implementation

```javascript
// Fetch and parse sitemap
const response = await fetch('https://iaml.com/sitemap.xml');
const xml = await response.text();
const urls = parseSitemap(xml);

// Validate each URL
for (const url of urls) {
  const check = await fetch(url, { method: 'HEAD', redirect: 'manual' });

  if (check.status === 404) {
    issues.push({ type: 'not_found', url });
  } else if (check.status === 301) {
    issues.push({ type: 'redirect', url, location: check.headers.get('location') });
  }
}

// Check for orphaned pages
const knownPages = await getKnownPages(); // From internal crawl
const orphaned = knownPages.filter(p => !urls.includes(p));
```

## Data Storage

Results stored in Supabase `sitemap_checks` table:
- `check_date`
- `total_urls`
- `valid_urls`
- `issues` (JSON array)
- `new_pages`
- `removed_pages`

## Integration

- Triggers Content Specialist review when issues found
- Notifies DevOps if sitemap file needs regeneration
- Feeds into SEO Health Score calculation
