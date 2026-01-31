import { NextResponse } from 'next/server';
import { getSmartLeadEngagement } from '@/lib/api/smartlead-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const engagement = await getSmartLeadEngagement(email);

  if (engagement === null) {
    return NextResponse.json({ configured: false, data: null });
  }

  return NextResponse.json({ configured: true, data: engagement });
}
