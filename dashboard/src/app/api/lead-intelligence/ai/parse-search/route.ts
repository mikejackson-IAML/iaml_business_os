// Lead Intelligence - AI Parse Search API
// POST /api/lead-intelligence/ai/parse-search
// Converts natural language queries into structured ContactListParams filters

import { NextRequest, NextResponse } from 'next/server';
import { parseSearchQuery } from '@/lib/api/lead-intelligence-ai';
import { getServerClient } from '@/lib/supabase/server';

export async function POST(request: NextRequest) {
  try {
    let body: { query?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { query } = body;
    if (!query || typeof query !== 'string' || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query is required and must be a non-empty string' },
        { status: 400 }
      );
    }

    if (query.length > 500) {
      return NextResponse.json(
        { error: 'Query must be 500 characters or fewer' },
        { status: 400 }
      );
    }

    // Parse with 5-second timeout
    const timeoutPromise = new Promise<never>((_, reject) =>
      setTimeout(() => reject(new Error('timeout')), 5000)
    );

    let result;
    try {
      result = await Promise.race([
        parseSearchQuery(query.trim()),
        timeoutPromise,
      ]);
    } catch (err) {
      if (err instanceof Error && err.message === 'timeout') {
        return NextResponse.json({
          error: 'Search took too long',
          suggestion: 'Try a simpler query',
        });
      }
      throw err;
    }

    // If AI couldn't parse, return error (still 200 — valid request)
    if (result.error) {
      return NextResponse.json({
        error: result.error,
        suggestion: result.suggestion,
      });
    }

    // Resolve program name to program_id if present
    const filters = { ...result.filters };
    if (filters.program_id && !isUUID(filters.program_id)) {
      const supabase = getServerClient();
      const programName = filters.program_id;
      const { data: programs } = await (supabase.from('li_programs') as any)
        .select('id')
        .ilike('name', `%${programName}%`)
        .limit(1);

      if (programs && programs.length > 0) {
        filters.program_id = programs[0].id;
      } else {
        // No matching program found — remove the filter
        delete filters.program_id;
      }
    }

    return NextResponse.json({ filters });
  } catch (error) {
    console.error('Parse search API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
