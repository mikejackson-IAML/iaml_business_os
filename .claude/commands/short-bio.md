# Short Bio Generator

Generate punchy, brand-aligned short bios for faculty cards that encourage visitors to click through and learn more.

## Usage

```
/short-bio "Faculty Name"
/short-bio "Grant Gibeau"
/short-bio "Di Ann Sanchez"
```

## Your Task

Create a compelling 2-3 sentence short bio (~250-300 characters) from source content the user provides, then save it to Airtable.

---

## PHASE 1: Collect Information

### Step 1.1: Confirm Faculty Name
Acknowledge the faculty name provided. If no name was given, ask for one.

### Step 1.2: Request Source Content
Ask the user to paste the source content:

```
Ready to create a short bio for [Faculty Name].

Please paste the source content (full bio, LinkedIn profile, resume, or any background info):
```

Wait for the user to paste the content before proceeding.

---

## PHASE 2: Generate Short Bio

### Step 2.1: Analyze Source Content
Extract key information:
- Primary practice areas or expertise
- Notable achievements or differentiators
- Current role and firm/organization
- What makes them valuable to participants

### Step 2.2: Write the Short Bio

**Specifications:**
- Length: 2-3 sentences, 200-300 characters
- Purpose: Tease expertise, create curiosity, encourage "Read full bio" click
- Display context: Faculty cards truncate at 3 lines (CSS `line-clamp: 3`)

**Brand Voice Requirements:**

| Do This | Avoid This |
|---------|------------|
| Lead with action/impact | Starting with "Dr./Mr./Ms. [Name] is a..." |
| Use confident, direct language | Hedging words (might, could, may, possibly) |
| Be specific about practice areas | Generic claims ("expert in...", "specializes in...") |
| End with a hook or differentiator | Trailing off or listing credentials |
| Focus on what they DO | Just describing who they ARE |

**Preferred Structure:**
```
[First Name] [action verb] [specific thing they do for clients].
[Second sentence with scope/context or notable differentiator].
[Optional: Punchy closer that creates intrigue].
```

**Power Verbs to Use:**
- defends, represents, advises, navigates, guides
- builds, designs, creates, develops, transforms
- prevents, protects, secures, safeguards
- wins, achieves, delivers, produces

**Words to Avoid:**
- comprehensive, solutions, leverage, utilize
- expert, specialist (show don't tell)
- simple, easy, just, basic
- passionate about, dedicated to

---

## PHASE 3: Present for Approval

### Step 3.1: Show the Draft

Present the bio with character count:

```
=== SHORT BIO DRAFT: [Faculty Name] ===

[Generated bio text here]

Characters: [XXX] / 300

>>> Actions:
[A] Approve - Save to Airtable
[E] Edit - Request changes
[R] Regenerate - Try a different angle
[C] Cancel
```

### Step 3.2: Handle User Response

**If [A] Approve:** Proceed to Phase 4
**If [E] Edit:** Ask what to change, regenerate, return to Step 3.1
**If [R] Regenerate:** Create new version with different emphasis, return to Step 3.1
**If [C] Cancel:** End without saving

---

## PHASE 4: Save to Airtable

### Step 4.1: Find Faculty Record
Use the Airtable MCP to search for the faculty member:

- Base ID: `applWPVmMkgMWoZIC`
- Table: `Faculty`
- Search by: Name field matching "[Faculty Name]"

### Step 4.2: Update the Record
Update the field: `Short Bio (250-300 characters)`

### Step 4.3: Confirm Success

```
Short bio saved to Airtable for [Faculty Name].

Next steps:
- Run the faculty fetch script to update the website JSON
- Or wait for the next scheduled sync

To generate another: /short-bio "Next Faculty Name"
```

---

## Examples

### STRONG (Use as reference)

**Grant Gibeau:**
```
Grant Gibeau defends employers against discrimination claims,
wage-hour lawsuits, union challenges, and NLRB disputes. As a
Taft partner in Minneapolis, he prevents workplace problems
before they escalate and wins the battles that can't be avoided.
```
- Action verb lead: "defends"
- Specific: discrimination, wage-hour, NLRB
- Punchy closer: "wins the battles that can't be avoided"

**Rudi Turner:**
```
Rudi represents employers in discrimination, harassment, and
wrongful termination disputes across state and federal courts.
Beyond litigation, she helps organizations build policies that
reduce risk before problems start.
```
- Clear scope: what courts, what claims
- Value prop: "reduce risk before problems start"

### WEAK (Avoid these patterns)

```
❌ "Dr. Jane Smith is a highly experienced employment attorney
   with over 20 years of experience. She is passionate about
   helping clients navigate complex legal challenges."

Why it fails:
- Starts with credentials, not action
- "Highly experienced" and "over 20 years" = generic
- "Passionate about" = cliché
- "Complex legal challenges" = vague
```

```
❌ "John is an expert in employment law who provides
   comprehensive solutions for HR professionals."

Why it fails:
- "Expert" = tell not show
- "Comprehensive solutions" = meaningless
- No specifics about what he actually does
```

---

## Troubleshooting

**Can't find faculty in Airtable:**
- Check spelling of name exactly
- Try searching by first name only
- Ask user to verify the name in Airtable

**Bio too long:**
- Prioritize action + impact over credentials
- Remove adjectives and qualifiers
- Combine two ideas into one sentence

**Bio feels generic:**
- Add specific practice areas (FMLA, ADA, NLRB, ERISA)
- Mention industries served if notable
- Include a unique differentiator or approach

---

## Quick Reference

| Element | Guideline |
|---------|-----------|
| Length | 200-300 characters (2-3 sentences) |
| First word | Ideally the faculty member's first name |
| First sentence | What they DO (action verb) |
| Second sentence | Scope, context, or differentiator |
| Tone | Confident, direct, specific |
| Goal | Make visitor want to click "Read full bio" |
