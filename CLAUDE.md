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

## Planning Studio

Planning Studio is an AI-guided idea-to-production pipeline. Ideas go through 6 phases with enforced incubation periods and semantic memory.

### Phases

| Phase | Purpose | Incubation After |
|-------|---------|------------------|
| CAPTURE | Quick capture before idea escapes | 24 hours |
| DISCOVER | Deep research - problem, user, market | 24-48 hours |
| DEFINE | Narrow the problem, create Lean Canvas | None |
| DEVELOP | Design solution - features, UX, technical | 24 hours |
| VALIDATE | Final gut check and readiness assessment | None |
| PACKAGE | Generate GSD documents for Claude Code | None |

### Key Features

- **Pipeline View:** Kanban board at `/dashboard/planning`
- **AI Conversations:** Claude-guided planning per phase
- **Memory System:** Semantic search across all project history (Cmd+K)
- **Document Generation:** ICP, Lean Canvas, Feature Specs, GSD packages
- **Deep Research:** Perplexity integration for market research
- **Priority Queue:** AI-ranked ready-to-build projects at `/dashboard/planning/queue`
- **Build Tracker:** Track active development progress

### Database Schema

Schema: `planning_studio` in Supabase

| Table | Purpose |
|-------|---------|
| projects | Main project records |
| phases | Phase tracking per project |
| conversations | Chat sessions |
| messages | Individual chat messages |
| memories | Extracted insights with embeddings |
| documents | Generated planning documents |
| research | Perplexity research results |
| user_goals | Goals for AI prioritization |

### API Routes

All routes under `/api/planning/`:

| Route | Method | Purpose |
|-------|--------|---------|
| /analytics | GET | Get analytics metrics by period |
| /ask | POST | RAG-based question answering |
| /chat | POST | Send message (SSE streaming) |
| /conversations | GET | List conversations for project |
| /conversations | POST | Create new conversation |
| /conversations | PATCH | End conversation with summary |
| /documents/generate | POST | Generate document via Claude |
| /documents/export | POST | Export all latest documents |
| /documents/[docId] | GET | Get document by ID |
| /memories | POST | Store memories with embeddings |
| /memories/search | POST | Semantic memory search |
| /prioritize | POST | Calculate priority scores |
| /research | GET | Fetch research records |
| /research | POST | Trigger Perplexity research |

### Workflow

1. **Capture:** Quick capture via modal or API
2. **Plan:** Navigate through phases with AI guidance
3. **Package:** Generate GSD documents when ready
4. **Build:** Export to Claude Code and track progress
5. **Ship:** Mark complete when deployed

### Migration

To migrate from the old Development Dashboard, visit `/dashboard/planning/migrate` and select projects to bring over.

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

## Autonomous Build Mode (BUILD-PLAN.md)

When a `BUILD-PLAN.md` file exists in the project root, this project uses pre-made decisions as the single source of truth. BUILD-PLAN.md is produced in Claude.ai using the question-anticipator skill and contains every decision needed for fully autonomous GSD execution.

### Rules When BUILD-PLAN.md Exists

1. **NEVER ask the human clarifying questions** if the answer exists in BUILD-PLAN.md
2. **During `/gsd:new-project`:** Extract all context from BUILD-PLAN.md instead of interviewing the user:
   - Section 1 (Project Vision) → PROJECT.md
   - Section 3 (Requirements) → REQUIREMENTS.md
   - Section 4 (Phases & Roadmap) → ROADMAP.md
   - Section 2 (Technical Architecture) → technical context in PROJECT.md
3. **During `/gsd:discuss-phase N`:** Read the phase details from BUILD-PLAN.md Section 4 and Section 15 (Verification Criteria). Generate CONTEXT.md for the phase without asking questions. Map:
   - "Phase-specific decisions" → CONTEXT.md `<decisions>` section
   - "Claude's discretion for this phase" → CONTEXT.md `### Claude's Discretion`
   - Relevant details from Sections 2, 5, 6, 7, 8 → CONTEXT.md implementation decisions
4. **During `/gsd:plan-phase N`:** Use BUILD-PLAN.md Sections 2, 5, 6, 7, 8 as context for task-level planning. Section 15 verification criteria become `must_haves` in plan frontmatter.
5. **During `/gsd:execute-phase N`:** Execute autonomously. Only pause if something is genuinely blocked (missing API key, broken dependency, etc.).
6. **If BUILD-PLAN.md doesn't cover something:** Make the best reasonable default decision, document it in the SUMMARY.md, and continue. Do NOT stop to ask.

### Build Preferences (Autonomous Mode)
- Commit after every completed task
- Use conventional commit messages
- Run tests after each task if test framework is configured
- Prefer explicit over clever code
- Section 14 of BUILD-PLAN.md lists the ONLY things that may require human input — everything else is pre-decided
