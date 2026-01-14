# Async Task Queue

Track tasks offloaded to Claude.AI for async processing.

---

## Active Queue

| Date | Status | Task | Notes/Link |
|------|--------|------|------------|
| | | | |

---

## Status Legend

| Status | Meaning | Next Action |
|--------|---------|-------------|
| PENDING | Prompt sent, awaiting output | Check Claude.AI |
| READY | Output received | Copy to terminal, integrate |
| INTEGRATING | In progress in terminal | Complete integration |
| DONE | Fully integrated | Move to completed |
| BLOCKED | Needs revision/clarification | Re-prompt or handle in terminal |

---

## Completed Tasks

| Date | Task | Outcome |
|------|------|---------|
| | | |

---

## Quick Add

Copy and fill:
```
| YYYY-MM-DD | PENDING | [describe task] | [claude.ai url or session notes] |
```

Or use bash:
```bash
echo "| $(date +%Y-%m-%d) | PENDING | [task] | [notes] |" >> tasks/async-queue.md
```

---

## Weekly Review

At end of week, review:
- [ ] All PENDING tasks checked
- [ ] READY items integrated or dropped
- [ ] BLOCKED items resolved or removed
- [ ] Completed section updated
- [ ] Any patterns worth adding to n8n-brain?

---

## Task Categories

When adding tasks, optionally tag with category:

| Tag | Examples |
|-----|----------|
| `[DOC]` | README, architecture docs, guides |
| `[SKILL]` | New skill files, workflow specs |
| `[CODE]` | Components, boilerplate, templates |
| `[N8N]` | Workflow designs, node configs |
| `[CONTENT]` | Email copy, page content, marketing |
| `[REVIEW]` | Code review, audits, analysis |
| `[PLAN]` | PRDs, architecture, strategy |
