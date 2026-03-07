import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  const clientId = process.env.GITHUB_CLIENT_ID!;
  const siteUrl = process.env.SITE_URL || 'https://home.synnovator.space';

  const returnTo = request.nextUrl.searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: 'read:user',
    state: returnTo,
  });

  return NextResponse.redirect(`https://github.com/login/oauth/authorize?${params}`);
}
