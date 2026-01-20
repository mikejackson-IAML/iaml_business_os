---
name: test-workflows
description: Test n8n workflows on demand. Runs in background so you can keep working. Use during the day to get more testing done.
---

# Test Workflows

Run workflow testing on demand during the day. Tests run in the background so you can continue working.

## Usage

```
/test-workflows              # Test next 3 untested workflows
/test-workflows 5            # Test next 5 workflows
/test-workflows all          # Test ALL untested workflows
/test-workflows <id>         # Test a specific workflow by ID
```

---

<instructions>

When the user runs `/test-workflows`:

1. **Parse the argument:**
   - No arg or number: batch test from registry queue
   - `all`: test all untested workflows
   - Workflow ID (like `8IBiLLAIHgSt2xWs`): test that specific workflow

2. **For batch testing (no arg, number, or "all"):**

   Run the nightly script in background:
   ```bash
   cd "/Users/mike/IAML Business OS" && nohup ./scripts/test-workflows-nightly.sh {COUNT_OR_ALL} > .planning/workflow-tests/manual-$(date +%Y%m%d-%H%M%S).log 2>&1 &
   echo "PID: $!"
   ```

   Where `{COUNT_OR_ALL}` is:
   - `3` if no argument
   - The number if a number was provided
   - `--all` if "all" was specified

   Respond with:
   ```
   ✓ Started testing {count} workflows in background

   Continue working - tests are running.

   Check progress:
     tail -f .planning/workflow-tests/manual-{timestamp}.log

   Check results when done:
     /test-results
   ```

3. **For specific workflow testing (workflow ID provided):**

   This runs in the foreground with full RALPH loop:

   a. Load the n8n MCP tools:
      - mcp__n8n__get_workflow
      - mcp__n8n__list_executions
      - mcp__n8n__get_execution
      - mcp__n8n__update_workflow

   b. Load n8n-brain MCP tools:
      - mcp__n8n-brain__get_pattern

   c. Execute the full test loop:
      1. Fetch the workflow
      2. Check recent executions for errors
      3. If errors: diagnose and attempt fix
      4. Check for error handling pattern - add if missing
      5. Check for business-os tag - note if missing (can't add via API)
      6. Update registry with results
      7. If fixes were made, verify workflow still works

   d. Report results with what was done and any manual steps needed

4. **Show queue status** at the end of batch starts:
   ```bash
   cd "/Users/mike/IAML Business OS" && source .env.local && curl -s "${SUPABASE_URL}/rest/v1/workflow_registry?select=test_status&test_status=in.(untested,needs_review,broken)" \
     -H "apikey: ${SUPABASE_SERVICE_KEY}" \
     -H "Authorization: Bearer ${SUPABASE_SERVICE_KEY}" \
     -H "Accept-Profile: n8n_brain" | python3 -c "import sys,json; d=json.load(sys.stdin); print(f'Queue: {len(d)} workflows remaining')"
   ```

</instructions>
