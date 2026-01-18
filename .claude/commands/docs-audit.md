# Documentation Audit

Scan the Business OS for documentation gaps and missing CEO summaries.

## Objective

Find all components that are missing required documentation, then offer to fix them.

---

## Execution Steps

### Phase 1: Scan Workflows

1. **Find all workflow JSON files:**
   ```
   Glob: business-os/workflows/*.json
   ```

2. **For each workflow JSON, check for matching README:**
   - Expected: `business-os/workflows/README-[workflow-name].md`
   - Example: `domain-health-sync.json` should have `README-domain-health-sync.md`

3. **Record missing READMEs**

### Phase 2: Scan Workers

1. **Find all worker definition files:**
   ```
   Glob: business-os/departments/**/workers/*.md
   ```

2. **For each worker file, grep for CEO Summary pattern:**
   ```
   Pattern: > \*\*CEO Summary:\*\*
   ```

3. **Record workers missing CEO summaries**

### Phase 3: Scan Employees

1. **Find all ROLE.md files:**
   ```
   Glob: business-os/departments/**/employees/*/ROLE.md
   ```

2. **For each ROLE.md, grep for CEO Summary pattern:**
   ```
   Pattern: > \*\*CEO Summary:\*\*
   ```

3. **Record employees missing CEO summaries**

### Phase 4: Scan Departments

1. **Find all DEPARTMENT.md files:**
   ```
   Glob: business-os/departments/*/DEPARTMENT.md
   ```

2. **For each DEPARTMENT.md, grep for CEO Summary pattern:**
   ```
   Pattern: > \*\*CEO Summary:\*\*
   ```

3. **Record departments missing CEO summaries**

### Phase 5: Check Central README

1. **Read the workflows README:**
   ```
   Read: business-os/workflows/README.md
   ```

2. **Compare listed workflows against actual workflow JSON files**

3. **Record any workflows not listed in the central README**

---

## Output Format

Generate a report in this format:

```
# Documentation Audit Report

**Date:** [Current date]

---

## Summary

| Category | Total | Documented | Missing |
|----------|-------|------------|---------|
| Workflows | X | Y | Z |
| Workers | X | Y | Z |
| Employees | X | Y | Z |
| Departments | X | Y | Z |

---

## Workflows

[Check] 14/14 workflow JSONs have README files

OR

[Warning] 2 workflows missing README files:
- new-workflow.json
- another-workflow.json

---

## Workers

[Check] All workers have CEO summaries

OR

[Warning] 3 workers missing CEO summaries:
- departments/lead-intelligence/sub-departments/sourcing/workers/apollo-monitor.md
- departments/marketing/sub-departments/email/workers/sequence-optimizer.md

---

## Employees

[Check] All ROLE.md files have CEO summaries

OR

[Warning] 1 employee missing CEO summary:
- departments/digital/employees/devops-specialist/ROLE.md

---

## Departments

[Check] All DEPARTMENT.md files have CEO summaries

OR

[Warning] 1 department missing CEO summary:
- departments/programs/DEPARTMENT.md

---

## Central README (Workflows)

[Check] All workflows listed in business-os/workflows/README.md

OR

[Warning] 2 workflows not listed in central README:
- new-workflow.json
- another-workflow.json
```

---

## After Report

Ask the user:

```
Would you like me to fix these gaps?

Options:
1. Generate missing workflow READMEs
2. Add CEO summaries to flagged files
3. Update central README with missing workflows
4. Fix all issues
5. No, just show the report
```

If user selects an option, generate the missing documentation following the templates in `business-os/docs/DOCUMENTATION-STANDARDS.md`.

---

## Generating Missing Documentation

### For Missing Workflow READMEs

1. Read the workflow JSON to understand what it does
2. Generate a README following this structure:

```markdown
# [Workflow Name]

> **CEO Summary:** [Infer from workflow structure - what does it do and why does it matter?]

## What It Does

[Describe based on workflow nodes and connections]

## Trigger

- **Type:** [Schedule / Webhook / Manual - infer from trigger node]
- **Schedule:** [If scheduled, note the cron pattern]

## Data Flow

[List the main steps based on node sequence]

## Integrations

[List services used based on node types]

## Related

- [Link to department if identifiable]
```

### For Missing CEO Summaries

1. Read the existing file content
2. Infer what the component does from the content
3. Insert a CEO Summary line after the title:

```markdown
> **CEO Summary:** [One sentence based on the file's purpose]
```

---

## Success Criteria

- All workflow JSONs have matching README files
- All workers have CEO summaries
- All ROLE.md files have CEO summaries
- All DEPARTMENT.md files have CEO summaries
- Central README lists all workflows
