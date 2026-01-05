# Cold Outreach Sequence Generator

Generate ABM or general prospect email sequences following IAML playbooks.

## Usage

```
/cold-outreach-sequence "Acme Corporation" "Jane Smith"     # Company + contact
/cold-outreach-sequence "Acme Corporation"                   # Company only
/cold-outreach-sequence                                       # Interactive mode
```

## Your Task

Create a ready-to-send email sequence for cold outreach campaigns.

---

## STEP 1: Gather Information

### If No Arguments Provided (Interactive Mode)

Ask these questions:

> 1. **What company is this sequence for?**
>
> 2. **Who is the primary contact?** (name and title if known)
>
> 3. **What type of sequence?**
>    - **ABM (Senior HR)**: VP+, CHRO, Chief People Officer at target companies → 5 emails over 21 days
>    - **General Prospect**: HR Managers, Generalists, Specialists → 4 emails over 14 days

### If Arguments Provided

Use provided company name and contact. Ask only about sequence type.

---

## STEP 2: Research (Use MCPs)

**Use Apollo MCP (`apollo`) for:**
- Company enrichment: industry, employee count, location
- Contact enrichment: title, tenure, LinkedIn info
- Determine appropriate sequence type based on title

**Use Airtable MCP (`airtable`) to check:**
- Any past registrations from this company
- Existing contacts in database

**Use GoHighLevel MCP (`gohighlevel`) to check:**
- Prior contact history
- Any existing relationship

---

## STEP 3: Reference Playbook

Read the EMAIL_COLD_OUTREACH.md playbook:
- **Location**: `business-os/knowledge/CHANNEL_PLAYBOOKS/EMAIL_COLD_OUTREACH.md`

Key sections to reference:
- Email Infrastructure Rules (domain usage, sending limits)
- ABM Sequence structure (5 emails, 21 days) — for VP+ HR
- General Prospect Sequence (4 emails, 14 days) — for all others
- Credential-specific customizations if applicable

---

## STEP 4: Determine Domain Strategy

Based on audience, recommend domains:

| Audience | Domain Type |
|----------|-------------|
| New cold prospects | Google Workspace (general marketing domains) |
| SHRM credential holders | Microsoft 365 (SHRM-referenced domains) |
| HRCI credential holders | Microsoft 365 (HRCI-referenced domains) |

---

## STEP 5: Generate Sequence

### For ABM (Senior HR) — 5 Emails Over 21 Days

| Email | Day | Focus | Subject Line Variants |
|-------|-----|-------|----------------------|
| 1 | Day 3 | Value introduction | 2-3 variants |
| 2 | Day 6 | Different angle | 2-3 variants |
| 3 | Day 10 | Social proof | 2-3 variants |
| 4 | Day 15 | Content/value share | 2-3 variants |
| 5 | Day 21 | Breakup | 2-3 variants |

**Offer**: Complimentary Quarterly Employment Law Update

### For General Prospect — 4 Emails Over 14 Days

| Email | Day | Focus | Subject Line Variants |
|-------|-----|-------|----------------------|
| 1 | Day 1 | Program introduction | 2-3 variants |
| 2 | Day 4 | Specific program recommendation | 2-3 variants |
| 3 | Day 8 | Social proof | 2-3 variants |
| 4 | Day 14 | Final value reminder | 2-3 variants |

**Offer**: Program information, registration, block attendance option

---

## STEP 6: Format Output

Present the sequence in this format:

---

### COLD OUTREACH SEQUENCE

**Company:** [Company Name]
**Contact:** [Contact Name] | [Title]
**Sequence Type:** [ABM / General Prospect]
**Domain Recommendation:** [Domain type]
**Generated:** [Date]

---

### SEQUENCE OVERVIEW

| Email | Send Day | Focus | Primary Subject Line |
|-------|----------|-------|---------------------|
| 1 | Day X | [Focus] | [Subject line] |
| 2 | Day X | [Focus] | [Subject line] |
| ... | ... | ... | ... |

---

### EMAIL 1: [Focus]

**Send Day:** Day X
**Goal:** [What we want them to do]

**Subject Line Options:**
1. [Subject A]
2. [Subject B]
3. [Subject C]

**Body:**
```
[Full email body with personalization tokens like [First Name], [Company]]
```

---

[Repeat for each email]

---

### A/B TEST RECOMMENDATIONS

For this sequence, consider testing:
- **Subject Lines**: [Specific recommendation based on audience]
- **Send Time**: [Recommendation based on playbook best practices]
- **Opening Line**: [Variation to test]

---

### SENDING RECOMMENDATIONS

- **Best Days**: Tuesday, Wednesday, Thursday
- **Best Times**: 9:00-11:00 AM or 1:00-3:00 PM recipient's local time
- **Avoid**: Monday morning, Friday afternoon, weekends
- **Daily Limit**: [Based on domain status per playbook]

---

## STEP 7: Offer Follow-Up Actions

After presenting the sequence:

1. "Would you like me to save this sequence to a file for Smartlead import?"
2. "Should I check if this contact already exists in our database?"
3. "Want me to suggest a LinkedIn connection request to send on Day 1?" (for ABM)

---

## Quality Standards

### Voice Check
- [ ] Confident, not pushy
- [ ] Value-first approach
- [ ] Professional but approachable
- [ ] No salesy language

### Compliance Check
- [ ] Unsubscribe mention included
- [ ] Clear sender identification
- [ ] No misleading subject lines

### Personalization
- [ ] Company name included appropriately
- [ ] Contact name used correctly
- [ ] Industry/role relevance where applicable
