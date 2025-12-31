# Meeting Prep: Discovery Call Brief

Generate a 5-minute pre-call intelligence brief for discovery calls with companies interested in IAML on-site training.

## Usage

```
/meeting-prep "Acme Corporation"                    # Company name only
/meeting-prep "Acme Corporation" "Jane Smith"       # Company + contact name
/meeting-prep                                        # Interactive mode - prompts for info
```

## Your Task

Create a comprehensive but concise pre-call briefing document that helps prepare for a discovery call with a prospective corporate training client.

---

## CONTEXT: What This Call Is About

You are preparing a brief for someone who:
- Is NOT an attorney or HR practitioner
- Sells on-site HR training programs to corporate teams
- Needs to gather information about the prospect's training needs
- Will qualify the opportunity (budget, timeline, decision-makers)
- Will provide a preliminary proposal (dollar per day cost)
- Will determine if a follow-up meeting with an instructor is warranted

---

## STEP 1: Gather Company Information

### Required Input
If no company name was provided, ask:
> What company is this meeting with?
> (Optional) Who is your contact at the company?

### Research Sources (Use Available MCPs)

**Use Apollo.io MCP (`apollo`) for:**
- Company enrichment: industry, employee count, revenue, location, tech stack
- Person enrichment: contact's title, tenure, LinkedIn summary
- Recent news about the company
- Job postings (especially HR-related roles)

**Use Perplexity MCP (`perplexity`) for:**
- Recent company news (funding, layoffs, acquisitions, leadership changes)
- Industry trends affecting HR/training
- Any public information about their HR challenges

**Use Exa MCP (`exa`) for:**
- Semantic search for company + "HR training" or "employee development"
- Press releases mentioning compliance, harassment, or workplace issues

**Use Firecrawl MCP (`firecrawl`) to scrape:**
- Company careers page (look for HR job postings - signals growth/change)
- Company about page for culture/values messaging

**Use GoHighLevel MCP (`gohighlevel`) to check:**
- Prior contact history with this company
- Previous conversations or proposals
- Any existing relationship

**Use Airtable MCP (`airtable`) to check:**
- Past program registrations from this company
- Previous attendees or contacts

---

## STEP 2: Generate the Brief

Create a brief with the following structure. Keep it scannable - use bullets, bold key info, and keep total reading time under 5 minutes.

---

### DISCOVERY CALL BRIEF
**Company:** [Company Name]
**Contact:** [Contact Name] | [Title] | [Tenure]
**Meeting:** [Date/Time if known]
**Prepared:** [Current Date]

---

### 1. COMPANY SNAPSHOT (30 seconds)

| Attribute | Value |
|-----------|-------|
| **Industry** | [Industry] |
| **Size** | [Employee count] |
| **Location** | [HQ location] |
| **Revenue** | [If available] |
| **Growth Stage** | [Startup/Growth/Enterprise] |

**Recent News:**
- [Bullet 1: Most relevant recent news]
- [Bullet 2: Second most relevant]
- [Bullet 3: Third if relevant]

---

### 2. HR CONTEXT SIGNALS (1 minute)

**Why They Might Need Training:**
Based on research, identify signals that suggest training needs:

- [ ] **HR Job Postings**: [Any open HR roles? This signals growth/change]
- [ ] **Leadership Changes**: [New CHRO, HR Director, etc.]
- [ ] **Workforce Changes**: [Layoffs, rapid hiring, restructuring]
- [ ] **Compliance Pressure**: [Industry regulations, recent lawsuits, settlements]
- [ ] **M&A Activity**: [Mergers creating culture/policy integration needs]
- [ ] **Geographic Expansion**: [Multi-state operations = complex employment law]

**Industry-Specific HR Challenges:**
- [Challenge 1 common to their industry]
- [Challenge 2 common to their industry]

---

### 3. YOUR CONTACT (30 seconds)

**[Contact Name]**
- **Title:** [Title]
- **Tenure:** [Time at company]
- **Background:** [Brief LinkedIn summary - prior roles, education]
- **Likely Authority:** [Can they make decisions? Or influencer?]

**Rapport Builders:**
- [Shared connection, school, experience, or interest if found]
- [Recent post or article they shared]

---

### 4. QUALIFICATION QUESTIONS (2 minutes)

Use these questions to qualify the opportunity. **The bolded questions are critical.**

**Understanding Their Situation:**
- "What's prompting you to look at training right now?"
- "What specific challenges is your team facing?"
- "Has something happened recently that made this a priority?"

**Program Fit:**
- "What topics are most important for your team?" (employment law, investigations, benefits, HR leadership)
- "What are the titles/roles of the people who would attend?"
- "How many people are you looking to train?"

**Logistics:**
- "Are you looking for on-site training at your location?"
- "What's your preferred format?" (in-person, virtual, or hybrid)

**CRITICAL - Budget & Timeline:**
- **"Do you have a budget allocated for this training?"**
- **"When are you hoping to have this completed?"**
- "Is this tied to any specific deadline?" (fiscal year, compliance deadline, etc.)

**Decision Process:**
- "Who else would be involved in making this decision?"
- "What does your evaluation process look like?"
- "Have you looked at other training providers?"

---

### 5. IAML PROGRAM RECOMMENDATIONS (1 minute)

Based on the company's size, industry, and likely needs, recommend relevant programs:

#### Primary Recommendations:

**If they need employment law fundamentals:**
→ **Certificate in Employee Relations Law** | 4.5 days | $2,375/person
  - Covers: labor relations, discrimination, FMLA, ADA, terminations
  - Best for: HR generalists, managers, in-house counsel
  - On-site pricing: ~$525/person/day (volume discounts available)

**If they need investigation skills:**
→ **Certificate in Workplace Investigations** | 2 days | $1,575/person
  - Covers: interviewing, documentation, credibility assessment, report writing
  - Best for: HR, employee relations, compliance
  - On-site pricing: ~$790/person/day (volume discounts available)

**If they need benefits compliance:**
→ **Certificate in Employee Benefits Law** | 4.5 days | $2,375/person
  - Covers: ERISA, 401(k), health plans, COBRA, ACA, HIPAA
  - Best for: Benefits specialists, HR managers with benefits oversight
  - On-site pricing: ~$525/person/day (volume discounts available)

**If they need HR leadership development:**
→ **Certificate in Strategic HR Leadership** | 4.5 days | $2,375/person
  - Covers: HR strategy, legal fundamentals, leadership skills
  - Best for: HR managers/directors moving into strategic roles
  - On-site pricing: ~$525/person/day (volume discounts available)

**If they need advanced content:**
→ **Advanced Certificate in Strategic Employment Law** | 2 days | $1,575/person
  - Covers: advanced topics for experienced HR professionals
  - Best for: Senior HR, employment law specialists
  - On-site pricing: ~$790/person/day (volume discounts available)

#### On-Site Training Pricing Framework:

| Group Size | Daily Rate (Approx) | Notes |
|------------|---------------------|-------|
| 10-15 | $5,000-7,500/day | Minimum viable group |
| 16-25 | $7,500-10,000/day | Sweet spot for ROI |
| 26-40 | $10,000-15,000/day | Volume discount applies |
| 40+ | Custom quote | May split into cohorts |

*Includes: all materials, certificates, SHRM/HRCI credits, post-program resources*

---

### 6. RED FLAGS & OPPORTUNITIES

**Red Flags (Proceed with Caution):**
- [ ] No budget allocated - "exploring options"
- [ ] No timeline - "sometime next year"
- [ ] Contact lacks authority - "I'll need to check with..."
- [ ] Price shopping - comparing multiple vendors on price alone
- [ ] Unclear objectives - can't articulate what they're trying to solve

**Opportunities (Lean In):**
- [ ] Specific incident driving urgency (investigation, lawsuit, complaint)
- [ ] Regulatory pressure or audit coming
- [ ] New HR leadership wanting to make an impact
- [ ] Budget already approved and timeline set
- [ ] Previous IAML attendees or alumni in the organization
- [ ] Expansion/growth creating new compliance complexity

---

### 7. NEXT STEPS SCRIPT

If the call goes well, use this to close:

> "Based on what you've shared, I think [Program Name] would be a great fit for your team. Here's what I'd suggest as next steps:
>
> 1. I'll send you a preliminary proposal with pricing for [X] participants over [Y] days
> 2. If that looks good, we can set up a call with one of our faculty members who can go deeper on the curriculum and answer any technical questions
> 3. From there, we'd finalize dates and logistics
>
> Does that sound like a good path forward?"

---

## STEP 3: Format Output

Present the brief in a clean, scannable format. The entire document should be readable in under 5 minutes.

Key formatting rules:
- Use tables for structured data
- Bold critical information
- Use checkboxes for signal indicators
- Keep sections clearly separated
- Include a "TL;DR" at the top if the brief is particularly long

---

## STEP 4: Offer Follow-Up Actions

After presenting the brief, offer:
1. "Would you like me to save this brief to Notion for future reference?"
2. "Should I create a follow-up reminder in GoHighLevel?"
3. "Want me to generate a draft follow-up email template?"

---

## FALLBACK: Limited Information Mode

If MCP research returns limited results:
- Note which data sources were unavailable
- Still generate the question framework and program recommendations
- Suggest manual research points to investigate before the call
- Provide industry-generic HR challenges based on company size/sector
