# Phase 7: Document Generation - Research

**Researched:** 2026-01-27
**Domain:** Document generation, versioning, ZIP export, markdown editing in Next.js
**Confidence:** HIGH

## Summary

Phase 7 adds document generation to the Planning Studio's existing conversation engine. The codebase already has: (1) a documents table with versioning, (2) a `DocumentsPanel` shell in the sidebar, (3) `react-markdown` + `remark-gfm` installed, (4) established patterns for SSE streaming with HTML comment markers and fire-and-forget post-processing.

The key integration pattern is: Claude signals document readiness via a new HTML comment marker (like `<!--GENERATE_DOC:icp-->`) in its streamed response. The chat route detects this marker, strips it, and emits a SSE event. The client shows an approval card. On approval, a separate API route calls Claude with `tool_choice` to produce structured document content, then upserts into `planning_studio.documents` with version increment.

**Primary recommendation:** Follow the exact same marker-detection + SSE event pattern used for phase transitions and memory extraction. Document generation is just another post-stream action.

## Standard Stack

### Core (Already Installed)
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| react-markdown | ^10.1.0 | Markdown rendering in preview modal | Already in use for message rendering |
| remark-gfm | (installed) | GitHub-flavored markdown tables/lists | Already in use |
| @anthropic-ai/sdk | (installed) | Claude API for document generation | Already in use |

### New Dependencies Needed
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| jszip | ^3.10 | Client-side ZIP generation | GSD package export (task 7.6) |
| file-saver | ^2.0 | Trigger browser file download | ZIP download (task 7.6) |

### Not Needed
| Instead of | Why Not |
|------------|---------|
| Handlebars library | Templates are guidance for Claude, not runtime interpolation. Claude generates full markdown content. No template engine needed. |
| Monaco/CodeMirror | Overkill for light editing. A `<textarea>` with monospace font suffices for the "light version tracking" requirement. |
| Separate versions table | Current schema stores version integer on documents row. For "view previous version", query by `project_id + doc_type` ordered by version. Each version is a separate row. |

**Installation:**
```bash
npm install jszip file-saver && npm install -D @types/file-saver
```

## Architecture Patterns

### Document Generation Flow (Critical Pattern)

```
User talks in chat
  -> Claude's response includes <!--GENERATE_DOC:icp-->
  -> chat/route.ts detects marker, strips it, emits SSE event { type: 'doc_suggestion', docType: 'icp' }
  -> ConversationShell shows inline approval card: "Generate ICP Document?"
  -> User clicks "Generate"
  -> Client POSTs to /api/planning/documents/generate
  -> Server calls Claude with tool_choice to produce structured content
  -> Server upserts document row (version increment if exists)
  -> Client refreshes documents list, shows preview modal
```

This mirrors the existing patterns:
- Phase completion: `<!--PHASE_COMPLETE-->` -> SSE `phase_complete` -> PhaseTransitionModal
- Readiness check: `<!--READINESS_PASS-->` -> SSE `readiness_result` -> ReadinessBadge
- Memory extraction: fire-and-forget after stream closes

### New Marker Constants

```typescript
// In phase-transitions.ts (or new doc-generation.ts)
export const DOC_GENERATE_MARKER_PREFIX = '<!--GENERATE_DOC:';
// Pattern: <!--GENERATE_DOC:icp--> or <!--GENERATE_DOC:lean_canvas-->

export function detectDocGenerateMarker(content: string): string | null {
  const match = content.match(/<!--GENERATE_DOC:(\w+)-->/);
  return match ? match[1] : null;
}
```

### Document Versioning Pattern

The existing `documents` table already supports versioning. Each "version" is a NEW ROW, not an update:

```typescript
// To save a new version:
const { data: existing } = await supabase
  .schema('planning_studio')
  .from('documents')
  .select('version')
  .eq('project_id', projectId)
  .eq('doc_type', docType)
  .order('version', { ascending: false })
  .limit(1)
  .single();

const nextVersion = existing ? existing.version + 1 : 1;

await supabase
  .schema('planning_studio')
  .from('documents')
  .insert({
    project_id: projectId,
    doc_type: docType,
    content: generatedContent,
    version: nextVersion,
    file_path: getFilePath(docType),
  });
```

### File Path Mapping

```typescript
const DOC_FILE_PATHS: Record<DocumentType, string> = {
  icp: '.planning/references/icp.md',
  competitive_intel: '.planning/references/competitive_intel.md',
  lean_canvas: '.planning/references/lean_canvas.md',
  problem_statement: '.planning/references/problem_statement.md',
  feature_spec: '.planning/references/feature_spec.md',
  technical_scope: '.planning/references/technical_scope.md',
  gsd_project: '.planning/PROJECT.md',
  gsd_requirements: '.planning/REQUIREMENTS.md',
  gsd_roadmap: '.planning/ROADMAP.md',
};
```

### Recommended Project Structure (New Files)

```
dashboard/src/
├── lib/planning/
│   ├── doc-generation.ts         # Marker detection + generation logic
│   └── doc-templates.ts          # Template constants (TypeScript string literals)
├── app/api/planning/
│   └── documents/
│       ├── generate/route.ts     # POST: generate doc via Claude tool_choice
│       ├── [docId]/route.ts      # GET: fetch doc, PUT: update doc content
│       └── export/route.ts       # POST: generate ZIP package
└── app/dashboard/planning/[projectId]/components/
    ├── doc-suggestion-card.tsx    # Inline approval UI in chat
    ├── doc-preview-modal.tsx      # Full-screen modal for viewing docs
    ├── doc-editor.tsx             # Textarea editor for editing
    └── doc-version-selector.tsx   # Dropdown for version history
```

### Anti-Patterns to Avoid
- **Runtime template interpolation:** Don't build a Handlebars engine. The reference templates are instructions for Claude, not code templates. Claude generates the full markdown.
- **Blocking the SSE stream for generation:** Don't generate documents inline during streaming. Use the suggest-approve-generate async flow.
- **Single document row with updates:** Each version must be a new row so version history is preserved.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| ZIP generation | Custom archive code | jszip | Handles folder structure, works client-side, 0 server memory |
| File download | Custom blob handling | file-saver | Cross-browser, handles edge cases |
| Markdown rendering | Custom parser | react-markdown (already installed) | Full GFM support already in use |
| Document generation | Template interpolation engine | Claude tool_choice (like memory extraction) | Claude already has all context, just needs structured output |

## Common Pitfalls

### Pitfall 1: Template Confusion
**What goes wrong:** Building a runtime template engine to populate the Handlebars-style templates from `document_templates.md`
**Why it happens:** Templates file uses `{{variables}}` syntax suggesting Handlebars
**How to avoid:** Templates are INSTRUCTIONS for Claude, not code. Pass them as part of the system prompt. Claude fills them in and returns complete markdown. No template engine needed.

### Pitfall 2: Version History Query
**What goes wrong:** Querying only latest version when user wants to browse history
**How to avoid:** Always query with `order('version', { ascending: false })` and use `.limit(1)` only for "current version" queries. For history dropdown, query all versions for a `(project_id, doc_type)` pair.

### Pitfall 3: Blocking Stream for Doc Generation
**What goes wrong:** Trying to generate the document during the SSE stream, causing timeout
**How to avoid:** The marker only SUGGESTS generation. Generation happens via a separate POST request after user approval.

### Pitfall 4: Missing Context in Generation
**What goes wrong:** Document generation Claude call lacks project context, producing generic content
**How to avoid:** The generate endpoint must load full project context (existing documents, memories, conversation history) and pass it as system prompt, same as `loadChatContext` does for chat.

### Pitfall 5: Stale DocumentsPanel After Generation
**What goes wrong:** DocumentsPanel in sidebar doesn't update after new document is generated
**How to avoid:** After generation completes, trigger a data refresh (router.refresh() or fetch-based like conversations do).

## Code Examples

### Document Generation API Route Pattern
```typescript
// /api/planning/documents/generate/route.ts
// Follows exact pattern of memory-extraction.ts (tool_choice)

const generateDocTool: Anthropic.Tool = {
  name: 'generate_document',
  description: 'Generate a planning document in markdown format',
  input_schema: {
    type: 'object',
    properties: {
      content: {
        type: 'string',
        description: 'Complete markdown document content',
      },
    },
    required: ['content'],
  },
};

// Use tool_choice: { type: 'tool', name: 'generate_document' }
// System prompt includes: template structure + all project context
```

### Doc Suggestion Card (Inline Chat UI)
```typescript
// Rendered inside MessageList when doc_suggestion SSE event fires
interface DocSuggestionCardProps {
  docType: DocumentType;
  onApprove: () => void;
  onDismiss: () => void;
  isGenerating: boolean;
}
// Renders as a Card with doc type label, "Generate" button, dismiss X
```

### GSD Package Export (ZIP)
```typescript
import JSZip from 'jszip';
import { saveAs } from 'file-saver';

async function exportGSDPackage(projectId: string) {
  // Fetch all documents for project
  const docs = await fetchDocuments(projectId);

  const zip = new JSZip();
  const planning = zip.folder('.planning')!;
  const refs = planning.folder('references')!;

  for (const doc of docs) {
    if (doc.file_path?.startsWith('.planning/references/')) {
      refs.file(doc.file_path.split('/').pop()!, doc.content);
    } else if (doc.file_path?.startsWith('.planning/')) {
      planning.file(doc.file_path.replace('.planning/', ''), doc.content);
    }
  }

  const blob = await zip.generateAsync({ type: 'blob' });
  saveAs(blob, `${projectName}-planning.zip`);
}
```

### Claude Code Command Generation
```typescript
function generateClaudeCommand(projectTitle: string): string {
  return `claude "Initialize project from .planning/ - read PROJECT.md, REQUIREMENTS.md, and ROADMAP.md to understand scope, then create the implementation plan"`;
}
// Copy to clipboard via navigator.clipboard.writeText()
```

### Document Preview Modal
```typescript
// Uses shadcn Dialog + react-markdown (already installed)
// Version dropdown: <Select> with versions fetched by (project_id, doc_type)
// Edit button: switches content area from ReactMarkdown to <textarea>
// Save: POST to /api/planning/documents/[docId] creating new version row
```

## State of the Art

| Old Approach | Current Approach | Impact |
|--------------|------------------|--------|
| Handlebars template engine | Claude generates full content via tool_choice | No template library needed |
| Server-side ZIP (archiver) | Client-side ZIP (jszip) | No server memory/temp files |
| Complex rich-text editor | Textarea for light editing | Matches "light version tracking" requirement |

## Open Questions

1. **System prompt update for doc markers**
   - What we know: Phase prompts need to include `<!--GENERATE_DOC:type-->` marker instructions
   - Recommendation: Add doc generation marker instructions to DISCOVER, DEFINE, DEVELOP, and PACKAGE phase prompts

2. **Document update flow**
   - What we know: User decision says "updates follow same suggest-approve flow"
   - Recommendation: Claude includes `<!--GENERATE_DOC:icp-->` again when it wants to update; system detects existing doc and creates new version

## Sources

### Primary (HIGH confidence)
- Codebase inspection: `chat/route.ts`, `phase-transitions.ts`, `memory-extraction.ts`, `conversation-shell.tsx`, `documents-panel.tsx`, `project-detail-client.tsx`
- Codebase inspection: `planning.ts` types, `planning-chat.ts`, `system-prompts.ts`
- Codebase inspection: `document_templates.md` reference file
- Package.json: `react-markdown ^10.1.0` already installed

### Secondary (MEDIUM confidence)
- jszip: well-known client-side ZIP library, widely used in Next.js apps
- file-saver: standard companion to jszip for browser downloads

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - verified existing dependencies and patterns in codebase
- Architecture: HIGH - directly extends 3 established patterns (markers, SSE events, tool_choice)
- Pitfalls: HIGH - derived from understanding the actual codebase structure

**Research date:** 2026-01-27
**Valid until:** 2026-02-27 (stable codebase, no external API changes expected)
