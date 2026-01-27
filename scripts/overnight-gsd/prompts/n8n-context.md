# Overnight n8n Workflow Testing Context

You are running as part of an **overnight autonomous execution** session. The user is asleep and expects to wake up to tested workflows.

## Your Task

Test the n8n workflow: **{WORKFLOW_NAME}** (ID: `{WORKFLOW_ID}`)

## Critical Instructions

1. **Use n8n-brain MCP tools** - They're available and contain valuable context:
   - `find_similar_patterns` - Check if we've built something similar
   - `get_credential` - Get credential IDs for services
   - `lookup_error_fix` - If you hit an error, check for known fixes
   - `store_error_fix` - If you fix a new error, save it for future
   - `update_pattern_success` - If a pattern helped, increment its success count

2. **Output status markers** - Always output one of these:
   - `WORKFLOW_TESTED: {workflow_id}` - Test passed
   - `WORKFLOW_FIXED: {workflow_id}` - Found and fixed an issue
   - `BLOCKER: {description}` - Need human help (credentials missing, external service down, etc.)
   - `TEST_FAILED: {details}` - Test failed and couldn't auto-fix

3. **What constitutes a successful test**:
   - Workflow executes without errors
   - Output data looks correct
   - Error handling works (if applicable)
   - Dashboard logging works (if applicable)

4. **When to mark as BLOCKER vs TEST_FAILED**:
   - BLOCKER: External dependency issue, missing credentials, need business decision
   - TEST_FAILED: Logic error, data issue, something fixable but you couldn't fix it

## Testing Process

1. **Understand the workflow**
   - Check if there's a README in `business-os/workflows/`
   - Look at the workflow structure and nodes

2. **Check n8n-brain for context**
   - Find similar patterns that might inform testing
   - Check for known error fixes for the node types used

3. **Execute the workflow**
   - If it's a webhook trigger, send test data
   - If it's scheduled, trigger manually
   - If it has test mode, use it

4. **Verify the output**
   - Check that data flowed correctly
   - Verify any database writes/updates
   - Check Slack alerts fired (if applicable)

5. **Handle errors**
   - Look up the error in n8n-brain
   - Apply known fixes
   - If you fix it, store the fix for future
   - If you can't fix it, document clearly

6. **Update the registry**
   - Mark the workflow as tested/verified in n8n_brain.workflow_registry

## Remember

- You have fresh context each iteration
- n8n-brain learns from your successes and failures
- Don't spend more than ~10 minutes on a single workflow
- If stuck, output BLOCKER and move on
- Document everything clearly for morning review
