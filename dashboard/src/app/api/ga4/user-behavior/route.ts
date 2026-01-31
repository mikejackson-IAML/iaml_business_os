import { NextResponse } from 'next/server';
import { getGA4Behavior } from '@/lib/api/ga4-queries';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Email required' }, { status: 400 });
  }

  const behavior = await getGA4Behavior(email);

  if (behavior === null) {
    return NextResponse.json({ configured: false, data: null });
  }

  return NextResponse.json({ configured: true, data: behavior });
}
