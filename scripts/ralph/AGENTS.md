# AGENTS.md - IAML Business OS

> Guidelines and patterns for autonomous agents working on this codebase.

## Project Overview

IAML Business OS is a business automation platform for an HR training company. It uses:
- **n8n** for workflow automation
- **Supabase** for PostgreSQL database
- **GoHighLevel (GHL)** for CRM and email sequences
- **n8n-brain** MCP server for learning and pattern storage

## n8n Workflow Building

### Credential Mappings

Before building any workflow, retrieve credentials from n8n-brain:

| Service | Call | Returns |
|---------|------|---------|
| Supabase | `get_credential({ service_name: "supabase" })` | Postgres credential ID |
| GHL | `get_credential({ service_name: "ghl" })` | HTTP Header Auth ID |
| Gemini | `get_credential({ service_name: "gemini" })` | API Key ID |

### Workflow Naming Convention

```
[Department]-[Function]-Worker

Examples:
- Marketing-Campaign-Analyst-Worker
- Lead-Scoring-Engine-Worker
- Operations-Invoice-Generator-Worker
```

### Standard Workflow Structure

```
1. Trigger Node
   └─ Webhook, Schedule, or Manual

2. Input Validation
   └─ Check required fields exist

3. Main Logic
   └─ Business logic nodes

4. Success Path
   ├─ Log to campaign_activity (if relevant)
   └─ Return success response

5. Error Path
   ├─ Log error to error_log table
   └─ Send alert (if critical)
```

### Error Handling Pattern

Always include:
1. Try/Catch around main logic
2. Error logging to Supabase `error_logs` table
3. Graceful failure response

## Campaign Tracking Schema

### Key Tables

| Table | Purpose |
|-------|---------|
| `contacts` | Master contact records |
| `campaign_contacts` | Contact's journey through campaign |
| `campaign_activity` | Event log (sent, opened, clicked, etc.) |
| `campaign_contact_channels` | Per-channel status |

### Lifecycle Tags

```
STANDARD → HOT LEAD → QUALIFIED → (Branch A/A+)
        → ENGAGED → WARM → NURTURE → (Branch B)
        → COLD → NO CONTACT → (Branch C)
        → OPT OUT
```

### GHL Branch Routing

| Branch | Trigger Events |
|--------|----------------|
| A | positive_reply, interested, call_interested |
| A+ | interested_secondary, wants_virtual_training |
| B | not_now_polite, maybe_later, call_not_now |
| C | no_contact_exhausted, calls_exhausted |

### Message Code Prefixes

| Prefix | Channel |
|--------|---------|
| L | LinkedIn (HeyReach) |
| S | Smartlead (Email) |
| P | Phone |
| A/A+/B/C | GHL Branches |

## Supabase Patterns

### Connection String

Use n8n-brain credential, never hardcode:
```
get_credential({ service_name: "supabase" })
```

### Common Queries

**Log activity:**
```sql
INSERT INTO campaign_activity (campaign_contact_id, activity_type, channel, metadata)
VALUES ($1, $2, $3, $4)
```

**Update lifecycle tag:**
```sql
SELECT update_contact_lifecycle_tag($1, $2, $3, $4)
```

**Assign GHL branch:**
```sql
SELECT assign_ghl_branch($1, $2, $3)
```

## n8n-brain Integration

### Before Building

```javascript
// 1. Check for similar patterns
find_similar_patterns({
  services: ["supabase", "ghl"],
  node_types: ["webhook", "postgres"]
})

// 2. Calculate confidence
calculate_confidence({
  task_description: "Build campaign analyst worker",
  services: ["supabase"],
  node_types: ["schedule", "postgres"]
})
```

### After Success

```javascript
// 1. Store the pattern
store_pattern({
  name: "Campaign Analyst Worker",
  description: "Daily analysis of campaign funnel metrics",
  workflow_json: { ... },
  services: ["supabase"],
  node_types: ["scheduleTrigger", "postgres", "set"]
})

// 2. Record the outcome
record_action({
  task_description: "Built campaign analyst worker",
  services_involved: ["supabase"],
  outcome: "success",
  outcome_notes: "Deployed as workflow ID xyz"
})
```

### On Error

```javascript
// If error was solved, store the fix
store_error_fix({
  error_message: "The resource could not be found",
  node_type: "n8n-nodes-base.postgres",
  fix_description: "Table name was incorrect, use 'campaign_activity' not 'activities'"
})
```

## File Locations

| Resource | Path |
|----------|------|
| n8n workflows | `/n8n-workflows/` |
| Supabase migrations | `/supabase/migrations/` |
| Campaign tracking docs | `/business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` |
| n8n-brain schema | `/supabase/migrations/20260111_create_n8n_brain_schema.sql` |
| Website | `/website/` |
| API functions | `/api/` |

## Testing Workflows

1. **Validate JSON**: Ensure workflow JSON is valid
2. **Check credentials**: All credential IDs exist
3. **Dry run**: Execute with test data if possible
4. **Monitor**: Check n8n execution logs

## Common Gotchas

1. **Credential IDs change between environments** - Always use n8n-brain lookups
2. **Supabase RLS** - Workflows use service role, not user context
3. **GHL rate limits** - Add delays between bulk operations
4. **Webhook URLs** - n8n webhooks need /webhook/ prefix in production
5. **Timezone** - All timestamps should be in UTC

## Adding New Workers

1. Create workflow in n8n
2. Export JSON to `/n8n-workflows/[department]/`
3. Store pattern in n8n-brain
4. Update REQUIREMENTS.md status
5. Commit with `feat: [DEPT-XX] - Worker Name`
