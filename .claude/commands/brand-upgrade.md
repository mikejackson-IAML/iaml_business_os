# Brand Voice Upgrade

Perform a comprehensive content review and upgrade of IAML website pages, using all knowledge docs to recommend the best-fit content for the target audience.

## Usage

```
/brand-upgrade [file path]
```

Examples:
- `/brand-upgrade website/about-us.html`
- `/brand-upgrade website/programs/employee-relations-law.html`
- `/brand-upgrade` (uses currently open file in IDE)

---

## CRITICAL: Approval-Based Workflow

**DO NOT make any changes until the user explicitly approves them.**

This command follows a strict review-then-approve workflow:
1. Load ALL knowledge docs and deeply understand the content strategy
2. Analyze the page and its target audience
3. Propose comprehensive content improvements
4. **STOP and WAIT for user approval**
5. Only implement changes the user approves

---

## Your Task

You are performing a **comprehensive content audit and upgrade** on an IAML website page. This is NOT just vocabulary fixes. You are evaluating whether the content:

1. Speaks to the right audience with the right message
2. Addresses their specific pain points and motivations
3. Uses the proper story framework
4. Includes appropriate proof points and differentiators
5. Handles likely objections
6. Follows brand voice guidelines

---

## PHASE 1: Load All Knowledge Documents

### Step 1.1: Read ALL Knowledge Docs

Read and internalize each document completely:

**Required Reading:**
```
business-os/knowledge/VOICE_AND_MESSAGING.md
business-os/knowledge/ICP.md
business-os/knowledge/COMPETITIVE_POSITIONING.md
business-os/knowledge/MARKETING_OVERVIEW.md
```

### Step 1.2: Extract Key Frameworks

From **VOICE_AND_MESSAGING.md**, internalize:
- **Voice Attributes**: Confident, Supportive, Practical, Direct, Trustworthy
- **Primary Message**: "IAML provides comprehensive support before, during, and after your program. You're never alone in navigating employment law."
- **Three Pillars**: Practicing Attorneys, Deep Expertise, Ongoing Support
- **Story Framework** (5 parts): The Challenge → Failed Alternatives → The Solution → The Transformation → The Proof
- **Proof Points**: 45+ years, 80,000+ alumni, faculty firm names (Taft, Thompson Hine, Alston & Bird, etc.)
- **Testimonial Categories**: Quality of Instruction, Practical Application, Instructor Excellence, Immediate Value, Career Impact
- **Objection Handling**: Price, time away, "can't I Google this?", "why not SHRM?", "our law firm provides free CLEs"
- **Words to Use/Avoid**: Full vocabulary guidance
- **Punctuation to Avoid**: Em dashes (—)

From **ICP.md**, internalize:
- **Segment Profiles**:
  - HR Leadership (VP, SVP, CHRO): Risk mitigation, team development, organizational protection
  - HR Directors/Senior Managers: Career advancement, building expertise, handling complex situations
  - HR Managers/Generalists: Stop guessing, build foundation, gain confidence
  - Benefits Professionals: ERISA compliance, avoid costly mistakes, regulatory expertise
  - In-House Counsel: Stay current, CLE credits, advise HR effectively
- **Pain Points by Segment**: Each audience has specific challenges
- **Emotional Appeals by Segment**: What each audience needs to feel
- **Core Messages by Segment**: The primary message that resonates with each

From **COMPETITIVE_POSITIONING.md**, internalize:
- **Key Differentiators**: Practicing attorneys, intensive multi-day immersion, peer networking, prestigious certificate, 45-year track record
- **Competitor Contrasts**: SHRM (broad but shallow), Law Firm CLEs (free but brief), Boutique Providers (cheap but less prestigious)
- **Objection Responses**: How to address common concerns
- **Competitive Talking Points by Segment**: What to emphasize for each audience

From **MARKETING_OVERVIEW.md**, internalize:
- **Strategic Principles**: Intelligence-first, quality over volume, relationship building, prove value first
- **Value Proposition**: For whom, who, what IAML is, what it provides, unlike competitors

Report:
```
=== Knowledge Base Loaded ===
✓ Voice & Messaging guidelines
✓ ICP profiles for all 5 segments
✓ Competitive positioning & differentiators
✓ Marketing strategy & value propositions

>>> Ready to analyze target page...
```

---

## PHASE 2: Analyze Target Page

### Step 2.1: Resolve File Path

If user provided a path, use it directly.
If no path provided, check for IDE selection or open file context.

If neither available, prompt:
```
Which page would you like to upgrade?

Common options:
- website/index.html (homepage)
- website/about-us.html
- website/featured-programs.html
- website/corporate-training.html
- website/faculty.html
- website/programs/[program-slug].html

Enter file path:
```

### Step 2.2: Read and Analyze Target Page

Read the HTML file and analyze:

**Page Structure:**
- Page type (homepage, program page, about page, etc.)
- Major content sections
- Current headlines and subheadlines
- Body copy and descriptions
- CTAs and buttons
- Testimonials used
- Proof points mentioned

**Audience Analysis:**
- Who is this page primarily speaking to? (Map to ICP segments)
- What secondary audiences might visit?
- Are there audience-specific sections?

**Content Gaps Analysis:**
- Does the page follow the story framework (Challenge → Alternatives → Solution → Transformation → Proof)?
- Are the right proof points included for this audience?
- Are likely objections addressed?
- Does it speak to the audience's pain points and motivations?
- Does it create the right emotional response (Confident, Supported, Trusting)?

Report:
```
=== Page Analysis ===
File: [path]
Page Type: [homepage/program/about/corporate/faculty]
Primary Audience: [ICP segment(s)]

Content Sections Identified:
1. [Section name] - [X words]
2. [Section name] - [X words]
...

>>> Evaluating content against knowledge base...
```

---

## PHASE 3: Comprehensive Content Evaluation

### Step 3.1: Story Framework Alignment

Evaluate whether the page follows the IAML story arc:

| Story Element | Present? | Current Approach | Recommended Approach |
|---------------|----------|------------------|---------------------|
| **The Challenge** (their pain) | Yes/No/Partial | ... | ... |
| **Failed Alternatives** (what doesn't work) | Yes/No/Partial | ... | ... |
| **The Solution** (IAML's approach) | Yes/No/Partial | ... | ... |
| **The Transformation** (what changes) | Yes/No/Partial | ... | ... |
| **The Proof** (why believe it) | Yes/No/Partial | ... | ... |

### Step 3.2: Audience Message Alignment

For each ICP segment the page should address:

| Segment | Addressed? | Current Message | Recommended Message |
|---------|------------|-----------------|---------------------|
| [Primary segment] | Yes/No/Weak | ... | [From ICP.md] |
| [Secondary segment] | Yes/No/Weak | ... | [From ICP.md] |

### Step 3.3: Differentiator Coverage

Evaluate which key differentiators are used:

| Differentiator | Used? | How Currently Used | Recommendation |
|----------------|-------|-------------------|----------------|
| Practicing Attorneys | Yes/No/Weak | ... | ... |
| Intensive Multi-Day | Yes/No/Weak | ... | ... |
| Peer Networking | Yes/No/Weak | ... | ... |
| Prestigious Certificate | Yes/No/Weak | ... | ... |
| 45-Year Track Record | Yes/No/Weak | ... | ... |

### Step 3.4: Proof Point Usage

Evaluate proof point coverage:

| Proof Point | Used? | Context | Recommendation |
|-------------|-------|---------|----------------|
| 45+ years | Yes/No | ... | ... |
| 80,000+ alumni | Yes/No | ... | ... |
| Faculty firm names | Yes/No | ... | ... |
| 29.75 CE credits | Yes/No | ... | ... |
| Quarterly updates included | Yes/No | ... | ... |
| Specific testimonials | Yes/No | ... | ... |

### Step 3.5: Objection Handling

Does the page proactively address likely objections for this audience?

| Objection | Addressed? | Current Approach | Recommended Approach |
|-----------|------------|------------------|---------------------|
| "It's expensive" | Yes/No | ... | [From knowledge docs] |
| "I can't be away" | Yes/No | ... | [From knowledge docs] |
| "Why not SHRM?" | Yes/No | ... | [From knowledge docs] |
| "Can't I Google this?" | Yes/No | ... | [From knowledge docs] |
| [Audience-specific objections] | ... | ... | ... |

### Step 3.6: Vocabulary & Tone Check

Scan for:
- Words to avoid (webinar, course, class, cheap, easy, buy, customers, etc.)
- Em dashes (—)
- Passive voice where active would be stronger
- Generic claims without proof points
- Tone issues (too formal, too casual, arrogant, distant)

---

## PHASE 4: Propose Comprehensive Changes (STOP HERE FOR APPROVAL)

### Step 4.1: Prioritize Recommendations

Organize proposed changes into three tiers:

**TIER 1: Strategic Content Changes**
These are significant content rewrites that better align with audience needs, story framework, or messaging strategy. These are the high-impact recommendations.

**TIER 2: Messaging Enhancements**
These add missing proof points, differentiators, objection handling, or testimonials. Medium impact.

**TIER 3: Voice & Style Fixes**
Vocabulary corrections, punctuation fixes, tone adjustments. Lower impact but important for consistency.

### Step 4.2: Present Recommendations

For each tier, present numbered recommendations:

```
=== TIER 1: Strategic Content Changes ===

### [1] [Section Name]: [Issue Summary]

**Current Content:**
"[Current text - can be multiple paragraphs]"

**Problem:**
[Explain why this doesn't align with knowledge docs - cite specific guidance]

**Recommended Content:**
"[Proposed new text]"

**Why This Is Better:**
- [Specific improvement #1 - reference knowledge doc]
- [Specific improvement #2 - reference knowledge doc]
- [Specific improvement #3 - reference knowledge doc]

---

### [2] [Next Recommendation]
...

=== TIER 2: Messaging Enhancements ===

### [3] Add [Differentiator/Proof Point/Objection Handling]
...

=== TIER 3: Voice & Style Fixes ===

### [5] Vocabulary Fix: [Location]
Current: "[word/phrase]"
Proposed: "[word/phrase]"
Reason: [Why, per Voice & Messaging guidelines]

---

=== Summary ===
Tier 1 (Strategic): [X] changes
Tier 2 (Messaging): [X] changes
Tier 3 (Voice/Style): [X] changes
Total: [X] proposed changes
```

### Step 4.3: ASK FOR APPROVAL (REQUIRED)

**You MUST stop here and ask the user for approval using the AskUserQuestion tool.**

Present options:
- "Apply all changes" - Implement everything across all tiers
- "Apply Tier 1 only" - Only strategic content changes
- "Apply Tier 1 + Tier 2" - Strategic and messaging changes
- "Select specific changes" - User will specify which numbers to apply
- "Revise suggestions" - User wants to modify some proposals
- "Cancel" - Don't make any changes

**DO NOT proceed to Phase 5 until user explicitly approves.**

---

## PHASE 5: Implementation

### Step 5.1: Apply Approved Changes

For each approved change:
1. Locate the exact text in the file
2. Use Edit tool to replace old text with new text
3. Verify the change was applied correctly
4. Preserve HTML structure - only change text content

### Step 5.2: Post-Implementation Check

After all changes:
- Verify HTML is valid
- Check that no em dashes remain
- Confirm vocabulary fixes applied
- Ensure proof points are accurate

---

## PHASE 6: Summary Report

```
=== Brand Voice Upgrade Complete ===

Page: [filename]
Primary Audience: [ICP segment(s)]

### Changes Applied:
**Tier 1 - Strategic:**
✓ [Summary of change 1]
✓ [Summary of change 2]

**Tier 2 - Messaging:**
✓ [Summary of change 3]

**Tier 3 - Voice/Style:**
✓ [Summary of change 4]

### Alignment Improvements:

**Story Framework:**
- Before: [X/5 elements present]
- After: [X/5 elements present]

**Differentiators Used:**
- Before: [X/5 differentiators]
- After: [X/5 differentiators]

**Proof Points Added:**
- [List new proof points included]

**Objections Now Addressed:**
- [List objections now handled]

### Next Steps:
1. Review changes in browser
2. Test on mobile
3. Commit: git add [file] && git commit -m "content: brand voice upgrade for [page]"
4. Consider upgrading related pages:
   - [Related page 1]
   - [Related page 2]
```

---

## Important Rules

1. **NEVER implement without approval** - Always stop after Phase 4
2. **Read ALL knowledge docs first** - Don't just use Voice & Messaging
3. **Think strategically** - Content structure matters more than word swaps
4. **Map to audience** - Every recommendation should tie back to ICP profiles
5. **Use the story framework** - Pages should follow the 5-part arc
6. **Include proof points** - Specific beats generic every time
7. **Address objections** - Proactively handle what the audience is thinking
8. **Preserve meaning** - Upgraded text should convey the same core information
9. **Maintain HTML structure** - Only change text content, not tags
10. **Number all changes** - Use [1], [2], [3] for easy selection
11. **Cite knowledge docs** - Each recommendation should reference which doc it's from
12. **Prioritize high-impact** - Tier 1 changes should come first in review
13. **NEVER modify bottom CTA sections** - Skip any CTA section at the bottom of the page (typically the final call-to-action before the footer). These sections are standardized across the site and should not be changed.

---

## Quick Reference: What Makes Great IAML Content

**The Story Arc (every page should have elements of this):**
1. Challenge: Employment law is complex, stakes are high, most HR never get formal training
2. Failed Alternatives: Conferences are shallow, CLEs are brief, Google is risky
3. Solution: Intensive multi-day programs from practicing attorneys + ongoing support
4. Transformation: Expertise, confidence, credential, career advancement
5. Proof: 45 years, 80,000+ alumni, top law firm faculty, testimonials

**The Emotional Response (readers should feel):**
- Confident: "I can handle this"
- Supported: "IAML has my back"
- Trusting: "These people know what they're doing"

**Audience-Specific Hooks:**
- HR Leadership: Protect your organization, develop your team, reduce legal exposure
- HR Directors: Career advancement, deep expertise, handle complex situations
- HR Managers: Stop guessing, build confidence, practical skills for Monday morning
- Benefits: ERISA compliance, avoid costly mistakes, fiduciary protection
- Counsel: Stay current, CLE credits, multiple perspectives, practical application

**The IAML Difference (use these consistently):**
- "Practicing attorneys, not academics"
- "Real cases, practical solutions, immediate results"
- "Comprehensive coverage, not surface-level overviews"
- "We're with you before, during, and after the program"
- "Strategies you'll use the following week"

---

## Files Referenced

- **Voice & Messaging**: `business-os/knowledge/VOICE_AND_MESSAGING.md`
- **ICP Profiles**: `business-os/knowledge/ICP.md`
- **Competitive Positioning**: `business-os/knowledge/COMPETITIVE_POSITIONING.md`
- **Marketing Overview**: `business-os/knowledge/MARKETING_OVERVIEW.md`
- **Target**: User-specified HTML file

---

## Related Commands

- `/seo-optimize` - SEO audit and schema implementation
- `/speed-optimize` - Performance optimization
- `/new-program` - Create new program pages (uses brand voice by default)