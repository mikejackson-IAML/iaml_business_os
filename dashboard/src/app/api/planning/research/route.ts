// Planning Studio Research API Route
// POST: Trigger Perplexity research and persist results
// GET: Fetch research records by id, projectId, or conversationId

import { NextRequest, NextResponse } from 'next/server';
import { createServerClient } from '@/lib/supabase/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

// Soft limits
const SESSION_LIMIT = 10;
const PROJECT_LIMIT = 50;

interface ResearchRequestBody {
  projectId: string;
  conversationId: string;
  phaseId: string;
  query: string;
  researchType?: string;
}

// =============================================================================
// POST - Trigger research
// =============================================================================

export async function POST(request: NextRequest) {
  let body: ResearchRequestBody;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { projectId, conversationId, phaseId, query, researchType } = body;

  if (!projectId || !conversationId || !phaseId || !query) {
    return NextResponse.json(
      { error: 'projectId, conversationId, phaseId, and query are required' },
      { status: 400 }
    );
  }

  const supabase = createServerClient();

  // Check soft limits
  const { count: sessionCount } = await supabase
    .schema('planning_studio')
    .from('research')
    .select('*', { count: 'exact', head: true })
    .eq('conversation_id', conversationId);

  if (sessionCount !== null && sessionCount >= SESSION_LIMIT) {
    return NextResponse.json(
      { error: `Session research limit reached (${SESSION_LIMIT}). Start a new conversation to continue researching.` },
      { status: 429 }
    );
  }

  const { count: projectCount } = await supabase
    .schema('planning_studio')
    .from('research')
    .select('*', { count: 'exact', head: true })
    .eq('project_id', projectId);

  if (projectCount !== null && projectCount >= PROJECT_LIMIT) {
    return NextResponse.json(
      { error: `Project research limit reached (${PROJECT_LIMIT}). Archive unused research to free capacity.` },
      { status: 429 }
    );
  }

  // Create research record as pending
  const { data: record, error: insertError } = await supabase
    .schema('planning_studio')
    .from('research')
    .insert({
      project_id: projectId,
      conversation_id: conversationId,
      phase_id: phaseId,
      research_type: researchType || 'custom',
      query,
      status: 'pending',
    })
    .select()
    .single();

  if (insertError || !record) {
    console.error('Research insert error:', insertError);
    return NextResponse.json({ error: 'Failed to create research record' }, { status: 500 });
  }

  // Update to running
  await supabase
    .schema('planning_studio')
    .from('research')
    .update({ status: 'running' })
    .eq('id', record.id);

  // Call Perplexity API
  try {
    const perplexityKey = process.env.PERPLEXITY_API_KEY;
    if (!perplexityKey) {
      throw new Error('PERPLEXITY_API_KEY not configured');
    }

    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${perplexityKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'sonar-pro',
        messages: [
          {
            role: 'system',
            content: 'You are a research assistant. Provide comprehensive, well-structured research findings with specific data points, sources, and actionable insights. Focus on accuracy and recency of information.',
          },
          {
            role: 'user',
            content: query,
          },
        ],
        return_citations: true,
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Perplexity API error ${response.status}: ${errorText}`);
    }

    const result = await response.json();
    const summary = result.choices?.[0]?.message?.content || '';
    const citations = result.citations || [];

    // Update record with results
    const { data: updated, error: updateError } = await supabase
      .schema('planning_studio')
      .from('research')
      .update({
        status: 'complete',
        raw_results: result,
        summary,
        key_findings: { citations, model: result.model },
        completed_at: new Date().toISOString(),
      })
      .eq('id', record.id)
      .select()
      .single();

    if (updateError) {
      console.error('Research update error:', updateError);
      return NextResponse.json({ error: 'Failed to update research record' }, { status: 500 });
    }

    return NextResponse.json(updated);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('Perplexity API error:', errorMessage);

    // Update record as failed
    const { data: failed } = await supabase
      .schema('planning_studio')
      .from('research')
      .update({
        status: 'failed',
        raw_results: { error: errorMessage },
      })
      .eq('id', record.id)
      .select()
      .single();

    return NextResponse.json(failed || { error: errorMessage }, { status: 502 });
  }
}

// =============================================================================
// GET - Fetch research records
// =============================================================================

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');
  const projectId = searchParams.get('projectId');
  const conversationId = searchParams.get('conversationId');

  const supabase = createServerClient();

  if (id) {
    const { data, error } = await supabase
      .schema('planning_studio')
      .from('research')
      .select('*')
      .eq('id', id)
      .single();

    if (error || !data) {
      return NextResponse.json({ error: 'Research not found' }, { status: 404 });
    }
    return NextResponse.json(data);
  }

  if (conversationId) {
    const { data, error } = await supabase
      .schema('planning_studio')
      .from('research')
      .select('*')
      .eq('conversation_id', conversationId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch research' }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  if (projectId) {
    const { data, error } = await supabase
      .schema('planning_studio')
      .from('research')
      .select('*')
      .eq('project_id', projectId)
      .order('created_at', { ascending: false });

    if (error) {
      return NextResponse.json({ error: 'Failed to fetch research' }, { status: 500 });
    }
    return NextResponse.json(data);
  }

  return NextResponse.json({ error: 'Provide id, projectId, or conversationId query parameter' }, { status: 400 });
}
