# SEO Optimization for Program Pages

Comprehensive SEO audit and optimization for IAML program pages using MCP servers and structured data enhancements.

## Usage

```
/seo-optimize [program-slug or file path]
```

Examples:
- `/seo-optimize comprehensive-labor-relations`
- `/seo-optimize website/programs/employee-relations-law.html`

---

## Your Task

You are performing a full SEO audit and optimization on an IAML program page. This includes:

1. **Data Collection** - Gather search performance and keyword data via MCP servers
2. **SEO Analysis** - Identify gaps in structured data, meta tags, and content
3. **Schema Implementation** - Add FAQPage and BreadcrumbList schemas
4. **Content Fixes** - Fix price discrepancies, update meta tags based on research
5. **Validation** - Verify all schemas are valid

---

## PHASE 1: Identify Target Page

### Step 1.1: Resolve File Path

If user provided a slug (e.g., `comprehensive-labor-relations`):
- Target file: `website/programs/[slug].html`

If user provided a path, use it directly.

Verify the file exists. If not, list available program pages:
```bash
ls website/programs/*.html
```

### Step 1.2: Extract Program Info

Read the target HTML file and extract:
- **Program Name**: From `<h1>` tag
- **Program Slug**: From filename or canonical URL
- **Current Price**: From Course schema `offers.price`
- **Canonical URL**: From `<link rel="canonical">`

Report to user:
```
=== Target Page ===
Program: [Name]
File: website/programs/[slug].html
URL: https://iaml.com/programs/[slug]
Price: $[price]
```

---

## PHASE 2: MCP Data Collection

### Step 2.1: Google Search Console (if available)

Query GSC for the page URL:
- Last 90 days of search data
- Top queries by impressions
- CTR and position data

**What to look for:**
- Queries with high impressions but low CTR (meta optimization needed)
- Queries ranking position 4-10 (quick wins)
- Keywords not in current meta description

If GSC MCP is not available, note this and continue.

### Step 2.2: Lighthouse SEO Audit

Run Lighthouse on the live URL (if deployed) or note to run locally:
- Categories: SEO, Performance
- Document current SEO score
- List any SEO warnings or failures

If Lighthouse MCP is not available, use PageSpeed Insights API or note to validate manually.

### Step 2.3: DataForSEO Keyword Research

Research keywords related to the program:
1. Primary keyword (e.g., "[program name] training")
2. Related keywords from the `teaches` array in Course schema
3. Long-tail variations

**Extract:**
- Search volume for target keywords
- Keyword difficulty
- SERP features (FAQ boxes, featured snippets present?)

If DataForSEO MCP is not available, use WebSearch to research competitors and keyword intent.

### Step 2.4: Report Findings

Present a summary:
```
=== SEO Data Collection Results ===

Google Search Console:
- Top query: "[query]" - [X] impressions, [Y]% CTR, position [Z]
- Opportunity: "[query]" has [X] impressions but only [Y]% CTR
- [Or: GSC data not available]

Lighthouse:
- SEO Score: [X]/100
- Issues: [list any]
- [Or: Lighthouse not run]

Keyword Research:
- Primary: "[keyword]" - [volume] monthly searches
- Related: [list 3-5 keywords]
- SERP features: [FAQ boxes present? Featured snippets?]

>>> Continue with optimization? [Y/n]
```

---

## PHASE 3: SEO Analysis

### Step 3.1: Check Existing Structured Data

Search for existing schemas in the `<head>`:
```
Existing Schemas:
✓ Course - [present/missing]
✗ FAQPage - [present/missing]
✗ BreadcrumbList - [present/missing]
✗ AggregateRating - [present/missing]
```

### Step 3.2: Locate FAQ Content

Search for FAQ section in HTML (usually has class `faq-section` or `faq-item`):
- Count number of FAQ items
- Extract questions and answers for schema

### Step 3.3: Check for Content Issues

Look for:
- **Price discrepancies**: Compare Course schema price vs FAQ mentions vs button text
- **Credit discrepancies**: Compare FAQ credit mentions vs meta description
- **Missing alt text**: Any images without alt attributes
- **Heading hierarchy**: Proper H1 → H2 → H3 structure

### Step 3.4: Meta Tag Analysis

Compare current meta tags against keyword research:
- Is primary keyword in title?
- Is primary keyword in meta description?
- Are important related keywords missing?

Report issues:
```
=== SEO Issues Found ===

Structured Data:
- [ ] FAQPage schema missing ([X] FAQ items exist)
- [ ] BreadcrumbList schema missing

Content Issues:
- [ ] Price mismatch: Schema says $[X], FAQ says $[Y]
- [ ] [Other issues]

Meta Optimization:
- [ ] Missing keyword "[X]" in meta description
- [ ] Title could include "[X]" for better ranking

>>> Proceed with fixes? [Y/n]
```

---

## PHASE 4: Implementation

### Step 4.1: Add FAQPage Schema

**Location**: Insert after Course schema, before `</head>`

Generate FAQPage schema from extracted FAQ content:
```json
{
  "@context": "https://schema.org",
  "@type": "FAQPage",
  "mainEntity": [
    {
      "@type": "Question",
      "name": "[Question text]",
      "acceptedAnswer": {
        "@type": "Answer",
        "text": "[Answer text - clean HTML, escape quotes]"
      }
    }
    // ... repeat for each FAQ
  ]
}
```

**Important:**
- Escape special characters in JSON (quotes, ampersands)
- Remove HTML tags from answer text
- Include 8-10 most relevant FAQ items (not all if there are many)
- Ensure FAQ answer matches any corrected prices/credits

### Step 4.2: Add BreadcrumbList Schema

**Location**: After FAQPage schema, before `</head>`

```json
{
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  "itemListElement": [
    {
      "@type": "ListItem",
      "position": 1,
      "name": "Home",
      "item": "https://iaml.com/"
    },
    {
      "@type": "ListItem",
      "position": 2,
      "name": "Programs",
      "item": "https://iaml.com/featured-programs"
    },
    {
      "@type": "ListItem",
      "position": 3,
      "name": "[Program Name]",
      "item": "https://iaml.com/programs/[slug]"
    }
  ]
}
```

### Step 4.3: Fix Content Issues

For each issue found in Phase 3:

**Price discrepancy:**
- Update FAQ question/answer to match Course schema price
- Ensure button text matches

**Credit discrepancy:**
- Verify correct credit count
- Update FAQ answer if needed

**Missing keywords:**
- Update meta description to include high-value keywords (stay under 160 chars)
- Update meta keywords tag

### Step 4.4: Optional - AggregateRating Schema

If testimonials with star ratings exist, consider adding to Course schema:
```json
"aggregateRating": {
  "@type": "AggregateRating",
  "ratingValue": "5.0",
  "bestRating": "5",
  "worstRating": "1",
  "ratingCount": [count of testimonials]
}
```

**Note:** Only add if testimonials appear to be genuine reviews. Skip if unsure.

---

## PHASE 5: Validation

### Step 5.1: JSON Syntax Check

Verify all JSON-LD schemas are valid:
- No trailing commas
- Properly escaped quotes
- Correct nesting

### Step 5.2: Schema Validation

Provide validation links:
```
=== Validate Your Schemas ===

After deploying, test with:
1. Google Rich Results Test:
   https://search.google.com/test/rich-results?url=https://iaml.com/programs/[slug]

2. Schema Markup Validator:
   https://validator.schema.org/

Expected results:
- Course: ✓ Valid (eligible for course rich results)
- FAQPage: ✓ Valid (eligible for FAQ rich snippets)
- BreadcrumbList: ✓ Valid (eligible for breadcrumb display)
```

### Step 5.3: Re-run Lighthouse (if available)

Run another Lighthouse audit to verify:
- SEO score improved or maintained
- No new warnings introduced

---

## PHASE 6: Summary Report

```
=== SEO Optimization Complete ===

Page: [Program Name]
File: website/programs/[slug].html

Changes Made:
✓ Added FAQPage schema ([X] questions)
✓ Added BreadcrumbList schema
✓ Fixed price: $[old] → $[new] in FAQ
✓ [Other changes]

Structured Data Now Present:
✓ Course
✓ FAQPage (NEW)
✓ BreadcrumbList (NEW)

Expected SERP Impact:
- FAQ rich snippets (increased SERP real estate)
- Breadcrumb navigation under title
- [Other improvements]

Next Steps:
1. Commit changes
2. Deploy to production
3. Validate with Rich Results Test
4. Monitor GSC for impression/CTR changes (2-4 weeks)
```

---

## Important Rules

1. **Preserve existing schemas** - Don't modify Course schema unless fixing errors
2. **Match prices exactly** - FAQ answers must match Course schema price
3. **Escape JSON properly** - Quotes, ampersands, special chars
4. **Keep FAQ answers concise** - Google truncates long answers in rich snippets
5. **Don't invent content** - Only use existing FAQ content for schema
6. **Validate before reporting success** - Ensure JSON is syntactically correct

---

## Quick Reference: Common Issues

| Issue | How to Fix |
|-------|------------|
| No FAQPage schema | Extract from `.faq-item` elements |
| No BreadcrumbList | Add standard 3-level breadcrumb |
| Price mismatch | Update FAQ to match Course schema |
| Missing keyword in meta | Edit meta description (keep <160 chars) |
| GA4 placeholder | Note for user to update (don't auto-fix) |

---

## Files Modified

This command typically modifies only one file:
- `website/programs/[slug].html`

No new files are created.
