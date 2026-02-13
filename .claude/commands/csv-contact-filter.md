# CSV Contact Filter

Filter CSV lead lists to keep only relevant HR director contacts, removing irrelevant titles (fitness, healthcare, travel, academic, etc.) that got pulled in via keyword overlap. Upload a CSV, get back clean/removed/review lists with reasoning. Configurable target persona for reuse across campaigns.

## Usage

```
/csv-contact-filter <path-to-csv>
```

Examples:
- `/csv-contact-filter /Users/mike/Downloads/leads.csv`
- `/csv-contact-filter $ARGUMENTS` (pass file path as argument)

---

## Default Target Persona

**HR Directors** — People who hold director-level (or above) roles with direct responsibility for Human Resources functions including people operations, employee relations, talent management, compensation/benefits, HR operations, HRIS, workforce planning, and related HR disciplines.

The user may override this persona at runtime by specifying a different target.

---

## Workflow

### Step 1: Inspect the CSV

Run the Python script in **analyze mode** to understand the file:

```bash
python3 scripts/filter_contacts.py analyze "<csv_path>"
```

This prints:
- Total rows and columns
- Detected title/department columns
- Top 30 most common titles
- Distribution preview (estimated KEEP/REMOVE/REVIEW counts based on rules)

Share the analysis summary with the user and confirm before proceeding.

### Step 2: Run the Filter

```bash
python3 scripts/filter_contacts.py filter "<csv_path>" "<output_dir>"
```

Use the same directory as the input CSV for output, or create a subdirectory. This produces:
- `contacts_kept.csv` — Clean list of relevant contacts
- `contacts_removed.csv` — Filtered out contacts with reason
- `contacts_review.csv` — Ambiguous contacts needing human review
- `filter_summary.txt` — Stats and breakdown

### Step 3: Review Ambiguous Contacts

Read `contacts_review.csv` and apply AI judgment to each row. For each ambiguous contact:
- Consider the full title, department, company, and industry context
- Make a KEEP or REMOVE recommendation with reasoning
- Present the review list to the user as a table for final approval

### Step 4: Deliver Results

After the user confirms the review decisions:
1. Merge approved keeps into the kept file
2. Merge approved removes into the removed file
3. Present the final files with a summary

---

## Classification Rules

### KEEP — Definite HR Director Contacts

Title contains ANY of these patterns (case-insensitive) AND does not trigger a REMOVE rule:

**Primary HR signals:**
- `human resources`, `human resource` (singular)
- Exact match or word boundary: `hr` followed by space/punctuation/end (to avoid matching "chr" "share" etc.)
- `people operations`, `people and culture`, `people experience`, `people partner`, `people team`, `people business`
- `people director`, `director of people`, `director people`
- `personnel director`, `director of personnel`

**HR sub-functions (KEEP when clearly internal HR):**
- `employee relations`, `employee experience`, `employee engagement`, `employee success`
- `employee communications`, `employee development`, `employee benefits` (internal)
- `employee health and wellness` (when it's an HR program, not clinical)
- `labor relations`, `labor and employment`
- `total rewards`
- `hris`, `human resource information system`
- `compensation and benefits`, `comp and ben`, `compensation benefits`
- `workforce planning`, `workforce analytics`, `workforce management` (when HR-side)
- `talent management` (when paired with HR context)
- `organizational culture`, `organizational effectiveness`
- `staffing` (when internal HR staffing function)

### REMOVE — Definitely Not HR

Title contains ANY of these patterns:

**Fitness & Wellness (non-HR):**
- `fitness director`, `fitness center`, `personal training director`, `group fitness`
- `wellness director` (standalone, not "employee wellness")
- `health and wellness director` (standalone facility/program role)
- `spa and fitness`, `tennis and fitness`, `swim and fitness`

**Healthcare / Medical / Clinical:**
- `behavioral health`, `mental health` (clinical roles)
- `public health`, `population health`, `environmental health`
- `medical director`, `clinical director` (medical context)
- `healthcare director`, `healthcare sales`, `healthcare account`
- `health sciences`, `allied health`, `health program director`
- `home health`, `telehealth` (clinical delivery)
- `physician recruitment`, `physician recruiting`, `provider recruitment`
- `nursing`, `nurse`, `dental`, `pharmacy`, `veterinary`
- `occupational health` (medical, not HR)
- `district health director`, `county health`, `health department`

**Education & Academic:**
- `teaching and learning`, `distance learning`, `e-learning`, `elearning`, `online learning`
- `experiential learning` (academic context)
- `admissions and recruitment`, `admissions` (academic enrollment)
- `student recruitment`, `undergraduate recruitment`, `graduate recruitment`
- `residency training`, `fellowship`, `academic affairs`
- `program director` (when clearly academic: allied health, nursing, etc.)

**Travel & Hospitality:**
- `travel director`, `business travel`, `travel sales`, `travel management`
- `travel and housing`, `travel and expense`

**Sales-specific recruiting:**
- `driver recruitment`, `driver recruiting`
- `attorney recruiting`, `legal recruiting` (law firm specific)
- `football recruiting`, `athletic recruitment`

**Other irrelevant:**
- `horticulture`, `agriculture`, `veterinary`
- `arts and culture`, `humanities director`
- `machine learning director`, `ai director` (tech, not HR)
- `financial controller` (unless paired with HR)
- `board of directors` (governance, not operational)

### REVIEW — Ambiguous, Needs Context

These patterns get flagged for human review:

- **"Director of Training"** — Could be corporate L&D (KEEP) or military/clinical/aviation (REMOVE)
- **"Director of Recruiting"** — Could be corporate talent acquisition (KEEP) or niche recruiting (REMOVE)
- **"Director of Culture"** — Could be organizational development (KEEP) or arts/community (REMOVE)
- **"Director of Benefits"** — Could be employee benefits (KEEP) or insurance/health plan sales (REMOVE)
- **"Director of Staffing"** — Could be internal HR (KEEP) or staffing agency (REMOVE)
- **"Director of Workforce"** — Could be HR workforce planning (KEEP) or government program (REMOVE)
- **"Director of Employer Relations"** — Could be HR (KEEP) or university career services (REMOVE)
- **"Payroll Director"** — Likely HR-adjacent (usually KEEP), but confirm

### Override Logic

When a title contains BOTH a KEEP signal and a REMOVE signal, apply this precedence:
1. If the title explicitly contains `human resources` or `hr` (word boundary), KEEP wins
2. Otherwise, REMOVE wins
3. If neither is strong, send to REVIEW

**Examples:**
- "Director of Human Resources and Risk Management" → KEEP (explicit HR)
- "Director of Accounting and Human Resources" → KEEP (explicit HR)
- "Director Employee Health Services" → REMOVE (clinical health program)
- "Director of Corporate Training" → REVIEW (ambiguous)
- "Director Benefits and Health Mgt" → REVIEW (ambiguous)
- "Regional Human Resources Director (First Aid and Safety Division)" → KEEP (explicit HR)

---

## Output Format

### contacts_kept.csv
All original columns plus:
- `_filter_status`: "KEEP"
- `_filter_reason`: Brief explanation (e.g., "Core HR title", "HR Business Partner variant")

### contacts_removed.csv
All original columns plus:
- `_filter_status`: "REMOVE"
- `_filter_reason`: Brief explanation (e.g., "Fitness role - not HR", "Healthcare clinical role")

### contacts_review.csv
All original columns plus:
- `_filter_status`: "REVIEW"
- `_filter_reason`: Why it's ambiguous (e.g., "Training director - could be corporate L&D or military/clinical")

### filter_summary.txt
```
=== CSV Contact Filter Results ===
Input file: [filename]
Total contacts: [n]
Kept: [n] ([%])
Removed: [n] ([%])
Review: [n] ([%])

Top removal reasons:
  - Healthcare/clinical role: [n]
  - Fitness role: [n]
  - Academic/education role: [n]
  - Travel/hospitality: [n]
  - Other: [n]
```

---

## Custom Persona Mode

If the user specifies a different target (e.g., "I want Directors of IT" or "I want Marketing VPs"), adapt the rules:

1. Ask the user to describe the target persona
2. Generate equivalent KEEP/REMOVE/REVIEW rules
3. Run the filter with the custom rules
4. Follow the same three-file output pattern

---

## Important Notes

- **Preserve all original data**: Never delete columns. Only ADD the filter columns.
- **Case insensitive**: All matching is case-insensitive.
- **Handle encoding**: CSVs may have varied encodings. Try utf-8 first, then latin-1.
- **Deduplication**: Flag exact duplicate rows (same name + same company + same title) in the output but don't auto-remove them — add a `_duplicate` column.
- **Large files**: The Python script handles files of any size. The REVIEW step is where Claude adds value for ambiguous cases.
- **Script location**: `scripts/filter_contacts.py` in the project root.
