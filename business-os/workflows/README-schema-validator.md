# Schema Validator

> **CEO Summary:** This workflow runs weekly to verify that key pages have structured data (JSON-LD schema) that helps Google understand our content. It checks for Organization schema on the homepage and Course/Event schema on program pages—essential for rich search results.

## Overview

```
Schedule (Weekly)
       │
       ▼
 Get Pages (5 key URLs)
       │
       ▼
 Fetch Each Page
       │
       ▼
 Analyze Schemas
       │
       ▼
 Has Issues?
       │
       ├── No ──► All OK (silent)
       │
       └── Yes ──► Slack Alert
```

## Schedule

- **Runs:** Weekly (every 7 days)
- **Trigger:** Schedule

## What It Does

1. **Checks 5 key pages:**
   - Homepage
   - Employment Law Update (program)
   - Advanced Employment Law (program)
   - About page
   - Faculty page
2. **Extracts JSON-LD structured data** from each page
3. **Validates:**
   - JSON syntax is valid
   - Homepage has Organization or WebSite schema
   - Program pages have Course or Event schema
   - All pages have at least some structured data
4. **Alerts** if any issues found

## Expected Schema Types

| Page Type | Expected Schema |
|-----------|-----------------|
| Homepage | Organization, WebSite |
| Program pages | Course, Event, or Product |
| About page | Organization |
| Faculty page | Person (optional) |

## Why Structured Data Matters

- **Rich search results** - Star ratings, event dates, prices in Google
- **Knowledge panel** - Organization info in Google sidebar
- **Voice search** - Better answers for voice assistants
- **SEO boost** - Google understands content better

## Alerts

| Condition | What Happens |
|-----------|--------------|
| Invalid JSON-LD syntax | Slack alert |
| Homepage missing Organization | Slack alert |
| Program page missing Course/Event | Slack alert |
| Page has no structured data | Slack alert |

**Slack Alert Format:**
```
Schema Validator Alert

Pages Checked: 5
Total Schemas: 12
Issues: 2

• Program page missing Course/Event schema
  https://www.iaml.com/programs/new-seminar
• No structured data found
  https://www.iaml.com/faculty
```

## Setup

### Prerequisites

1. **Slack webhook** configured

### Import Workflow

1. Go to n8n → Workflows → Import from File
2. Import `schema-validator.json`
3. Workflow is self-contained
4. Activate the workflow

**n8n Workflow ID:** `AqUWODfMaJOhS6fb`

## Testing Structured Data

To manually test structured data:

1. Go to [Google Rich Results Test](https://search.google.com/test/rich-results)
2. Enter the page URL
3. Review detected schemas and any errors

## Example Valid Schema

```json
{
  "@context": "https://schema.org",
  "@type": "Course",
  "name": "Employment Law Update",
  "description": "Annual update on employment law...",
  "provider": {
    "@type": "Organization",
    "name": "Institute for Applied Management & Law"
  }
}
```

## Related

- [Meta Tag Auditor](README-meta-tag-auditor.md) - Checks title/description
- [Indexability Checker](README-indexability-checker.md) - Checks robots directives
- [Digital Department](../departments/digital/DEPARTMENT.md) - Owns SEO
