# Planning Studio — Roadmap

## Phase Overview

| Phase | Name | Goal |
|-------|------|------|
| 1 | Database Foundation & Core UI Shell | Establish data layer and basic navigation |
| 2 | Pipeline View | Kanban-style view of all ideas |
| 3 | Project Detail View — Layout | Project detail page structure without AI |
| 4 | Conversation Engine | Functional AI conversations with context |
| 5 | Phase Transitions & Incubation | Proper phase flow with incubation enforcement |
| 6 | Memory System | Extract and store memories, enable semantic search |
| 7 | Document Generation | Generate and manage planning documents |
| 8 | Deep Research Integration | Perplexity integration for research |
| 9 | Ready-to-Build Queue & Prioritization | AI-prioritized queue of packaged projects |
| 10 | Build Tracker | Track active development progress |
| 11 | Analytics & Polish | Metrics dashboard and final refinements |
| 12 | Migration & Cleanup | Migrate existing data, remove old dashboard |

---

## Phase 1: Database Foundation & Core UI Shell

**Goal:** Establish data layer and basic navigation

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 01-01-PLAN.md — Create complete planning_studio schema with pgvector
- [x] 01-02-PLAN.md — Create shell pages with skeletons (planning, project, goals, analytics)
- [x] 01-03-PLAN.md — Add Planning Studio navigation link to dashboard header
- [x] 01-04-PLAN.md — Create TypeScript types, query functions, and seed data

### Success Criteria
- [x] pgvector extension enabled
- [x] All tables created and accessible via Supabase client
- [x] Basic page routing works
- [x] Can navigate between pages from sidebar
- [x] Test data visible in Supabase (seed migration ready)

---

## Phase 2: Pipeline View (Main Dashboard)

**Goal:** Kanban-style view of all ideas with drag-and-drop, search/filter, and quick capture

**Status:** Complete (2026-01-27)
**Plans:** 3 plans

Plans:
- [x] 02-01-PLAN.md — Pipeline board with drag-and-drop columns and project cards
- [x] 02-02-PLAN.md — Search and filter bar
- [x] 02-03-PLAN.md — Quick capture modal

### Requirements Covered
- REQ-F1: Pipeline View feature

### Success Criteria
- [x] Can see all projects organized by status columns
- [x] Cards show accurate information
- [x] Search and filter work
- [x] Clicking card navigates to detail view
- [x] Quick capture button visible

---

## Phase 3: Project Detail View — Layout

**Goal:** Project detail page structure without AI conversation

**Status:** Complete (2026-01-27)
**Plans:** 3 plans

Plans:
- [x] 03-01-PLAN.md — Phase progress bar, data wiring, and page layout shell
- [x] 03-02-PLAN.md — Sidebar panels (sessions, documents, research)
- [x] 03-03-PLAN.md — Conversation shell, incubation overlay, and full layout wiring

### Requirements Covered
- REQ-F2: Project Detail View (UI only)
- REQ-F3: Incubation State UI

### Success Criteria
- [x] Project detail page renders correctly
- [x] All sidebar panels show data from database
- [x] Phase navigation shows correct state
- [x] Incubation UI displays correctly when locked
- [x] Skip incubation modal works

---

## Phase 4: Conversation Engine

**Goal:** Functional AI conversations with context management

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 04-01-PLAN.md — API route, system prompts, context loading, message persistence
- [x] 04-02-PLAN.md — Conversation UI with streaming and markdown rendering
- [x] 04-03-PLAN.md — Session management (new/switch sessions, message loading)
- [x] 04-04-PLAN.md — End-to-end verification checkpoint

### Requirements Covered
- REQ-API-CLAUDE: Claude API integration
- REQ-CONV: Conversation system

### Success Criteria
- [x] Can have full conversation with Claude
- [x] Context is loaded correctly per phase
- [x] Messages are saved to database
- [x] Streaming responses display properly
- [x] Multiple sessions per phase work
- [x] System prompts differ by phase

---

## Phase 5: Phase Transitions & Incubation

**Goal:** Proper phase flow with incubation enforcement

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 05-01-PLAN.md — Phase transition backend: server actions, marker detection, incubation logic
- [x] 05-02-PLAN.md — Transition UI: confirmation modal, force-complete, readiness badges
- [x] 05-03-PLAN.md — Incubation overlay: countdown timer, idea capture, working skip
- [x] 05-04-PLAN.md — Phase navigation via progress bar + end-to-end verification

### Requirements Covered
- REQ-PHASES: Phase transition logic
- REQ-INCUBATE: Incubation enforcement

### Tasks

5.1 **Phase Transition Logic**
- Detect when Claude signals phase completion (special markers)
- Show transition confirmation modal
- Update project phase and status
- Create new phase record

5.2 **Incubation Enforcement**
- Set phase_locked_until timestamp after phase completion
- Check lock on page load
- Display incubation UI when locked
- Countdown timer component with accurate time

5.3 **Skip Incubation Flow**
- Confirmation modal with explanation
- Set incubation_skipped flag on project
- Log the skip in conversation metadata
- Unlock immediately

5.4 **Readiness Check Integration**
- Detect readiness check in conversation
- Special UI for Q&A format
- Pass/fail determination from Claude response
- Block transition if not passed

5.5 **Backward Navigation**
- Allow returning to previous phases
- Add to existing documents (don't replace)
- Update phase status appropriately

### Success Criteria
- [x] Phases transition correctly on completion
- [x] Incubation is enforced with accurate countdown
- [x] Can skip with proper logging
- [x] Readiness checks work for DISCOVER→DEFINE and DEVELOP→VALIDATE
- [x] Can go back to previous phases

---

## Phase 6: Memory System

**Goal:** Extract and store memories, enable semantic search

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 06-01-PLAN.md — Embeddings library, memory extraction library, and API routes
- [x] 06-02-PLAN.md — Wire extraction into chat endpoint, conversation summaries
- [x] 06-03-PLAN.md — Semantic search API and project-scoped Ask AI panel
- [x] 06-04-PLAN.md — Global Ask AI (Cmd+K) modal

### Requirements Covered
- REQ-MEMORY: Memory extraction and storage
- REQ-SEARCH: Semantic search
- REQ-F6: Ask AI feature

### Tasks

6.1 **OpenAI Embeddings Integration**
- Create `/api/planning/embeddings` route
- Batch embedding generation
- Error handling and retry

6.2 **Memory Extraction**
- At conversation end, send to Claude for memory extraction
- Extract decisions, insights, pivots with types
- Store with appropriate memory_type
- Generate embeddings for each memory

6.3 **Conversation Summary Generation**
- At conversation end, generate summary
- Store in conversations.summary
- Use for context in future conversations

6.4 **Semantic Search Function**
- Implement search endpoint `/api/planning/search`
- Call planning_studio.search_memories RPC
- Return ranked results with sources

6.5 **Ask AI Panel (Project-Scoped)**
- UI in project detail sidebar
- Ask questions about current project
- Display answers with sources
- Link to source conversations

6.6 **Global Ask AI (Cmd+K)**
- Keyboard shortcut trigger
- Modal interface
- Search across all projects
- Filter options by project

### Success Criteria
- [x] Memories are extracted after conversations end
- [x] Embeddings are generated and stored
- [x] Semantic search returns relevant results
- [x] Ask AI works at project level
- [x] Global Ask AI (Cmd+K) works across all projects

---

## Phase 7: Document Generation

**Goal:** Generate and manage planning documents

**Status:** Complete (2026-01-27)
**Plans:** 5 plans

Plans:
- [x] 07-01-PLAN.md — Document templates and generation library
- [x] 07-02-PLAN.md — API routes for generation, fetch, and edit
- [x] 07-03-PLAN.md — Chat integration with marker detection and suggestion cards
- [x] 07-04-PLAN.md — Document preview modal, editor, and version history UI
- [x] 07-05-PLAN.md — GSD package export (ZIP download + Claude Code command)

### Requirements Covered
- REQ-DOCS: Document generation
- REQ-GSD: GSD package output

### Tasks

7.1 **Document Templates**
- Create template constants for each document type
- ICP, Lean Canvas, Problem Statement, Feature Spec, Technical Scope
- GSD templates: PROJECT.md, REQUIREMENTS.md, ROADMAP.md

7.2 **Document Generation Logic**
- Claude generates document content during conversation
- Parse and store in planning_studio.documents
- Version increment on updates

7.3 **Document Preview UI**
- Modal for viewing documents
- Markdown rendering
- Version history dropdown

7.4 **Document Edit Flow**
- Edit button opens editor
- Save creates new version
- Version history preserved

7.5 **GSD Package Generation**
- Generate PROJECT.md from templates + content
- Generate REQUIREMENTS.md
- Generate ROADMAP.md
- Bundle reference documents
- Create .planning folder structure (virtual)

7.6 **Export/Download**
- Download as ZIP option
- Copy Claude Code command to clipboard

### Success Criteria
- [x] Documents are generated during planning conversations
- [x] Can view and edit documents with versioning
- [x] GSD package is generated correctly in PACKAGE phase
- [x] Can download/export package
- [x] Claude Code command is generated

---

## MVP Checkpoint

After Phase 7, the system is functional end-to-end:
- Can capture ideas
- Can have AI-guided planning conversations
- Incubation is enforced
- Memories are stored and searchable
- Documents are generated
- GSD packages are created

**Recommendation:** Consider shipping after Phase 7 and iterating based on real usage.

---

## Phase 8: Deep Research Integration

**Goal:** Perplexity integration for research during planning

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 08-01-PLAN.md — Research backend: Perplexity API route, marker detection, system prompt updates
- [x] 08-02-PLAN.md — Chat integration: SSE research markers, suggestion cards, approve/edit flow
- [x] 08-03-PLAN.md — Research panel UI: list view, results modal, manual research trigger
- [x] 08-04-PLAN.md — Results integration: context injection, sidebar refresh, memory extraction

### Requirements Covered
- REQ-API-PERPLEXITY: Perplexity API integration
- REQ-RESEARCH: Research system

### Tasks

8.1 **Perplexity API Integration**
- Create `/api/planning/research` route
- Handle async requests
- Store results in planning_studio.research

8.2 **Research Trigger in Conversation**
- Claude suggests research with specific query (special marker)
- One-click approval button in UI
- Research runs async

8.3 **Research Status UI**
- Show pending/running status in sidebar
- Notification when complete
- View findings button

8.4 **Research Results Integration**
- Summary injected into next Claude message
- Key findings extracted as memories
- Full results stored and viewable

8.5 **Research Panel Updates**
- List all research runs for project
- Click to view full results
- Filter by type

### Success Criteria
- [x] Can trigger research from conversation
- [x] Research runs asynchronously
- [x] Results are stored and integrated into conversation
- [x] Can view research history

---

## Phase 9: Ready-to-Build Queue & Prioritization

**Goal:** AI-prioritized queue of packaged projects

**Status:** Complete (2026-01-27)
**Plans:** 4 plans

Plans:
- [x] 09-01-PLAN.md — Goals management page with CRUD, migration for pinned column, server actions
- [x] 09-02-PLAN.md — Queue page UI with ranked list, queue items, and empty state
- [x] 09-03-PLAN.md — Priority calculation API route with Claude batch scoring and refresh button
- [x] 09-04-PLAN.md — Queue actions: View, Start Build, Export with confirmation flow

### Requirements Covered
- REQ-F4: Ready-to-Build Queue
- REQ-F7: Goals Management
- REQ-PRIORITY: AI prioritization

### Tasks

9.1 **Goals Management Page**
- CRUD for user goals
- Tier selection (Must-have / Should-have / Nice-to-have)
- Business goal types only (revenue, strategic, quick_win)

9.2 **Priority Calculation**
- Create `/api/planning/prioritize` route
- Claude batch scoring with multi-factor analysis
- Generate reasoning text
- Store score and reasoning

9.3 **Ready-to-Build Queue UI**
- Sorted list by priority score (pinned first)
- Priority score display with reasoning
- Project summary cards with doc counts

9.4 **Queue Actions**
- View project details link
- Export GSD package (reuse ExportPanel)
- Start Build with confirmation

9.5 **Refresh Priority**
- Manual recalculation button
- Stale indicator when goals changed
- Recalculates all ready-to-build projects

9.6 **Start Build Flow**
- Transition project to 'building' status
- Record build_started_at
- Navigate away from queue

### Success Criteria
- [x] Can manage goals with priorities
- [x] Projects are prioritized by AI with reasoning
- [x] Queue displays correctly sorted
- [x] Can start build from queue

---

## Phase 10: Build Tracker

**Goal:** Track active development progress

**Status:** Complete (2026-01-28)
**Plans:** 3 plans

Plans:
- [x] 10-01-PLAN.md — Build modal with progress stepper, actions, and Claude Code command
- [x] 10-02-PLAN.md — Progress management server actions and Mark Shipped flow
- [x] 10-03-PLAN.md — Enhanced card displays for building and shipped statuses

### Requirements Covered
- REQ-F5: Build Tracker

### Tasks

10.1 **Build Status Display**
- Current phase indicator
- Progress percentage
- Last activity timestamp

10.2 **GitHub Integration (Optional)**
- Store repo URL in project
- Display current branch
- Link to PRs

10.3 **Progress Sync**
- Manual update option for phase/progress
- Phase completion marking

10.4 **Build Actions**
- Open Claude Code button (copy command)
- View PRD button
- Mark Shipped button

10.5 **Shipped Flow**
- Confirmation modal
- Record shipped_at timestamp
- Move to Shipped column

### Success Criteria
- [x] Active builds show progress
- [x] Can track multiple builds
- [x] Can mark as shipped
- [x] Shipped projects appear in Shipped column

---

## Phase 11: Analytics & Polish

**Goal:** Metrics dashboard and final refinements

**Status:** Not Started
**Plans:** 4 plans

Plans:
- [ ] 11-01-PLAN.md — Analytics data layer and reusable components (queries, MetricCard, PeriodSelector, FunnelVisualization)
- [ ] 11-02-PLAN.md — Analytics dashboard page implementation with period selection and empty state
- [ ] 11-03-PLAN.md — Error boundaries for all Planning Studio routes
- [ ] 11-04-PLAN.md — Standardize empty states and add hover transitions

### Requirements Covered
- REQ-F8: Analytics Dashboard
- REQ-POLISH: UI polish

### Tasks

11.1 **Analytics Queries**
- Ideas captured (total, by period)
- Ideas by status (funnel)
- Average time to ship (velocity)
- Conversion rates

11.2 **Analytics Dashboard UI**
- Summary cards with sparklines
- Period selector (week/month/quarter/all)
- Funnel visualization

11.3 **UI Polish**
- Error boundaries for all routes
- Standardized empty states
- Subtle hover transitions

### Success Criteria
- [ ] Analytics page shows meaningful data
- [ ] All UI states handled gracefully
- [ ] Mobile works reasonably well
- [ ] Performance is acceptable

---

## Phase 12: Migration & Cleanup

**Goal:** Migrate existing data, remove old dashboard

### Requirements Covered
- REQ-MIGRATE: Data migration
- REQ-CLEANUP: Code cleanup

### Tasks

12.1 **Data Migration**
- Migrate any existing Development Dashboard projects if desired
- Map to new schema
- Preserve history where possible

12.2 **Remove Old Dashboard (Optional)**
- Delete old components if replacing
- Remove old API routes
- Clean up old database tables (after confirming migration)

12.3 **Documentation**
- Update CLAUDE.md with Planning Studio instructions
- Document new workflow

12.4 **Final Testing**
- End-to-end flow testing
- Edge case testing
- Performance testing

### Success Criteria
- [ ] Old data migrated (if applicable)
- [ ] System fully functional
- [ ] Documentation complete
- [ ] All tests pass

---

## Dependencies

```
Phase 1 (Database)
    └── Phase 2 (Pipeline View)
    └── Phase 3 (Project Detail Layout)
            └── Phase 4 (Conversation Engine)
                    └── Phase 5 (Phase Transitions)
                    └── Phase 6 (Memory System)
                    └── Phase 7 (Document Generation)
                            └── Phase 8 (Deep Research)
                            └── Phase 9 (Prioritization)
                                    └── Phase 10 (Build Tracker)
                                            └── Phase 11 (Analytics)
                                                    └── Phase 12 (Migration)
```

---

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Claude context limits | Aggressive summarization, selective loading |
| Embedding costs | Batch processing, cache common queries |
| Perplexity rate limits | Queue system, graceful degradation |
| Complex phase logic | Thorough state machine testing |
| Migration data loss | Full backup before migration, staged rollout |
