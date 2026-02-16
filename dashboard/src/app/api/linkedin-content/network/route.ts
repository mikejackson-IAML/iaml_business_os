// LinkedIn Content Engine - Engagement Network API
// GET /api/linkedin-content/network - Returns all contacts
// POST /api/linkedin-content/network - Creates a new contact

import { NextRequest, NextResponse } from 'next/server';
import { getEngagementNetworkFull } from '@/lib/api/linkedin-content-queries';
import { createNetworkContact } from '@/lib/api/linkedin-content-mutations';

export async function GET() {
  try {
    const network = await getEngagementNetworkFull();
    return NextResponse.json(network);
  } catch (error) {
    console.error('Network GET API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}

const LINKEDIN_URL_REGEX = /^https:\/\/(www\.)?linkedin\.com\/in\//;
const VALID_TIERS = ['tier_1', 'tier_2'] as const;
const VALID_CATEGORIES = ['hr_leader', 'employment_attorney', 'ai_policy', 'hr_tech', 'journalist', 'other'] as const;

export async function POST(request: NextRequest) {
  try {
    let body: Record<string, unknown>;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON body', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const { linkedin_name, linkedin_url, linkedin_headline, follower_count, tier, category, notes } = body;

    // Validate required fields
    if (!linkedin_name || typeof linkedin_name !== 'string' || linkedin_name.trim().length === 0) {
      return NextResponse.json(
        { error: 'linkedin_name is required', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!linkedin_url || typeof linkedin_url !== 'string' || !LINKEDIN_URL_REGEX.test(linkedin_url)) {
      return NextResponse.json(
        { error: 'linkedin_url is required and must be a valid LinkedIn profile URL (https://www.linkedin.com/in/...)', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!tier || !VALID_TIERS.includes(tier as (typeof VALID_TIERS)[number])) {
      return NextResponse.json(
        { error: 'tier is required and must be: tier_1 or tier_2', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    if (!category || !VALID_CATEGORIES.includes(category as (typeof VALID_CATEGORIES)[number])) {
      return NextResponse.json(
        { error: 'category is required and must be one of: hr_leader, employment_attorney, ai_policy, hr_tech, journalist, other', code: 'VALIDATION_ERROR' },
        { status: 400 }
      );
    }

    const contact = await createNetworkContact({
      linkedin_name: (linkedin_name as string).trim(),
      linkedin_url: (linkedin_url as string).trim(),
      linkedin_headline: linkedin_headline ? String(linkedin_headline).trim() : undefined,
      follower_count: follower_count ? Number(follower_count) : undefined,
      tier: tier as 'tier_1' | 'tier_2',
      category: category as string,
      notes: notes ? String(notes).trim() : undefined,
    });

    return NextResponse.json(contact, { status: 201 });
  } catch (error) {
    console.error('Network POST API error:', error);
    return NextResponse.json(
      { error: 'Internal server error', code: 'INTERNAL_ERROR' },
      { status: 500 }
    );
  }
}
