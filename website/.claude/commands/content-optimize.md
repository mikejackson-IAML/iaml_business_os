# Content Optimizer

Generate data-driven content optimization recommendations for website pages.

## Usage

```
/content-optimize /programs/workplace-investigations.html
/content-optimize /programs/workplace-investigations.html --mode=rewrite
/content-optimize all --focus=seo
/content-optimize --from-scan
```

## Options

- `--mode=targeted` (default) - Suggest specific improvements
- `--mode=rewrite` - Generate complete section rewrites
- `--focus=seo` - Prioritize SEO improvements
- `--focus=conversion` - Prioritize conversion improvements
- `--focus=voice` - Prioritize brand voice alignment
- `--from-scan` - Optimize pages with issues from last scan

---

## YOUR TASK

Generate actionable content optimization recommendations by combining:
1. Brand voice guidelines (from Notion/local config)
2. Quiz data insights (what challenges bring users here)
3. SEO data (keyword opportunities, Search Console metrics)
4. Conversion analysis (CTA effectiveness)

---

## OPTIMIZATION PROCESS

### Step 1: Gather Context

1. **Read the target page** - Get current content
2. **Load brand voice** - From `/brand-voice-check` guidelines
3. **Get quiz insights** - Call `/api/content-insights?type=quiz-stats`
4. **Get SEO data** (if available) - Use DataForSEO MCP for keyword research
5. **Get performance data** (if available) - Use Search Console MCP

### Step 2: Analyze Current Content

For each page element, evaluate:

| Element | Check Against |
|---------|---------------|
| Meta title | SEO best practices, keyword inclusion, length |
| Meta description | CTR optimization, keyword inclusion, length |
| H1 headline | Brand voice, keyword alignment, outcome focus |
| Hero description | Pain point addressing, differentiator mention |
| CTAs | Action-oriented, value clarity, specificity |
| Section headlines | Outcome focus, engagement |
| FAQ answers | Completeness, brand voice |

### Step 3: Generate Recommendations

For each issue found, create a recommendation with:
- Priority (high/medium/low)
- Current content
- Suggested content
- Rationale with data sources
- Expected impact

---

## RECOMMENDATION FORMAT

```markdown
## Content Optimization Report

**Page:** /programs/workplace-investigations.html
**Mode:** Targeted
**Generated:** 2025-12-29

---

### HIGH PRIORITY

#### 1. Meta Description - SEO Opportunity

**Current:**
> "Master workplace investigations in 2 days. Learn interviewing, documentation & legal compliance."

**Suggested:**
> "Workplace investigation training by practicing attorneys. 2-day certificate program with 13 SHRM/HRCI credits. Master interviewing, documentation, and defensible outcomes."

**Rationale:**
- Added "training" keyword (260 monthly searches)
- Added credentials (high-converting based on quiz data: 68% value SHRM credits)
- Kept under 160 characters (156)

**Data Sources:** DataForSEO keyword research, Quiz response analysis

---

### MEDIUM PRIORITY

#### 2. Hero CTA - Conversion Improvement

**Current:**
> "Register Now"

**Suggested:**
> "Enroll Now - 2 Days, 13 Credits, $1,575"

**Rationale:**
- Adds specificity (duration, credits, price)
- Quiz data shows "developing skills" segment responds to credential focus
- Reduces friction by showing full value upfront

**Data Sources:** Quiz data (role/experience distribution)

---

### LOW PRIORITY

#### 3. FAQ Answer - Brand Voice

**Current:**
> "Students will receive a certificate upon completion of the class."

**Suggested:**
> "Participants receive their certificate upon completing the program, plus immediate access to our 50,000+ alumni network."

**Rationale:**
- Replaced "students" with "participants"
- Replaced "class" with "program"
- Added ongoing support pillar mention

**Data Sources:** Brand voice guidelines

---

## Summary

| Priority | Count | Est. Impact |
|----------|-------|-------------|
| High | 1 | +15% CTR |
| Medium | 1 | +5% conversion |
| Low | 1 | Brand consistency |

**Next Steps:**
1. Review recommendations above
2. Approve/reject each recommendation
3. Run `/content-apply` to implement approved changes
```

---

## DATA-DRIVEN INSIGHTS TO USE

### From Quiz Data

Typical quiz response distribution (fetch live):
- **Roles:** ~40% managers, ~30% specialists, ~20% directors, ~10% executives
- **Challenges:** ~50% compliance, ~25% leadership, ~15% culture, ~10% performance
- **Experience:** ~35% developing, ~30% experienced, ~20% new, ~15% expert

**Content implications:**
- Lead with compliance/legal protection messaging
- Speak to managers primarily, but acknowledge career advancement
- Balance foundational + advanced content signals

### From SEO Data

Use DataForSEO MCP to research:
- Primary keywords for the program
- Related keywords with search volume
- Competitor content gaps
- SERP features to target

### From Brand Voice

Key checks:
- Using preferred vocabulary
- Hitting messaging pillars
- Avoiding anti-patterns
- Correct tone for content type

---

## MODE: TARGETED (Default)

Generate surgical improvements:
- Specific line/element changes
- Minimal disruption to existing content
- Focus on highest-impact fixes

Example output:
```
Line 45: Change "Learn about FMLA" to "Navigate FMLA with confidence"
Line 112: Add "practicing attorneys" to faculty intro
Meta description: Add "SHRM credits" mention
```

---

## MODE: REWRITE

Generate complete section rewrites:
- Full hero section
- Complete meta tags
- Entire CTA sections

Only use when:
- Content fundamentally misaligned with brand voice
- Major SEO issues requiring structural changes
- User explicitly requests

Example output:
```markdown
### Hero Section Rewrite

**Current Hero (remove entirely):**
[current content]

**New Hero:**
<section class="hero">
  <h1>Master Workplace Investigations That Hold Up in Court</h1>
  <p>Stop hoping complaints resolve themselves. In this intensive 2-day program,
     practicing attorneys teach you investigation techniques that produce
     defensible outcomes. Walk away ready to handle any workplace issue.</p>
  <a href="#register" class="btn-primary">
    Enroll Now - 2 Days, 13 Credits, $1,575
  </a>
</section>
```

---

## STORING RECOMMENDATIONS

After generating recommendations, offer to store in Supabase:

```
I've generated [N] recommendations. Would you like me to:

1. Store all in Supabase for later review
2. Show me the top 3 to approve now
3. Apply high-priority changes immediately
4. Just show the report (no storage)
```

If storing, POST to `/api/content-insights?action=recommendation`:
```json
{
  "page_path": "/programs/workplace-investigations.html",
  "content_type": "meta_description",
  "recommendation_type": "seo",
  "priority": "high",
  "current_content": "...",
  "suggested_content": "...",
  "rationale": "...",
  "data_sources": ["dataforseo", "quiz_data"],
  "metrics": {"keyword_volume": 260}
}
```

---

## MCP INTEGRATIONS

This skill can use:

| MCP | Purpose |
|-----|---------|
| **DataForSEO** | Keyword research, SERP analysis |
| **Google Search Console** | Current rankings, CTR data |
| **Lighthouse** | SEO audit scores |
| **Notion** | Brand voice guidelines |
| **Supabase** | Store/retrieve recommendations |
| **Firecrawl** | Competitor content analysis |

---

## EXAMPLE EXECUTION

```
/content-optimize /programs/workplace-investigations.html

Analyzing page...
  ✓ Page loaded (2,847 words)
  ✓ Brand voice guidelines loaded
  ✓ Quiz stats fetched (342 responses)
  ✓ Keyword data available

Checking meta tags...
  ⚠ Description missing "training" keyword
  ⚠ Title could include program duration

Checking hero section...
  ✓ Headline uses action verb
  ✓ Description addresses pain point
  ⚠ CTA missing specifics

Checking body content...
  ✓ FAQ answers are thorough
  ⚠ Found "class" in testimonial section

Checking brand voice alignment...
  ✓ Expertise pillar mentioned
  ✓ Practical application emphasized
  ⚠ Ongoing support not mentioned in hero

---

Generated 5 recommendations:
  - 1 High Priority (SEO)
  - 2 Medium Priority (Conversion)
  - 2 Low Priority (Brand Voice)

>>> Store in Supabase? [Y/n]
>>> Apply high-priority now? [y/N]
```
