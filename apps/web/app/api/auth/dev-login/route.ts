import { NextRequest, NextResponse } from 'next/server';
import { encrypt, setSessionCookie } from '@synnovator/shared/auth';

const DEV_USERS: Record<string, { login: string; avatar_url: string }> = {
  admin: {
    login: 'allenwoods',
    avatar_url: 'https://avatars.githubusercontent.com/u/0?v=4',
  },
};

export async function POST(request: NextRequest) {
  const { username, password } = (await request.json()) as {
    username?: string;
    password?: string;
  };

  if (!username || !password) {
    return NextResponse.json({ error: 'Missing credentials' }, { status: 400 });
  }

  const expectedPassword = process.env.DEV_ADMIN_PASSWORD;
  if (!expectedPassword) {
    return NextResponse.json({ error: 'Dev login not configured' }, { status: 503 });
  }

  const user = DEV_USERS[username];
  if (!user || password !== expectedPassword) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 });
  }

  const authSecret = process.env.AUTH_SECRET!;

  const token = await encrypt(
    {
      login: user.login,
      avatar_url: user.avatar_url,
      access_token: 'dev-token',
    },
    authSecret,
  );

  const isSecure = request.nextUrl.protocol === 'https:';
  const headers = new Headers();
  setSessionCookie(headers, token, isSecure);

  return new NextResponse(JSON.stringify({ success: true, login: user.login }), {
    status: 200,
    headers,
  });
}
