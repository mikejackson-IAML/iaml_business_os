// Planning Studio Document Generation API Route
// POST endpoint to generate a document via Claude and persist as a versioned row

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import {
  generateDocument,
  saveDocumentVersion,
  loadDocGenerationContext,
} from '@/lib/planning/doc-generation';
import type { DocumentType } from '@/dashboard-kit/types/departments/planning';

export const runtime = 'nodejs';

const VALID_DOC_TYPES: DocumentType[] = [
  'icp',
  'competitive_intel',
  'lean_canvas',
  'problem_statement',
  'feature_spec',
  'technical_scope',
  'gsd_project',
  'gsd_requirements',
  'gsd_roadmap',
];

interface GenerateRequestBody {
  projectId: string;
  docType: string;
}

export async function POST(request: NextRequest) {
  let body: GenerateRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, docType } = body;

  if (!projectId || !docType) {
    return NextResponse.json(
      { error: 'projectId and docType are required' },
      { status: 400 }
    );
  }

  if (!VALID_DOC_TYPES.includes(docType as DocumentType)) {
    return NextResponse.json(
      { error: `Invalid docType. Must be one of: ${VALID_DOC_TYPES.join(', ')}` },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  try {
    // Load project context for generation
    const context = await loadDocGenerationContext(supabase, projectId);

    // Generate document content via Claude
    const content = await generateDocument(projectId, docType as DocumentType, context);

    // Save as a versioned document row
    const saved = await saveDocumentVersion(supabase, projectId, docType as DocumentType, content);

    return NextResponse.json({
      id: saved.id,
      version: saved.version,
      docType: saved.doc_type,
      content: saved.content,
    });
  } catch (error) {
    console.error('Document generation error:', error);
    const message = error instanceof Error ? error.message : 'Failed to generate document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
