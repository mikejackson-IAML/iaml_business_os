# n8n Lessons Learned

A living document capturing lessons from building n8n workflows. Reference this before starting new n8n projects.

---

## Postgres Nodes

### Always Enable "Always Output Data"
**Problem:** When a Postgres query returns no rows, the node outputs nothing and downstream nodes never execute.

**Solution:** On every Postgres node, go to Settings → enable "Always Output Data". This ensures the workflow continues even with empty results.

**Applies to:** All SELECT queries that might return no rows (lookups, duplicate checks, etc.)

---

### Use Simple Queries Over Complex CTEs
**Problem:** Complex Common Table Expressions (CTEs) with multiple INSERTs can fail silently or return unexpected results.

**Solution:** Use simpler queries with `ON CONFLICT DO UPDATE` patterns:
```sql
INSERT INTO table (col1, col2)
VALUES ('val1', 'val2')
ON CONFLICT (unique_col) DO UPDATE SET updated_at = NOW()
RETURNING id
```

---

## Code Nodes

### Use `$input.first().json` for Merge Nodes
**Problem:** When a code node receives data from multiple possible paths (e.g., after an IF node), referencing a specific upstream node like `$('Node Name').first().json` fails if that path wasn't taken.

**Solution:** Use `$input.first().json` to get whatever data arrived at the node:
```javascript
const data = $input.first().json;
// NOT: $('Specific Node').first().json
```

---

## HTTP Request Nodes (APIs)

### Don't Wrap API Keys in Expression Syntax
**Problem:** Pasting an API key as `{{ API_KEY_HERE }}` treats it as an n8n expression variable, not a literal string.

**Solution:** Paste API keys directly without curly braces:
```
https://api.example.com/endpoint?key=AIzaSyD5wxlicI_actual_key_here
```

---

### API Model Names Change Over Time
**Problem:** AI model names get deprecated. `gemini-1.5-flash` became `gemini-2.0-flash`.

**Solution:**
- Check current model names in API documentation before building
- Use model names that are less likely to change (e.g., `gemini-2.0-flash` over version-specific names)

---

### Free Tier Rate Limits Are Strict
**Problem:** Gemini free tier allows ~2 requests/minute, 50/day. Rapid testing quickly exhausts limits.

**Solution:**
- Enable billing on Google Cloud for testing (still uses free tier quota but removes strict limits)
- Space out test requests by 60+ seconds
- Or create multiple projects with separate API keys for testing

---

## Webhook Testing

### Use curl, Not Browser Tools
**Problem:** Browser-based tools like Hoppscotch can have CORS issues that cause malformed requests.

**Solution:** Use curl for testing webhooks:
```bash
curl -X POST "https://your-n8n.com/webhook-test/endpoint" \
  -H "Content-Type: application/json" \
  -d '{"key": "value"}'
```

---

### Use webhook-test vs webhook URLs
**Problem:** Production webhook URLs only work when the workflow is activated.

**Solution:**
- Use `/webhook-test/...` during development (works even when workflow is inactive)
- Use `/webhook/...` for production (requires workflow to be active)

---

## Security

### Regenerate Exposed API Keys Immediately
**Problem:** API keys shown in screenshots or logs are compromised.

**Solution:**
- Immediately regenerate any exposed keys
- Update all workflows using the old key
- Consider using n8n credentials instead of hardcoding keys in URLs

---

## Debugging Workflow Issues

### Check Node Outputs Step by Step
**Problem:** Workflows fail silently or produce unexpected results.

**Solution:**
1. Run the workflow with test data
2. Click each node in sequence
3. Check the OUTPUT tab for each node
4. Look for: empty arrays, null values, error messages in data

### Common Failure Points
1. **IF nodes returning wrong path** - Check the condition logic and input data types
2. **Empty arrays from Postgres** - Enable "Always Output Data"
3. **Null values in downstream nodes** - Check merge/code nodes are handling all paths
4. **API errors in response data** - Check `gemini_raw_response.error` or similar fields

---

## Workflow Architecture

### Design for Observability
- Log key events to a database (we use `campaign_activity` table)
- Include raw payloads in metadata for debugging
- Use descriptive node names

### Handle All Paths
- Every IF node should have both true and false paths connected
- Use NoOp (No Operation) nodes for paths that just end
- Name end nodes clearly: "End - Success", "End - Duplicate Skipped", etc.

---

## Pre-Build Checklist

Before starting a new n8n workflow:

- [ ] Verify all API credentials are set up in n8n
- [ ] Check current API model names/versions
- [ ] Ensure database tables exist with correct schema
- [ ] Plan the workflow paths on paper first
- [ ] Identify all Postgres nodes that need "Always Output Data"
- [ ] Prepare curl commands for testing

---

## Post-Build Checklist

After completing a workflow:

- [ ] Test all paths (success, failure, edge cases)
- [ ] Enable "Always Output Data" on all Postgres nodes
- [ ] Verify error handling doesn't break the flow
- [ ] Check rate limits won't be hit in production
- [ ] Activate workflow and test with production webhook URL
- [ ] Document any new lessons learned in this file

---

## Changelog

| Date | Project | Lessons Added |
|------|---------|---------------|
| 2026-01-11 | HeyReach Activity Receiver | Initial document - Postgres nodes, API keys, Gemini rate limits, webhook testing, merge node patterns |

