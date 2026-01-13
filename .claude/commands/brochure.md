# Brochure Generator

Generate professional PDF brochures for IAML training programs.

## Usage

```
/brochure [program-slug]
/brochure hr-law-fundamentals
/brochure strategic-hr-management
/brochure --list
/brochure --all
```

## Arguments

- `program-slug`: The URL slug of the program (e.g., `hr-law-fundamentals`)
- `--list`: Show all available programs
- `--all`: Generate brochures for all programs

## Workflow

When invoked, this skill follows a hybrid content generation workflow:

### Phase 1: Data Collection
1. Load program data from `/website/programs/data/[slug].json`
2. Load faculty data from `/website/data/faculty/by-program/[slug].json`
3. Validate all required content exists

### Phase 2: Content Generation
Generate brochure copy applying IAML brand voice:
- **Cover**: Program name and compelling tagline
- **Overview**: What you'll learn, who it's for, pre-program consultation section
- **Curriculum**: Full content for each block with individual pricing (Foundation → Advanced → Expert)
- **Faculty**: Up to 8 instructors with full bios
- **Testimonials**: Up to 8 participant quotes
- **Upcoming Sessions**: Up to 5 sessions with location images and dates
- **Details**: Pricing, credits, delivery options
- **FAQs**: All available FAQs from program data
- **CTA**: Registration call-to-action with QR code

### Phase 3: Human Approval Checkpoint
Present the draft content for review:
- Show each section's content
- Allow editing of specific sections
- Option to regenerate with different emphasis
- Approve to proceed to PDF generation

### Phase 4: PDF Generation
1. Populate HTML template with approved content
2. Generate 8-page Letter-sized PDF via Puppeteer
3. Save to `/website/brochures/output/[slug]-brochure.pdf`

## Brand Voice Guidelines

Content should follow IAML voice (from `brand-voice.md`):
- **Authoritative but Approachable** - Expert without talking down
- **Practical, Not Academic** - Real-world focused
- **Clear, Not Complex** - Plain language first
- **Confident, Not Arrogant** - Direct recommendations
- **Supportive, Not Judgmental** - Partner tone

**Preferred words**: Protect, Practical, Navigate, Equip, Partner
**Avoid**: Simple, Just, Obviously, Comprehensive, Solutions, Leverage

**Formatting rules**:
- Use regular dashes (-) or rewrite sentences to avoid em-dashes (—)
- Use "faculty" not "instructors"
- Use "program" not "seminar" or "course"
- Use "participants" not "students"
- Use "practicing attorneys" consistently

## Output

PDF brochures are saved to:
```
/website/brochures/output/[program-slug]-brochure.pdf
```

## Example

```
User: /brochure hr-law-fundamentals

Claude: Loading program data for hr-law-fundamentals...

=== BROCHURE DRAFT: HR Law Fundamentals ===

COVER:
  Title: HR Law Fundamentals
  Tagline: Build the legal foundation every HR professional needs...

OVERVIEW:
  [Generated overview content]

[Continue with approval workflow...]
```

## Files

- Template: `/website/brochures/templates/program-brochure.html`
- Styles: `/website/brochures/templates/brochure-styles.css`
- Script: `/website/scripts/generate-brochure-pdf.js`
- Output: `/website/brochures/output/`

## Quick Generation (Skip Approval)

For quick generation without the approval checkpoint:

```bash
cd /Users/mike/IAML\ Business\ OS/website
node scripts/generate-brochure-pdf.js hr-law-fundamentals
```

## Available Programs

Run `/brochure --list` or:

- `advanced-employee-benefits-law`
- `advanced-employment-law`
- `benefit-plan-claims-appeals-litigation`
- `comprehensive-labor-relations`
- `discrimination-prevention-defense`
- `employee-benefits-law`
- `hr-law-fundamentals`
- `retirement-plans`
- `special-issues-employment-law`
- `strategic-hr-management`
- `welfare-benefits-plan-issues`
- `workplace-investigations`

---

## Implementation Instructions

When the user invokes `/brochure [slug]`:

1. **Validate the program slug exists**
   - Check `/website/programs/data/[slug].json`
   - If not found, show available programs

2. **Load all data sources**
   ```javascript
   const programData = require(`../website/programs/data/${slug}.json`);
   const facultyData = require(`../website/data/faculty/by-program/${slug}.json`);
   ```

3. **Generate content sections** (applying brand voice):
   - Cover headline and tagline
   - Program overview (2-3 paragraphs) with pre-program consultation section
   - Curriculum: full content for each block with individual pricing
   - Faculty selection (up to 8 instructors with bios)
   - Testimonials (up to 8 quotes, scored for impact)
   - Upcoming sessions (up to 5 sessions with location images)
   - FAQs (all available FAQs from program data)
   - CTA copy

4. **Present for approval**:
   ```
   === BROCHURE DRAFT: [Program Name] ===

   COVER:
     Headline: "[title]"
     Tagline: "[description]"

   OVERVIEW:
     [generated content]

   CURRICULUM HIGHLIGHTS:
     [condensed list]

   FACULTY (up to 8 selected):
     - [name] - [title]
     ...

   TESTIMONIALS (up to 8 selected):
     - "[quote]" - [name], [company]
     ...

   >>> Actions:
   [A] Approve - Generate PDF
   [E] Edit - Modify sections
   [R] Regenerate - New draft
   [C] Cancel
   ```

5. **On approval**, run the PDF generation:
   ```bash
   node /Users/mike/IAML\ Business\ OS/website/scripts/generate-brochure-pdf.js [slug]
   ```

6. **Report success**:
   ```
   Brochure generated successfully!
   PDF: /website/brochures/output/[slug]-brochure.pdf
   Pages: 8
   Size: ~450 KB
   ```