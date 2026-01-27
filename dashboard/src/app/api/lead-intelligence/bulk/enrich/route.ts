// Lead Intelligence - Bulk Contact Enrichment API
// POST /api/lead-intelligence/bulk/enrich

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';
import { mergeContactEnrichment } from '@/lib/api/lead-intelligence/enrichment-merge';
import type { Contact } from '@/lib/api/lead-intelligence-contacts-types';

interface BulkEnrichResult {
  contactId: string;
  updates_applied: number;
  conflicts: number;
  error?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const body = await request.json();
    const { contactIds } = body as { contactIds: string[] };

    if (!Array.isArray(contactIds) || contactIds.length === 0) {
      return NextResponse.json(
        { error: 'contactIds must be a non-empty array', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (contactIds.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 contacts per bulk enrichment', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();
    const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.realtyamp.ai';
    const results: BulkEnrichResult[] = [];

    for (let i = 0; i < contactIds.length; i++) {
      const contactId = contactIds[i];

      // Rate limit: 1s delay between calls (skip first)
      if (i > 0) {
        await sleep(1000);
      }

      try {
        // Fetch contact
        const { data: contact, error: fetchError } = await (supabase.from('contacts') as any)
          .select('*')
          .eq('id', contactId)
          .single();

        if (fetchError || !contact) {
          results.push({ contactId, updates_applied: 0, conflicts: 0, error: 'Contact not found' });
          continue;
        }

        // Call webhook
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
          // Webhook failure
        }

        if (!enrichedData || Object.keys(enrichedData).length === 0) {
          results.push({ contactId, updates_applied: 0, conflicts: 0, error: 'No enrichment data found' });
          continue;
        }

        const { updates, conflicts } = mergeContactEnrichment(contact as Contact, enrichedData);

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
          .eq('id', contactId);

        if (updateError) {
          results.push({ contactId, updates_applied: 0, conflicts: 0, error: 'Failed to save' });
          continue;
        }

        results.push({
          contactId,
          updates_applied: Object.keys(updates).length,
          conflicts: conflicts.length,
        });
      } catch {
        results.push({ contactId, updates_applied: 0, conflicts: 0, error: 'Processing error' });
      }
    }

    return NextResponse.json({
      success: true,
      results,
    });
  } catch (error) {
    console.error('Bulk enrichment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
