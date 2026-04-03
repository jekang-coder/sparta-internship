import { NextRequest, NextResponse } from 'next/server';
import { parseSession } from '@/lib/session';

export async function GET(request: NextRequest) {
  const sessionCookie = request.cookies.get('user_session');
  const session = parseSession(sessionCookie?.value);

  if (!session) {
    return NextResponse.json({ data: null, error: null });
  }

  return NextResponse.json({ data: session, error: null });
}
