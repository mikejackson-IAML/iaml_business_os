# Content Scanner

Scan website content to create an inventory of all copy for optimization analysis.

## Usage

```
/content-scan                        # Scan all pages
/content-scan /programs              # Scan only program pages
/content-scan /programs/[slug].html  # Scan single page
/content-scan --output=json          # Output as JSON file
```

## Your Task

Scan the website HTML files and extract all content elements for analysis.

---

## WHAT TO EXTRACT

### For Each Page

1. **Meta Tags**
   - `<title>` - Page title
   - `<meta name="description">` - Meta description
   - `<meta name="keywords">` - Keywords
   - Open Graph tags (og:title, og:description)
   - Canonical URL

2. **Headings**
   - H1 (should be exactly 1 per page)
   - H2 headings (section titles)
   - H3 headings (subsections)
   - Check heading hierarchy (no skipped levels)

3. **Hero Section**
   - Hero headline
   - Hero description/subheadline
   - Hero CTA button text

4. **CTAs (Call to Action)**
   - All button text
   - Link text for primary actions
   - Registration/enrollment buttons

5. **Content Sections**
   - Section headlines
   - Key paragraph text
   - Benefit lists
   - Feature lists

6. **FAQ Content**
   - Questions
   - Answers (first 200 chars)

7. **Testimonials**
   - Count of testimonials
   - Sample testimonial text

---

## SCAN PROCESS

### Step 1: Identify Pages to Scan

If no path specified, scan all:
```
/website/index.html
/website/pages/*.html
/website/programs/*.html (exclude _template.html)
```

### Step 2: Parse Each HTML File

For each file:
1. Read the HTML content
2. Parse using regex or DOM methods
3. Extract elements listed above
4. Check for issues (missing meta, duplicate H1, etc.)

### Step 3: Generate Inventory

Create a structured inventory with all extracted content.

---

## OUTPUT FORMAT

### Summary (Always Show)

```markdown
## Content Scan Results

**Pages Scanned:** [count]
**Last Scan:** [timestamp]

### Quick Stats
| Metric | Count |
|--------|-------|
| Total Pages | X |
| Program Pages | X |
| Landing Pages | X |
| Missing Meta Descriptions | X |
| Missing H1 | X |
| Duplicate Titles | X |

### Issues Found
1. [page] - Missing meta description
2. [page] - Multiple H1 tags
3. [page] - Title too long (>60 chars)
```

### Detailed Inventory (JSON)

Save to `/website/content-analysis/inventory.json`:

```json
{
  "generated_at": "2025-12-29T12:00:00Z",
  "total_pages": 37,
  "pages": [
    {
      "path": "/programs/workplace-investigations.html",
      "type": "program",
      "meta": {
        "title": "Workplace Investigations Certificate | IAML",
        "title_length": 45,
        "description": "Master workplace investigations in 2 days...",
        "description_length": 155,
        "keywords": "workplace investigations, HR training, ...",
        "canonical": "https://iaml.com/programs/workplace-investigations"
      },
      "headings": {
        "h1": ["Master Workplace Investigations"],
        "h1_count": 1,
        "h2": ["What You Will Learn", "Our Faculty", "FAQ"],
        "h2_count": 3
      },
      "hero": {
        "headline": "Master Workplace Investigations",
        "description": "Stop hoping workplace complaints...",
        "cta_text": "Enroll Now - 2 Days, 13 Credits, $1,575"
      },
      "ctas": [
        {"text": "Enroll Now", "type": "primary"},
        {"text": "View Curriculum", "type": "secondary"}
      ],
      "faq_count": 10,
      "testimonial_count": 45,
      "issues": []
    }
  ]
}
```

---

## ISSUE DETECTION

### SEO Issues
- Missing `<title>` tag
- Title > 60 characters
- Missing meta description
- Meta description > 160 characters
- Missing or multiple H1 tags
- Missing canonical URL

### Content Issues
- Hero section missing headline
- No CTA buttons found
- Empty FAQ section

### Brand Voice Issues (Quick Check)
- Contains "course" or "class"
- Contains "training seminar"
- Contains "students" or "teachers"

---

## INTEGRATION

This scan output is used by:
- `/content-optimize` - To identify pages needing optimization
- `/brand-voice-check` - To validate content against guidelines
- n8n workflows - For automated monitoring

To trigger optimization for pages with issues:
```
/content-optimize --from-scan
```
