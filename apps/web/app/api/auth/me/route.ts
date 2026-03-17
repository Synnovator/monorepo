import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { getRoles } from '@/app/_generated/data';

export async function GET(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET!;
  const session = await getSession(request, authSecret);

  if (!session) {
    return NextResponse.json({ authenticated: false });
  }

  const isGitHub = session.access_token !== 'dev-token';

  // Determine global role from config/roles.yml
  let role: 'admin' | 'designer' | 'user' = 'user';
  if (!isGitHub) {
    // Dev-token users are always admin
    role = 'admin';
  } else {
    const roles = getRoles();
    const login = session.login.toLowerCase();
    if (roles.admin.some(a => a.toLowerCase() === login)) {
      role = 'admin';
    } else if (roles.designer.some(d => d.toLowerCase() === login)) {
      role = 'designer';
    }
  }

  return NextResponse.json({
    authenticated: true,
    login: session.login,
    avatar_url: session.avatar_url,
    isGitHub,
    role,
  });
}
