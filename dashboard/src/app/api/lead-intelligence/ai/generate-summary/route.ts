// Lead Intelligence - AI Generate Summary API
// POST /api/lead-intelligence/ai/generate-summary
// Generates or returns cached AI summary for a contact

import { NextRequest, NextResponse } from 'next/server';
import { getServerClient } from '@/lib/supabase/server';
import { generateContactSummary } from '@/lib/api/lead-intelligence-ai';
import type { AISummaryResponse } from '@/lib/api/lead-intelligence-ai-types';

const CACHE_MAX_AGE_DAYS = 30;

export async function POST(request: NextRequest) {
  try {
    let body: { contactId?: string; force?: boolean };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body' },
        { status: 400 }
      );
    }

    const { contactId, force = false } = body;
    if (!contactId || !isUUID(contactId)) {
      return NextResponse.json(
        { error: 'contactId is required and must be a valid UUID' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();

    // Fetch contact with cached summary
    const { data: contact, error: fetchError } = await (supabase.from('li_contacts') as any)
      .select('*, ai_summary, ai_summary_generated_at')
      .eq('id', contactId)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found' },
        { status: 404 }
      );
    }

    // Check cache
    if (!force && contact.ai_summary && contact.ai_summary_generated_at) {
      const generatedAt = new Date(contact.ai_summary_generated_at);
      const ageMs = Date.now() - generatedAt.getTime();
      const ageDays = ageMs / (1000 * 60 * 60 * 24);

      if (ageDays < CACHE_MAX_AGE_DAYS) {
        const response: AISummaryResponse = {
          summary: contact.ai_summary,
          generated_at: contact.ai_summary_generated_at,
          cached: true,
        };
        return NextResponse.json(response);
      }
    }

    // Fetch related data for context
    const [attendanceResult, activitiesResult, followUpsResult] = await Promise.all([
      (supabase.from('li_attendance_records') as any)
        .select('*')
        .eq('contact_id', contactId)
        .order('event_date', { ascending: false })
        .limit(20),
      (supabase.from('li_activities') as any)
        .select('*')
        .eq('contact_id', contactId)
        .order('activity_date', { ascending: false })
        .limit(20),
      (supabase.from('li_follow_ups') as any)
        .select('*')
        .eq('contact_id', contactId)
        .order('created_at', { ascending: false })
        .limit(10),
    ]);

    const contactData = {
      contact: {
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        title: contact.title,
        department: contact.department,
        seniority_level: contact.seniority_level,
        city: contact.city,
        state: contact.state,
        status: contact.status,
        classification: contact.classification,
        engagement_score: contact.engagement_score,
        is_vip: contact.is_vip,
        linkedin_headline: contact.linkedin_headline,
      },
      attendance_records: attendanceResult.data || [],
      activities: activitiesResult.data || [],
      follow_ups: followUpsResult.data || [],
    };

    // Generate summary
    const summary = await generateContactSummary(contactData);
    const now = new Date().toISOString();

    // Cache in database
    await (supabase.from('li_contacts') as any)
      .update({ ai_summary: summary as never, ai_summary_generated_at: now })
      .eq('id', contactId);

    const response: AISummaryResponse = {
      summary,
      generated_at: now,
      cached: false,
    };
    return NextResponse.json(response);
  } catch (error) {
    console.error('Generate summary API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

function isUUID(value: string): boolean {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(value);
}
