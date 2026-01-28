---
phase: 05-opportunities-pipeline
verified: 2026-01-27T22:30:00Z
status: passed
score: 9/9 must-haves verified
---

# Phase 5: Opportunities Pipeline Verification Report

**Phase Goal:** Full opportunity tracking with dual pipelines, kanban board, detail pages, and company integration.
**Verified:** 2026-01-27
**Status:** PASSED
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Kanban board with drag-and-drop stage progression | VERIFIED | `opportunity-kanban.tsx` uses @dnd-kit/core with DndContext, DragOverlay, optimistic updates, and API call to advance-stage endpoint on drop |
| 2 | In-house pipeline: Inquiry > Strategy Session > Consultation > Proposal Sent > Planning > Won > Lost | VERIFIED | `lead-intelligence-opportunities-types.ts` lines 83-91: IN_HOUSE_STAGES array matches exactly |
| 3 | Individual pipeline: Inquiry > Info Sent > Follow-Up > Registered > Lost | VERIFIED | `lead-intelligence-opportunities-types.ts` lines 93-99: INDIVIDUAL_STAGES array matches exactly |
| 4 | Create opportunity modal with company search | VERIFIED | `create-opportunity-modal.tsx` (260 lines) has debounced company search via /api/lead-intelligence/companies, contact search for individual type, type selector, value field, POST to API |
| 5 | Opportunity detail page with contacts, notes, attachments | VERIFIED | `opportunity-detail.tsx` (353 lines) renders StageVisualization, OpportunityContactsSection, OpportunityNotesSection, AttachmentUpload -- all substantive components with real API calls |
| 6 | Stage advancement API with validation | VERIFIED | `advance-stage/route.ts` fetches opportunity to get type, calls validateStageAdvancement against pipeline type, returns 400 on invalid stage |
| 7 | Company profile shows related opportunities (COMP-04) | VERIFIED | `companies/[id]/tabs/opportunities-tab.tsx` fetches opportunities filtered by company_id, renders table with links, includes CreateOpportunityModal with defaultCompanyId |
| 8 | Table view alternative to kanban | VERIFIED | `opportunity-table.tsx` (162 lines) renders sortable table with stage progress bar, column sorting, click-to-navigate to detail page |
| 9 | File attachment upload via Supabase Storage | VERIFIED | `attachments/route.ts` (191 lines) handles multipart upload to Supabase Storage bucket 'opportunity-attachments', generates signed URLs, supports DELETE with storage cleanup; `attachment-upload.tsx` has drag-and-drop UI |

**Score:** 9/9 truths verified

### Required Artifacts

| Artifact | Status | Lines | Details |
|----------|--------|-------|---------|
| `opportunities/page.tsx` | VERIFIED | 10 | Thin wrapper, delegates to OpportunitiesContent |
| `opportunities/opportunities-content.tsx` | VERIFIED | 130 | Dual pipeline tabs, kanban/table toggle, fetch with type filter |
| `opportunities/components/opportunity-kanban.tsx` | VERIFIED | 123 | @dnd-kit DnD with optimistic updates and revert on error |
| `opportunities/components/opportunity-table.tsx` | VERIFIED | 162 | Sortable table with stage progress bar |
| `opportunities/components/create-opportunity-modal.tsx` | VERIFIED | 260 | Company/contact search, type/value fields, POST API |
| `opportunities/components/opportunity-detail.tsx` | VERIFIED | 353 | Full detail with edit, delete, stage change, lost reason prompt |
| `opportunities/components/stage-visualization.tsx` | VERIFIED | 84 | Clickable stage circles with visual indicators |
| `opportunities/components/opportunity-contacts-section.tsx` | VERIFIED | 217 | Contact search, role assignment, add/remove |
| `opportunities/components/opportunity-notes-section.tsx` | VERIFIED | 66 | Editable textarea with dirty-check save |
| `opportunities/components/attachment-upload.tsx` | VERIFIED | 209 | Drag-and-drop, file type icons, download/delete |
| `api/opportunities/route.ts` | VERIFIED | 87 | GET with pagination/filters, POST with validation |
| `api/opportunities/[id]/advance-stage/route.ts` | VERIFIED | 71 | Stage validation against pipeline type |
| `api/opportunities/[id]/attachments/route.ts` | VERIFIED | 191 | GET (signed URLs), POST (upload), DELETE (storage cleanup) |
| `api/opportunities/[id]/contacts/route.ts` | EXISTS | -- | Not read but confirmed exists |
| `lib/api/lead-intelligence-opportunities-types.ts` | VERIFIED | 133 | Full type definitions, stage constants, role constants |
| `companies/[id]/tabs/opportunities-tab.tsx` | VERIFIED | 157 | Company-scoped opportunity list with create modal |

### Key Link Verification

| From | To | Via | Status |
|------|----|-----|--------|
| OpportunitiesContent | API GET | fetch with type filter | WIRED |
| OpportunityKanban | advance-stage API | fetch POST on dragEnd | WIRED |
| CreateOpportunityModal | API POST | fetch POST with body | WIRED |
| CreateOpportunityModal | companies search API | fetch GET debounced | WIRED |
| OpportunityDetail | API GET/PATCH/DELETE | fetch calls | WIRED |
| OpportunityDetail | advance-stage API | fetch POST | WIRED |
| AttachmentUpload | attachments API | FormData POST | WIRED |
| OpportunityContactsSection | contacts API | POST/DELETE | WIRED |
| OpportunityNotesSection | PATCH API | fetch PATCH | WIRED |
| OpportunitiesTab (company) | opportunities API | fetch with company_id | WIRED |

### Anti-Patterns Found

None blocking. No TODO/FIXME/placeholder patterns found in any verified file. All components have real implementations with proper error handling, loading states, and API integration.

### Human Verification Required

### 1. Drag-and-Drop Feel
**Test:** Drag an opportunity card from one stage column to another on the kanban board.
**Expected:** Card moves smoothly, overlay shows during drag, stage updates with toast notification, reverts on API failure.
**Why human:** Cannot verify DnD interaction behavior programmatically.

### 2. File Upload
**Test:** Upload a PDF via drag-and-drop and via file picker on opportunity detail page.
**Expected:** File appears in attachment list with correct icon, size, download link with signed URL.
**Why human:** Requires Supabase Storage bucket to exist and network interaction.

---

_Verified: 2026-01-27T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
