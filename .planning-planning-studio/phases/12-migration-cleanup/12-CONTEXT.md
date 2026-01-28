# Phase 12: Migration & Cleanup - Context

**Gathered:** 2026-01-28
**Status:** Ready for planning

<domain>
## Phase Boundary

Migrate existing data from the old Development Dashboard into the Planning Studio schema, remove old dashboard code and routes, create developer documentation, and establish automated E2E tests with performance benchmarks.

</domain>

<decisions>
## Implementation Decisions

### Data Migration Scope
- Selective migration: user will manually pick which projects to migrate
- Migrated projects should map to their appropriate Planning Studio phase based on current status in Supabase
- Old documents/specs should be referenced (linked) but not imported as Planning Studio documents
- Data migrates INTO the new planning_studio schema (not using dev_projects directly)

### Old Dashboard Removal
- Remove completely: delete old Development Dashboard components, routes, and related code
- Redirect /dashboard/development → /dashboard/planning
- Keep existing database tables (dev_projects, etc.) in place — don't delete, just stop using

### Documentation Deliverables
- Full API documentation: endpoints, types, and database schema
- CLAUDE.md update to include Planning Studio section
- No user-facing documentation needed — UI should be self-explanatory

### Testing Approach
- Automated E2E tests (Playwright) for all critical flows
- Test coverage includes:
  - Full planning journey: Capture → phases → documents → package → build
  - Core CRUD: Create/view/edit projects, navigation
  - Migration verification: Ensure migrated data is correct and accessible
- Performance benchmarks with targets:
  - Page loads < 1 second (aggressive optimization)
  - Measure and enforce load times

### Claude's Discretion
- Specific migration script implementation
- API documentation format and organization
- E2E test framework choice (Playwright recommended but flexible)
- Performance optimization techniques to hit targets

</decisions>

<specifics>
## Specific Ideas

- User wants to see current project status from Supabase reflected in Planning Studio after migration
- Migration should be interactive: show what exists, let user pick what to bring over

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 12-migration-cleanup*
*Context gathered: 2026-01-28*
