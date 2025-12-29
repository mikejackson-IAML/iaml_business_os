# Brand Voice Checker

Validate copy against IAML's brand voice guidelines. Use this before publishing any content.

## Usage

```
/brand-voice-check                     # Check clipboard or provide text
/brand-voice-check "Your copy here"    # Check specific text
/brand-voice-check /programs/[slug]    # Check a program page
```

## Your Task

Analyze the provided content against IAML's brand voice guidelines and provide actionable feedback.

---

## BRAND VOICE GUIDELINES

### Brand Positioning

**Mission:** Practicing attorneys teaching HR professionals employment law - practical knowledge they can apply Monday morning.

**Differentiators:**
- 45+ years of experience training HR professionals
- Faculty are practicing attorneys, not academics
- Practical application, not theoretical knowledge
- Ongoing support and alumni community
- SHRM, HRCI, and CLE credits

**Target Personas:**
1. **HR Managers/Directors** - Need to stay current on employment law to protect their organizations
2. **Benefits Specialists** - Require deep ERISA and benefits law knowledge
3. **Legal/Compliance Professionals** - Want practical updates from peers who practice daily

---

### Tone Guidelines

| Attribute | Do This | Avoid This |
|-----------|---------|------------|
| **Authority** | Speak with confidence based on expertise | Hedge with "maybe," "might," "could" |
| **Approachability** | Use "you" language, conversational | Stiff corporate-speak, passive voice |
| **Urgency** | Highlight consequences of inaction | Fear-mongering, scare tactics |
| **Expertise** | Reference real-world application | Academic jargon, theoretical concepts |
| **Support** | Emphasize ongoing relationship | One-and-done transactional language |

**Tone by Context:**
- **Hero sections:** Confident, direct, outcome-focused
- **Program descriptions:** Practical, benefit-driven
- **CTAs:** Action-oriented, clear value proposition
- **FAQs:** Helpful, thorough, reassuring
- **Testimonials:** Authentic, specific, relatable

---

### Vocabulary Library

**PREFERRED TERMS (Use These):**
- "practicing attorneys" (not "lawyers" or "legal experts")
- "certificate program" (not "course" or "class")
- "employment law" (not "HR law" - too informal)
- "HR professionals" (not "HR people" or "HR folks")
- "hands-on expertise" (not "skills" alone)
- "proven strategies" (not "tips" or "advice")
- "real-world application" (not "practical tips")
- "transform your approach" (not "improve")
- "master" or "build expertise" (not "learn")
- "protect your organization" (not "avoid lawsuits")
- "navigate complex challenges" (not "deal with problems")
- "faculty" (not "instructors" or "teachers")
- "participants" or "attendees" (not "students")

**AVOID THESE TERMS:**
- "course" (use "program" or "certificate program")
- "class" (use "session" or "program")
- "training seminar" (too generic, sounds commoditized)
- "webinar" (use "virtual program" or "live virtual")
- "teachers" (use "faculty" or "practicing attorneys")
- "students" (use "participants" or "professionals")
- "tricks" or "hacks" (undermines expertise)
- "easy" or "simple" (employment law isn't - don't promise it)
- "one-size-fits-all" (we customize)
- "basic" alone (use "foundational" if needed)

---

### Messaging Pillars

**Pillar 1: EXPERTISE**
> "Practicing attorneys, not academics"

- Faculty practice employment law daily
- They handle real cases, not hypotheticals
- They know what works in the real world
- Example: "taught by attorneys who argue these cases, not professors who study them"

**Pillar 2: PRACTICAL APPLICATION**
> "Ready to apply Monday morning"

- Participants leave with actionable knowledge
- Focus on what they can DO, not just know
- Emphasis on implementation, not theory
- Example: "walk away with policies you can implement immediately"

**Pillar 3: ONGOING SUPPORT**
> "Not just a program, a partnership"

- Alumni community and network
- Annual updates on law changes
- Discounts on future programs
- Example: "join 50,000+ HR professionals in our alumni network"

**Pillar 4: CREDENTIALS**
> "Advance your career while protecting your organization"

- SHRM, HRCI, and CLE credits
- Professional development recognition
- Career advancement opportunity
- Example: "earn up to 35 SHRM/HRCI credits"

---

### Copy Patterns

**Hero Headlines:**
```
[Action Verb] [Specific Skill/Outcome] in [Timeframe]
Examples:
- "Master Employment Law Essentials in 4 Days"
- "Build Workplace Investigation Expertise That Holds Up in Court"
- "Transform Your HR Leadership in 2 Days"
```

**Hero Descriptions:**
```
[Pain point acknowledgment]. [Our solution with differentiator]. [Outcome promise].
Example:
"Stop hoping workplace complaints resolve themselves. In this intensive program,
practicing attorneys teach you investigation techniques that produce defensible
outcomes. Walk away ready to handle any workplace issue with confidence."
```

**CTA Buttons:**
```
Primary: "Enroll Now - [Duration], [Credits] Credits, $[Price]"
Secondary: "View Full Curriculum" or "See Upcoming Sessions"
Tertiary: "Talk to an Advisor" or "Book a Consultation"
```

**Benefit Statements:**
```
[Outcome] + [Specificity]
Examples:
- "Navigate FMLA with confidence" (not just "Learn about FMLA")
- "Conduct investigations that withstand legal scrutiny"
- "Build policies that protect both employees and the organization"
```

---

### Anti-Patterns (What to Flag)

**Flag these issues:**

1. **Passive voice** - "The program is taught by..." → "Practicing attorneys teach you..."
2. **Weak verbs** - "Learn about" → "Master" or "Build expertise in"
3. **Generic claims** - "Best program" → Specific differentiator
4. **Missing specificity** - "Many credits" → "35.75 SHRM/HRCI credits"
5. **Academic language** - "Theoretical framework" → "Proven strategies"
6. **Hedging** - "You might learn" → "You will master"
7. **Feature focus** - "4 days long" → "Master key skills in just 4 days"
8. **Missing outcomes** - List of topics → What they can DO with that knowledge
9. **Competitor-matching language** - Anything that sounds like generic training
10. **Wrong vocabulary** - "Course," "class," "students," "teachers"

---

## ANALYSIS PROCESS

### Step 1: Read the Content

If a file path is provided, read the file. Otherwise, use the provided text.

### Step 2: Analyze Against Guidelines

Check for:
1. **Vocabulary violations** - Wrong terms being used
2. **Tone issues** - Too passive, too academic, too generic
3. **Missing pillars** - Not leveraging key differentiators
4. **Anti-patterns** - Known issues to flag
5. **Opportunities** - Places to strengthen messaging

### Step 3: Generate Report

```markdown
## Brand Voice Analysis: [Content Source]

### Overall Score: [A/B/C/D/F]

### Vocabulary Check
| Issue | Found | Suggested |
|-------|-------|-----------|
| [term] | "training class" | "certificate program" |

### Tone Analysis
- **Authority:** [Strong/Weak/Missing]
- **Approachability:** [Strong/Weak/Missing]
- **Urgency:** [Strong/Weak/Missing]

### Pillar Alignment
- [ ] Expertise mentioned
- [ ] Practical application emphasized
- [ ] Ongoing support referenced
- [ ] Credentials highlighted

### Specific Recommendations
1. [Line/section] - [Issue] - [Suggested fix]
2. ...

### Rewrite Suggestions
For critical issues, provide rewritten versions.
```

### Step 4: Offer to Apply Fixes

If reviewing a file:
```
I found [N] issues. Would you like me to:
1. Apply all fixes automatically
2. Show me the fixes one by one
3. Just save this report
```

---

## Examples

**WEAK (Before):**
> "This 4-day class covers employment law topics. Students will learn about various regulations and how to apply them. Taught by legal experts."

**STRONG (After):**
> "Master essential employment law in just 4 days. Practicing attorneys—not academics—teach you proven strategies to navigate FMLA, ADA, and discrimination issues. Walk away ready to protect your organization and advance your career."

---

## Integration with Content Optimization

This skill is part of the Content Optimization System. When checking content:
- Results can be saved to Supabase `content_recommendations` table
- Recommendations integrate with `/content-optimize` workflow
- Fixes can be applied via `/content-apply`
