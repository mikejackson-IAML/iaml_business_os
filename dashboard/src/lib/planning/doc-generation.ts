// Planning Studio Document Generation
// Marker detection, Claude tool_choice generation, version management, and context loading

import Anthropic from '@anthropic-ai/sdk';
import { createServerClient } from '@/lib/supabase/server';
import { DOC_TEMPLATES, DOC_FILE_PATHS, DOC_TYPE_LABELS } from './doc-templates';
import type { DocumentType } from './doc-templates';

// Re-export for convenience
export type { DocumentType };

const anthropic = new Anthropic();

// =============================================================================
// MARKER DETECTION
// =============================================================================

const DOC_GENERATE_REGEX = /<!--GENERATE_DOC:(\w+)-->/;
const DOC_GENERATE_REGEX_GLOBAL = /<!--GENERATE_DOC:(\w+)-->/g;

/**
 * Detect a document generation marker in content.
 * Returns the doc type string if found, null otherwise.
 */
export function detectDocGenerateMarker(content: string): string | null {
  const match = content.match(DOC_GENERATE_REGEX);
  return match ? match[1] : null;
}

/**
 * Detect all document generation markers in content.
 * Returns an array of doc type strings (may be empty).
 */
export function detectAllDocGenerateMarkers(content: string): string[] {
  const matches: string[] = [];
  let match: RegExpExecArray | null;
  while ((match = DOC_GENERATE_REGEX_GLOBAL.exec(content)) !== null) {
    matches.push(match[1]);
  }
  return matches;
}

/**
 * Remove all GENERATE_DOC markers from content.
 */
export function stripDocMarkers(content: string): string {
  let stripped = content.replace(/<!--GENERATE_DOC:\w+-->/g, '');
  stripped = stripped.replace(/\n{3,}/g, '\n\n').trim();
  return stripped;
}

// =============================================================================
// VERSION MANAGEMENT
// =============================================================================

/**
 * Get the latest version number for a project + docType pair.
 * Returns 0 if no versions exist.
 */
export async function getLatestVersion(
  supabase: ReturnType<typeof createServerClient>,
  projectId: string,
  docType: string
): Promise<number> {
  const { data } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('version')
    .eq('project_id', projectId)
    .eq('doc_type', docType)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  return data?.version ?? 0;
}

/**
 * Save a new document version. Increments version from latest.
 * Returns the new document's id and version.
 */
export async function saveDocumentVersion(
  supabase: ReturnType<typeof createServerClient>,
  projectId: string,
  docType: DocumentType,
  content: string
): Promise<{ id: string; version: number; doc_type: string; content: string }> {
  const latestVersion = await getLatestVersion(supabase, projectId, docType);
  const newVersion = latestVersion + 1;
  const filePath = DOC_FILE_PATHS[docType];

  const { data, error } = await supabase
    .schema('planning_studio')
    .from('documents')
    .insert({
      project_id: projectId,
      doc_type: docType,
      content,
      version: newVersion,
      file_path: filePath,
    })
    .select('id, version, doc_type, content')
    .single();

  if (error || !data) {
    throw new Error(`Failed to save document version: ${error?.message ?? 'No data returned'}`);
  }

  return { id: data.id, version: data.version, doc_type: data.doc_type, content: data.content };
}

// =============================================================================
// DOCUMENT GENERATION (Claude tool_choice)
// =============================================================================

const generateDocumentTool: Anthropic.Tool = {
  name: 'generate_document',
  description: 'Generate a planning document based on project context and template structure.',
  input_schema: {
    type: 'object' as const,
    properties: {
      content: {
        type: 'string',
        description: 'The full markdown content of the generated document',
      },
    },
    required: ['content'],
  },
};

/**
 * Generate a document using Claude tool_choice pattern.
 * Returns the generated markdown content.
 */
export async function generateDocument(
  projectId: string,
  docType: DocumentType,
  projectContext: string
): Promise<string> {
  const template = DOC_TEMPLATES[docType];
  const label = DOC_TYPE_LABELS[docType];

  const systemPrompt = `You are generating a "${label}" document for a planning project.

Use the following template structure as your guide. Fill in sections with information from the project context provided. For sections where you don't have enough information, mark them as [TBD - discuss in next session].

Cross-reference other documents where relevant (e.g., "See ICP document for target user details").

## Template Structure

${template}

## Instructions
- Follow the template headings and structure exactly
- Be specific and actionable, not generic
- Use real data from the project context
- Mark gaps honestly rather than inventing information
- Write in clear, professional markdown`;

  const response = await anthropic.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: 4096,
    tools: [generateDocumentTool],
    tool_choice: { type: 'tool', name: 'generate_document' },
    system: systemPrompt,
    messages: [
      {
        role: 'user',
        content: `Generate the ${label} document based on this project context:\n\n${projectContext}`,
      },
    ],
  });

  const toolBlock = response.content.find(
    (block): block is Anthropic.ToolUseBlock => block.type === 'tool_use'
  );

  if (!toolBlock) {
    throw new Error('Document generation: no tool_use block in response');
  }

  const input = toolBlock.input as { content: string };
  return input.content;
}

// =============================================================================
// CONTEXT LOADING
// =============================================================================

/**
 * Load full project context for document generation.
 * Includes project details, existing documents, recent memories, and conversation summaries.
 */
export async function loadDocGenerationContext(
  supabase: ReturnType<typeof createServerClient>,
  projectId: string
): Promise<string> {
  // Load project details
  const { data: project } = await supabase
    .schema('planning_studio')
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .single();

  // Load latest version of each document
  const { data: documents } = await supabase
    .schema('planning_studio')
    .from('documents')
    .select('doc_type, content, version')
    .eq('project_id', projectId)
    .order('version', { ascending: false });

  // Deduplicate to latest version per doc type
  const latestDocs = new Map<string, { content: string; version: number }>();
  if (documents) {
    for (const doc of documents) {
      if (!latestDocs.has(doc.doc_type)) {
        latestDocs.set(doc.doc_type, { content: doc.content, version: doc.version });
      }
    }
  }

  // Load recent memories
  const { data: memories } = await supabase
    .schema('planning_studio')
    .from('memories')
    .select('memory_type, content')
    .eq('project_id', projectId)
    .order('created_at', { ascending: false })
    .limit(30);

  // Load conversation summaries
  const { data: conversations } = await supabase
    .schema('planning_studio')
    .from('conversations')
    .select('summary')
    .eq('project_id', projectId)
    .not('summary', 'is', null)
    .order('started_at', { ascending: false })
    .limit(10);

  // Build context string
  const parts: string[] = [];

  if (project) {
    parts.push(`## Project Details
**Title:** ${project.title}
**One-liner:** ${project.one_liner || '(Not yet defined)'}
**Status:** ${project.status}
**Current Phase:** ${project.current_phase}`);
  }

  if (latestDocs.size > 0) {
    parts.push('## Existing Documents');
    for (const [docType, doc] of latestDocs) {
      const label = DOC_TYPE_LABELS[docType as DocumentType] || docType;
      parts.push(`### ${label} (v${doc.version})\n${doc.content}`);
    }
  }

  if (memories && memories.length > 0) {
    parts.push('## Project Memories');
    for (const mem of memories) {
      parts.push(`- [${mem.memory_type}] ${mem.content}`);
    }
  }

  if (conversations && conversations.length > 0) {
    parts.push('## Conversation Summaries');
    for (const conv of conversations) {
      if (conv.summary) {
        parts.push(`- ${conv.summary}`);
      }
    }
  }

  return parts.join('\n\n');
}
