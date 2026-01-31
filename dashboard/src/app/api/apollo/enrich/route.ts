import { NextRequest, NextResponse } from 'next/server';
import {
  enrichContactWithApollo,
  saveEnrichmentResults,
  isRecentlyEnriched,
} from '@/lib/api/apollo-enrichment';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email, firstName, lastName, domain, force = false } = body;

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      );
    }

    // Check if recently enriched (unless force=true)
    if (!force) {
      const recentlyEnriched = await isRecentlyEnriched(email);
      if (recentlyEnriched) {
        return NextResponse.json({
          success: true,
          skipped: true,
          message: 'Contact was enriched within the last 24 hours',
        });
      }
    }

    // Call Apollo API
    const result = await enrichContactWithApollo(email, firstName, lastName, domain);

    if (!result.success) {
      // Don't return 500 for "no match found" - that's a valid result
      if (result.error === 'No match found') {
        return NextResponse.json({
          success: true,
          matched: false,
          message: 'No Apollo match found for this email',
        });
      }

      return NextResponse.json(
        { error: result.error },
        { status: result.error?.includes('Rate limit') ? 429 : 500 }
      );
    }

    // Save results to database
    const { contactId, companyId } = await saveEnrichmentResults(email, result);

    return NextResponse.json({
      success: true,
      matched: !!result.person,
      contactId,
      companyId,
      person: result.person ? {
        name: result.person.name,
        title: result.person.title,
        linkedin_url: result.person.linkedin_url,
        photo_url: result.person.photo_url,
        email_status: result.person.email_status,
      } : null,
      organization: result.organization ? {
        name: result.organization.name,
        industry: result.organization.industry,
        employee_count: result.organization.estimated_num_employees,
      } : null,
    });
  } catch (error) {
    console.error('Enrichment API error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
