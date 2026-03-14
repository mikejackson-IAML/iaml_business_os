import { NextRequest, NextResponse } from 'next/server';

const PORTAL_PIN = process.env.PORTAL_PIN || '0000';
const COOKIE_NAME = 'portal_auth';
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30; // 30 days

export async function POST(request: NextRequest) {
  const { pin } = await request.json();

  if (pin === PORTAL_PIN) {
    const response = NextResponse.json({ success: true });
    response.cookies.set(COOKIE_NAME, 'authenticated', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      maxAge: COOKIE_MAX_AGE,
      path: '/portal',
    });
    return response;
  }

  return NextResponse.json({ success: false, error: 'Invalid PIN' }, { status: 401 });
}

export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete(COOKIE_NAME);
  return response;
}
