// GoHighLevel API integration for warm email engagement data
// PROG-68: GHL API integration
// Note: Using API v2 (v1 is EOL as of Jan 2026)

const GHL_API = 'https://services.leadconnectorhq.com';

export interface GHLEngagement {
  emailsSent: number;
  emailsOpened: number;
  emailsClicked: number;
  lastActivityAt: string | null;
  conversations: Array<{
    id: string;
    type: string;
    lastMessageDate: string;
  }>;
}

export async function getGHLEngagement(email: string): Promise<GHLEngagement | null> {
  const accessToken = process.env.GHL_ACCESS_TOKEN;
  const locationId = process.env.GHL_LOCATION_ID;

  if (!accessToken || !locationId) {
    return null; // Not configured
  }

  try {
    // First, find contact by email
    const searchResponse = await fetch(
      `${GHL_API}/contacts/search/duplicate?email=${encodeURIComponent(email)}&locationId=${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
        },
      }
    );

    if (!searchResponse.ok) {
      console.error('GHL contact search error:', searchResponse.status);
      return null;
    }

    const searchData = await searchResponse.json();
    const contact = searchData.contact;

    if (!contact) {
      return { emailsSent: 0, emailsOpened: 0, emailsClicked: 0, lastActivityAt: null, conversations: [] };
    }

    // Get conversations for this contact
    const convResponse = await fetch(
      `${GHL_API}/conversations/search?contactId=${contact.id}&locationId=${locationId}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Version': '2021-07-28',
        },
      }
    );

    const convData = await convResponse.json();

    return {
      emailsSent: contact.emailSent || 0,
      emailsOpened: contact.emailOpened || 0,
      emailsClicked: contact.emailClicked || 0,
      lastActivityAt: contact.lastActivity || null,
      conversations: (convData.conversations || []).slice(0, 10).map((c: Record<string, unknown>) => ({
        id: c.id as string,
        type: c.type as string,
        lastMessageDate: c.lastMessageDate as string,
      })),
    };
  } catch (error) {
    console.error('GHL fetch error:', error);
    return null;
  }
}
