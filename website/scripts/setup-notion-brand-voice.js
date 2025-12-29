/**
 * Setup Notion Brand Voice Database
 *
 * This script creates the brand voice database structure in Notion.
 * Run once to initialize, then use the Notion MCP to maintain.
 *
 * Prerequisites:
 * - NOTION_TOKEN environment variable set
 * - A parent page ID in Notion where the database will be created
 *
 * Usage:
 *   node scripts/setup-notion-brand-voice.js <parent-page-id>
 */

const BRAND_VOICE_CONTENT = {
  database_title: "IAML Brand Voice Guide",

  pages: [
    {
      title: "Brand Positioning",
      type: "foundation",
      content: `# Brand Positioning

## Mission Statement
Practicing attorneys teaching HR professionals employment law—practical knowledge they can apply Monday morning.

## Core Differentiators

### 1. Experience & Legacy
- 45+ years training HR professionals
- Over 50,000 alumni in our network
- Trusted by Fortune 500 companies and government agencies

### 2. Practicing Attorneys, Not Academics
- Faculty argue employment law cases daily
- Real courtroom experience, not theoretical knowledge
- They know what works because they've proven it

### 3. Practical Application
- "Ready to apply Monday morning"
- Actionable strategies, not abstract concepts
- Templates, checklists, and tools you can use immediately

### 4. Ongoing Support
- Alumni network access
- Annual law update sessions
- Discounts on future programs

## Target Personas

### Primary: HR Manager/Director
- **Pain Points:** Staying current on changing laws, protecting the organization, building credibility with legal
- **Goals:** Confidence handling HR issues, career advancement, fewer sleepless nights about compliance
- **Language Cues:** "defensible," "risk mitigation," "confidence," "credibility"

### Secondary: Benefits Specialist
- **Pain Points:** ERISA complexity, fiduciary liability, claims disputes
- **Goals:** Deep technical knowledge, avoiding costly mistakes, career specialization
- **Language Cues:** "ERISA," "fiduciary," "compliance," "plan administration"

### Tertiary: Legal/Compliance Professional
- **Pain Points:** Keeping up with case law, practical implementation, training non-lawyers
- **Goals:** Peer learning, current case updates, practical tools
- **Language Cues:** "case law," "precedent," "practical application," "defensible position"`
    },
    {
      title: "Tone Guidelines",
      type: "foundation",
      content: `# Tone Guidelines

## The IAML Voice

We speak with **confident expertise** while remaining **genuinely helpful**. We're the experienced colleague who's been through it all and wants to help you succeed.

## Tone Attributes

### Authoritative (Not Arrogant)
**Do:** Speak with confidence based on expertise
**Don't:** Lecture, condescend, or use jargon to impress

✓ "Practicing attorneys teach you proven strategies..."
✗ "Our world-renowned experts will show you the right way..."

### Approachable (Not Casual)
**Do:** Use "you" language, be conversational, show empathy
**Don't:** Be stiff, use passive voice, sound like a legal brief

✓ "You'll walk away ready to handle workplace investigations..."
✗ "Participants shall be equipped with investigative capabilities..."

### Urgent (Not Alarming)
**Do:** Highlight consequences of inaction, create momentum
**Don't:** Fear-monger, exaggerate risks, use scare tactics

✓ "Don't wait for a complaint to expose gaps in your approach..."
✗ "One mistake could cost you millions and destroy your career..."

### Practical (Not Academic)
**Do:** Focus on application, use real examples, be specific
**Don't:** Get theoretical, cite studies without context, be abstract

✓ "Leave with a complete investigation checklist you can use tomorrow..."
✗ "Explore the theoretical frameworks underlying investigative methodologies..."

### Supportive (Not Transactional)
**Do:** Emphasize ongoing relationship, community, growth
**Don't:** Make it feel like a one-time purchase

✓ "Join 50,000+ HR professionals in our alumni network..."
✗ "After payment, you'll receive access to..."

## Tone by Content Type

| Content Type | Tone Emphasis |
|-------------|---------------|
| Hero Headlines | Confident, outcome-focused, energizing |
| Program Descriptions | Practical, specific, benefit-driven |
| CTAs | Action-oriented, clear value, low friction |
| FAQs | Helpful, thorough, reassuring |
| Testimonials | Authentic, specific, relatable |
| Email Subject Lines | Intriguing, urgent, personalized |`
    },
    {
      title: "Vocabulary Library",
      type: "reference",
      content: `# Vocabulary Library

## Preferred Terms

### Programs & Learning
| Use This | Instead Of |
|----------|------------|
| certificate program | course, class, training |
| program | course, class, seminar |
| virtual program | webinar, online class |
| live virtual | webinar, livestream |
| session | class, meeting |
| curriculum | syllabus |

### People
| Use This | Instead Of |
|----------|------------|
| faculty | teachers, instructors, trainers |
| practicing attorneys | lawyers, legal experts |
| participants | students, attendees (for paid) |
| HR professionals | HR people, HR folks |
| alumni | former students, graduates |

### Expertise & Learning
| Use This | Instead Of |
|----------|------------|
| master | learn, understand |
| build expertise | get skills |
| proven strategies | tips, advice, tricks |
| real-world application | practical tips |
| hands-on expertise | skills |
| transform | improve, enhance |

### Outcomes
| Use This | Instead Of |
|----------|------------|
| protect your organization | avoid lawsuits |
| navigate with confidence | handle, deal with |
| defensible outcomes | good results |
| credibility with leadership | respect from bosses |

## Terms to Avoid

### Never Use
- "course" (sounds like community college)
- "class" (sounds like school)
- "training seminar" (commoditized)
- "webinar" (cheap, low-value association)
- "teachers" (K-12 connotation)
- "students" (we teach professionals)
- "tricks" or "hacks" (undermines expertise)
- "easy" or "simple" (employment law isn't)
- "basic" alone (use "foundational")

### Use Sparingly
- "best" (only with evidence)
- "comprehensive" (overused - be specific)
- "world-class" (prove it instead)
- "cutting-edge" (what does it mean?)

## Industry Terms

### Employment Law
- Employment law (not "HR law")
- FMLA (spell out first use)
- ADA (spell out first use)
- FLSA, ADEA, Title VII, etc.
- Discrimination, harassment, retaliation
- At-will employment
- Wrongful termination

### Benefits Law
- ERISA
- Fiduciary duty/responsibility
- Plan administration
- Claims and appeals
- Qualified plans
- Welfare benefits`
    },
    {
      title: "Messaging Pillars",
      type: "foundation",
      content: `# Messaging Pillars

## The Four Pillars

Every piece of IAML content should reinforce at least one of these pillars. Ideally, hero content touches on 2-3.

---

## Pillar 1: EXPERTISE

### Core Message
> "Practicing attorneys, not academics"

### Key Points
- Faculty practice employment law daily in their own firms
- They argue cases, write briefs, advise clients
- They know what works because they've done it
- Real courtroom experience shapes what they teach

### Proof Points
- "taught by attorneys who argue these cases, not professors who study them"
- "faculty collectively handle thousands of employment cases annually"
- "learn from attorneys on the front lines of employment law"

### When to Emphasize
- Hero sections (always)
- Faculty section introductions
- Competitor differentiation
- Credibility building

---

## Pillar 2: PRACTICAL APPLICATION

### Core Message
> "Ready to apply Monday morning"

### Key Points
- Participants leave with actionable knowledge
- Focus on what they can DO, not just know
- Templates, checklists, real documents
- Role-playing and practice scenarios

### Proof Points
- "walk away with policies you can implement immediately"
- "practice with real scenarios, not hypotheticals"
- "includes templates and checklists you'll use every day"

### When to Emphasize
- Curriculum descriptions
- Program outcomes
- Value proposition
- ROI justification

---

## Pillar 3: ONGOING SUPPORT

### Core Message
> "Not just a program, a partnership"

### Key Points
- Alumni community of 50,000+ professionals
- Annual law update sessions
- Discounts on future programs
- Networking opportunities

### Proof Points
- "join 50,000+ HR professionals in our alumni network"
- "receive annual updates on major law changes"
- "alumni discounts on all future programs"

### When to Emphasize
- Post-program benefits
- Long-term value
- Community building
- Retention messaging

---

## Pillar 4: CREDENTIALS

### Core Message
> "Advance your career while protecting your organization"

### Key Points
- SHRM, HRCI, and CLE credits
- Professional development recognition
- Resume-building credentials
- Career advancement opportunity

### Proof Points
- "earn up to 35.75 SHRM/HRCI credits"
- "qualifies for continuing legal education"
- "certificate recognized by leading organizations"

### When to Emphasize
- CTAs and registration
- Career-focused messaging
- HR audience specifically
- Justifying expense to employer`
    },
    {
      title: "Copy Patterns",
      type: "reference",
      content: `# Copy Patterns

## Hero Headlines

### Formula
\`\`\`
[Action Verb] [Specific Skill/Outcome] in [Timeframe]
\`\`\`

### Strong Examples
- "Master Employment Law Essentials in 4 Days"
- "Build Workplace Investigation Expertise That Holds Up in Court"
- "Transform Your HR Leadership in 2 Days"
- "Navigate ERISA Complexity with Confidence"

### Weak Examples (Avoid)
- "Learn About Employment Law" (too passive)
- "Comprehensive HR Training Program" (generic, no outcome)
- "The Best Employment Law Course" (unsubstantiated claim)

---

## Hero Descriptions

### Formula
\`\`\`
[Pain point acknowledgment]. [Our solution with differentiator]. [Outcome promise].
\`\`\`

### Strong Example
> "Stop hoping workplace complaints resolve themselves. In this intensive 2-day program, practicing attorneys teach you investigation techniques that produce defensible outcomes. Walk away ready to handle any workplace issue with confidence."

### Anatomy
1. **Pain point:** "Stop hoping workplace complaints resolve themselves"
2. **Solution + differentiator:** "practicing attorneys teach you investigation techniques"
3. **Outcome:** "Walk away ready to handle any workplace issue with confidence"

---

## CTA Buttons

### Primary (Enrollment)
\`\`\`
Enroll Now - [Duration], [Credits] Credits, $[Price]
\`\`\`
Examples:
- "Enroll Now - 4 Days, 35 Credits, $2,375"
- "Enroll Now - 2 Days, 13 Credits, $1,575"

### Secondary (Information)
- "View Full Curriculum"
- "See Upcoming Sessions"
- "Download Program Guide"

### Tertiary (Consultation)
- "Talk to an Advisor"
- "Book a Consultation"
- "Questions? Let's Talk"

---

## Benefit Statements

### Formula
\`\`\`
[Outcome] + [Specificity]
\`\`\`

### Strong Examples
| Weak | Strong |
|------|--------|
| Learn about FMLA | Navigate FMLA with confidence |
| Investigation training | Conduct investigations that withstand legal scrutiny |
| Policy development | Build policies that protect both employees and the organization |
| Employment law knowledge | Master the employment law essentials that matter most |

---

## Testimonial Framing

### What Makes Strong Testimonials
1. **Specific outcomes** - what changed for them
2. **Credibility markers** - role, company, years of experience
3. **Emotional resonance** - relief, confidence, transformation
4. **Practicality** - what they can DO now

### Example Structure
> "[Specific outcome or transformation]. [What made IAML different]. [Emotional impact or recommendation]."
> — Name, Title, Company

---

## Section Headlines

### Formula
\`\`\`
What You'll [Achieve/Master/Build] in [Specific Timeframe/Program]
\`\`\`

### Examples
- "What You'll Master in 4 Days"
- "Build These Critical Skills"
- "Walk Away Ready To..."
- "After This Program, You'll Be Able To..."`
    },
    {
      title: "Anti-Patterns",
      type: "reference",
      content: `# Anti-Patterns (What to Flag and Fix)

## Common Issues to Flag

### 1. Passive Voice
**Problem:** Hides the expertise and sounds weak
**Flag:** "The program is taught by..."
**Fix:** "Practicing attorneys teach you..."

More examples:
- ✗ "Participants are given tools..."
- ✓ "You'll receive tools..."

- ✗ "Knowledge is imparted through..."
- ✓ "Faculty share real-world strategies..."

---

### 2. Weak Verbs
**Problem:** Undersells the transformation
**Flag:** "Learn about," "understand," "know"
**Fix:** "Master," "build expertise in," "develop"

Verb upgrade chart:
| Weak | Strong |
|------|--------|
| learn | master |
| understand | navigate with confidence |
| know | apply |
| get | build, develop |
| improve | transform |

---

### 3. Generic Claims
**Problem:** Could describe any competitor
**Flag:** "Best program," "high-quality training," "expert instructors"
**Fix:** Specific differentiators

Examples:
- ✗ "Learn from the best"
- ✓ "Learn from practicing attorneys who argue these cases daily"

- ✗ "Comprehensive curriculum"
- ✓ "4-day deep dive covering 40+ employment law topics"

---

### 4. Missing Specificity
**Problem:** Vague claims don't convince
**Flag:** "Many credits," "experienced faculty," "lots of content"
**Fix:** Specific numbers and details

Examples:
- ✗ "Earn professional credits"
- ✓ "Earn 35.75 SHRM/HRCI credits"

- ✗ "Experienced instructors"
- ✓ "Faculty with 200+ combined years of employment law practice"

---

### 5. Academic Language
**Problem:** Sounds like college, not professional development
**Flag:** "Theoretical framework," "methodology," "pedagogy"
**Fix:** Practical, outcome-focused language

Examples:
- ✗ "Explore the theoretical underpinnings of employment law"
- ✓ "Master the employment law principles that protect your organization"

---

### 6. Hedging Language
**Problem:** Signals lack of confidence
**Flag:** "might," "could," "may," "possibly"
**Fix:** Confident, direct statements

Examples:
- ✗ "You might learn strategies that could help..."
- ✓ "You'll master proven strategies that..."

---

### 7. Feature-First Thinking
**Problem:** Lists features without connecting to outcomes
**Flag:** "4-day program," "Includes materials," "Certificate provided"
**Fix:** Benefits-first, features as proof

Examples:
- ✗ "This is a 4-day program"
- ✓ "Master key employment law skills in just 4 days"

- ✗ "Includes 300+ page manual"
- ✓ "Walk away with a comprehensive reference guide you'll use for years"

---

### 8. Missing Outcomes
**Problem:** Topics without transformation
**Flag:** List of topics without "so what"
**Fix:** Add the outcome for each topic

Examples:
- ✗ "Covers FMLA, ADA, and Title VII"
- ✓ "Navigate FMLA leaves, ADA accommodations, and discrimination claims with confidence"

---

### 9. Competitor-Matching Language
**Problem:** Sounds like everyone else
**Flag:** "Training seminar," "HR course," "professional development"
**Fix:** IAML-specific differentiation

Remember: We're not a "training company." We're practicing attorneys who teach.

---

### 10. Wrong Vocabulary
**Problem:** Undermines positioning
**Flag:** "course," "class," "students," "teachers," "webinar"
**Fix:** Proper IAML vocabulary (see Vocabulary Library)

| Wrong | Right |
|-------|-------|
| course | program |
| class | session |
| students | participants |
| teachers | faculty |
| webinar | virtual program |`
    }
  ]
};

// Export for use by other scripts
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { BRAND_VOICE_CONTENT };
}

// If run directly, output the content structure
if (require.main === module) {
  console.log('IAML Brand Voice Database Structure');
  console.log('====================================\n');

  console.log(`Database: ${BRAND_VOICE_CONTENT.database_title}\n`);
  console.log('Pages to create:');

  BRAND_VOICE_CONTENT.pages.forEach((page, index) => {
    console.log(`\n${index + 1}. ${page.title} (${page.type})`);
    console.log(`   Content length: ${page.content.length} characters`);
  });

  console.log('\n\nTo set up in Notion:');
  console.log('1. Create a new database in Notion named "IAML Brand Voice Guide"');
  console.log('2. Add properties: Title (title), Type (select), Content (rich text)');
  console.log('3. Use the Notion MCP to populate with the content above');
  console.log('\nOr use the /setup-notion-brand-voice command in Claude Code.');
}
