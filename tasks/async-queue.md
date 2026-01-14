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

```bash
echo "| $(date +%Y-%m-%d) | PENDING | [task] | [notes] |" >> tasks/async-queue.md
```
