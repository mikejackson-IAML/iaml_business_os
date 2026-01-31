// SmartLead API integration for cold email engagement data
// PROG-67: SmartLead API integration

const SMARTLEAD_API = 'https://server.smartlead.ai/api/v1';

export interface SmartLeadEngagement {
  openCount: number;
  clickCount: number;
  replyCount: number;
  bounced: boolean;
  lastOpenedAt: string | null;
  campaigns: Array<{
    id: string;
    name: string;
    status: string;
  }>;
}

export async function getSmartLeadEngagement(email: string): Promise<SmartLeadEngagement | null> {
  const apiKey = process.env.SMARTLEAD_API_KEY;

  if (!apiKey) {
    return null; // Not configured
  }

  try {
    const response = await fetch(
      `${SMARTLEAD_API}/leads/by-email?email=${encodeURIComponent(email)}&api_key=${apiKey}`,
      { next: { revalidate: 300 } } // Cache for 5 minutes
    );

    if (!response.ok) {
      console.error('SmartLead API error:', response.status);
      return null;
    }

    const data = await response.json();

    return {
      openCount: data.open_count || 0,
      clickCount: data.click_count || 0,
      replyCount: data.reply_count || 0,
      bounced: data.is_bounced || false,
      lastOpenedAt: data.open_time || null,
      campaigns: data.campaigns || [],
    };
  } catch (error) {
    console.error('SmartLead fetch error:', error);
    return null;
  }
}
