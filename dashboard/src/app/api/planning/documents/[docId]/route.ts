// Planning Studio Document CRUD API Route
// GET: fetch document by ID, version list, or specific version
// PUT: save edited content as a new version

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';
import { saveDocumentVersion } from '@/lib/planning/doc-generation';
import type { DocumentType } from '@/dashboard-kit/types/departments/planning';

export const runtime = 'nodejs';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;
  const { searchParams } = request.nextUrl;
  const projectId = searchParams.get('projectId');
  const docType = searchParams.get('docType');
  const version = searchParams.get('version');

  const supabase = createServerClient();

  try {
    // Version list mode: return all versions for a project+docType
    if (projectId && docType && version === 'all') {
      const { data, error } = await supabase
        .schema('planning_studio')
        .from('documents')
        .select('id, version, created_at')
        .eq('project_id', projectId)
        .eq('doc_type', docType)
        .order('version', { ascending: false });

      if (error) {
        console.error('Document version list error:', error);
        return NextResponse.json({ error: 'Failed to fetch versions' }, { status: 500 });
      }

      return NextResponse.json({ versions: data });
    }

    // Specific version mode
    if (projectId && docType && version) {
      const { data, error } = await supabase
        .schema('planning_studio')
        .from('documents')
        .select('id, project_id, doc_type, content, version, file_path, created_at')
        .eq('project_id', projectId)
        .eq('doc_type', docType)
        .eq('version', parseInt(version, 10))
        .single();

      if (error) {
        console.error('Document version fetch error:', error);
        return NextResponse.json({ error: 'Document version not found' }, { status: 404 });
      }

      return NextResponse.json(data);
    }

    // Single document by ID
    const { data, error } = await supabase
      .schema('planning_studio')
      .from('documents')
      .select('id, project_id, doc_type, content, version, file_path, created_at')
      .eq('id', docId)
      .single();

    if (error) {
      console.error('Document fetch error:', error);
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    return NextResponse.json(data);
  } catch (error) {
    console.error('Document GET error:', error);
    const message = error instanceof Error ? error.message : 'Failed to fetch document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ docId: string }> }
) {
  const { docId } = await params;

  let body: { content: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { content } = body;

  if (!content) {
    return NextResponse.json({ error: 'content is required' }, { status: 400 });
  }

  const supabase = createServerClient();

  try {
    // Fetch existing document to get project_id and doc_type
    const { data: existing, error: fetchError } = await supabase
      .schema('planning_studio')
      .from('documents')
      .select('project_id, doc_type')
      .eq('id', docId)
      .single();

    if (fetchError || !existing) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Save as new version (never updates existing row)
    const saved = await saveDocumentVersion(
      supabase,
      existing.project_id,
      existing.doc_type as DocumentType,
      content
    );

    return NextResponse.json({
      id: saved.id,
      version: saved.version,
      docType: saved.doc_type,
      content: saved.content,
    });
  } catch (error) {
    console.error('Document PUT error:', error);
    const message = error instanceof Error ? error.message : 'Failed to save document';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
