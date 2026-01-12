# IAML Business OS

## Project Overview

Business automation platform integrating n8n workflows, Supabase, and GHL for marketing operations.

## n8n-brain: Intelligent Workflow Building

n8n-brain is an MCP server that provides learning capabilities for n8n workflow development. It automatically:

- **Remembers patterns** - Successful workflows are stored and can be reused
- **Learns from errors** - Error→fix mappings help avoid repeating mistakes
- **Tracks credentials** - Service→credential ID mappings (no secrets stored)
- **Scores confidence** - Determines when to ask vs. act autonomously

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

## Reference Documents

- Business OS architecture: @business-os/docs/architecture/
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
