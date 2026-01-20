---
name: mark-tested
description: Mark a workflow as tested/verified after manual review. Use this during morning review of nightly test results.
---

# Mark Workflow Tested

Quickly update a workflow's test status in the registry.

## Usage

```
/mark-tested <workflow_id> [status] [notes]
```

**Examples:**
- `/mark-tested 8IBiLLAIHgSt2xWs` - Mark as verified (default)
- `/mark-tested 8IBiLLAIHgSt2xWs tested "Runs but needs tag added"`
- `/mark-tested 8IBiLLAIHgSt2xWs broken "API credentials expired"`
- `/mark-tested 8IBiLLAIHgSt2xWs needs_review`

**Status options:**
| Status | When to use |
|--------|-------------|
| `verified` | Confirmed working in production (default) |
| `tested` | Tested but not yet verified in production |
| `needs_review` | Was working, needs re-testing |
| `broken` | Known to be broken |

---

<instructions>

When the user runs `/mark-tested`:

1. **Parse the arguments:**
   - First arg: `workflow_id` (required)
   - Second arg: `status` (optional, default: "verified")
   - Remaining args: `notes` (optional)

2. **Validate status** is one of: verified, tested, needs_review, broken

3. **Update the registry** using this curl command:
   ```bash
   cd "/Users/mike/IAML Business OS" && source .env.local && curl -s -X PATCH "${SUPABASE_URL}/rest/v1/workflow_registry?workflow_id=eq.{WORKFLOW_ID}" \
     -H "apikey: ${SUPABASE_SERVICE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
     -H "Content-Type: application/json" \
     -H "Content-Profile: n8n_brain" \
     -H "Prefer: return=representation" \
     -d '{
       "test_status": "{STATUS}",
       "tested_at": "{ISO_TIMESTAMP}",
       "tested_by": "mike",
       "test_notes": "{NOTES}"
     }'
   ```

4. **Confirm the update:**
   ```
   ✓ Marked {workflow_name} as {status}

   Notes: {notes}
   ```

5. **If workflow not found**, show:
   ```
   ✗ Workflow {workflow_id} not found in registry.

   To register it first:
     /test-workflow {workflow_id}
   ```

</instructions>
