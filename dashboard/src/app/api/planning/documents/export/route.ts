// Planning Studio Document Export API Route
// POST endpoint returning all latest-version documents for a project

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';

interface ExportRequestBody {
  projectId: string;
}

export async function POST(request: NextRequest) {
  let body: ExportRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId } = body;

  if (!projectId) {
    return NextResponse.json(
      { error: 'projectId is required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  try {
    // Fetch all documents for this project
    const { data: allDocs, error: docsError } = await supabase
      .schema('planning_studio')
      .from('documents')
      .select('id, doc_type, content, version, file_path, created_at')
      .eq('project_id', projectId)
      .order('version', { ascending: false });

    if (docsError) {
      console.error('Error fetching documents for export:', docsError);
      return NextResponse.json(
        { error: 'Failed to fetch documents' },
        { status: 500 }
      );
    }

    // Keep only the latest version per doc_type
    const latestByType = new Map<string, typeof allDocs[number]>();
    for (const doc of allDocs || []) {
      if (!latestByType.has(doc.doc_type)) {
        latestByType.set(doc.doc_type, doc);
      }
    }

    // Fetch project name for ZIP filename
    const { data: project, error: projectError } = await supabase
      .schema('planning_studio')
      .from('projects')
      .select('title')
      .eq('id', projectId)
      .single();

    if (projectError) {
      console.error('Error fetching project:', projectError);
      return NextResponse.json(
        { error: 'Failed to fetch project' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      documents: Array.from(latestByType.values()),
      projectName: project.title,
    });
  } catch (error) {
    console.error('Document export error:', error);
    const message = error instanceof Error ? error.message : 'Failed to export documents';
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
