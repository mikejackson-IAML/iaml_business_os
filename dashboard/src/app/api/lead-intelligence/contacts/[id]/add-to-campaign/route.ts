// Lead Intelligence - Add Single Contact to Campaign
// POST /api/lead-intelligence/contacts/[id]/add-to-campaign

import { NextRequest, NextResponse } from 'next/server';
import { validateApiKey } from '@/lib/api/task-auth';
import { getServerClient } from '@/lib/supabase/server';

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const authError = validateApiKey(request);
  if (authError) return authError;

  try {
    const { id } = await params;
    const body = await request.json();
    const { campaignId } = body as { campaignId: number };

    if (!campaignId) {
      return NextResponse.json(
        { error: 'campaignId is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const supabase = getServerClient();
    const { data: contact, error: dbError } = await (supabase.from('contacts') as any)
      .select('email, first_name, last_name, company')
      .eq('id', id)
      .single();

    if (dbError || !contact) {
      return NextResponse.json(
        { error: 'Contact not found', code: 'NOT_FOUND' },
        { status: 404 }
      );
    }

    if (!contact.email) {
      return NextResponse.json(
        { error: 'Contact has no email address', code: 'VALIDATION_ERROR' },
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

    const slResponse = await fetch(
      `https://server.smartlead.ai/api/v1/campaigns/${campaignId}/leads?api_key=${apiKey}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          lead_list: [
            {
              email: contact.email,
              first_name: contact.first_name || '',
              last_name: contact.last_name || '',
              company_name: contact.company || '',
            },
          ],
        }),
      }
    );

    if (!slResponse.ok) {
      const errorText = await slResponse.text();
      console.error('SmartLead add lead error:', errorText);
      return NextResponse.json(
        { error: 'Failed to add contact to campaign', code: 'EXTERNAL_API_ERROR' },
        { status: 502 }
      );
    }

    return NextResponse.json({ success: true, added: 1 });
  } catch (error) {
    console.error('Error adding contact to campaign:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
