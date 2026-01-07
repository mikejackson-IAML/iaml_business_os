# Deep Plan: Rigorous Multi-Round Planning for Frontend Work

A disciplined planning process that maximizes the chance of building complex frontend features correctly the first time through multiple rounds of context gathering, clarification, and confidence building.

## Usage

```
/deep-plan "Add a mega menu to the header"
/deep-plan "Redesign the registration form with multi-step wizard"
/deep-plan "Build a program comparison feature"
/deep-plan  # Interactive mode - will ask what you want to build
```

---

## CRITICAL RULES

1. **MINIMUM 3 ROUNDS** before implementation can begin - no exceptions
2. **MINIMUM 80% CONFIDENCE** required before proceeding to implementation
3. **NO CODE WRITING** until the user explicitly approves the final plan
4. **ACTIVELY REQUEST** visual references, annotated screenshots, and examples when they would help
5. **ASK "WHAT ELSE?"** at the end of every round

---

## THE PROCESS

### ROUND 1: Discovery & Initial Understanding

**Step 1.1: Parse the Request**

If no task was provided, ask:
> What frontend feature would you like to plan? Please describe it in as much detail as you can.

**Step 1.2: Explore the Codebase**

Before asking any questions, thoroughly explore relevant parts of the codebase:

- Search for related components, pages, or patterns
- Read existing CSS architecture and conventions
- Identify similar features that already exist
- Note the tech stack, frameworks, and libraries in use
- Find any design tokens, variables, or style guides

Report what you found:
```
=== CODEBASE EXPLORATION ===

Related Files Found:
- [file1] - [what it does, why it's relevant]
- [file2] - [what it does, why it's relevant]

Existing Patterns Identified:
- [Pattern 1]: [how it works]
- [Pattern 2]: [how it works]

Tech Stack:
- [Framework/libraries detected]
- [CSS approach: vanilla, Tailwind, etc.]

Style Conventions:
- [Naming conventions, file organization, etc.]
```

**Step 1.3: State Your Understanding**

Summarize what you understand about the request:
```
=== MY CURRENT UNDERSTANDING ===

You want to build: [description]

Purpose: [why this feature exists]
Primary Users: [who will use it]
Key Interactions: [what users will do with it]

I believe this involves:
1. [Component/change 1]
2. [Component/change 2]
3. [Component/change 3]
```

**Step 1.4: Ask Clarifying Questions**

Ask 3-7 specific questions that will significantly impact the implementation:

```
=== ROUND 1 QUESTIONS ===

**Functionality:**
1. [Question about behavior/interaction]
2. [Question about edge cases]

**Visual Design:**
3. [Question about appearance]
4. [Question about responsive behavior]

**Integration:**
5. [Question about how it connects to existing features]

**Constraints:**
6. [Question about requirements or limitations]
```

**Step 1.5: Request Visual References**

Always ask for visual input:
```
=== VISUAL REFERENCES NEEDED ===

To increase my confidence, it would help to see:

[ ] Annotated screenshot of the current state (mark what changes)
[ ] Sketch or mockup of desired outcome (even hand-drawn is helpful)
[ ] Examples from other sites that capture the feel you want
[ ] Screenshots showing specific interactions or states

You can share images directly in the chat. Even rough sketches help enormously.
```

**Step 1.6: End Round 1**

```
=== END OF ROUND 1 ===

Current Confidence: [X]% (minimum 80% required to proceed)

What I still need to know:
- [Gap 1]
- [Gap 2]

What else would help me build this perfectly on the first try?
```

---

### ROUND 2: Deep Dive & Refinement

**Step 2.1: Process New Information**

Incorporate the user's answers, images, and clarifications:
```
=== PROCESSING YOUR INPUT ===

New information integrated:
- [Key insight 1 from their answers]
- [Key insight 2 from their answers]
- [What the visual references revealed]

Updated understanding:
[Refined description of what we're building]
```

**Step 2.2: Identify Remaining Unknowns**

```
=== REMAINING QUESTIONS ===

Based on your answers, I now need to clarify:

1. [More specific question based on their input]
2. [Edge case that emerged from discussion]
3. [Technical detail that matters for implementation]
```

**Step 2.3: Propose Technical Approach**

Present your intended implementation strategy:
```
=== PROPOSED TECHNICAL APPROACH ===

**File Changes:**
1. [file] - [what changes and why]
2. [file] - [what changes and why]

**New Files (if any):**
- [file] - [purpose]

**HTML Structure:**
[Brief description of markup approach]

**CSS Strategy:**
[How styling will be handled, what patterns used]

**JavaScript Behavior:**
[Interactions, state management, events]

**Responsive Strategy:**
- Mobile: [approach]
- Tablet: [approach]
- Desktop: [approach]

**Accessibility Considerations:**
- [A11y concern 1 and how it's addressed]
- [A11y concern 2 and how it's addressed]
```

**Step 2.4: Surface Potential Issues**

```
=== POTENTIAL ISSUES & RISKS ===

Things that could cause problems:

1. **[Risk 1]**: [description]
   - Mitigation: [how we'll handle it]

2. **[Risk 2]**: [description]
   - Mitigation: [how we'll handle it]

Questions to prevent rework:
- [Specific question about a risk]
```

**Step 2.5: Request Additional Visual Input (if needed)**

If visual references would still help:
```
=== ADDITIONAL VISUALS THAT WOULD HELP ===

Specifically, I'd benefit from seeing:
- [Specific visual that would clarify something]
- [Annotated image showing specific behavior]
```

**Step 2.6: End Round 2**

```
=== END OF ROUND 2 ===

Current Confidence: [X]% (minimum 80% required to proceed)

Confidence breakdown:
- Understanding requirements: [X]%
- Technical approach: [X]%
- Visual design clarity: [X]%
- Edge case coverage: [X]%

What's still unclear:
- [Remaining uncertainty 1]
- [Remaining uncertainty 2]

What else would help me build this perfectly on the first try?
```

---

### ROUND 3: Final Plan & Confidence Check

**Step 3.1: Present Complete Plan**

```
=== FINAL IMPLEMENTATION PLAN ===

## Summary
[One paragraph describing what we're building]

## Detailed Changes

### 1. [First file/component]
**File:** [path]
**Changes:**
- [Specific change 1]
- [Specific change 2]

**Code approach:**
[Pseudocode or description of key logic]

### 2. [Second file/component]
...

## User Interactions

| Action | Result | Notes |
|--------|--------|-------|
| [User action 1] | [What happens] | [Any special handling] |
| [User action 2] | [What happens] | [Any special handling] |

## Responsive Behavior

| Breakpoint | Behavior |
|------------|----------|
| Mobile (<768px) | [Description] |
| Tablet (768-1024px) | [Description] |
| Desktop (>1024px) | [Description] |

## Edge Cases Handled

1. [Edge case 1] -> [How handled]
2. [Edge case 2] -> [How handled]
3. [Edge case 3] -> [How handled]

## Accessibility

- [A11y feature 1]
- [A11y feature 2]
- [A11y feature 3]

## Testing Checklist

After implementation, verify:
- [ ] [Test case 1]
- [ ] [Test case 2]
- [ ] [Test case 3]
- [ ] [Test case 4]
```

**Step 3.2: Confidence Assessment**

```
=== CONFIDENCE ASSESSMENT ===

Overall Confidence: [X]%

Breakdown:
| Area | Confidence | Notes |
|------|------------|-------|
| Requirements clarity | [X]% | [Brief note] |
| Technical feasibility | [X]% | [Brief note] |
| Visual design | [X]% | [Brief note] |
| Edge cases | [X]% | [Brief note] |
| Integration with existing code | [X]% | [Brief note] |

**What could still go wrong:**
1. [Potential issue 1] - [Likelihood: Low/Medium/High]
2. [Potential issue 2] - [Likelihood: Low/Medium/High]

**What would increase my confidence:**
- [Thing that would help, if anything]
```

**Step 3.3: Request Approval**

If confidence >= 80%:
```
=== READY FOR APPROVAL ===

I'm at [X]% confidence. This meets the 80% threshold.

Options:
1. **Approve & Begin Implementation** - I'll start building
2. **Another Round** - You have more context to share
3. **Modify Plan** - You want changes to the approach
4. **Pause** - Save this plan for later

What would you like to do?
```

If confidence < 80%:
```
=== NOT YET READY ===

I'm at [X]% confidence, below the 80% threshold.

To proceed, I need:
- [Specific thing needed 1]
- [Specific thing needed 2]

What additional context can you provide?
```

---

### ROUND 4+: Additional Rounds (if needed)

Continue iterating until:
- Minimum 3 rounds completed AND
- Confidence >= 80% AND
- User explicitly approves

Each additional round should:
1. Acknowledge new information provided
2. Update the plan based on feedback
3. Identify any remaining gaps
4. Reassess confidence
5. Ask "What else would help me build this perfectly?"

---

## IMPLEMENTATION PHASE (After Approval)

Only after explicit approval, begin implementation:

1. Use TodoWrite to create detailed task list
2. Implement changes incrementally
3. Reference the plan checkpoints if issues arise
4. Report back on completion

---

## CHECKPOINT SYSTEM

Throughout the process, create named checkpoints:

```
=== CHECKPOINT: [NAME] ===
Round: [N]
Confidence: [X]%
Key decisions made:
- [Decision 1]
- [Decision 2]
```

The user can say "go back to checkpoint [NAME]" to revisit a decision point.

---

## TEMPLATES FOR REQUESTING VISUALS

Use these prompts when visual input would help:

**For current state:**
> Could you share a screenshot of how this currently looks? It helps to annotate it (circle or arrow) showing what should change.

**For desired outcome:**
> Do you have a mockup, sketch, or even a rough drawing of what you're envisioning? Even a napkin sketch photographed with your phone is valuable.

**For interaction behavior:**
> Could you record a quick screen capture showing the interaction you want? Or find an example on another site that behaves similarly?

**For specific element:**
> Could you share an image showing exactly what [specific element] should look like? Or point me to an example that captures the feel?

**For responsive behavior:**
> Could you show me (or describe) how this should look on mobile vs desktop? Screenshots at different sizes would help.

---

## ANTI-PATTERNS TO AVOID

**DO NOT:**
- Rush to implementation before 3 rounds
- Accept vague requirements without pushing for specifics
- Skip asking for visual references
- Proceed below 80% confidence
- Make assumptions without validating them
- Write any code before explicit approval

**DO:**
- Ask "stupid" questions - they often reveal important gaps
- Push back if something seems unclear
- Request annotated images proactively
- Surface risks and edge cases early
- Be honest about confidence level
- Keep asking "what else would help?"

---

## EXAMPLE CONVERSATION FLOW

```
User: /deep-plan "Add a mega menu to the header"

Round 1:
- Claude explores codebase, finds header.html, components.js, navigation patterns
- Claude summarizes understanding of mega menu request
- Claude asks about: menu structure, hover vs click, mobile behavior, content sources
- Claude requests: screenshot of current header, examples of mega menus you like
- Claude states: "Confidence: 45%. Need visual references and interaction details."

User: [provides answers and annotated screenshot]

Round 2:
- Claude integrates new info, refines understanding
- Claude proposes technical approach: new mega-menu.css, modify components.js
- Claude identifies risks: z-index conflicts, mobile touch handling
- Claude asks about: animation preferences, accessibility requirements
- Claude states: "Confidence: 72%. Need clarity on mobile UX."

User: [provides mobile mockup and animation examples]

Round 3:
- Claude presents complete implementation plan
- Claude shows confidence breakdown by area
- Claude lists what could go wrong
- Claude states: "Confidence: 88%. Ready for approval."

User: "Approved, let's build it"

Implementation:
- Claude creates todo list
- Claude implements changes
- Claude reports completion
```

---

## RELATED COMMANDS

- `/brand-upgrade` - Content review with approval workflow
- `/speed-optimize` - Performance optimization
- `/preview` - Deploy to preview environment for testing
