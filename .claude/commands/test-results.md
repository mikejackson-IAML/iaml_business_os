---
name: test-results
description: Morning review of nightly workflow test results. Shows what passed, what needs attention, and exactly what to verify.
---

# Morning Workflow Review

Review results from overnight RALPH loop testing. Get actionable checklist of what needs your attention.

---

<instructions>

When the user runs `/test-results`:

## 1. Find the most recent results

```bash
RESULTS_DIR=$(ls -td /Users/mike/IAML\ Business\ OS/.planning/workflow-tests/results/*/ 2>/dev/null | head -1)
echo "Results directory: $RESULTS_DIR"
```

If no results found, show:
```
No test results found.

Run tests now:
  /test-workflows 3

Or wait for tonight's 2 AM automatic run.
```

## 2. Read and parse the SUMMARY.md

Read the SUMMARY.md file from the results directory.

## 3. Display Morning Review Dashboard

Format the output as an actionable morning review:

```
# Morning Workflow Review - {date}

## Quick Summary
| Status | Count |
|--------|-------|
| ✅ Verified | X |
| ⚠️ Needs Verification | X |
| 🔧 Needs Manual Fix | X |
| ❌ Broken | X |

---

## ✅ Passed (No Action Needed)

These workflows passed all checks and were fixed automatically:

| Workflow | What RALPH Did |
|----------|----------------|
| [Name](url) | Added error handling |
| [Name](url) | No changes needed |

---

## ⚠️ Needs Verification

These were fixed overnight - verify they're working:

### 1. {Workflow Name}
**URL:** https://n8n.realtyamp.ai/workflow/{id}
**What was fixed:** {description of fix}
**How to verify:**
1. Open the workflow URL above
2. Check the Executions tab for recent runs
3. Confirm the latest execution shows ✅ success

**If working:** `/mark-tested {id} verified`
**If still broken:** `/test-workflows {id}` to investigate

---

## 🔧 Needs Manual Fix

These require your intervention:

### 1. {Workflow Name}
**URL:** https://n8n.realtyamp.ai/workflow/{id}
**Issue:** {what's wrong}
**How to fix:**
1. {specific step}
2. {specific step}

**After fixing:** `/mark-tested {id} verified`

---

## ❌ Broken (Couldn't Auto-Fix)

These failed and RALPH couldn't fix them:

### 1. {Workflow Name}
**URL:** https://n8n.realtyamp.ai/workflow/{id}
**Error:** {error message or timeout}
**Suggested investigation:**
- Check credentials haven't expired
- Check external APIs are responding
- Review recent code changes

**To investigate:** `/test-workflows {id}`

---

## Common Manual Tasks

These can't be done via API:

| Task | Workflows |
|------|-----------|
| Add `business-os` tag | {list workflow names} |
| Fix credentials | {list if any} |

---

## Quick Commands

```
/mark-tested {id} verified    # Mark as verified after checking
/mark-tested {id} broken      # Mark as broken if still failing
/test-workflows {id}          # Re-run full RALPH loop on one workflow
/test-workflows 5             # Test 5 more workflows now
```
```

## 4. Parse individual result files for details

For each workflow that needs attention (not verified), read its individual result file:
```bash
cat "$RESULTS_DIR/{workflow_id}.md"
```

Extract:
- What actions were taken
- What manual steps are needed
- Any error messages

## 5. Query registry for additional context

Get current registry status for workflows that need attention:
```bash
cd "/Users/mike/IAML Business OS" && source .env.local && curl -s "${SUPABASE_URL}/rest/v1/workflow_registry?test_status=in.(tested,needs_review,broken)&select=workflow_id,workflow_name,workflow_url,test_status,test_notes" \
  -H "apikey: ${SUPABASE_SERVICE_KEY}" \
  -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
  -H "Accept-Profile: n8n_brain"
```

## Key Principles

1. **Always include clickable URLs** - User should be able to go directly to each workflow
2. **Be specific about what to verify** - Not just "check it works" but "look at Executions tab, confirm last run is green"
3. **Provide the exact command** to mark as verified or investigate further
4. **Group by action needed** - Don't make user figure out what to do
5. **Show what RALPH already did** - So user knows what was automated

</instructions>
