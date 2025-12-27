# SOP: Creating New Skills

> How to create skills that coworkers execute

---

## What is a Skill?

A skill is a defined task that a coworker can execute. It includes:
- Clear trigger/invocation
- Step-by-step instructions
- Required data sources
- Expected output format

---

## When to Create a New Skill

Create a skill when:
- A task is repeated regularly (daily, weekly, monthly)
- Multiple steps need to be executed in order
- Output needs to be consistent in format
- A coworker needs clear instructions for a task

---

## Step 1: Define the Skill

Answer these questions:
1. **What does this skill do?** (one sentence)
2. **Who executes it?** (which coworker)
3. **When is it executed?** (trigger/frequency)
4. **What data does it need?**
5. **What is the output?**

---

## Step 2: Create the Skill File

Location: `departments/{dept}/{level}/{role}/skills/{skill-name}.md`

**Naming convention:**
- Format: `verb-noun.md`
- Examples: `audit-seo.md`, `review-pipeline.md`, `generate-report.md`

---

## Skill File Structure

```markdown
# {Skill Name}

> {One-line description}

---

## Trigger

{When this skill should be executed}
- Frequency: Daily/Weekly/Monthly/On-demand
- Triggered by: {event or schedule}

---

## Objective

{What this skill accomplishes when complete}

---

## Required Access

| Tool/System | Permission | Purpose |
|-------------|------------|---------|
| {Tool} | {Read/Write} | {Why needed} |

---

## Steps

### 1. {Step Name}
{Instructions for this step}

### 2. {Step Name}
{Instructions for this step}

### 3. {Step Name}
{Instructions for this step}

---

## Output Format

{Describe the expected output structure}

### Example Output:
```
{Show what the output should look like}
```

---

## Escalation Triggers

Escalate to {Manager} if:
- {Condition 1}
- {Condition 2}

---

## Quality Checklist

- [ ] {Quality check 1}
- [ ] {Quality check 2}
- [ ] {Quality check 3}
```

---

## Skill Categories by Level

### Specialist Skills
- Detailed, technical, action-oriented
- Focus on execution
- Produce raw data and findings

### Manager Skills
- Aggregation and prioritization
- Team coordination
- Synthesize specialist outputs

### Director Skills
- Strategic analysis
- Cross-team insights
- Resource planning

### Executive Skills
- Business impact translation
- Decision support
- High-level summaries

---

## Best Practices

1. **Be specific**: Include exact steps, not vague instructions
2. **Define outputs**: Show what success looks like
3. **Include examples**: Real examples help execution
4. **Set thresholds**: What counts as good/bad/urgent
5. **Link dependencies**: Reference other skills if needed
6. **Test the skill**: Run it once before finalizing

---

## Example: Technical SEO Audit Skill

```markdown
# Technical SEO Audit

> Audit website technical SEO health

---

## Trigger
- Frequency: Daily
- Triggered by: Morning workflow

## Objective
Identify technical SEO issues that may impact search visibility.

## Required Access
| Tool | Permission | Purpose |
|------|------------|---------|
| Google Search Console | Read | Index data |
| Lighthouse MCP | Execute | Audit site |

## Steps

### 1. Run Lighthouse SEO Audit
Execute lighthouse audit with SEO category...

### 2. Check Search Console
Review index coverage report...

### 3. Compile Findings
Organize issues by severity...

## Output Format
| Issue | Severity | Page(s) | Recommendation |
|-------|----------|---------|----------------|

## Escalation Triggers
Escalate to SEO Manager if:
- Critical issues found (>10)
- Indexation dropped >10%
```
