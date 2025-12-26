# Decision Log

> Track significant decisions with context and rationale for future reference.

---

## Why Log Decisions?

1. **Accountability** - Record what you decided and why
2. **Learning** - Review past decisions to improve future ones
3. **Context** - Remember the "why" when you revisit later
4. **Patterns** - Spot decision-making patterns over time
5. **Delegation** - Help others understand your thinking

---

## Structure

```
decisions/
├── README.md               # This file
├── log.md                  # Rolling decision log
├── pending.md              # Decisions to make
├── frameworks/             # Decision-making frameworks
│   └── README.md
└── archive/                # Yearly archives
```

---

## Decision Categories

| Category | Examples |
|----------|----------|
| **Strategic** | Business direction, major investments, pivots |
| **Financial** | Pricing, spending, investments |
| **Operational** | Processes, tools, systems |
| **People** | Hiring, partnerships, collaborations |
| **Product** | Programs, offerings, changes |
| **Marketing** | Campaigns, positioning, channels |
| **Personal** | Work style, boundaries, priorities |

---

## Decision Log Template

### Quick Entry
For routine decisions, add to `log.md`:

```markdown
## [Date] - [Decision Title]
**Category:** [Category]
**Decision:** [What was decided]
**Why:** [Brief rationale]
**Status:** [Made / Revisit on X]
```

### Full Entry
For significant decisions, create: `YYYY-MM-DD-[title].md`

```markdown
# Decision: [Title]

**Date:** [Date]
**Category:** [Category]
**Status:** [Pending / Made / Revisited / Reversed]
**Revisit By:** [Date to reconsider]

---

## Context

### Situation
[What prompted this decision?]

### Constraints
- [Constraint 1]
- [Constraint 2]

### Stakeholders
- [Who is affected]

---

## Options Considered

### Option A: [Name]
- **Description:** [What this option entails]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Effort/Cost:** [Investment required]

### Option B: [Name]
- **Description:** [What this option entails]
- **Pros:** [Benefits]
- **Cons:** [Drawbacks]
- **Effort/Cost:** [Investment required]

### Option C: [Name] (if applicable)
[Same format]

---

## Decision

**Chosen:** [Option X]

**Rationale:**
[Why this option was chosen over others]

**Key Factors:**
1. [Factor 1]
2. [Factor 2]
3. [Factor 3]

---

## Implementation

**Next Steps:**
1. [ ] [Action item]
2. [ ] [Action item]
3. [ ] [Action item]

**Timeline:** [When implementation happens]

**Success Metrics:** [How we'll know it worked]

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| [Risk 1] | [How to address] |
| [Risk 2] | [How to address] |

**Reversal Trigger:** [What would make us reconsider]

---

## Follow-Up

### [Date] - Update
[What happened, how it's going]

### [Date] - Outcome
[Final result and learnings]
```

---

## Pending Decisions

Track decisions you need to make:

```markdown
## Pending Decisions

| Decision | Category | Deadline | Blocking | Priority |
|----------|----------|----------|----------|----------|
| [Decision] | [Cat] | [Date] | [What it blocks] | [H/M/L] |
```

---

## Decision-Making Frameworks

### For Quick Decisions
- **10/10/10:** How will I feel about this in 10 minutes, 10 months, 10 years?
- **Reversibility:** Is this easily reversible? If yes, decide fast.
- **Default to Action:** When in doubt, try something.

### For Complex Decisions
- **Pro/Con List:** Classic but effective
- **Decision Matrix:** Score options against criteria
- **Pre-mortem:** Imagine it failed—what went wrong?
- **Regret Minimization:** What would I regret NOT doing?

### Decision Matrix Template
| Criteria (Weight) | Option A | Option B | Option C |
|-------------------|----------|----------|----------|
| [Criteria 1] (30%) | [1-5] | [1-5] | [1-5] |
| [Criteria 2] (25%) | [1-5] | [1-5] | [1-5] |
| [Criteria 3] (25%) | [1-5] | [1-5] | [1-5] |
| [Criteria 4] (20%) | [1-5] | [1-5] | [1-5] |
| **Weighted Total** | **[X]** | **[X]** | **[X]** |

---

## Decision Review

### Monthly
- Review pending decisions
- Follow up on recent decisions
- Close out resolved items

### Quarterly
- Review major decisions made
- Assess outcomes vs. expectations
- Extract patterns and learnings

---

## Red Flags in Decision-Making

Watch for these patterns:
- Deciding to avoid discomfort
- Waiting for perfect information
- Letting others decide by default
- Ignoring your gut completely
- Making fear-based decisions
- Analysis paralysis

---

*A good decision made now beats a perfect decision made too late.*
