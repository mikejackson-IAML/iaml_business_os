# Autoskill

Analyze the current coding session to detect corrections and preferences, then propose targeted improvements to Skills used in the session. Use this skill to learn from feedback and improve future sessions.

## Usage

```
/autoskill
```

Also triggered by:
- "learn from this session"
- "update skills from these corrections"
- "remember this pattern"
- "make sure you do X next time"

---

## When to Activate

**DO trigger on:**
- Explicit requests like `/autoskill` or "learn from this session"
- "We always do it this way" statements
- "Remember this for next time"
- Repeated corrections (same feedback 2+ times)

**DO NOT trigger on:**
- One-off corrections without "always" or similar
- User declining skill modifications
- Context-specific instructions

---

## PHASE 1: Signal Detection

Scan the current session for learning signals:

### High-Value Signals (Corrections)
- "No, use X instead of Y"
- "We always do it this way"
- "Don't do X in this codebase"
- "That's wrong, it should be..."

### Medium-Value Signals (Repeated Patterns)
- Same feedback given 2+ times
- Consistent naming/structure choices across multiple files
- Repeated file path preferences

### Supporting Signals (Approvals)
- "Yes, that's right"
- "Perfect, keep doing it this way"
- "That's exactly what I wanted"

### Signals to Ignore
- Context-specific one-offs ("use X here" without "always")
- Ambiguous feedback
- Contradictory signals (ask for clarification instead)

Report detected signals:
```
=== Session Signals Detected ===

CORRECTIONS (high value):
1. [Signal] - "[exact quote]"
2. [Signal] - "[exact quote]"

REPEATED PATTERNS (medium value):
1. [Pattern] - Observed [N] times

APPROVALS (supporting):
1. [Signal] - "[context]"

>>> Filtering for quality...
```

---

## PHASE 2: Signal Quality Filter

For each detected signal, ask:

1. **Durability**: Was this correction repeated, or stated as a general rule?
2. **Scope**: Would this apply to future sessions, or just this task?
3. **Specificity**: Is it specific enough to be actionable?
4. **Novelty**: Is this NEW information I wouldn't already know?

### What Counts as "New Information" (Worth Capturing)

- Project-specific conventions ("we use `cn()` not `clsx()` here")
- Custom component/utility locations ("buttons are in `@/components/ui`")
- Team preferences that differ from defaults ("we prefer explicit returns")
- Domain-specific terminology or patterns
- Non-obvious architectural decisions ("auth logic lives in middleware")
- Integration quirks specific to this stack
- Business-specific rules ("never modify CTA sections")
- File naming conventions unique to this project

### NOT Worth Capturing (Already Known)

- General best practices (DRY, separation of concerns)
- Language/framework conventions (React hooks rules, TypeScript basics)
- Common library usage (standard Tailwind classes, typical Next.js patterns)
- Universal security practices (input validation, SQL injection prevention)
- Standard accessibility guidelines

**Rule: If I'd give the same advice to any project, it doesn't belong in a skill.**

Only signals passing ALL FOUR filters proceed:
```
=== Quality Filter Results ===

PASSED (will propose changes):
1. [Signal] - Durable: Yes | Scope: Global | Specific: Yes | Novel: Yes
2. [Signal] - Durable: Yes | Scope: Global | Specific: Yes | Novel: Yes

FILTERED OUT:
- [Signal] - Reason: One-time context
- [Signal] - Reason: Standard best practice

>>> Mapping to skills...
```

---

## PHASE 3: Map Signals to Skills

### Step 3.1: Identify Active Skills

Check which skills were loaded/used in the session:
- Commands in `.claude/commands/` that were invoked
- Skills in `.claude/skills/` that provided context
- CLAUDE.md project instructions

### Step 3.2: Match Signals to Skills

For each filtered signal, determine the best target:

| Signal Type | Target |
|-------------|--------|
| Command-specific correction | `.claude/commands/[command].md` |
| General project convention | `.claude/skills/[relevant].md` or new skill |
| Workflow/architecture pattern | `business-os/` knowledge docs or skills |
| Codebase-wide rule | `CLAUDE.md` or `.claude/skills/` |

### Step 3.3: Handle Unmapped Signals

If 3+ related signals don't fit any existing skill:
- Propose creating a new skill file
- Group related signals thematically
- Suggest appropriate file location

Report:
```
=== Signal-to-Skill Mapping ===

MAPPED:
1. [Signal] → .claude/commands/brand-upgrade.md (Section: Important Rules)
2. [Signal] → .claude/skills/frontend-design.md (Section: Conventions)
3. [Signal] → New skill recommended: .claude/skills/[name].md

UNMAPPED (need clarification):
- [Signal] - Could apply to multiple skills, which is primary?
```

---

## PHASE 4: Propose Changes (STOP HERE FOR APPROVAL)

### Step 4.1: Format Proposals

For each proposed edit:

```
---
### Change [N]: [Brief Description]

**File:** [path/to/SKILL.md]
**Section:** [existing section or "new section: X"]
**Confidence:** HIGH | MEDIUM

**Signal:** "[exact user quote or paraphrase]"

**Current text (if modifying):**
> existing content

**Proposed text:**
> updated content

**Rationale:** [one sentence explaining the improvement]
---
```

### Step 4.2: Group and Prioritize

Present changes grouped by file, HIGH confidence first:

```
=== Autoskill Proposals ===

Detected [N] durable preferences from this session.

## HIGH Confidence (recommended to apply)

### .claude/commands/brand-upgrade.md
[Change 1]
[Change 2]

### .claude/skills/frontend-design.md
[Change 3]

## MEDIUM Confidence (review carefully)

### .claude/skills/business-os-architecture.md
[Change 4]

## NEW SKILL Proposals

### Proposed: .claude/skills/[name].md
- Would capture: [signals 5, 6, 7]
- Purpose: [description]

---
Total: [N] changes across [M] files
```

### Step 4.3: Request Approval (REQUIRED)

**You MUST stop here and use AskUserQuestion tool.**

Present options:
- "Apply all changes" - Implement everything
- "Apply HIGH confidence only" - Skip MEDIUM confidence changes
- "Select specific changes" - User specifies which numbers
- "Revise suggestions" - User wants to modify proposals
- "Cancel" - Don't make any changes

**DO NOT proceed to Phase 5 until user explicitly approves.**

---

## PHASE 5: Apply Approved Changes

### Step 5.1: Edit Files

For each approved change:
1. Read the target file if not already read
2. Locate the exact section
3. Use Edit tool to apply the change
4. Verify the change was applied correctly

### Step 5.2: Create New Skills (if approved)

If a new skill file was approved:
1. Create the file with proper structure
2. Include all mapped signals as rules
3. Add header with purpose and context

### Step 5.3: Commit (if git available)

If the project uses git:
```bash
git add [changed files]
git commit -m "chore(autoskill): [brief description of changes]"
```

---

## PHASE 6: Summary Report

```
=== Autoskill Complete ===

### Changes Applied:
✓ [file1.md] - [summary of change]
✓ [file2.md] - [summary of change]
✓ Created: [new-skill.md]

### Signals Captured:
- "[Original correction/preference]" → [where it now lives]
- "[Original correction/preference]" → [where it now lives]

### Skills Updated:
- .claude/commands/brand-upgrade.md (2 rules added)
- .claude/skills/frontend-design.md (1 convention added)

### Git Status:
[commit hash] chore(autoskill): learned 3 preferences from session

### What I'll Remember:
Next time I encounter similar situations, I will:
- [Behavior 1]
- [Behavior 2]
- [Behavior 3]
```

---

## Important Rules

1. **NEVER apply changes without explicit approval** - Always stop at Phase 4
2. **Never delete existing rules** - Only add or clarify, never remove
3. **Prefer additive changes** - Easier to revert if needed
4. **One concept per change** - Atomic, reversible edits
5. **Preserve file structure and tone** - Match existing style
6. **When uncertain, downgrade to MEDIUM** - And explain why
7. **Cite exact quotes** - Traceability back to user feedback
8. **Don't capture obvious best practices** - Only project-specific learnings
9. **Group related signals** - Avoid scattered micro-rules

---

## Confidence Scoring

**HIGH confidence** when:
- User explicitly said "always" or "never"
- Same correction given 2+ times
- Clear project-specific convention
- Directly contradicts current skill content

**MEDIUM confidence** when:
- Single correction without "always"
- Could be interpreted multiple ways
- Affects multiple skills
- Uncertain if project-specific or personal preference

---

## Example Session

User during session: "No, we never use em dashes on this site"
User later: "Remember, no em dashes - that's a brand guideline"

Autoskill detects:
- Signal: "never use em dashes" (2 occurrences)
- Quality: Durable (Yes), Scope (Global), Specific (Yes), Novel (Yes - project rule)
- Maps to: `.claude/commands/brand-upgrade.md` (already has this!)
- Action: Verify rule exists, skip if duplicate

User: "When creating program pages, always check the Airtable cache first"

Autoskill detects:
- Signal: "always check Airtable cache first for program pages"
- Quality: Durable (Yes), Scope (Global), Specific (Yes), Novel (Yes)
- Maps to: `.claude/commands/new-program.md`
- Proposal: Add rule to Phase 1 of new-program command

---

## Files This Skill May Modify

- `.claude/commands/*.md` - Command-specific rules
- `.claude/skills/*.md` - General project context
- `CLAUDE.md` - Project-wide instructions (rare, high bar)
- `business-os/knowledge/*.md` - Business knowledge docs (rare)

---

## Related Commands

- `/brand-upgrade` - Content improvement (may receive voice rules)
- `/new-program` - Program page creation (may receive workflow rules)
- `/deep-plan-ui` - Planning (may receive architecture rules)
