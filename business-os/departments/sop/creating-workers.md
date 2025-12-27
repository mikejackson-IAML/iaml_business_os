# SOP: Creating New Workers (Coworkers)

> How to add new AI coworkers to the department hierarchy

---

## When to Create a New Worker

Create a new worker when you need:
- A specialized role not covered by existing workers
- To break down a large role into smaller, focused roles
- Someone to handle a specific recurring task
- A new department or function

---

## Step 1: Identify the Role

Answer these questions:
1. **What is the primary responsibility?** (one sentence)
2. **Who will this role report to?** (existing manager/director/chief)
3. **What level is this role?** (Specialist/Manager/Director/Chief)
4. **What department does it belong to?**

---

## Step 2: Create the Folder Structure

```
departments/{department}/{level}/{role-name}/
├── coworker.md
├── dashboard.md (for managers+)
└── skills/
    └── .gitkeep
```

**Folder naming conventions:**
- Use lowercase with hyphens: `content-seo`, `account-executive`
- Be descriptive but concise
- Match the role name to the folder name

---

## Step 3: Create the Coworker File

Use the template at `departments/_templates/coworker-template.md`

**Required fields:**
1. **Title & Nickname**: `# {Role} - {Name} "{Nickname}"`
2. **Mission**: One sentence describing the role's purpose
3. **Identity table**: Department, Reports To, Direct Reports, Level
4. **Primary Question**: The key question this role answers
5. **Responsibilities**: Daily, Weekly, Periodic tasks
6. **Needs to Know**: Critical information requirements
7. **Decision Authority**: What they can decide vs escalate

**Name conventions:**
- Use gender-neutral names: Alex, Jordan, Casey, Riley, Morgan, Taylor, etc.
- Each name should be unique across the organization
- Nicknames should be descriptive: "The Crawler Detective", "The Pipeline Builder"

---

## Step 4: Create Dashboard (Managers+)

Use the template at `departments/_templates/dashboard-template.md`

Dashboards should include:
- Quick status of direct reports
- Key metrics for their area
- Active issues
- Escalation items

---

## Step 5: Define Skills

Create skill files in the `skills/` folder:
- One skill per file
- Name format: `verb-noun.md` (e.g., `audit-seo.md`)
- Link skills in the coworker file

---

## Step 6: Update the Index

Add the new worker to `departments/coworker-index.md`

---

## Step 7: Wire Up Reporting

Ensure the new worker's manager has them listed in their "Direct Reports" section.

---

## Checklist

- [ ] Folder structure created
- [ ] `coworker.md` created with all required fields
- [ ] `dashboard.md` created (if manager+)
- [ ] Skills folder created
- [ ] Manager's file updated with new direct report
- [ ] Coworker index updated
- [ ] Department structure doc updated

---

## Example: Adding a "Social Media Specialist"

```bash
# Create the structure
departments/cmo/specialists/social-media/
├── coworker.md
└── skills/
    └── .gitkeep
```

**coworker.md:**
```markdown
# Social Media Specialist - Riley "The Engagement Expert"

> Build and engage social media communities.

## Identity
| Attribute | Value |
|-----------|-------|
| **Department** | Marketing |
| **Reports To** | Email Marketing Manager (Alex) |
| **Direct Reports** | None |
| **Level** | Specialist |

...
```

Then update:
1. Email Marketing Manager's direct reports
2. `departments/coworker-index.md`
3. `departments/cmo/_config/department-structure.md`
