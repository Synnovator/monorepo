import { NextRequest, NextResponse } from 'next/server';
import { encrypt, setSessionCookie } from '@synnovator/shared/auth';

export async function GET(request: NextRequest) {
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnTo = url.searchParams.get('state') || '/';

  if (!code) {
    return new NextResponse('Missing code parameter', { status: 400 });
  }

  const clientId = process.env.GITHUB_CLIENT_ID!;
  const clientSecret = process.env.GITHUB_CLIENT_SECRET!;
  const authSecret = process.env.AUTH_SECRET!;
  const siteUrl = process.env.SITE_URL || 'https://home.synnovator.space';

  const tokenRes = await fetch('https://github.com/login/oauth/access_token', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      client_id: clientId,
      client_secret: clientSecret,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    const loginUrl = `${siteUrl}/api/auth/login?returnTo=${encodeURIComponent(returnTo)}`;
    return NextResponse.redirect(loginUrl);
  }

  const userRes = await fetch('https://api.github.com/user', {
    headers: {
      Authorization: `Bearer ${tokenData.access_token}`,
      Accept: 'application/vnd.github+json',
      'User-Agent': 'Synnovator',
    },
  });

  const user = (await userRes.json()) as { login: string; avatar_url: string };

  const token = await encrypt(
    {
      login: user.login,
      avatar_url: user.avatar_url,
      access_token: tokenData.access_token,
    },
    authSecret,
  );

  const isSecure = request.nextUrl.protocol === 'https:';
  const headers = new Headers({ Location: returnTo });
  setSessionCookie(headers, token, isSecure);
  return new NextResponse(null, { status: 302, headers });
}
