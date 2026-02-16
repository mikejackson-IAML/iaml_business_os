// LinkedIn Content Engine - Engagement Digest API
// GET /api/linkedin-content/engagement
// Returns today's digest items for client-side refresh

import { NextResponse } from 'next/server';
import { getTodayDigest } from '@/lib/api/linkedin-content-queries';

export async function GET() {
  try {
    const digest = await getTodayDigest();
    return NextResponse.json(digest);
  } catch (error) {
    console.error('Engagement digest API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
