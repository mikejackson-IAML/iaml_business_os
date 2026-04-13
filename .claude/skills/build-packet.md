---
name: build-packet
description: Convert a PRD, feature request, or task description into a structured Build Packet for autonomous PopeBot execution. Use when planning a build, starting a new feature, or when asked to create a build packet/plan. Triggers on: create a build packet, write build packet for, plan this build, package this for popebot, prepare for autonomous build.
---

# Build Packet Generator

Convert any product requirement, feature request, bug report, or task description into a structured Build Packet optimized for autonomous execution by PopeBot agents.

## Phase 1: Repo Discovery (ALWAYS RUN FIRST)

Before generating any Build Packet, gather repo context. This makes every packet specific to the codebase rather than generic.

### Step 1: Read Project Documentation
Read these files in order (skip if not found):
1. `CLAUDE.md` (root and subdirectories)
2. `README.md`
3. `ARCHITECTURE.md`
4. `package.json` / `requirements.txt` / `Cargo.toml` (whatever exists)
5. `.claude/skills/` directory listing
6. `.claude/commands/` directory listing

### Step 2: Identify Tech Stack
From the docs and config files, determine:
- **Language(s):** [e.g., vanilla JS, TypeScript, Python]
- **Framework(s):** [e.g., none, Next.js, Flask]
- **CSS approach:** [e.g., vanilla CSS with variables, Tailwind, styled-components]
- **Build process:** [e.g., none, Vite, Webpack]
- **Testing:** [e.g., Playwright, Jest, pytest]
- **Hosting:** [e.g., Vercel, AWS, Docker]
- **Key integrations:** [e.g., Stripe, Airtable, Supabase]
- **Anti-patterns:** [things the project explicitly avoids]

### Step 3: Map File Structure
Run a quick scan of the directory structure (depth 2) to understand:
- Where source code lives
- Where tests live
- Where configs live
- Where data/content lives
- Where API/serverless functions live

### Step 4: Identify Existing Patterns
Look for:
- How existing components are structured
- CSS naming conventions and file organization
- JavaScript module patterns
- API endpoint patterns
- Test patterns
- Commit message conventions
- PR conventions

### Step 5: Check for Active Work
- Look at recent commits or open branches
- Note any files that are actively being modified
- Flag potential merge conflict zones

**Store all discovery findings in memory for the packet generation phase.**

---

## Phase 2: Gap Analysis (FLAG, DON'T ASK)

This agent runs AUTONOMOUSLY from a PRD — there is no interactive conversation. After repo discovery, analyze the PRD for gaps:

**If information is missing or ambiguous:**
- Do NOT block execution waiting for answers
- Do NOT ask clarifying questions in chat
- Instead: mark the section `[NEEDS INPUT]` with a clear explanation of what's needed and why
- The human reviews the Build Packet PR and fills in gaps before triggering the Builder

**Use repo discovery to fill gaps automatically:**
- Tech stack? → discovered from CLAUDE.md / package.json
- File paths? → discovered from directory scan
- Conventions? → discovered from existing code patterns
- Test commands? → discovered from scripts/package.json

**For quick-fix items (typos, small content changes):** use the Quick Packet format.

**If the PRD naturally splits into multiple independent deliverables:** generate separate packets with sequence numbers and dependency markers. One packet per PR-sized unit of work.

---

## Phase 3: Generate Build Packet

Use the repo discovery context to make every section specific. Reference actual file paths, actual conventions, actual patterns from the codebase.

```markdown
# Build Packet: [Descriptive Title]
# Generated: [date]
# Repo: [repo URL]
# Priority: [P0-critical | P1-high | P2-normal | P3-low]
# Estimated effort: [quick-fix (<30min) | small (<2hr) | medium (<1 day) | large (multi-day)]
# Tech stack: [summary from discovery — e.g., "Vanilla HTML/CSS/JS, Vercel, Airtable, Stripe"]

---

## 1. Context

**Business:** [tenant/business name]
**Stakeholder:** [who requested or benefits]
**Why this matters:** [business problem — not technical, business language]
**User story:** As a [user type], I want [capability] so that [business value].

---

## 2. Current State

What exists today. Reference specific files found during repo discovery.

- `[actual/file/path]` — [what it does now, what's wrong or missing]
- `[actual/file/path]` — [relevant context]
- **Current behavior:** [what happens today]
- **Known issues:** [anything broken or degraded]

---

## 3. Target State

Concrete description of the finished product.

- **What the user sees:** [specific UI/content]
- **What the system does:** [specific behavior]
- **How it differs from current:** [specific delta]

---

## 4. Scope

### In scope (deliverables)
- [ ] [specific deliverable with file paths]
- [ ] [specific deliverable with file paths]

### Explicitly out of scope
- [thing NOT to touch — be specific about files/directories]

### Risk zones
- [files with high blast radius — from discovery context]
- [payment/registration/production data flows if applicable]

---

## 5. Files to Read First

**Project standards (always read):**
[List the actual documentation files found during discovery — CLAUDE.md, ARCHITECTURE.md, etc.]

**Specific to this build:**
- `[file]` — [why: what context this provides]
- `[file]` — [why: related logic that must stay consistent]
- `[file]` — [why: patterns or tokens to reuse]

---

## 6. Design Reference

[Based on repo discovery — reference actual existing pages/components to match]

- **Match the style of:** `[actual component or page path from the repo]`
- **Design tokens:** `[actual path to variables/theme file]`
- **Layout pattern:** [describe the actual pattern used in similar pages]
- **Do NOT invent:** new visual patterns not found in the existing codebase

For non-UI work: "N/A — backend/automation/data work"

---

## 7. Requirements

### Functional
- [what it must DO]

### Technical
[Reference actual tech stack from discovery]
- Language/framework: [from discovery]
- Must follow: [actual conventions from CLAUDE.md or project docs]
- [specific technical requirements for this build]

### Data
- **Source:** [actual data source from the project — table name, API endpoint, JSON file path]
- **Format:** [expected shape]
- **Test data:** [what to use for testing]

### Dependencies
- [what must exist first]
- [other builds or PRs to complete first]

---

## 8. Constraints

[Start with constraints from CLAUDE.md / project docs, then add build-specific ones]

**From project standards:**
- [key constraint from CLAUDE.md — e.g., "Vanilla JS only, no frameworks"]
- [key constraint — e.g., "New CSS goes in main.css only"]

**Build-specific:**
- [constraint unique to THIS build]
- [business rule the agent wouldn't know from code]
- [performance budget if applicable]

---

## 9. Acceptance Criteria

- [ ] **[criterion]** — verify by: [specific check]
- [ ] **[criterion]** — verify by: [specific check]
- [ ] **Progressive enhancement** — verify: disable JS, content still renders
- [ ] **Responsive** — verify at: 320px, 768px, 1024px+
- [ ] **Accessible** — verify: ARIA labels, keyboard nav, color contrast

---

## 10. QA Checklist

[Reference actual test commands from repo discovery — don't list generic checks if the project has specific ones]

- [ ] [actual test command from project] — [what it checks]
- [ ] [actual test command] — [what it checks]
- [ ] [additional check specific to this build]

---

## 11. Test Environment

- **Test against:** [local dev / preview / production — based on project hosting from discovery]
- **Test credentials:** [what's available via agent secrets or env]
- **Test data:** [specific records or "use live data read-only"]
- **Safe to experiment:** [yes/no]

---

## 12. Related Changes

- **Other builds in flight:** [check recent branches/PRs from discovery]
- **Merge order:** [sequence dependencies]
- **Shared files:** [files multiple agents might touch]

---

## 13. Escalation Rules

Stop and ask for human input if:

- [ ] Change would affect more than [N] files (default: 10 normal, 3 critical paths)
- [ ] Business logic is ambiguous — guessing could be wrong
- [ ] A test fails unexpectedly
- [ ] Build would touch [risk zones from Section 4]
- [ ] External API returns unexpected responses
- [ ] Effort significantly exceeds estimated level
- [ ] [custom rule for this build]

---

## 14. Success Signal

> "[User type] can now [do the thing] and [see the result]. Previously [old behavior]. Now [new behavior]."

---

## 15. Completion Contract

This build is DONE when:
1. All acceptance criteria pass (Section 9)
2. QA checklist is green (Section 10)
3. PR created with:
   - Descriptive title
   - Build Packet provenance (job_id if from Paperclip)
   - Summary of changes
   - Before/after screenshots (if UI change)
4. No unresolved escalation items
5. Agent has NOT touched any out-of-scope files

**Merge policy:** [auto-merge if QA passes | human review required | specific reviewer]
```

---

## Quick Packet (for P3 / quick-fix items)

For typos, small content changes, single-file fixes — don't force a 15-section doc.

```markdown
# Quick Build: [Title]
# Priority: P3 | Effort: quick-fix
# Repo: [repo URL]

## What to change
`[specific file]` — [specific change]

## Read first
- `[file that contains the thing being changed]`

## Verify
- [ ] [one-line verification]

## Don't touch
- [anything else]
```

---

## Generation Rules

1. **Discovery first, always.** Never generate a packet without reading the repo. The discovery phase is what makes packets specific instead of generic.

2. **Use discovered file paths.** Every packet should reference actual paths from the repo, not placeholders. If you found `css/main.css` during discovery, reference it — don't write "[stylesheet]."

3. **Inherit project conventions.** If CLAUDE.md says "mobile-first," every acceptance criterion should include responsive checks. If the project uses specific commit message formats, the completion contract should reference them.

4. **Ask before guessing.** If the input doesn't specify something critical, ask. But don't ask about things you learned from discovery.

5. **Right-size the packet.** Typo fix → Quick Packet. New feature → full packet. Match document weight to task weight.

6. **Name the "don't touch" list.** Scope creep prevention. Explicitly listing what NOT to change is more effective than listing what to change.

7. **One packet per PR.** Don't bundle unrelated changes. Split naturally independent deliverables into separate packets.

8. **Flag [NEEDS INPUT] honestly.** Better to flag 5 unknowns than to guess 5 wrong answers.
