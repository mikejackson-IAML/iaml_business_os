import { NextResponse } from 'next/server';
import { getGHLEngagement } from '@/lib/api/ghl-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const engagement = await getGHLEngagement(email);

  if (engagement === null) {
    return NextResponse.json({ configured: false, data: null });
  }

  return NextResponse.json({ configured: true, data: engagement });
}
