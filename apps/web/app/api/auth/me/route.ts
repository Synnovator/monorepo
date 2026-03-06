import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
  const session = await getSession(request, authSecret);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  return NextResponse.json({
    authenticated: true,
    login: session.login,
    avatar_url: session.avatar_url,
  });
}
