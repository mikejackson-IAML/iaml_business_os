# /handoff

Generate a ready-to-execute command to push this work to Claude Code in the cloud.

## GSD Framework Context

The GSD workflow follows this sequence per phase:
1. `/gsd:discuss-phase N` — Shape implementation (requires human input)
2. `/gsd:plan-phase N` — Create atomic task plans
3. `/gsd:execute-phase N` — Build it (can run autonomously)
4. `/gsd:verify-work N` — Confirm deliverables work
5. Repeat for next phase

## Your Task

1. Identify the project name from our session
2. Determine the current GSD phase number
3. Determine which GSD step we just completed (discuss, plan, execute, verify)
4. Capture key decisions and context from this session
5. Identify the next GSD command to run
6. Determine the appropriate checkpoint to stop at

## Output Rules

- Output ONLY the command, starting with: Continue
- No markdown, no code blocks, no explanation
- Keep it concise but include essential context
- Always specify the next `/gsd:` command to run
- Always specify a stop point

## Output Format

Continue [project name] in [.planning path]. Context: [key decisions/outcomes from session]. Files touched: [if any]. Next: [/gsd:command]. Stop at: Completion of [command] or when human input needed.

## Stop Points by GSD Step

- After `/gsd:plan-phase` → Stop before execute, let me review plans
- After `/gsd:execute-phase` → Stop at verify, let me check work
- After `/gsd:verify-work` → Stop before next phase discuss
- After `/gsd:discuss-phase` → Stop after plan created

## Example Outputs

Continue lead-intelligence in .planning. Context: Decided Apollo for enrichment, skip ZoomInfo due to cost. Schema approved. Next: /gsd:plan-phase 2. Stop at: Plan complete, before execute.

Continue web-intelligence in .planning. Context: Phase 1 verified, all workflows passing. Next: /gsd:discuss-phase 2. Stop at: When implementation decisions needed.

## Usage

After working locally:
```
/handoff
```

Claude outputs:
```
Continue lead-intelligence in .planning. Context: Reviewed enrichment logic, approved 3-task plan for Apollo integration. Next: /gsd:execute-phase 1. Stop at: Execution complete, before verify.
```

You add `&` and press enter:
```
& Continue lead-intelligence in .planning. Context: Reviewed enrichment logic, approved 3-task plan for Apollo integration. Next: /gsd:execute-phase 1. Stop at: Execution complete, before verify.
```
