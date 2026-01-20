# IAML Business OS

## Project Overview

Business automation platform integrating n8n workflows, Supabase, and GHL for marketing operations.

## n8n-brain: Intelligent Workflow Building

n8n-brain is an MCP server that provides learning capabilities for n8n workflow development. It automatically:

- **Remembers patterns** - Successful workflows are stored and can be reused
- **Learns from errors** - Error→fix mappings help avoid repeating mistakes
- **Tracks credentials** - Service→credential ID mappings (no secrets stored)
- **Scores confidence** - Determines when to ask vs. act autonomously
- **Tracks workflow testing** - Registry of all workflows with test status

### How Confidence Works

When building n8n workflows, n8n-brain calculates a confidence score (0-100):

| Score | Behavior |
|-------|----------|
| 0-39 | **Ask First** - Need permission and more information |
| 40-79 | **Do & Verify** - Build and test, but verify before activating |
| 80-100 | **Autonomous** - Can act without asking |

The score is based on:
- Pattern matches (have we built something similar?)
- Credentials mapped (do we know the credential IDs?)
- Error knowledge (do we know common errors for these nodes?)
- Past success rate (how often have similar tasks succeeded?)
- Risk level (high-risk services like payments reduce confidence)

### Using n8n-brain Tools

**Before building a workflow:**
```
calculate_confidence({
  task_description: "Sync Airtable to GHL when records are created",
  services: ["airtable", "ghl"],
  node_types: ["airtableTrigger", "httpRequest"]
})
```

**After a successful build:**
```
store_pattern({
  name: "Airtable to GHL sync",
  description: "...",
  workflow_json: {...},
  services: ["airtable", "ghl"],
  node_types: ["airtableTrigger", "httpRequest"]
})
```

**When encountering an error:**
```
lookup_error_fix({
  error_message: "The resource could not be found",
  node_type: "n8n-nodes-base.postgres"
})
```

### Available Tools

| Category | Tools |
|----------|-------|
| Patterns | `store_pattern`, `find_similar_patterns`, `get_pattern`, `update_pattern_success` |
| Errors | `store_error_fix`, `lookup_error_fix`, `report_fix_result` |
| Credentials | `register_credential`, `get_credential`, `list_credentials` |
| Confidence | `calculate_confidence`, `record_action` |
| Preferences | `set_preference`, `get_preferences` |

### Workflow Testing Registry

Track which workflows have been tested and verified:

```sql
-- See testing progress
SELECT * FROM n8n_brain.workflow_test_summary;

-- See workflows needing attention (prioritized)
SELECT * FROM n8n_brain.workflows_needing_attention;

-- Register a new workflow
SELECT n8n_brain.register_workflow(
  'WORKFLOW_ID'::TEXT,
  'Workflow Name'::TEXT,
  'category'::TEXT,
  'Department'::TEXT,
  'schedule'::TEXT,
  'Daily 6am'::TEXT,
  'Description'::TEXT,
  ARRAY['service1', 'service2']::TEXT[],
  TRUE,  -- has_error_handling
  TRUE,  -- has_slack_alerts
  TRUE   -- has_dashboard_logging
);

-- Mark workflow as tested
SELECT n8n_brain.mark_workflow_tested(
  'WORKFLOW_ID'::TEXT,
  'verified'::TEXT,
  'tester_name'::TEXT,
  'Test notes here'::TEXT
);
```

**Test Status Values:**
| Status | Meaning |
|--------|---------|
| `untested` | Never tested |
| `in_progress` | Currently being tested |
| `tested` | Tested but not verified in production |
| `verified` | Verified working in production |
| `needs_review` | Was working, needs re-testing |
| `broken` | Known to be broken |

### Automated Workflow Testing

Use the `/test-workflow` skill to automatically test n8n workflows:

```bash
# Test a workflow by ID or name
/test-workflow HnZQopXL7xjZnX3O
/test-workflow "Airtable to GHL Sync"

# Create a test specification
/test-workflow --create-spec

# Run specific test case
/test-workflow HnZQopXL7xjZnX3O --test-case happy_path
```

The testing agent:
1. Executes workflows with test data
2. Diagnoses failures using n8n-brain error lookups
3. Applies fixes automatically
4. Learns from successful fixes
5. Escalates to human when stuck

**Test specifications** are stored in `.planning/workflow-tests/specs/`

**Architecture:** `business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md`

## Documentation Requirements (MANDATORY)

All Business OS components MUST include documentation with CEO summaries. This is non-negotiable.

### CEO Summary Format

Every document must start with a CEO Summary immediately after the title:

```markdown
# Component Name

> **CEO Summary:** [One sentence in plain English explaining what this does and why it matters]
```

### Required Documentation

| When You Create... | You Must Also Create... |
|--------------------|------------------------|
| New n8n workflow | `business-os/workflows/README-[name].md` + update `business-os/workflows/README.md` |
| New worker | Worker spec with CEO summary at top |
| New employee/role | `ROLE.md` with CEO summary at top |
| New department | `DEPARTMENT.md` with CEO summary at top |

### Documentation Checklist

Before considering any component "done":
- [ ] CEO Summary block exists at top of doc
- [ ] Central README (`business-os/workflows/README.md` for workflows) updated if applicable
- [ ] Related docs linked where appropriate

Reference: `business-os/docs/DOCUMENTATION-STANDARDS.md`

## Reference Documents

- Business OS architecture: @business-os/docs/architecture/
- Documentation standards: @business-os/docs/DOCUMENTATION-STANDARDS.md
- Campaign tracking: @business-os/docs/architecture/08-CAMPAIGN-TRACKING.md
- n8n-brain schema: @supabase/migrations/20260111_create_n8n_brain_schema.sql

## Key Integrations

| System | Purpose | Credentials Location |
|--------|---------|---------------------|
| n8n | Workflow automation | n8n.realtyamp.ai |
| Supabase | PostgreSQL database | Supabase dashboard |
| GHL | CRM and marketing automation | GHL dashboard |
| HeyReach | LinkedIn automation | HeyReach dashboard |
| Gemini | AI classification | Google AI Studio |

## MCP Servers

| Server | Purpose | Location |
|--------|---------|----------|
| n8n-brain | n8n workflow learning layer | mcp-servers/n8n-brain/ |
| neverbounce | Email verification | mcp-servers/neverbounce/ |

## Setup Instructions

### n8n-brain Setup

1. **Run the Supabase migration:**
   ```bash
   # In Supabase SQL editor, run:
   # supabase/migrations/20260111_create_n8n_brain_schema.sql
   ```

2. **Install dependencies:**
   ```bash
   cd mcp-servers/n8n-brain
   npm install
   ```

3. **Bootstrap data:**
   ```bash
   SUPABASE_URL=your-url SUPABASE_SERVICE_KEY=your-key npm run bootstrap
   ```

4. **Add to Claude Code MCP config:**
   ```json
   {
     "mcpServers": {
       "n8n-brain": {
         "command": "node",
         "args": ["/path/to/mcp-servers/n8n-brain/index.js"],
         "env": {
           "SUPABASE_URL": "your-supabase-url",
           "SUPABASE_SERVICE_KEY": "your-service-key"
         }
       }
     }
   }
   ```

### n8n-mcp Setup (Optional - for full n8n integration)

For node schemas, validation, and workflow management, install [n8n-mcp](https://github.com/czlonkowski/n8n-mcp):

```json
{
  "mcpServers": {
    "n8n-mcp": {
      "command": "npx",
      "args": ["-y", "@anthropic/n8n-mcp"],
      "env": {
        "N8N_API_URL": "https://n8n.realtyamp.ai",
        "N8N_API_KEY": "your-n8n-api-key"
      }
    }
  }
}
```
