# Feedback System

> Capture feedback to help the Business OS improve over time.

---

## How This Works

When any coworker or skill produces output that needs correction, log it here. Over time, patterns emerge that improve the entire system.

### Folder Structure

```
feedback/
├── corrections/         # When outputs were wrong or needed fixing
│   └── YYYY-MM-DD-{context}.md
├── wins/               # When something worked really well
│   └── YYYY-MM-DD-{context}.md
└── skill-improvements/ # Specific skill refinements
    └── {skill-name}/
        └── v1.md, v2.md, etc.
```

---

## When to Log Feedback

### Log a CORRECTION when:
- A coworker misunderstood something
- Output was wrong or misleading
- Tone was off
- Format wasn't useful
- Data was missing or incorrect
- You had to redo significant work

### Log a WIN when:
- Output was exactly what you needed
- Coworker caught something you missed
- Skill saved significant time
- Something worked better than expected
- You want to reinforce this behavior

---

## Correction Template

Create a file in `corrections/` named `YYYY-MM-DD-{brief-description}.md`:

```markdown
# Correction: [Brief Title]

**Date:** [Date]
**Coworker/Skill:** [Which coworker or skill]
**Severity:** [Minor/Moderate/Major]

## What Happened
[Describe the situation]

## What Was Wrong
[Specifically what was incorrect or unhelpful]

## What Should Have Happened
[The correct approach or output]

## Root Cause (if known)
[Why this might have happened]

## Action Taken
[How this should inform future behavior]
- [ ] Update coworker context
- [ ] Update skill instructions
- [ ] Add to training examples
- [ ] Other: [describe]
```

---

## Win Template

Create a file in `wins/` named `YYYY-MM-DD-{brief-description}.md`:

```markdown
# Win: [Brief Title]

**Date:** [Date]
**Coworker/Skill:** [Which coworker or skill]

## What Happened
[Describe the situation]

## What Worked Well
[Specifically what was great]

## Why This Matters
[Impact or value created]

## Reinforce By
[How to ensure this keeps happening]
- [ ] Add to examples
- [ ] Note in coworker feedback log
- [ ] Share pattern with other skills
```

---

## Weekly Feedback Review

The Chief Improvement Officer should review feedback weekly:

1. Read all new corrections and wins
2. Identify patterns across entries
3. Update relevant coworkers and skills
4. Archive processed feedback
5. Update improvement backlog

---

## Feedback Metrics

Track these monthly:

| Metric | Goal | Current |
|--------|------|---------|
| Corrections logged | Trending down | - |
| Wins logged | Trending up | - |
| Corrections → Improvements | 80%+ | - |
| Same issue recurring | 0 | - |

---

## Example Entries

### Example Correction

```markdown
# Correction: Morning Briefing Missing Pipeline Data

**Date:** 2024-01-15
**Coworker/Skill:** Chief of Staff / morning-briefing.md
**Severity:** Moderate

## What Happened
Morning briefing ran but showed no pipeline data.

## What Was Wrong
The briefing said "No pipeline data available" instead of pulling from GoHighLevel.

## What Should Have Happened
Should have shown current opportunities, or clearly stated why data couldn't be retrieved with suggested action.

## Root Cause
GoHighLevel MCP wasn't connected yet - skill didn't handle this gracefully.

## Action Taken
- [x] Update skill to check for MCP availability
- [x] Add fallback messaging when data unavailable
- [x] Note to connect GoHighLevel MCP as priority
```

### Example Win

```markdown
# Win: Perfect Proposal Draft

**Date:** 2024-01-18
**Coworker/Skill:** Sales Director / generate-proposal.md

## What Happened
Generated a proposal for [Company] that needed minimal editing.

## What Worked Well
- Captured their specific needs perfectly
- Pricing was appropriate
- Tone matched our brand voice
- Timeline was realistic

## Why This Matters
Saved about 90 minutes of proposal writing time. Client commented it "felt like we really understood them."

## Reinforce By
- [x] Note the input format that worked well (detailed discovery notes)
- [x] Add this as example in proposal skill
```

---

## Integration with Coworkers

Each coworker has a Feedback Log section. Monthly, transfer learnings from here to their individual logs for persistent memory.
