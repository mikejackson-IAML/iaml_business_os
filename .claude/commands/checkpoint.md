# /checkpoint

You've reached a GSD gate that requires human input. Generate a structured checkpoint summary.

## Your Task

1. Identify the project and current GSD phase
2. Summarize what was accomplished since last checkpoint
3. Clearly state what decision or input is needed
4. List any files created or modified
5. Show what's next after input is provided

## Output Format

Use exactly this structure:

---

## CHECKPOINT: [Project Name]

**Phase:** [N] — [Phase description]
**GSD Step:** [discuss/plan/execute/verify]
**Status:** Waiting for input

### Completed This Session
- [What was done]
- [What was done]

### Files Changed
- `[filepath]` — [brief description]
- `[filepath]` — [brief description]

### Decision Needed
[Clear, specific question or decision required]

### Options (if applicable)
1. [Option A] — [tradeoff]
2. [Option B] — [tradeoff]

### After Your Input
Next command: `/gsd:[next-command]`

---

## Rules

- Be specific about what decision is needed
- If multiple decisions, number them
- Keep "Completed" list to key outcomes, not every step
- Always show the next GSD command
