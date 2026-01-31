import { NextResponse } from 'next/server';
import { getCompanyRegistrationHistory } from '@/lib/api/programs-queries';

/**
 * GET /api/programs/company-history?company=ACME%20Corp
 *
 * Fetches registration history for all registrants from a specific company
 * Used by Contact Panel to show colleague history
 */
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const company = searchParams.get('company');

  if (!company) {
    return NextResponse.json({ history: [] });
  }

  try {
    const history = await getCompanyRegistrationHistory(company);
    return NextResponse.json({ history });
  } catch (error) {
    console.error('Error fetching company history:', error);
    return NextResponse.json(
      { error: 'Failed to fetch company history', history: [] },
      { status: 500 }
    );
  }
}
