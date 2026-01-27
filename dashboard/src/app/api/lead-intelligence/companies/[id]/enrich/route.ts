// Lead Intelligence - Single Company Enrichment API
// POST /api/lead-intelligence/companies/:id/enrich

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';
import { mergeCompanyEnrichment } from '@/lib/api/lead-intelligence/enrichment-merge';
import type { Company } from '@/lib/api/lead-intelligence-companies-types';

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
        { error: 'Invalid company ID format', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();
    const { data: company, error: fetchError } = await (supabase.from('companies') as any)
      .select('*')
      .eq('id', id)
      .single();

    if (fetchError || !company) {
      return NextResponse.json(
        { error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.realtyamp.ai';
    let enrichedData: Record<string, unknown> | null = null;

    try {
      const webhookRes = await fetch(`${webhookBase}/webhook/enrich-company`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company.name,
          domain: company.website ? new URL(company.website).hostname : undefined,
          website: company.website,
        }),
      });

      if (webhookRes.ok) {
        enrichedData = await webhookRes.json();
      }
    } catch {
      // Webhook failure handled gracefully
    }

    if (!enrichedData || Object.keys(enrichedData).length === 0) {
      return NextResponse.json({
        success: false,
        error: 'No enrichment data found',
      });
    }

    const { updates, conflicts } = mergeCompanyEnrichment(company as Company, enrichedData);

    const dbUpdate: Record<string, unknown> = {
      ...updates,
      enrichment_data: {
        ...(company.enrichment_data ?? {}),
        ...enrichedData,
        conflicts: conflicts.length > 0 ? conflicts : undefined,
      },
      enriched_at: new Date().toISOString(),
      enrichment_source: (enrichedData.source as string) ?? 'n8n-webhook',
      updated_at: new Date().toISOString(),
    };

    const { error: updateError } = await (supabase.from('companies') as any)
      .update(dbUpdate)
      .eq('id', id);

    if (updateError) {
      console.error('Company enrichment update error:', updateError);
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
    console.error('Company enrichment error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
