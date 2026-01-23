# Development Dashboard - Roadmap

## Milestone: v1.0

**Goal:** Create a Development department in the CEO dashboard for parallel project visibility and management.

### Overview

This milestone delivers database schema, GSD integration, dashboard views, and CLI skill for managing multiple GSD projects simultaneously.

**Build Order Rationale:**
1. Database first - All other features depend on data structures
2. GSD Integration - Populates data as work happens
3. Active Projects view - Core visibility feature
4. Roadmap view - Shows where projects are headed
5. Ideas Backlog - Captures future work
6. CLI Skill - Terminal access to same data
7. Polish - Real-time subscriptions, edge cases

### Phase Summary

| Phase | Name | Requirements | Count |
|-------|------|--------------|-------|
| 1 | Database Schema | DB-01, DB-02, DB-03, DB-04 | 4 |
| 2 | GSD Integration | GSD-01, GSD-02, GSD-03, GSD-04, GSD-05 | 5 |
| 3 | Dashboard - Active Projects | DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06 | 6 |
| 4 | Dashboard - Roadmap View | ROAD-01, ROAD-02, ROAD-03, ROAD-04, ROAD-05 | 5 |
| 5 | Dashboard - Ideas Backlog | IDEA-01, IDEA-02, IDEA-03, IDEA-04, IDEA-05 | 5 |
| 6 | CLI Skill | CLI-01, CLI-02, CLI-03 | 3 |
| 7 | Polish & Testing | (integration, edge cases) | 0 |

**Total:** 28 requirements across 7 phases

---

### Phase 1: Database Schema
**Goal:** Create tables in Supabase to track project state, phases, and ideas
**Depends on:** Nothing (first phase)
**Requirements:** DB-01, DB-02, DB-03, DB-04

**Success Criteria** (what must be TRUE):
1. dev_projects table exists with all columns from schema
2. dev_project_phases table exists with foreign key to dev_projects
3. dev_project_ideas table exists with foreign key to dev_projects
4. Test project can be inserted and queried

**Plans:** TBD

---

### Phase 2: GSD Integration
**Goal:** GSD commands write status to Supabase and send macOS notifications
**Depends on:** Phase 1 (database tables)
**Requirements:** GSD-01, GSD-02, GSD-03, GSD-04, GSD-05

**Success Criteria** (what must be TRUE):
1. Running /gsd:execute-phase updates dev_projects.status in Supabase
2. Checkpoint decisions are appended to pending_decisions JSONB
3. Phase completion triggers macOS notification
4. Blocker triggers macOS notification with sound
5. /gsd:new-project creates dev_projects record

**Plans:** TBD

---

### Phase 3: Dashboard - Active Projects
**Goal:** Users can view all active projects with status and launch commands
**Depends on:** Phase 2 (GSD writes data)
**Requirements:** DASH-01, DASH-02, DASH-03, DASH-04, DASH-05, DASH-06

**Success Criteria** (what must be TRUE):
1. Development tab appears in CEO dashboard navigation
2. Project cards render with name, phase, progress, status indicator
3. Status colors: green=Ready, blue=Executing, yellow=Needs Input, red=Blocked
4. Clicking [Launch] shows modal with command to copy
5. Dashboard updates within 5 seconds of Supabase change

**Plans:** TBD

---

### Phase 4: Dashboard - Roadmap View
**Goal:** Users can see phase timeline for each project
**Depends on:** Phase 3 (dashboard infrastructure)
**Requirements:** ROAD-01, ROAD-02, ROAD-03, ROAD-04, ROAD-05

**Success Criteria** (what must be TRUE):
1. Roadmap tab shows all projects with phase timeline
2. Complete phases show checkmark
3. Current phase is visually highlighted
4. Clicking phase shows details panel
5. Clicking project name navigates to project detail

**Plans:** TBD

---

### Phase 5: Dashboard - Ideas Backlog
**Goal:** Users can capture and organize ideas for future work
**Depends on:** Phase 3 (dashboard infrastructure)
**Requirements:** IDEA-01, IDEA-02, IDEA-03, IDEA-04, IDEA-05

**Success Criteria** (what must be TRUE):
1. Ideas tab shows ideas grouped by project
2. Ideas display target milestone
3. User can add new idea via form modal
4. User can edit existing idea
5. Ideas are ordered by priority

**Plans:** TBD

---

### Phase 6: CLI Skill
**Goal:** Terminal access to project status and commands
**Depends on:** Phase 1 (database tables)
**Requirements:** CLI-01, CLI-02, CLI-03

**Success Criteria** (what must be TRUE):
1. /parallel shows formatted table of projects with status
2. /parallel status shows just the table
3. /parallel commands shows all commands for ready projects

**Plans:** TBD

---

### Phase 7: Polish & Testing
**Goal:** Everything works together smoothly
**Depends on:** Phases 3, 4, 5, 6
**Requirements:** (none - integration)

**Success Criteria** (what must be TRUE):
1. Real-time Supabase subscriptions work reliably
2. Edge cases handled (no projects, stale data, network errors)
3. All verification tests pass

**Plans:** TBD

---

## Progress

| Phase | Plans Complete | Status | Completed |
|-------|----------------|--------|-----------|
| 1. Database Schema | 0/? | Not started | - |
| 2. GSD Integration | 0/? | Not started | - |
| 3. Dashboard - Active Projects | 0/? | Not started | - |
| 4. Dashboard - Roadmap View | 0/? | Not started | - |
| 5. Dashboard - Ideas Backlog | 0/? | Not started | - |
| 6. CLI Skill | 0/? | Not started | - |
| 7. Polish & Testing | 0/? | Not started | - |

---
*Roadmap created: 2026-01-23*
*Last updated: 2026-01-23 after initial creation*
