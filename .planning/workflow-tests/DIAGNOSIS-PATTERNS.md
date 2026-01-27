# Diagnosis Patterns Reference

> Reference document for the workflow testing agent's pattern-based error diagnosis.

---

## Pattern Priority

When diagnosing errors, patterns are checked in this order:

1. **n8n-brain lookup** (always first)
2. **Authentication errors** (escalate immediately)
3. **Property access errors** (most common)
4. **Empty input errors**
5. **JSON parse errors**
6. **Required field errors**
7. **Resource not found errors**
8. **Rate limiting errors**
9. **Timeout errors**
10. **Unknown** (escalate)

---

## Pattern Definitions

### 1. Authentication Errors (ESCALATE)

**Regex Patterns:**
```regex
401|403
Unauthorized
Authentication (failed|required|error)
Invalid (API )?[Kk]ey
Forbidden
Access denied
Token (expired|invalid)
```

**Action:** Always escalate. Credential issues require human intervention.

**Escalation Message:**
```markdown
Authentication error detected. This requires human intervention:

1. Check credential is valid in n8n
2. Verify API key hasn't expired
3. Check service account permissions
4. Re-authenticate if OAuth token expired

Service: {service_name}
Credential ID: {credential_id or "unknown"}
```

---

### 2. Property Access Errors (Auto-Fix)

**Regex Patterns:**
```regex
Cannot read propert(y|ies) ['"]?(\w+)['"]? of (undefined|null)
(\w+) is not defined
TypeError: (undefined|null) is not an object
Cannot access ['"]?(\w+)['"]? of undefined
```

**Diagnosis Steps:**
1. Extract the missing property name from error
2. Get the actual input data structure
3. Find similar property names (fuzzy match)
4. Check for common transformations:
   - `email` vs `contact.email` vs `emailAddress`
   - `name` vs `firstName` + `lastName`
   - Nested vs flat structures

**Fix Strategy:**
```javascript
// Before
expression: "={{$json.email}}"

// After (if found at $json.contact.email_address)
expression: "={{$json.contact.email_address}}"
```

**Common Transformations:**
| Looking For | Often Found At |
|-------------|----------------|
| `email` | `contact.email`, `emailAddress`, `email_address` |
| `phone` | `contact.phone`, `phoneNumber`, `mobile` |
| `name` | `firstName + lastName`, `full_name`, `displayName` |
| `id` | `_id`, `contactId`, `recordId`, `ID` |
| `date` | `createdAt`, `created_at`, `timestamp` |

---

### 3. Empty Input Errors (Auto-Fix)

**Regex Patterns:**
```regex
No items( to process)?
Nothing to iterate
Items (array )?must be
0 items
Empty (input|array|result)
Cannot iterate over (undefined|null|empty)
```

**Diagnosis:**
Previous node returned empty array or undefined.

**Fix Strategies:**

**Option A: Add IF Node**
```json
{
  "name": "Check Empty",
  "type": "n8n-nodes-base.if",
  "parameters": {
    "conditions": {
      "boolean": [{
        "value1": "={{$json.length > 0}}",
        "operation": "true"
      }]
    }
  }
}
```

**Option B: Enable "Always Output Data"**
```json
{
  "name": "Failing Node",
  "parameters": {
    "options": {
      "alwaysOutputData": true
    }
  }
}
```

**Option C: Add Default Value**
```javascript
// Before
expression: "={{$json.items}}"

// After
expression: "={{$json.items || []}}"
```

---

### 4. JSON Parse Errors (Auto-Fix)

**Regex Patterns:**
```regex
Unexpected token .* in JSON
SyntaxError: JSON\.parse
Invalid JSON
Unexpected end of JSON input
JSON Parse error
```

**Diagnosis:**
Expression produces malformed JSON.

**Fix Strategy:**
1. Find the expression producing bad JSON
2. Check for:
   - Missing quotes around strings
   - Trailing commas
   - Unescaped special characters
   - Template literal issues

**Common Fixes:**
```javascript
// Missing quotes
{{ $json.name }}  →  "{{ $json.name }}"

// Trailing comma
{ "a": 1, }  →  { "a": 1 }

// Unescaped quotes
"He said "hello""  →  "He said \"hello\""
```

---

### 5. Required Field Errors (Auto-Fix)

**Regex Patterns:**
```regex
required (field|property|parameter)
(field|property|parameter) .* is required
must (provide|specify|include)
mandatory field
missing required
```

**Diagnosis:**
Node configuration is missing required field.

**Fix Strategy:**
1. Get node schema from n8n-mcp (if available)
2. Identify which field is missing
3. Check if value can be derived from input
4. Prompt for value if cannot derive

**Common Required Fields:**
| Node Type | Common Required Fields |
|-----------|----------------------|
| HTTP Request | URL, method |
| Postgres | Query (for executeQuery) |
| Airtable | Base ID, Table |
| GHL | Contact email or phone |
| Slack | Channel, Message |

---

### 6. Resource Not Found Errors (Context-Dependent)

**Regex Patterns:**
```regex
404
not found
does not exist
No (record|contact|item|resource) (found|with)
Invalid (id|ID|identifier)
Unknown (record|entity)
```

**Diagnosis:**
Referenced entity doesn't exist in target system.

**Actions:**
- If ID looks malformed → Fix ID format
- If ID from expression → Check expression
- If entity should exist → **ESCALATE** (data issue)
- If entity should be created → Add create step

**ID Format Checks:**
| Service | Expected Format |
|---------|-----------------|
| GHL | Alphanumeric, ~24 chars |
| Airtable | "rec" prefix, alphanumeric |
| Supabase | UUID format |
| Smartlead | Numeric |

---

### 7. Rate Limiting Errors (Escalate or Wait)

**Regex Patterns:**
```regex
429
[Rr]ate limit
[Tt]oo many requests
[Tt]hrottl(ed|ing)
[Qq]uota exceeded
```

**Diagnosis:**
Too many API calls to external service.

**Actions:**
1. If testing → Wait and retry once
2. If production workflow → Add:
   - Delay node between iterations
   - SplitInBatches with wait
   - Rate limiting configuration

**Fix Strategy:**
```json
{
  "name": "Delay",
  "type": "n8n-nodes-base.wait",
  "parameters": {
    "amount": 1,
    "unit": "seconds"
  }
}
```

---

### 8. Timeout Errors (Escalate with Suggestion)

**Regex Patterns:**
```regex
[Tt]imeout
ETIMEDOUT
ECONNREFUSED
socket hang up
request timeout
```

**Diagnosis:**
External service took too long or is unreachable.

**Actions:**
1. Check if service is up (quick HTTP probe if possible)
2. Suggest increasing timeout in node settings
3. **ESCALATE** if service appears down

**Escalation Message:**
```markdown
Workflow timed out waiting for external service.

Possible causes:
1. Service is temporarily slow or overloaded
2. Service is down
3. Network connectivity issue
4. Timeout setting too short

Recommended:
- Check service status
- Increase timeout in node settings
- Add retry logic with backoff
```

---

## Diagnosis Flow

```
┌─────────────────────────────────────────────────────────────┐
│                    ERROR RECEIVED                            │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
              ┌───────────────────────────────┐
              │  n8n-brain.lookup_error_fix() │
              └───────────────────────────────┘
                              │
                    ┌─────────┴─────────┐
                    │                   │
              FOUND FIX             NO FIX
                    │                   │
                    ▼                   ▼
           ┌─────────────┐    ┌─────────────────┐
           │ Apply Fix   │    │ Pattern Match   │
           └─────────────┘    └─────────────────┘
                                        │
          ┌─────────────────────────────┼────────────────────────┐
          │                             │                        │
     AUTH ERROR                  PROPERTY ACCESS           EMPTY INPUT
          │                             │                        │
          ▼                             ▼                        ▼
    ┌───────────┐              ┌─────────────────┐     ┌─────────────────┐
    │ ESCALATE  │              │ Fix Expression  │     │ Add Empty Check │
    └───────────┘              └─────────────────┘     └─────────────────┘
                                        │                        │
                                        └───────────┬────────────┘
                                                    │
                                                    ▼
                                        ┌─────────────────────┐
                                        │ Apply Fix &         │
                                        │ Loop Back           │
                                        └─────────────────────┘
```

---

## Adding New Patterns

To add a new diagnosis pattern:

1. Identify the error pattern regex
2. Document the diagnosis logic
3. Define the fix strategy
4. Add to this reference document
5. Test with sample workflows

**Template:**
```markdown
### N. Pattern Name (Auto-Fix/Escalate)

**Regex Patterns:**
\`\`\`regex
pattern1
pattern2
\`\`\`

**Diagnosis:**
What causes this error.

**Fix Strategy:**
How to resolve it.

**Example:**
Before/after code or config.
```

---

## Related

- Testing Agent: @.claude/skills/test-workflow.md
- n8n-brain: @mcp-servers/n8n-brain/
- Architecture: @business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md
