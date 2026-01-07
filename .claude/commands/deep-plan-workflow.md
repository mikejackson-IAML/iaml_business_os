# Deep Plan: n8n Workflow Design

A rigorous multi-round planning process for n8n workflows that maximizes the chance of building automations correctly the first time. Ensures proper error handling, data flow, and edge case coverage before any nodes are created.

## Usage

```
/deep-plan-workflow "Sync new Stripe payments to Airtable and send confirmation email"
/deep-plan-workflow "Automated lead scoring based on Apollo enrichment"
/deep-plan-workflow "Alumni re-engagement drip sequence"
/deep-plan-workflow  # Interactive mode - will ask what you want to automate
```

---

## CRITICAL RULES

1. **MINIMUM 3 ROUNDS** before any workflow JSON is generated - no exceptions
2. **MINIMUM 80% CONFIDENCE** required before proceeding to implementation
3. **NO WORKFLOW CODE** until the user explicitly approves the final plan
4. **MAP ALL PATHS** - Happy path, error paths, edge cases must be defined
5. **VERIFY CREDENTIALS** - Confirm which services/APIs are involved and available
6. **ASK "WHAT ELSE?"** at the end of every round

---

## THE PROCESS

### ROUND 1: Discovery & Initial Understanding

**Step 1.1: Parse the Request**

If no workflow was described, ask:
> What automation would you like to build? Please describe:
> - What triggers it (webhook, schedule, manual, another event)?
> - What should happen when it runs?
> - What's the end result you want?

**Step 1.2: Explore Existing Workflows**

Before asking questions, check the codebase for relevant patterns:

- Search `n8n-workflows/` for similar workflows
- Identify which services/APIs are already integrated
- Note existing patterns for error handling, transformations, etc.
- Check for related Airtable tables, GHL pipelines, or other data sources

Report what you found:
```
=== EXISTING WORKFLOW PATTERNS ===

Related Workflows Found:
- [workflow.json] - [what it does, relevant patterns]

Services Already Integrated:
- [Service 1]: [credential name, how it's used]
- [Service 2]: [credential name, how it's used]

Relevant Data Sources:
- Airtable: [tables that might be involved]
- GHL: [pipelines/contacts that might be involved]
- Other: [any other relevant data]
```

**Step 1.3: State Your Understanding**

Summarize what you understand about the workflow:
```
=== MY CURRENT UNDERSTANDING ===

You want to automate: [description]

**Trigger:** [What starts this workflow]
**Input Data:** [What data is available at the start]
**Core Logic:** [Main processing steps]
**Output/Result:** [What happens at the end]
**Success Criteria:** [How we know it worked]
```

**Step 1.4: Ask Clarifying Questions**

Ask specific questions that will impact the workflow design:

```
=== ROUND 1 QUESTIONS ===

**Trigger & Timing:**
1. [Question about when/how this should run]
2. [Question about frequency, batching, or real-time needs]

**Data & Sources:**
3. [Question about where data comes from]
4. [Question about data format or required fields]

**Logic & Decisions:**
5. [Question about branching conditions]
6. [Question about business rules]

**Error Handling:**
7. [Question about what happens when something fails]
8. [Question about notifications or alerts]

**Integration:**
9. [Question about which services are involved]
10. [Question about credentials or API access]
```

**Step 1.5: Request Visual/Conceptual Input**

```
=== HELPFUL CONTEXT ===

To increase my confidence, it would help to have:

[ ] A rough sketch of the workflow flow (boxes and arrows, even hand-drawn)
[ ] Example data that would flow through this workflow
[ ] Screenshots of the Airtable/GHL/other systems involved
[ ] Similar workflows you've seen that do something like this
[ ] The exact format of incoming webhook data (if webhook-triggered)

You can share images or paste example JSON/data directly in the chat.
```

**Step 1.6: End Round 1**

```
=== END OF ROUND 1 ===

Current Confidence: [X]% (minimum 80% required to proceed)

What I still need to understand:
- [Gap 1]
- [Gap 2]

What else would help me design this workflow correctly the first time?
```

---

### ROUND 2: Deep Dive & Flow Design

**Step 2.1: Process New Information**

```
=== PROCESSING YOUR INPUT ===

New information integrated:
- [Key insight 1]
- [Key insight 2]
- [What example data revealed]

Updated understanding:
[Refined description of the workflow]
```

**Step 2.2: Map the Complete Flow**

Present the workflow as a visual text diagram:

```
=== PROPOSED WORKFLOW FLOW ===

[Trigger Name]
       │
       ▼
┌─────────────────┐
│ [Node 1 Name]   │
│ [What it does]  │
└────────┬────────┘
         │
         ▼
    ┌────┴────┐
    │ IF/SWITCH│ [Condition being checked]
    └────┬────┘
    ┌────┴────┬────────────┐
    ▼         ▼            ▼
[True]    [False]      [Other]
    │         │            │
    ▼         ▼            ▼
[Node 2]  [Node 3]    [Node 4]
    │         │            │
    └────┬────┴────────────┘
         │
         ▼
   [Final Node]
         │
         ▼
      [END]
```

**Step 2.3: Define Each Node**

For each node in the flow:

```
=== NODE DEFINITIONS ===

### Node 1: [Name]
- **Type:** [n8n node type, e.g., n8n-nodes-base.airtable]
- **Purpose:** [What this node does]
- **Input:** [What data it receives]
- **Output:** [What data it produces]
- **Config:** [Key configuration settings]
- **Error Handling:** [What happens if this fails]

### Node 2: [Name]
...
```

**Step 2.4: Map Data Transformations**

```
=== DATA FLOW ===

**Input Data (at trigger):**
```json
{
  "field1": "example value",
  "field2": 123
}
```

**After Node 1:**
```json
{
  "originalField": "...",
  "newField": "transformed value"
}
```

**Final Output:**
```json
{
  "result": "...",
  "status": "success"
}
```
```

**Step 2.5: Identify All Paths**

```
=== PATH ANALYSIS ===

**Happy Path (everything works):**
1. [Step 1] → 2. [Step 2] → 3. [Step 3] → Success

**Error Paths:**
- If [condition]: [what happens]
- If [API fails]: [what happens]
- If [data missing]: [what happens]

**Edge Cases:**
- [Edge case 1]: [how handled]
- [Edge case 2]: [how handled]
- [Edge case 3]: [how handled]
```

**Step 2.6: Remaining Questions**

```
=== ROUND 2 QUESTIONS ===

Based on the flow design, I need to clarify:

1. [Question about specific node behavior]
2. [Question about error recovery]
3. [Question about data validation]
```

**Step 2.7: End Round 2**

```
=== END OF ROUND 2 ===

Current Confidence: [X]% (minimum 80% required to proceed)

Confidence breakdown:
- Trigger mechanism: [X]%
- Data transformations: [X]%
- Error handling: [X]%
- Integration points: [X]%

What's still unclear:
- [Remaining uncertainty 1]
- [Remaining uncertainty 2]

What else would help me design this workflow correctly the first time?
```

---

### ROUND 3: Final Plan & Confidence Check

**Step 3.1: Present Complete Workflow Specification**

```
=== FINAL WORKFLOW SPECIFICATION ===

## Overview
**Name:** [Workflow name]
**Purpose:** [One sentence description]
**Trigger:** [How it starts]
**Frequency:** [How often it runs]
**Services Used:** [List of integrations]

---

## Workflow Diagram

[ASCII diagram of complete flow]

---

## Node-by-Node Specification

### 1. [Trigger Node]
- **Type:** [node type]
- **Configuration:**
  - [Setting 1]: [value]
  - [Setting 2]: [value]
- **Output Schema:**
```json
{ "example": "output" }
```

### 2. [Next Node]
...

---

## Data Transformations

| From Node | To Node | Transformation |
|-----------|---------|----------------|
| [Node A] | [Node B] | [What changes] |
| [Node B] | [Node C] | [What changes] |

---

## Error Handling Strategy

| Error Scenario | Detection | Response |
|----------------|-----------|----------|
| [API timeout] | [How detected] | [Retry/alert/skip] |
| [Invalid data] | [How detected] | [Reject/default/alert] |
| [Rate limit] | [How detected] | [Wait/queue/alert] |

---

## Edge Cases

| Scenario | Likelihood | Handling |
|----------|------------|----------|
| [Edge case 1] | [Low/Med/High] | [How handled] |
| [Edge case 2] | [Low/Med/High] | [How handled] |

---

## Testing Checklist

After implementation, verify:
- [ ] Trigger fires correctly
- [ ] Happy path completes successfully
- [ ] Error path [X] handled correctly
- [ ] Error path [Y] handled correctly
- [ ] Edge case [Z] handled correctly
- [ ] Data appears correctly in [destination]
- [ ] No duplicate processing occurs
- [ ] Rate limits respected

---

## Credentials Required

| Service | Credential Name | Status |
|---------|-----------------|--------|
| [Service 1] | [Name] | [Exists/Needs setup] |
| [Service 2] | [Name] | [Exists/Needs setup] |

---

## Monitoring & Alerts

- **Success indicator:** [How we know it worked]
- **Failure notification:** [How failures are reported]
- **Logging:** [What gets logged where]
```

**Step 3.2: Confidence Assessment**

```
=== CONFIDENCE ASSESSMENT ===

Overall Confidence: [X]%

Breakdown:
| Area | Confidence | Notes |
|------|------------|-------|
| Requirements clarity | [X]% | [Brief note] |
| Trigger mechanism | [X]% | [Brief note] |
| Data transformations | [X]% | [Brief note] |
| Error handling | [X]% | [Brief note] |
| Integration/credentials | [X]% | [Brief note] |
| Edge case coverage | [X]% | [Brief note] |

**What could still go wrong:**
1. [Risk 1] - Likelihood: [Low/Med/High]
2. [Risk 2] - Likelihood: [Low/Med/High]

**What would increase my confidence:**
- [Additional info that would help]
```

**Step 3.3: Request Approval**

If confidence >= 80%:
```
=== READY FOR APPROVAL ===

I'm at [X]% confidence. This meets the 80% threshold.

Options:
1. **Approve & Generate Workflow** - I'll create the n8n workflow JSON
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
1. Acknowledge new information
2. Update the flow design
3. Identify remaining gaps
4. Reassess confidence
5. Ask "What else would help?"

---

## IMPLEMENTATION PHASE (After Approval)

Only after explicit approval:

1. Generate the n8n workflow JSON file
2. Document any manual steps needed (credential setup, webhook URLs, etc.)
3. Provide testing instructions
4. Save to `n8n-workflows/[workflow-name].json`

---

## N8N-SPECIFIC CONSIDERATIONS

### Common Node Types

| Purpose | Node Type | Notes |
|---------|-----------|-------|
| HTTP API calls | `httpRequest` | Use for any REST API |
| Airtable | `airtable` | CRUD operations |
| Branching | `if` or `switch` | Conditional logic |
| Loops | `splitInBatches` | Process items one at a time |
| Transform data | `code` | JavaScript transformations |
| Merge paths | `merge` | Combine multiple branches |
| Wait | `wait` | Delays and scheduling |
| Error handling | `errorTrigger` | Catch workflow errors |

### Error Handling Patterns

**Continue on Error:**
```json
"onError": "continueRegularOutput"
```

**Retry Logic:**
- Use `splitInBatches` with batch size 1
- Add error handling per item
- Failed items can be logged/retried separately

**Notifications on Failure:**
- Add error trigger workflow
- Send to Slack/email/GHL

### Rate Limit Handling

- Use `splitInBatches` to process slowly
- Add `wait` nodes between API calls
- Track API usage in workflow metadata

### Idempotency Patterns

- Check if record already processed before acting
- Use unique identifiers to prevent duplicates
- Store processing status in source system

---

## QUESTIONS TO ALWAYS ASK

For any n8n workflow, ensure these are answered:

**Trigger:**
- [ ] What starts this workflow?
- [ ] Can it be triggered multiple times for the same data?
- [ ] What's the expected volume/frequency?

**Data:**
- [ ] What data is available at the start?
- [ ] What format is it in?
- [ ] What fields are required vs optional?

**Logic:**
- [ ] What decisions need to be made?
- [ ] What are the possible outcomes?
- [ ] Are there any business rules to enforce?

**Errors:**
- [ ] What happens if an API call fails?
- [ ] Should failures block the whole workflow or just that item?
- [ ] Who should be notified of failures?

**Output:**
- [ ] Where does the result go?
- [ ] What format does the destination expect?
- [ ] How do we verify it worked?

**Operations:**
- [ ] Should this run on a schedule or on-demand?
- [ ] Are there rate limits to respect?
- [ ] Is this idempotent (safe to re-run)?

---

## CHECKPOINT SYSTEM

Throughout planning, create named checkpoints:

```
=== CHECKPOINT: [NAME] ===
Round: [N]
Confidence: [X]%
Key decisions made:
- [Decision 1]
- [Decision 2]
Flow state:
[Current ASCII diagram]
```

User can say "go back to checkpoint [NAME]" to revisit decisions.

---

## RELATED COMMANDS

- `/deep-plan` - Frontend feature planning
- `/smoke` - Test deployed functionality
- `/deploy` - Deploy to production
