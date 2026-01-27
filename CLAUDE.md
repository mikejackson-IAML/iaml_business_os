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

### Confidence Scoring

| Score | Behavior |
|-------|----------|
| 0-39 | **Ask First** - Need permission and more information |
| 40-79 | **Do & Verify** - Build and test, but verify before activating |
| 80-100 | **Autonomous** - Can act without asking |

Score factors: pattern matches, credential mappings, error knowledge, past success rate, risk level.

### Available Tools

| Category | Tools |
|----------|-------|
| Patterns | `store_pattern`, `find_similar_patterns`, `get_pattern`, `update_pattern_success` |
| Errors | `store_error_fix`, `lookup_error_fix`, `report_fix_result` |
| Credentials | `register_credential`, `get_credential`, `list_credentials` |
| Confidence | `calculate_confidence`, `record_action` |
| Preferences | `set_preference`, `get_preferences` |

### Workflow Testing

Use `/test-workflow` to test n8n workflows automatically. The registry tracks test status (`untested`, `in_progress`, `tested`, `verified`, `needs_review`, `broken`). Use `n8n_brain.register_workflow()` and `n8n_brain.mark_workflow_tested()` for registry management. Test specs stored in `.planning/workflow-tests/specs/`. Architecture: `business-os/docs/architecture/N8N-WORKFLOW-TESTING-AGENT.md`.

## Understanding Confirmation (Auto-Trigger)

Before starting any ambiguous coding task, **automatically invoke the `/understand` skill** to confirm interpretation.

### When to Auto-Trigger

| Signal | Example |
|--------|---------|
| Ambiguous scope | "Add authentication" (where? how?) |
| Multiple valid approaches | "Add caching" (Redis? memory? file?) |
| Vague verbs | "improve", "fix", "refactor", "optimize" |
| Broad impact | Will touch 4+ files |
| Missing specifics | No file paths, function names, or error messages |

### When to Skip

- User gives explicit file + change
- Detailed specs provided
- Tiny scope (typo fixes)
- User says "just do it" or "skip confirmation"

### Confidence Thresholds

| Confidence | Behavior |
|------------|----------|
| 80-100% | Confirm understanding, proceed on approval |
| 50-79% | Confirm + ask 2-3 specific questions |
| < 50% | Ask fundamental questions before planning |

Reference: `.claude/skills/understand.md`

---

## Documentation Requirements (MANDATORY)

All Business OS components MUST include documentation with CEO summaries. This is non-negotiable.

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

Full standards: `business-os/docs/DOCUMENTATION-STANDARDS.md`

## Reference Documents

Read these files when working on specific domains:

| Domain | File Path |
|--------|-----------|
| Documentation standards | `business-os/docs/DOCUMENTATION-STANDARDS.md` |
| Campaign tracking schema | `business-os/docs/architecture/08-CAMPAIGN-TRACKING.md` |
| n8n-brain schema | `supabase/migrations/20260111_create_n8n_brain_schema.sql` |
| Business OS architecture | `business-os/docs/architecture/` |

## Supabase Migrations

Run migrations automatically using the CLI. Do not ask the user to run these manually.

```bash
cd "/Users/mike/IAML Business OS" && supabase db push
```

Project: business-os-production (already linked). Credentials configured in `.env.local`.

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

1. Run migration: `supabase/migrations/20260111_create_n8n_brain_schema.sql` in Supabase SQL editor
2. Install: `cd mcp-servers/n8n-brain && npm install`
3. Bootstrap: `SUPABASE_URL=your-url SUPABASE_SERVICE_KEY=your-key npm run bootstrap`
4. Add to Claude Code MCP config with `SUPABASE_URL` and `SUPABASE_SERVICE_KEY` env vars

### n8n-mcp Setup (Optional)

For node schemas, validation, and workflow management: [n8n-mcp](https://github.com/czlonkowski/n8n-mcp). Configure with `N8N_API_URL` and `N8N_API_KEY` env vars.
