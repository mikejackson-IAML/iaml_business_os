# New Program Page Generator (SEO-Enhanced)

Generate a new IAML program page with integrated SEO research and optimization.

## Prerequisites

Before running this command, ensure:
- Program exists in Airtable with the correct slug
- Faculty members are linked to the program in Airtable
- Airtable view IDs are created for session filtering

## Your Task

You are generating a new program page for IAML with SEO optimization. This command handles:
1. **Data collection** - Gather program information from user
2. **SEO research** - Automatically research keywords and generate optimized metadata
3. **Page generation** - Create optimized HTML with enhanced meta tags
4. **SEO validation** - Run Lighthouse audit to verify SEO quality

---

## PHASE 1: Check for Existing Data

First, check if `programs/data/[program-slug].json` exists:
- **If exists**: Read it and ask "I found existing data for this program. Should I use it, or do you want to update it?"
- **If not exists**: Proceed to Phase 2 (Data Collection)

---

## PHASE 2: Interactive Data Collection

Guide the user through data entry step by step. For each section, wait for user input before proceeding.

### Step 2.1: Basic Program Info
Ask for all at once:
```
Let's set up your program page. Please provide:

1. **Program Name** (as it appears in Airtable):
2. **Program Slug** (URL-friendly, e.g., "strategic-hr-management"):
3. **Registration URL** (external registration link, or "#" as placeholder):
4. **Enrollment Fee** (number only, e.g., 2375):
5. **Duration** (e.g., "4½ days", "3 days", "2 days"):
6. **Delivery Options** (comma-separated: In Person, Virtual, On Demand):
```

### Step 2.2: SEO & Meta (AUTO-GENERATED)

**DO NOT ask the user for SEO input.** Instead:

1. Use WebSearch to research keywords related to the program name
2. Analyze competitor pages and search intent
3. Auto-generate optimized metadata:
   - **Page Title**: `[Program Name] | IAML` (include "Training" if relevant)
   - **Meta Description**: 150-160 chars focusing on outcomes, duration, and credits
   - **Keywords**: 6-10 relevant keywords from research
   - **OG Image**: Use default `https://iaml.com/images/og-image.jpg`

4. Present the generated SEO data to the user for confirmation:
```
=== Auto-Generated SEO Metadata ===

Based on keyword research, I've generated:

Page Title: [generated title]
Meta Description: [generated description]
Keywords: [generated keywords]

>>> These look good? [Y/n to customize]
```

If user says "n", allow customization. Otherwise, proceed.

### Step 2.3: Hero Content
```
Hero section content:

1. **Hero Title** (can include <br> for line breaks):
2. **Hero Description** (main value proposition, 2-3 sentences):
```

### Step 2.4: Content Section (next to testimonials)
```
Content section (appears next to testimonials):

1. **Headline** (e.g., "Build Employment Law Expertise That Protects and Advances"):
2. **Description** (include program duration with emphasis):
3. **Key Benefits** (paste as bullet points, I'll format them):
```

### Step 2.5: Testimonials
```
Testimonials - paste in any format:

Accepted formats:
- "Quote text" - Name, Title, Company
- Quote | Name | Title | Company
- Or just paste a spreadsheet/CSV export

Paste your testimonials (or type "skip" to add later):
```

### Step 2.6: Curriculum
```
Curriculum structure - How many blocks? (1-3):
```

For single-block programs (like 2-day advanced programs):
```
Since this is a single cohesive program, I'll create one curriculum block.

Paste your curriculum content. Format:
- Group title and description on first line
- Skills with levels (FOUNDATION/ADVANCED/EXPERT) and descriptions below

Example:
New Administration Agenda - Prepare for What's Coming
FOUNDATION — DOL enforcement priorities: Understand the new administration's focus
ADVANCED — NLRB policy shifts: Navigate changes to joint-employer tests
EXPERT — Contractor classification: Anticipate rule changes on gig worker status
```

For multi-block programs:
```
Block [N] details:
1. **Label** (e.g., "Block I"):
2. **Title** (e.g., "Comprehensive Labor Relations"):
3. **Description** (1-2 sentences):
4. **Price** (individual block price):

Now list competency groups for Block [N].
```

### Step 2.7: Faculty (DYNAMIC FROM AIRTABLE)

**DO NOT ask the user for faculty information.**

Faculty is loaded dynamically from Airtable:
1. The HTML page includes `data-program-slug="[slug]"` on the faculty section
2. The `/js/faculty.js` script fetches faculty from cache or Airtable API
3. Faculty must be linked to the program in Airtable via the `PROGRAMS (Faculty)` field

Simply confirm with the user:
```
Faculty will be loaded dynamically from Airtable.

Please ensure:
- Faculty members are linked to "[Program Name]" in Airtable
- Each faculty member has: name, title, bio, and headshot photo

>>> Faculty is set up in Airtable? [Y/n]
```

If "n", remind them to set up faculty in Airtable before the page will display correctly.

### Step 2.8: FAQ
```
FAQ section (8-12 questions):

Paste your Q&A pairs in any format:
- Question? Answer text here.
- Or: Q: Question | A: Answer

Paste your FAQs:
```

### Step 2.9: Benefits Section (SKIP - USE TEMPLATE)

**DO NOT ask the user for benefits section input.**

The benefits section uses the template's default content and styling. Simply use the values from the FAQ content:
- Extract credit count from FAQ answers (e.g., "13.75 SHRM/HRCI/CLE")
- Use default update period: "12 months"
- Extract alumni discount from FAQ answers (e.g., "$300")

If these values aren't clear from the FAQ, use sensible defaults based on the program duration.

### Step 2.10: Airtable View IDs
```
Airtable View Configuration:

These view IDs connect your program to Airtable session data.
Create filtered views in Airtable for this program, then paste the view IDs below.

Based on your delivery options ([list options]), I need:

1. **In-Person View ID** (required):
   Example: viwfys9oVCU3gFsel
```

Only ask for Virtual and On-Demand view IDs if those delivery options were specified:
```
2. **Virtual View ID**:
   Example: viwG1w68D5qVdMHIa

3. **On-Demand View ID**:
   Example: viw123456789abcd
```

---

## PHASE 3: Generate JSON Data File

After collecting all data, create `programs/data/[program-slug].json` with the structured data.

Include all collected data plus auto-generated SEO fields:
- `seo.canonicalUrl`
- `seo.schema.educationalLevel` (beginner/intermediate/advanced based on program type)
- `seo.schema.timeRequired` (ISO 8601 duration)
- `seo.schema.teaches` (array of skills from curriculum)
- `seo.keywordData` (research results for reference)

Show the user: "Data saved to programs/data/[slug].json"

---

## PHASE 4: Generate HTML Page

Use the generator script or manual template replacement:

1. Read existing program page as base (e.g., `programs/employee-relations-law.html`)
2. Replace all program-specific content:
   - Meta tags and SEO
   - Hero section
   - Content section
   - Testimonials data
   - Curriculum blocks
   - FAQ items
   - Airtable view IDs
3. Set `data-program-slug` attribute for dynamic faculty loading
4. Adjust "Choose Your Format" section based on delivery options
5. Write to: `programs/[program-slug].html`

### Key Replacements

**For In-Person only programs:**
- Remove Virtual and On-Demand tabs from format toggle
- Update subtitle text to reflect in-person only

**For curriculum:**
- Single-block programs: Remove block navigation cards, show all competency groups
- Multi-block programs: Include navigation cards with pricing

**For faculty:**
- Set `data-program-slug="[slug]"` on faculty section
- Include `/js/faculty.js` script
- Add placeholder static content that JS will replace

---

## PHASE 5: Post-Generation Checklist

Display this checklist:
```
Program page generated successfully!

Files created:
- programs/data/[slug].json
- programs/[slug].html

Post-generation checklist:
[ ] Verify program exists in Airtable with slug "[slug]"
[ ] Verify faculty are linked to this program in Airtable
[ ] Verify Airtable view ID returns sessions for this program
[ ] Test registration URL works correctly
[ ] Preview the page in browser

>>> Ready for Lighthouse SEO audit? [Y/n/skip]
```

---

## PHASE 6: Lighthouse SEO Audit

Run an automated SEO audit on the generated page to verify quality.

### Step 6.1: Start Local Server

If not already running, start the development server:
```bash
npx vercel dev --listen 3000
```

Wait for server to be ready, then proceed.

### Step 6.2: Run Lighthouse SEO Audit

Run SEO-focused audit:
- URL: `http://localhost:3000/programs/[program-slug].html`
- Categories: `seo` only

### Step 6.3: Report Results and Fix Issues

Report SEO score and any issues found. Auto-fix simple issues like missing alt attributes.

### Step 6.4: Final Summary

```
=== Generation Complete ===

Program: [Program Name]
URL:     https://iaml.com/programs/[slug]

Files:
  ✓ programs/data/[slug].json
  ✓ programs/[slug].html

SEO Status:
  ✓ Lighthouse Score: [score]/100
  ✓ Schema.org: Course (valid)
  ✓ Open Graph: Complete
  ✓ Canonical: Set

Next Steps:
  1. Review the page in browser
  2. Commit changes
  3. Push to deploy
```

---

## Important Rules

1. **Vanilla JS only** - No frameworks or build tools
2. **Keep heading hierarchy**: H1 (title), H2 (sections), H3 (subsections), H4 (skills)
3. **Sessions widget** uses program name for Airtable queries - must match exactly
4. **Faculty is dynamic** - Loaded from Airtable, not hardcoded
5. **Benefits section** - Use template defaults, extract values from FAQ content
6. **SEO is auto-generated** - Research and generate, don't ask for manual input

### Automation Summary

| Section | User Input Required? | How It Works |
|---------|---------------------|--------------|
| SEO/Meta | NO | Auto-generated from keyword research |
| Faculty | NO | Dynamic from Airtable via `data-program-slug` |
| Benefits | NO | Use template, extract from FAQ content |
| Basic Info | YES | User provides program name, price, duration, etc. |
| Hero | YES | User provides title and description |
| Content | YES | User provides headline, description, benefits |
| Testimonials | YES | User pastes CSV or formatted list |
| Curriculum | YES | User provides structure and content |
| FAQ | YES | User provides Q&A pairs |
| Airtable IDs | YES | User provides view IDs |

---

## Schema Reference

See `programs/data/_schema.json` for the complete data structure.
