# Content Apply

Apply approved content optimization recommendations to website files.

## Usage

```
/content-apply                    # Apply all approved recommendations
/content-apply [recommendation-id] # Apply specific recommendation
/content-apply --preview          # Show what would change without applying
/content-apply --page=/programs/workplace-investigations.html
```

## Options

- `--preview` - Dry run, show changes without applying
- `--page=[path]` - Only apply recommendations for specific page
- `--priority=high` - Only apply high-priority recommendations
- `--no-branch` - Apply directly without creating a branch

---

## YOUR TASK

Apply approved content recommendations to the actual HTML/JSON files, following version control best practices.

---

## APPLICATION PROCESS

### Step 1: Fetch Approved Recommendations

Query Supabase for approved recommendations:
```
GET /api/content-insights?type=recommendations&status=approved
```

Or if specific ID provided:
```
GET /api/content-insights?type=recommendations&id=[id]
```

### Step 2: Group by Page

Organize recommendations by target page to minimize file operations:
```
/programs/workplace-investigations.html
  - rec_123: meta_description
  - rec_124: hero_cta
  - rec_125: faq_answer

/programs/employee-relations-law.html
  - rec_126: meta_title
```

### Step 3: Create Git Branch

Unless `--no-branch` specified:
```bash
git checkout -b content-opt/2025-12-29-[summary]
```

Branch naming:
- `content-opt/[date]-[page-slug]` for single page
- `content-opt/[date]-batch-[count]` for multiple pages

### Step 4: Apply Changes

For each recommendation:

1. **Read the target file**
2. **Locate the content** using element selector or content matching
3. **Replace with suggested content**
4. **Validate HTML** is still valid
5. **Mark recommendation as applied** in Supabase

### Step 5: Commit Changes

Create a detailed commit:
```bash
git commit -m "content(optimize): [page] - [summary]

## Changes Applied
- Meta description: Added 'training' keyword
- Hero CTA: Added specifics (duration, credits, price)

## Data-Driven Rationale
- 'training' keyword: 260 monthly searches
- Quiz data: 68% value SHRM credits

Recommendations: rec_123, rec_124

Generated with Claude Code Content Optimization System
Co-Authored-By: Claude <noreply@anthropic.com>"
```

### Step 6: Report Results

```markdown
## Content Applied Successfully

**Branch:** content-opt/2025-12-29-workplace-investigations
**Commit:** abc123

### Changes Made

| File | Type | Change |
|------|------|--------|
| programs/workplace-investigations.html | meta_description | Added 'training' keyword |
| programs/workplace-investigations.html | hero_cta | Added specifics |

### Next Steps

1. Review changes: `git diff HEAD~1`
2. Test locally: `vercel dev`
3. Push for preview: `git push -u origin content-opt/2025-12-29-workplace-investigations`
4. Create PR: `gh pr create`

>>> Push to remote? [Y/n]
>>> Create PR? [y/N]
```

---

## CONTENT TYPE HANDLERS

### meta_title
```html
<!-- Find -->
<title>Old Title</title>

<!-- Replace -->
<title>New Title</title>
```

### meta_description
```html
<!-- Find -->
<meta name="description" content="Old description">

<!-- Replace -->
<meta name="description" content="New description">
```

### hero_headline
Look for H1 in hero section:
```html
<section class="hero">
  <h1>Old Headline</h1>  <!-- Replace this -->
</section>
```

### hero_description
Look for paragraph in hero section:
```html
<section class="hero">
  <p class="hero-description">Old description</p>  <!-- Replace this -->
</section>
```

### cta_button
Find by class or text match:
```html
<a class="btn-primary" href="#register">Old Text</a>
<!-- Replace with -->
<a class="btn-primary" href="#register">New Text</a>
```

### faq_answer
Match by question text, then update answer:
```html
<div class="faq-item">
  <h3>Question Text?</h3>
  <p>Old answer text</p>  <!-- Replace this -->
</div>
```

### full_rewrite
Replace entire section:
```html
<!-- Find section by class/id -->
<section class="hero">
  ...entire old content...
</section>

<!-- Replace with -->
<section class="hero">
  ...entire new content...
</section>
```

---

## PROGRAM PAGE JSON UPDATES

For program pages, some content lives in JSON data files:
- `/programs/data/[slug].json`

Update both HTML and JSON as needed:

### JSON Fields
```json
{
  "meta": {
    "title": "...",
    "description": "...",
    "keywords": "..."
  },
  "hero": {
    "title": "...",
    "description": "..."
  },
  "faq": [
    {"question": "...", "answer": "..."}
  ]
}
```

---

## VALIDATION

Before applying each change:

1. **Backup original** - Store in memory for rollback
2. **Apply change** - Make the modification
3. **Validate HTML** - Check for syntax errors
4. **Check length limits** - Meta title <60, description <160
5. **Verify encoding** - Proper UTF-8, no broken entities

If validation fails:
- Rollback that specific change
- Mark recommendation as "failed" with reason
- Continue with other recommendations

---

## ERROR HANDLING

### Content Not Found
```
Warning: Could not locate target content for rec_123
Original: "Learn about employment law"
Page: /programs/employee-relations-law.html

The original content may have changed. Options:
1. Skip this recommendation
2. Search for similar content
3. Show me the current page section
```

### Conflict Detection
```
Warning: Content appears to have changed since recommendation was created

Recommendation created: 2025-12-28
File last modified: 2025-12-29

Original (expected):
"Learn about employment law"

Current (actual):
"Master employment law fundamentals"

This may indicate the content was already updated.
>>> Skip this recommendation? [Y/n]
```

---

## SUPABASE UPDATES

After applying each recommendation:

```
PATCH /api/content-insights?id=[rec_id]
{
  "status": "applied",
  "applied_by": "claude-code",
  "branch_name": "content-opt/2025-12-29-workplace-investigations",
  "commit_hash": "abc123"
}
```

---

## PREVIEW MODE

With `--preview`:

```markdown
## Preview: Changes to Apply

**Mode:** Preview (no changes will be made)

### /programs/workplace-investigations.html

#### Change 1: meta_description
```diff
- <meta name="description" content="Master workplace investigations in 2 days.">
+ <meta name="description" content="Workplace investigation training by practicing attorneys. 2-day certificate with 13 SHRM credits.">
```

#### Change 2: hero_cta
```diff
- <a class="btn-primary">Register Now</a>
+ <a class="btn-primary">Enroll Now - 2 Days, 13 Credits, $1,575</a>
```

---

**Total changes:** 2
**Files affected:** 1

>>> Apply these changes? [Y/n]
```

---

## INTEGRATION

This skill works with:
- `/content-optimize` - Generates the recommendations
- `/content-scan` - Identifies pages needing updates
- `/brand-voice-check` - Validates changes align with voice

Typical workflow:
1. `/content-scan` - Find issues
2. `/content-optimize [page]` - Generate recommendations
3. Review and approve recommendations
4. `/content-apply` - Apply approved changes
5. Push and deploy
