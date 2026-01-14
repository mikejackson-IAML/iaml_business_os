---
name: workflow-multiplier
description: "Task routing engine for offloading work to background Claude processes. Use when starting any task to maximize throughput by running background Claude as an async 'junior dev' while staying focused in terminal. Triggers on: offload this, should I offload, parallel work, async task, background task."
---

# Workflow Multiplier

Route tasks between Terminal (execution) and Background Claude (async generation) to maximize throughput.

---

## Offload Command (Background Claude)

### Setup (one time)
```bash
# Add to your ~/.zshrc or ~/.bashrc:
source "/Users/mike/IAML Business OS/scripts/offload.sh"
```

### Usage
```bash
# Offload any task - runs in background, saves to file
offload "write documentation for the campaign tracking system"

# Check status of running tasks
offload-status

# View the latest completed result
offload-latest

# Watch a task as it completes
offload-watch
```

### What Happens
1. Your prompt + context gets sent to background Claude Code
2. You keep working in current terminal
3. macOS notification when done
4. Output saved to `tasks/responses/[timestamp]-[task].md`
5. Auto-logged to `tasks/async-queue.md`

### Output Location
```
tasks/responses/
├── 20260113-143022-write-documentation-for-the-campaign.md
├── 20260113-144512-design-n8n-workflow-for-lead-scoring.md
└── ...
```

---

## Quick Reference: 5-Second Decision

```
         ┌─────────────────────────────────────────────────┐
         │            Does it need file system?            │
         └───────────────┬─────────────────┬───────────────┘
                        YES               NO
                         │                 │
                         ▼                 ▼
         ┌───────────────────┐   ┌───────────────────────────┐
         │ Does it need      │   │ Is it pure generation?    │
         │ tight feedback?   │   │ (docs, specs, templates)  │
         └────────┬────┬─────┘   └──────────┬────────┬───────┘
                 YES  NO                   YES      NO
                  │    │                    │        │
                  ▼    ▼                    ▼        ▼
            TERMINAL  HYBRID           OFFLOAD   TERMINAL
```

---

## Classification Engine

### TERMINAL (Keep in Ghostty/Claude Code)

| Signal | Examples | Why Terminal |
|--------|----------|--------------|
| File system operations | git, file edits, search | Needs real-time access |
| Tight feedback loops | build → error → fix | Each step depends on previous |
| Package/dependency work | npm install, migrations | Interactive decisions needed |
| Current codebase state | refactoring, debugging | Needs live file context |
| Quick tasks (<5 min) | typo fix, config change | Overhead not worth it |
| Database operations | migrations, queries | Connection and verification |
| Deployment | Vercel, preview URLs | Real-time status monitoring |

### OFFLOAD (Background Claude)

| Signal | Examples | Why Offload |
|--------|----------|---------------|
| Pure generation | New files, boilerplate | No dependencies on codebase state |
| Documentation | READMEs, architecture docs | Self-contained output |
| Content writing | Email copy, landing page text | Iterative refinement works better async |
| Code review | PR analysis, audit reports | Reading + analysis = async-friendly |
| Research/analysis | Competitor analysis, specs | Thinking-heavy, not execution-heavy |
| Test data generation | Mock data, fixtures | Self-contained JSON/SQL output |
| Skill creation | New skills, workflow specs | Template-based generation |
| Planning/architecture | System design, PRDs | Strategy before execution |

### HYBRID (Split the Work)

| Pattern | Offload First | Then Terminal |
|---------|-----------------|---------------|
| New feature | Spec + component structure | Integration + testing |
| New page | HTML/CSS template + copy | Connect to data + deploy |
| Refactoring | Analysis + plan | Execute changes |
| n8n workflow | Design + JSON structure | Import + credential wiring |
| Bug investigation | Research + diagnosis | Apply fix + verify |
| New component | Markup + styling | Props + state logic |

---

## Prompt Templates

### 1. Documentation Generation

```markdown
## Context
I'm building [PROJECT_TYPE] for IAML (HR training company).
Tech stack: [STACK_DETAILS]
Current file structure:
```
[PASTE RELEVANT ls OUTPUT]
```

## Task
Create documentation for [WHAT_TO_DOCUMENT].

## Requirements
- [SPECIFIC_SECTIONS_NEEDED]
- Match tone of existing docs (professional, direct)
- Include code examples where relevant

## Output Format
Return a single markdown file I can paste directly into:
`[TARGET_PATH]`

Start with the filename, then the complete content.
```

---

### 2. Skill File Creation

```markdown
## Context
Creating a skill for the IAML Business OS platform.
Existing skills follow this pattern:
- YAML frontmatter with name/description
- Clear section headers
- Tables for quick reference
- Checklists for quality assurance

## Task
Create a skill for: [SKILL_PURPOSE]

## Requirements
- Trigger phrases: [WHEN_TO_USE]
- Key actions: [WHAT_IT_DOES]
- Should NOT: [BOUNDARIES]

## Output Format
Return complete SKILL.md content starting with:
```yaml
---
name: [skill-name]
description: "[description including trigger phrases]"
---
```

Include:
1. The Job (what this skill does)
2. Step-by-step instructions
3. Templates/examples
4. Checklist before completion
```

---

### 3. Code Review Request

```markdown
## Context
Repository: IAML Business OS
Component/file: [FILE_OR_COMPONENT]
Purpose: [WHAT_IT_DOES]

## Code to Review
```[language]
[PASTE CODE]
```

## Review Focus
- [ ] Security vulnerabilities (OWASP top 10)
- [ ] Performance issues
- [ ] Code quality / maintainability
- [ ] [SPECIFIC_CONCERNS]

## Output Format
## Review Summary
[One paragraph overall assessment]

## Issues Found
| Severity | Line | Issue | Suggested Fix |
|----------|------|-------|---------------|
| ... | ... | ... | ... |

## Recommendations
[Prioritized list of improvements]
```

---

### 4. Architecture Planning

```markdown
## Context
Project: IAML Business OS
Existing architecture: See attached CLAUDE.md
Database: Supabase PostgreSQL
Automation: n8n at n8n.realtyamp.ai
Dashboard: Next.js 16.1.1 / React 19 / TypeScript / Tailwind

## Task
Design architecture for: [FEATURE_OR_SYSTEM]

## Constraints
- Must integrate with: [EXISTING_SYSTEMS]
- Must NOT: [LIMITATIONS]
- Priority: [SPEED_VS_SCALABILITY_VS_SIMPLICITY]

## Output Format
## Architecture Overview
[Diagram in ASCII or description]

## Components
| Component | Responsibility | Technology |
|-----------|---------------|------------|
| ... | ... | ... |

## Data Flow
1. [Step-by-step flow]

## Database Schema Changes
```sql
[SQL if needed]
```

## Implementation Order
1. [First thing to build]
2. [Dependencies]
```

---

### 5. Boilerplate Generation

```markdown
## Context
Project: [website | dashboard]
Tech stack: [Vanilla HTML/CSS/JS | Next.js + Tailwind]

## Task
Generate boilerplate for: [COMPONENT_TYPE]

## Specifications
- Name: [COMPONENT_NAME]
- Props/inputs: [WHAT_IT_RECEIVES]
- Outputs/behavior: [WHAT_IT_DOES]
- Styling: [DESIGN_REQUIREMENTS]

## Output Format
Return paste-ready code blocks:

### File: `[path/to/file.ext]`
```[language]
[Complete code]
```

### Integration Notes
- Import: [how to import]
- Usage: [example usage]
```

---

### 6. n8n Workflow Design

```markdown
## Context
n8n instance: n8n.realtyamp.ai
Database: Supabase PostgreSQL
MCP: n8n-brain (has patterns, credentials, error fixes)

Existing patterns to reference:
- Uptime Monitor (schedule → HTTP → alert)
- HeyReach Activity Receiver (webhook → classify → route)
- Smartlead Activity Receiver (webhook → process → log)

## Task
Design workflow for: [WORKFLOW_PURPOSE]

## Requirements
- Trigger: [webhook | schedule | manual]
- Inputs: [WHAT_DATA_ARRIVES]
- Processing: [WHAT_TO_DO_WITH_IT]
- Outputs: [WHERE_RESULTS_GO]

## Output Format
## Workflow Overview
[ASCII diagram of flow]

## Nodes Required
| Order | Node Type | Name | Purpose |
|-------|-----------|------|---------|
| 1 | [type] | [name] | [purpose] |

## Configuration Details
[For each complex node, explain settings]

## Critical Settings
- Postgres nodes: Enable "Always Output Data"
- Error handling: [approach]
- Rate limits: [considerations]

## Testing Commands
```bash
curl -X POST "https://n8n.realtyamp.ai/webhook-test/[path]" \
  -H "Content-Type: application/json" \
  -d '[test payload]'
```
```

---

### 7. SEO Page Generation (Next.js)

```markdown
## Context
Project: IAML Dashboard (Next.js 16.1.1, React 19, TypeScript, Tailwind)
Location: dashboard/src/app/

## Task
Create SEO-optimized page for: [PAGE_PURPOSE]

## Requirements
- Route: /[URL_PATH]
- Meta title: [TITLE]
- Meta description: [DESCRIPTION]
- Target keywords: [KEYWORDS]
- Schema type: [Organization | Event | Course | FAQPage | etc.]

## Content Sections
1. [SECTION_1]
2. [SECTION_2]

## Output Format
### File: `dashboard/src/app/[route]/page.tsx`
```tsx
[Complete page component with metadata export]
```

### File: `dashboard/src/app/[route]/layout.tsx` (if needed)
```tsx
[Layout if route needs special layout]
```
```

---

### 8. Website Component Design (Vanilla)

```markdown
## Context
Project: IAML Website (Vanilla HTML/CSS/JS only)
CSS: Add to /website/css/main.css
JS: Add to /website/js/[feature].js
Design system: See website/.claude/skills/design/SKILL.md

## Task
Create component for: [COMPONENT_PURPOSE]

## Requirements
- Must work without JavaScript (progressive enhancement)
- Mobile-first responsive
- Accessibility: ARIA labels, keyboard navigation
- Colors: Use CSS custom properties (--blue-primary, --gray-900, etc.)

## Specifications
- [VISUAL_REQUIREMENTS]
- [BEHAVIOR_REQUIREMENTS]
- [STATES: hover, focus, active, disabled]

## Output Format
### HTML (paste into page)
```html
[Semantic HTML with ARIA]
```

### CSS (add to main.css)
```css
/* [Component Name] */
[Mobile-first styles]

@media (min-width: 768px) {
  [Tablet+ styles]
}
```

### JS (if needed, add to js/[feature].js)
```javascript
// [Feature] - Progressive Enhancement
document.addEventListener('DOMContentLoaded', () => {
  [Enhancement code]
});
```
```

---

## Return Format Specification

All Claude.AI outputs must follow this structure for instant execution:

```markdown
## Ready to Implement

### Files to Create/Edit:
`/path/to/file.ext`
```[language]
[Complete paste-ready code]
```

### Commands to Run:
```bash
[Any terminal commands needed]
```

### Integration Notes:
- Import: [how to import/include]
- Dependencies: [what must exist first]
- Testing: [how to verify it works]

### Not Included (do in terminal):
- [Things that need terminal execution]
```

---

## Context Block (Auto-Included with Offload)

```markdown
## IAML Business OS Context

**Company:** IAML (Institute for Applied Management & Law) - HR training company

**Tech Stack:**
| Component | Technology |
|-----------|------------|
| Website | Vanilla HTML/CSS/JS, Vercel, NO frameworks |
| Dashboard | Next.js 16.1.1, React 19, TypeScript, Tailwind CSS |
| Database | Supabase PostgreSQL |
| UI Components | Radix UI, lucide-react, Framer Motion |
| Automation | n8n at n8n.realtyamp.ai |
| CRM | GHL (GoHighLevel) |
| Email | Smartlead (cold), GHL (nurture) |
| LinkedIn | HeyReach |

**Key File Locations:**
- Website: `/website/` (HTML pages at root, CSS in `/css/main.css`)
- Dashboard: `/dashboard/src/app/` (Next.js App Router)
- Database: `/supabase/migrations/`
- n8n workflows: `/n8n-workflows/`
- Skills: `/.claude/skills/`
- Business docs: `/business-os/docs/`

**Code Conventions:**
- Website: Progressive enhancement, semantic HTML, CSS custom properties
- Dashboard: TypeScript strict, Tailwind utilities, Radix components
- Database: snake_case tables/columns, UUID primary keys
- n8n: Postgres nodes need "Always Output Data" enabled

**Current Projects:**
- Business OS: Autonomous business command center with departments
- Campaign Tracking: Multi-channel outreach (LinkedIn, Smartlead, Phone, GHL)
- Lead Intelligence: Lead sourcing, email validation, capacity planning

[ADD TASK-SPECIFIC CONTEXT BELOW]
```

---

## Tracking Protocol

Track offloaded tasks in: `tasks/async-queue.md`

### Quick Add
```bash
echo "| $(date +%Y-%m-%d) | PENDING | [task] | [claude.ai session link or notes] |" >> tasks/async-queue.md
```

### File Template
See: `TRACKING-TEMPLATE.md` in this skill folder

### Statuses
| Status | Meaning |
|--------|---------|
| PENDING | Prompt sent, waiting for output |
| READY | Output received, ready to integrate |
| INTEGRATING | Bringing output into codebase |
| DONE | Fully integrated and verified |
| BLOCKED | Needs clarification or revision |

---

## Prompt Anatomy: Why Each Part Works

```markdown
## Context                    ← Grounds the model in YOUR specific setup
[Project details]            ← Prevents generic/wrong-stack suggestions

## Task                       ← Clear single objective
[What to do]                 ← Reduces scope creep and hallucination

## Requirements               ← Constraints that shape output
- [Specific needs]           ← Forces thinking about edge cases
- [Boundaries]               ← Prevents over-engineering

## Output Format              ← Exact structure you need back
[Template]                   ← Makes output paste-ready
                             ← Eliminates reformatting work
```

**Key Principles:**
1. **Context is king** - The more specific, the more useful the output
2. **Format matters** - Specify exactly how you want it back
3. **Boundaries prevent scope creep** - Say what it should NOT do
4. **Examples anchor expectations** - Show don't tell

---

## Quick Commands

### Classify a Task
Ask yourself:
1. Does it touch files? → Probably TERMINAL
2. Is it pure text generation? → Probably OFFLOAD
3. Does it need iteration with errors? → TERMINAL
4. Is it thinking-heavy? → OFFLOAD

### Offload a Task
```bash
offload "your task description here"
```
That's it. Context auto-included, output saved to file, you get notified.

### Retrieve and Execute
```bash
offload-latest           # View most recent result
cat tasks/responses/...  # View specific result
```
Then paste code blocks to terminal and integrate.

---

## Anti-Patterns

| Don't | Do Instead |
|-------|------------|
| Send vague requests | Use templates with specific context |
| Skip the context block | Always include tech stack details |
| Forget return format | Specify exact file paths and structure |
| Track in your head | Use the tracking file |
| Wait for perfect output | Iterate in terminal after first pass |
| Offload quick fixes | Just do them in terminal |
