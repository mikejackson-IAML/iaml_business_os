# Requirements: Development Dashboard

**Defined:** 2026-01-23
**Core Value:** See all project statuses at a glance, get notified only when critical, and never lose track of what's being built.

## v1.0 Requirements

Requirements for initial release. Each maps to roadmap phases.

### Database

- [ ] **DB-01**: dev_projects table stores project key, name, path, status, current phase, pending decisions
- [ ] **DB-02**: dev_project_phases table stores phase number, name, status, completion date per project
- [ ] **DB-03**: dev_project_ideas table stores ideas with title, description, target milestone, priority
- [ ] **DB-04**: Views for workflow_test_summary equivalent (project status summary)

### GSD Integration

- [ ] **GSD-01**: GSD commands write status to Supabase on phase start/complete
- [ ] **GSD-02**: GSD commands append to pending_decisions when checkpoint reached
- [ ] **GSD-03**: GSD commands send macOS notification on phase complete
- [ ] **GSD-04**: GSD commands send macOS notification when blocked/needs input
- [ ] **GSD-05**: new-project creates dev_projects record in Supabase

### Dashboard - Active Projects

- [ ] **DASH-01**: User can view list of active projects with status indicators
- [ ] **DASH-02**: Project cards show current phase, progress, last activity
- [ ] **DASH-03**: Status indicators: Ready, Executing, Needs Input, Blocked
- [ ] **DASH-04**: User can click [Launch] to see command to copy
- [ ] **DASH-05**: User can click [Launch All Ready] to see all ready commands
- [ ] **DASH-06**: Dashboard updates in real-time via Supabase subscription

### Dashboard - Roadmap View

- [ ] **ROAD-01**: User can view roadmap timeline for each project
- [ ] **ROAD-02**: Phases show as boxes with checkmarks for complete
- [ ] **ROAD-03**: Current phase is highlighted
- [ ] **ROAD-04**: User can click phase to see details and goals
- [ ] **ROAD-05**: User can click project name to go to project detail

### Dashboard - Ideas Backlog

- [ ] **IDEA-01**: User can view ideas grouped by project
- [ ] **IDEA-02**: Ideas show target milestone (v1.1, v2.0, etc.)
- [ ] **IDEA-03**: User can add new idea via modal form
- [ ] **IDEA-04**: User can edit existing ideas
- [ ] **IDEA-05**: User can drag to reorder priority (stretch goal)

### CLI Skill

- [ ] **CLI-01**: /parallel shows status table of all projects
- [ ] **CLI-02**: /parallel status shows just the status table
- [ ] **CLI-03**: /parallel commands shows all ready-to-run commands

## v1.1 Requirements (Future)

Deferred to next milestone. Tracked but not in current roadmap.

### Decision Handling
- **DEC-01**: Simple decisions can be answered in dashboard modal
- **DEC-02**: Dashboard writes decision back to STATE.md
- **DEC-03**: Answered decision triggers GSD resume

### Enhanced CLI
- **CLI-04**: /parallel launch [project] spawns background Claude process
- **CLI-05**: Background execution with overnight-gsd infrastructure

## Out of Scope

Explicitly excluded. Documented to prevent scope creep.

| Feature | Reason |
|---------|--------|
| Remote execution from dashboard | Terminal execution maintains GSD control |
| Multi-user support | Single operator use case |
| Android/Linux notifications | macOS only for now |
| Complex decision handling | Those stay in terminal |
| Automatic project detection | Manual registration via GSD commands |

## Traceability

Which phases cover which requirements. Updated during roadmap creation.

| Requirement | Phase | Status |
|-------------|-------|--------|
| DB-01 | Phase 1 | Pending |
| DB-02 | Phase 1 | Pending |
| DB-03 | Phase 1 | Pending |
| DB-04 | Phase 1 | Pending |
| GSD-01 | Phase 2 | Pending |
| GSD-02 | Phase 2 | Pending |
| GSD-03 | Phase 2 | Pending |
| GSD-04 | Phase 2 | Pending |
| GSD-05 | Phase 2 | Pending |
| DASH-01 | Phase 3 | Pending |
| DASH-02 | Phase 3 | Pending |
| DASH-03 | Phase 3 | Pending |
| DASH-04 | Phase 3 | Pending |
| DASH-05 | Phase 3 | Pending |
| DASH-06 | Phase 3 | Pending |
| ROAD-01 | Phase 4 | Pending |
| ROAD-02 | Phase 4 | Pending |
| ROAD-03 | Phase 4 | Pending |
| ROAD-04 | Phase 4 | Pending |
| ROAD-05 | Phase 4 | Pending |
| IDEA-01 | Phase 5 | Pending |
| IDEA-02 | Phase 5 | Pending |
| IDEA-03 | Phase 5 | Pending |
| IDEA-04 | Phase 5 | Pending |
| IDEA-05 | Phase 5 | Pending |
| CLI-01 | Phase 6 | Pending |
| CLI-02 | Phase 6 | Pending |
| CLI-03 | Phase 6 | Pending |

**Coverage:**
- v1.0 requirements: 28 total
- Mapped to phases: 28
- Unmapped: 0

---
*Requirements defined: 2026-01-23*
*Last updated: 2026-01-23 after initial definition*
