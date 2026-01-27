// Lead Intelligence - SmartLead Campaigns API
// GET /api/lead-intelligence/campaigns - List active SmartLead campaigns

import { NextResponse } from 'next/server';

interface SmartLeadCampaign {
  id: number;
  name: string;
  status: string;
  created_at: string;
}

export async function GET() {
  try {
    const apiKey = process.env.SMARTLEAD_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'SmartLead API key not configured', code: 'CONFIG_ERROR' },
        { status: 500 }
      );
    }

    const response = await fetch(
      `https://server.smartlead.ai/api/v1/campaigns?api_key=${apiKey}`,
      { next: { revalidate: 60 } }
    );

    if (!response.ok) {
      return NextResponse.json(
        { error: 'Failed to fetch campaigns from SmartLead', code: 'EXTERNAL_API_ERROR' },
        { status: 502 }
      );
    }

    const campaigns: SmartLeadCampaign[] = await response.json();

    const activeCampaigns = campaigns
      .filter((c) => c.status === 'STARTED')
      .map((c) => ({
        id: c.id,
        name: c.name,
        status: c.status,
        created_at: c.created_at,
      }));

    return NextResponse.json(activeCampaigns);
  } catch (error) {
    console.error('Error fetching SmartLead campaigns:', error);
    return NextResponse.json(
      { error: 'Failed to fetch campaigns', code: 'EXTERNAL_API_ERROR' },
      { status: 502 }
    );
  }
}
