# Phase 7: Document Generation - Context

**Gathered:** 2026-01-27
**Status:** Ready for planning

<domain>
## Phase Boundary

Generate and manage planning documents during AI conversations. Includes document templates, version tracking, GSD-compatible package output, and export/download. Does NOT include research integration (Phase 8) or priority scoring (Phase 9).

</domain>

<decisions>
## Implementation Decisions

### Generation Triggers
- Claude suggests document generation, user approves before it runs
- Claude detects enough information gathered and proposes: "Ready to generate your ICP?"
- Updates follow the same flow — Claude suggests updating after further conversation evolves the content
- No manual user-initiated generation; all generation flows through conversation

### Document Editing UX
- Light version tracking — version number displayed, can view previous version, no diff view
- Each new generation or update increments version number
- Document viewing and editing UX is Claude's discretion (modal, side panel, or full page)
- Source conversation linking is Claude's discretion

### Claude's Discretion (Editing UX)
- Document viewing pattern (modal overlay vs side panel vs full page)
- Whether to show source conversation link on documents
- Whether to allow direct editing or conversation-only updates

### GSD Package Structure
- Exact match to .planning/ convention — PROJECT.md, REQUIREMENTS.md, ROADMAP.md generated in the format GSD expects
- Drop into .planning/ and go — no manual edits needed
- Reference documents (ICP, Lean Canvas, etc.) placed in .planning/references/ using convention-based discovery
- Documents serve as knowledge that GSD agents reference to answer planning questions themselves
- Export: both ZIP download AND copy Claude Code command available
- Convention-based integration — no config file needed, rely on .planning/references/ folder convention

### Template Content Depth
- Strict templates — every document type has consistent sections, headings, and structure
- Full set at launch: ICP, Lean Canvas, Problem Statement, Feature Spec, Technical Scope, plus GSD trio (PROJECT.md, REQUIREMENTS.md, ROADMAP.md)
- Fill known sections, mark gaps as [TBD - discuss in next session]
- Cross-reference between documents where relevant (e.g., REQUIREMENTS.md links to ICP)

### Claude's Discretion
- Phase-to-document mapping (which phases naturally suggest which documents)
- Approval UX pattern for generation suggestions (inline button vs toast vs other)

</decisions>

<specifics>
## Specific Ideas

- Documents are knowledge artifacts for GSD agents — the goal is that GSD can reference them to answer planning questions itself rather than asking the user
- .planning/references/ folder convention means GSD agents automatically discover and read these docs during research/planning phases
- Strict templates ensure consistency across projects — every ICP looks the same, every Lean Canvas has the same sections

</specifics>

<deferred>
## Deferred Ideas

None — discussion stayed within phase scope

</deferred>

---

*Phase: 07-document-generation*
*Context gathered: 2026-01-27*
