// Lead Intelligence - Single Contact Enrichment API
// POST /api/lead-intelligence/contacts/:id/enrich

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';
import { mergeContactEnrichment } from '@/lib/api/lead-intelligence/enrichment-merge';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface RouteContext {
  params: Promise<{ id: string }>;
}

const UUID_REGEX = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;

    if (!UUID_REGEX.test(id)) {
      return NextResponse.json(
        { error: 'Invalid contact ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Fetch contact
    const supabase = getServerClient();
    const { data: contact, error: fetchError } = await (supabase.from('contacts') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Call n8n enrichment webhook
    const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.realtyamp.ai';
    let enrichedData: Record<string, unknown> | null = null;

    try {
      const webhookRes = await fetch(`${webhookBase}/webhook/enrich-contact`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: contact.email,
          linkedin_url: contact.linkedin_url,
          name: [contact.first_name, contact.last_name].filter(Boolean).join(' '),
        }),
      });

      if (webhookRes.ok) {
        enrichedData = await webhookRes.json();
      }
    } catch {
      // Webhook failure is expected — return gracefully
    }

    if (!enrichedData || Object.keys(enrichedData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No enrichment data found',
      });
    }

    // Merge using fill-blanks-only strategy
    const { updates, conflicts } = mergeContactEnrichment(contact as Contact, enrichedData);

    // Build DB update
    const dbUpdate: Record<string, unknown> = {
      ...updates,
      enrichment_data: {
        ...(contact.enrichment_data ?? {}),
        ...enrichedData,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
      enriched_at: new Date().toISOString(),
      enrichment_source: (enrichedData.source as string) ?? 'n8n-webhook',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await (supabase.from('contacts') as any)
      .update(dbUpdate)
      .eq('id', id);

    if (updateError) {
      console.error('Enrichment update error:', updateError);
      return NextResponse.json(
        { error: 'Failed to save enrichment data', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      updates_applied: Object.keys(updates).length,
      conflicts: conflicts.length,
      enriched_fields: Object.keys(updates),
    });
  } catch (error) {
    console.error('Contact enrichment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
