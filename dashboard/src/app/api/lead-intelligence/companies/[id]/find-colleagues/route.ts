// Lead Intelligence - Find Colleagues API
// POST /api/lead-intelligence/companies/:id/find-colleagues
// Triggers n8n webhook to discover people at a company

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';

interface RouteContext {
  params: Promise<{ id: string }>;
}

interface N8nColleague {
  name: string;
  title?: string;
  linkedin_url?: string;
  email?: string;
}

interface ColleagueResult {
  name: string;
  title: string | null;
  linkedin_url: string | null;
  email: string | null;
  existsInCrm: boolean;
  contactId?: string;
}

export async function POST(request: NextRequest, context: RouteContext) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await context.params;
    const supabase = getServerClient();

    // Fetch company
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const { data: company, error: companyError } = await (supabase.from('companies') as any)
      .select('id, company_name, domain')
      .eq('id', id)
      .single();

    if (companyError || !company) {
      return NextResponse.json(
        { error: 'Company not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    // Call n8n webhook
    const webhookBase = process.env.N8N_WEBHOOK_BASE_URL || 'https://n8n.realtyamp.ai';
    let n8nResults: N8nColleague[];

    try {
      const n8nRes = await fetch(`${webhookBase}/webhook/find-colleagues`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          company_name: company.company_name,
          company_domain: company.domain,
        }),
      });

      if (!n8nRes.ok) {
        return NextResponse.json(
          { error: 'Upstream service error', code: 'UPSTREAM_ERROR' },
          { status: 502 }
        );
      }

      n8nResults = await n8nRes.json();
    } catch {
      return NextResponse.json(
        { error: 'Failed to reach workflow service', code: 'UPSTREAM_ERROR' },
        { status: 502 }
      );
    }

    if (!Array.isArray(n8nResults)) {
      n8nResults = [];
    }

    // Cross-reference with existing contacts
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const contactsTable = supabase.from('contacts') as any;

    // Get contacts at this company
    const { data: existingByCompany } = await contactsTable
      .select('id, email, linkedin_url')
      .eq('company_id', id);

    // Also check by email for any that might be under different company
    const emails = n8nResults
      .map((r) => r.email)
      .filter((e): e is string => !!e && e.length > 0);

    let existingByEmail: Array<{ id: string; email: string; linkedin_url: string | null }> = [];
    if (emails.length > 0) {
      const { data } = await contactsTable
        .select('id, email, linkedin_url')
        .in('email', emails);
      existingByEmail = data ?? [];
    }

    // Build lookup sets
    const existingEmails = new Map<string, string>();
    const existingLinkedins = new Map<string, string>();

    for (const c of [...(existingByCompany ?? []), ...existingByEmail]) {
      if (c.email) existingEmails.set(c.email.toLowerCase(), c.id);
      if (c.linkedin_url) existingLinkedins.set(c.linkedin_url.toLowerCase(), c.id);
    }

    // Map results with CRM existence check
    const results: ColleagueResult[] = n8nResults.map((person) => {
      let existsInCrm = false;
      let contactId: string | undefined;

      if (person.email && existingEmails.has(person.email.toLowerCase())) {
        existsInCrm = true;
        contactId = existingEmails.get(person.email.toLowerCase());
      } else if (person.linkedin_url && existingLinkedins.has(person.linkedin_url.toLowerCase())) {
        existsInCrm = true;
        contactId = existingLinkedins.get(person.linkedin_url.toLowerCase());
      }

      return {
        name: person.name,
        title: person.title ?? null,
        linkedin_url: person.linkedin_url ?? null,
        email: person.email ?? null,
        existsInCrm,
        contactId,
      };
    });

    return NextResponse.json({ results });
  } catch (error) {
    console.error('Find colleagues API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
