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

**Plans:** 3 plans

Plans:
- [ ] 03-01-PLAN.md — Phase progress bar, data wiring, and page layout shell
- [ ] 03-02-PLAN.md — Sidebar panels (sessions, documents, research)
- [ ] 03-03-PLAN.md — Conversation shell, incubation overlay, and full layout wiring

### Requirements Covered
- REQ-F2: Project Detail View (UI only)
- REQ-F3: Incubation State UI

### Success Criteria
- [ ] Project detail page renders correctly
- [ ] All sidebar panels show data from database
- [ ] Phase navigation shows correct state
- [ ] Incubation UI displays correctly when locked
- [ ] Skip incubation modal works

---

## Phase 4: Conversation Engine

**Goal:** Functional AI conversations with context management

### Requirements Covered
- REQ-API-CLAUDE: Claude API integration
- REQ-CONV: Conversation system

### Tasks

4.1 **Claude API Integration**
- Create `/api/planning/chat` route
- Streaming response handling
- Error handling and retry logic

4.2 **Context Loading**
- Implement get_phase_context function call from frontend
- Load conversation summaries
- Load relevant documents
- Load recent messages (last 10)

4.3 **System Prompts**
- Create system prompt files/constants for each phase
- CAPTURE, DISCOVER, DEFINE, DEVELOP, VALIDATE, PACKAGE prompts
- Template variable injection

4.4 **Message Storage**
- Save messages to planning_studio.messages table
- Update conversation message_count
- Handle conversation creation on first message

4.5 **Conversation UI**
- Render messages with Markdown
- Streaming response display
- Auto-scroll behavior
- Loading states

4.6 **Session Management**
- "New Session" creates new conversation
- Previous sessions are read-only
- Can switch between sessions

### Success Criteria
- [ ] Can have full conversation with Claude
- [ ] Context is loaded correctly per phase
- [ ] Messages are saved to database
- [ ] Streaming responses display properly
- [ ] Multiple sessions per phase work
- [ ] System prompts differ by phase

---

## Phase 5: Phase Transitions & Incubation

**Goal:** Proper phase flow with incubation enforcement

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
- [ ] Phases transition correctly on completion
- [ ] Incubation is enforced with accurate countdown
- [ ] Can skip with proper logging
- [ ] Readiness checks work for DISCOVER→DEFINE and DEVELOP→VALIDATE
- [ ] Can go back to previous phases

---

## Phase 6: Memory System

**Goal:** Extract and store memories, enable semantic search

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
- [ ] Memories are extracted after conversations end
- [ ] Embeddings are generated and stored
- [ ] Semantic search returns relevant results
- [ ] Ask AI works at project level
- [ ] Global Ask AI (Cmd+K) works across all projects

---

## Phase 7: Document Generation

**Goal:** Generate and manage planning documents

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
- [ ] Documents are generated during planning conversations
- [ ] Can view and edit documents with versioning
- [ ] GSD package is generated correctly in PACKAGE phase
- [ ] Can download/export package
- [ ] Claude Code command is generated

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
- [ ] Can trigger research from conversation
- [ ] Research runs asynchronously
- [ ] Results are stored and integrated into conversation
- [ ] Can view research history

---

## Phase 9: Ready-to-Build Queue & Prioritization

**Goal:** AI-prioritized queue of packaged projects

### Requirements Covered
- REQ-F4: Ready-to-Build Queue
- REQ-F7: Goals Management
- REQ-PRIORITY: AI prioritization

### Tasks

9.1 **Goals Management Page**
- CRUD for user goals
- Priority slider (1-10)
- Goal type selection

9.2 **Priority Calculation**
- Create `/api/planning/prioritize` route
- Claude function to calculate priority based on goals
- Generate reasoning text
- Store score and reasoning

9.3 **Ready-to-Build Queue UI**
- Sorted list by priority score
- Priority score display with reasoning tooltip
- Project summary cards

9.4 **Queue Actions**
- View PRD button
- Copy Claude Code command button
- Start Build button

9.5 **Refresh Priority**
- Manual recalculation button
- Recalculates all ready-to-build projects

9.6 **Start Build Flow**
- Transition project to 'building' status
- Record build_started_at
- Navigate to build tracker

### Success Criteria
- [ ] Can manage goals with priorities
- [ ] Projects are prioritized by AI with reasoning
- [ ] Queue displays correctly sorted
- [ ] Can start build from queue

---

## Phase 10: Build Tracker

**Goal:** Track active development progress

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
- [ ] Active builds show progress
- [ ] Can track multiple builds
- [ ] Can mark as shipped
- [ ] Shipped projects appear in Shipped column

---

## Phase 11: Analytics & Polish

**Goal:** Metrics dashboard and final refinements

### Requirements Covered
- REQ-F8: Analytics Dashboard
- REQ-POLISH: UI polish

### Tasks

11.1 **Analytics Queries**
- Ideas captured (total, this month)
- Ideas by status (funnel)
- Average time to ship
- Conversion rates
- Incubation skip rate

11.2 **Analytics Dashboard UI**
- Summary cards
- Funnel visualization
- Trend charts (optional)

11.3 **UI Polish**
- Loading states everywhere
- Error states with retry
- Empty states with guidance
- Animations/transitions

11.4 **Mobile Responsiveness**
- Test all views on mobile
- Adjust layouts as needed

11.5 **Performance Optimization**
- Lazy loading for lists
- Query optimization
- Caching where appropriate

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
