// Lead Intelligence - Bulk Add Contacts to Campaign
// POST /api/lead-intelligence/bulk/add-to-campaign

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';

interface BulkAddBody {
  contactIds: string[];
  campaignId: number;
  confirmed?: boolean;
}

interface SmartLeadLead {
  email: string;
  first_name?: string;
  last_name?: string;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export async function POST(request: NextRequest) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const body: BulkAddBody = await request.json();
    const { contactIds, campaignId, confirmed } = body;

    if (!contactIds?.length || !campaignId) {
      return NextResponse.json(
        { error: 'contactIds and campaignId are required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const apiKey = process.env.SMARTLEAD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SmartLead API key not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    // Fetch contacts from Supabase
    const supabase = getServerClient();
    const { data: contacts, error: dbError } = await (supabase.from('contacts') as any)
      .select('id, email, first_name, last_name, company')
      .in('id', contactIds);

    if (dbError) {
      return NextResponse.json(
        { error: 'Failed to fetch contacts', code: 'DB_ERROR' },
        { status: 500 }
      );
    }

    const contactsWithEmail = (contacts || []).filter(
      (c: { email?: string }) => c.email
    );

    if (contactsWithEmail.length === 0) {
      return NextResponse.json(
        { error: 'No contacts with email addresses found', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    // Check for duplicates if not already confirmed
    if (!confirmed) {
      try {
        const leadsRes = await fetch(
          `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${apiKey}&limit=1000`,
        );

        if (leadsRes.ok) {
          const existingLeads: SmartLeadLead[] = await leadsRes.json();
          const existingEmails = new Set(
            (Array.isArray(existingLeads) ? existingLeads : []).map(
              (l) => l.email?.toLowerCase()
            )
          );

          const duplicates = contactsWithEmail.filter(
            (c: { email: string }) => existingEmails.has(c.email.toLowerCase())
          );

          if (duplicates.length > 0) {
            const newContacts = contactsWithEmail.filter(
              (c: { email: string }) => !existingEmails.has(c.email.toLowerCase())
            );

            return NextResponse.json({
              action: 'confirm_needed',
              duplicates: duplicates.map((d: { email: string; first_name?: string; last_name?: string }) => ({
                email: d.email,
                name: [d.first_name, d.last_name].filter(Boolean).join(' '),
              })),
              newCount: newContacts.length,
              duplicateCount: duplicates.length,
            });
          }
        }
      } catch {
        // If duplicate check fails, proceed anyway
        console.warn('Could not check for duplicates, proceeding with add');
      }
    }

    // Add leads in batches of 10
    let added = 0;
    const batches = [];
    for (let i = 0; i < contactsWithEmail.length; i += 10) {
      batches.push(contactsWithEmail.slice(i, i + 10));
    }

    for (let i = 0; i < batches.length; i++) {
      const batch = batches[i];
      const leadList = batch.map(
        (c: { email: string; first_name?: string; last_name?: string; company?: string }) => ({
          email: c.email,
          first_name: c.first_name || '',
          last_name: c.last_name || '',
          company_name: c.company || '',
        })
      );

      const slResponse = await fetch(
        `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${apiKey}`,
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ lead_list: leadList }),
        }
      );

      if (slResponse.ok) {
        added += batch.length;
      } else {
        console.error('SmartLead batch add error:', await slResponse.text());
      }

      // Delay between batches (except last)
      if (i < batches.length - 1) {
        await sleep(500);
      }
    }

    const skipped = contactsWithEmail.length - added;
    return NextResponse.json({ success: true, added, skipped });
  } catch (error) {
    console.error('Error bulk adding contacts to campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
