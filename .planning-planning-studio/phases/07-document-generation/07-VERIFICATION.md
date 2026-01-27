---
phase: 07-document-generation
verified: 2026-01-27T22:30:00Z
status: gaps_found
score: 4/5 must-haves verified
gaps:
  - truth: "Save/edit creates new version and UI reflects updated content"
    status: partial
    reason: "saveDocumentVersion returns {id, version} but API routes return saved.doc_type and saved.content which are undefined. DocEditor relies on response.content after PUT."
    artifacts:
      - path: "dashboard/src/lib/planning/doc-generation.ts"
        issue: "saveDocumentVersion return type is {id, version} - missing doc_type and content"
      - path: "dashboard/src/app/api/planning/documents/generate/route.ts"
        issue: "Lines 69-72 reference saved.doc_type and saved.content which are undefined"
      - path: "dashboard/src/app/api/planning/documents/[docId]/route.ts"
        issue: "Lines 125-130 same issue in PUT handler - saved.doc_type and saved.content undefined"
    missing:
      - "saveDocumentVersion should return {id, version, doc_type, content} or API routes should construct response from known values instead of saved.doc_type/saved.content"
---

# Phase 7: Document Generation Verification Report

**Phase Goal:** Generate and manage planning documents
**Verified:** 2026-01-27T22:30:00Z
**Status:** gaps_found
**Re-verification:** No -- initial verification

## Goal Achievement

### Observable Truths

| # | Truth | Status | Evidence |
|---|-------|--------|----------|
| 1 | Documents are generated during planning conversations | VERIFIED | Chat route detects `GENERATE_DOC` markers via `detectAllDocGenerateMarkers`, emits `doc_suggestion` SSE events. Generate API calls Claude with `tool_choice` pattern and saves versioned row. |
| 2 | Can view documents with markdown rendering | VERIFIED | `documents-panel.tsx` lists docs, clicking opens `doc-preview-modal.tsx` which renders markdown via `ReactMarkdown` + `remarkGfm`. |
| 3 | Can edit documents with versioning | PARTIAL | `doc-editor.tsx` has textarea + save button calling PUT to `[docId]` route. PUT calls `saveDocumentVersion` (creates new version, never updates). However, response returns `saved.doc_type` and `saved.content` which are undefined on the return object, so the UI would receive undefined content after save. |
| 4 | GSD package generated and downloadable as ZIP | VERIFIED | `export-panel.tsx` fetches latest docs via export API, creates ZIP with JSZip using `.planning/` folder structure, triggers download via file-saver. |
| 5 | Claude Code command is generated | VERIFIED | `export-panel.tsx` line 65 copies command: `claude "Initialize project from .planning/ ..."` to clipboard. |

**Score:** 4/5 truths verified

### Required Artifacts

| Artifact | Expected | Status | Details |
|----------|----------|--------|---------|
| `dashboard/src/lib/planning/doc-templates.ts` | Template constants for 9 doc types | VERIFIED | 407 lines, all 9 types with full markdown templates |
| `dashboard/src/lib/planning/doc-generation.ts` | Generation logic with Claude tool_choice | VERIFIED | 279 lines, marker detection, version mgmt, context loading, Claude generation |
| `dashboard/src/app/api/planning/documents/generate/route.ts` | POST endpoint for generation | VERIFIED | 79 lines, validates input, loads context, generates, saves |
| `dashboard/src/app/api/planning/documents/[docId]/route.ts` | GET/PUT for view/edit | PARTIAL | 136 lines, GET works (3 modes), PUT has response shape bug |
| `dashboard/src/app/api/planning/documents/export/route.ts` | POST export endpoint | VERIFIED | 82 lines, fetches latest versions, returns with project name |
| `dashboard/src/app/dashboard/planning/[projectId]/components/documents-panel.tsx` | Document list UI | VERIFIED | 104 lines, renders doc list with version badges, opens modal, includes export panel |
| `dashboard/src/app/dashboard/planning/[projectId]/components/doc-preview-modal.tsx` | Modal with markdown preview | VERIFIED | 146 lines, Dialog with markdown rendering, edit toggle, version selector |
| `dashboard/src/app/dashboard/planning/[projectId]/components/doc-editor.tsx` | Textarea editor with save | VERIFIED | 54 lines, textarea + save/cancel, calls PUT API |
| `dashboard/src/app/dashboard/planning/[projectId]/components/doc-version-selector.tsx` | Version dropdown | VERIFIED | 67 lines, fetches version list, select element for switching |
| `dashboard/src/app/dashboard/planning/[projectId]/components/export-panel.tsx` | ZIP download + Claude command | VERIFIED | 115 lines, JSZip download, clipboard copy |

### Key Link Verification

| From | To | Via | Status | Details |
|------|----|-----|--------|---------|
| Chat route | doc-generation.ts | import detectAllDocGenerateMarkers, stripDocMarkers | WIRED | Markers detected, SSE events emitted for doc suggestions |
| documents-panel | doc-preview-modal | onClick sets selectedDoc, opens modal | WIRED | State management correct |
| doc-preview-modal | doc-editor | isEditing toggle renders DocEditor | WIRED | Edit button switches to editor, save callback updates modal state |
| doc-editor | PUT /api/planning/documents/[docId] | fetch PUT | WIRED | Call exists, response handling present (but response shape issue) |
| doc-version-selector | GET /api/planning/documents/_list | fetch with query params | WIRED | Uses `_list` as docId but query params route to version-list branch |
| export-panel | POST /api/planning/documents/export | fetch POST | WIRED | Full chain: fetch docs, create ZIP, trigger download |
| DocumentsPanel | project-detail-client.tsx | import and render | WIRED | Used in project detail page |
| system-prompts.ts | GENERATE_DOC markers | Prompt instructions | WIRED | System prompt instructs Claude to emit markers |

### Anti-Patterns Found

| File | Line | Pattern | Severity | Impact |
|------|------|---------|----------|--------|
| doc-generation.ts (generate route) | 69-72 | Returns `saved.doc_type` / `saved.content` which are undefined | Blocker | Generate API response missing doc_type and content fields |
| [docId]/route.ts | 125-130 | Same: returns `saved.doc_type` / `saved.content` undefined | Blocker | After edit-save, UI receives undefined content |

### Human Verification Required

### 1. Document Generation Flow
**Test:** Start a planning conversation, progress to a phase where Claude suggests a document, verify the document appears in the documents panel.
**Expected:** Document card appears with correct type and version badge.
**Why human:** Requires live Claude API call and SSE stream handling.

### 2. ZIP Download
**Test:** With GSD documents generated, click "Download .planning/ ZIP" and extract the archive.
**Expected:** ZIP contains `.planning/PROJECT.md`, `.planning/REQUIREMENTS.md`, `.planning/ROADMAP.md` with actual content.
**Why human:** Requires browser download and file inspection.

### Gaps Summary

One gap found: the `saveDocumentVersion` function returns `{id, version}` but both the generate and edit API routes attempt to return `saved.doc_type` and `saved.content` from that object, which would be `undefined`. This means:

1. The generate endpoint response is missing `docType` and `content` fields (both undefined).
2. After editing and saving a document, the doc-editor receives `undefined` for `content` in the response, which would break the preview modal's display of the updated content.

The fix is straightforward: either expand `saveDocumentVersion` to return the full row (add `.select('id, version, doc_type, content')` to the insert), or have the API routes construct the response from the input values they already have.

---

_Verified: 2026-01-27T22:30:00Z_
_Verifier: Claude (gsd-verifier)_
