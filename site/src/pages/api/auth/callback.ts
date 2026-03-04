import type { APIRoute } from 'astro';
import { encrypt, setSessionCookie, getCookieDomain, isAllowedRedirect, getOAuthConfig } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);
  const { clientId, clientSecret, siteUrl } = getOAuthConfig(url.hostname, env);
  const code = url.searchParams.get('code');
  const rawReturnTo = url.searchParams.get('state') || '/';

  // Validate redirect target to prevent open redirect
  const returnTo = isAllowedRedirect(rawReturnTo) ? rawReturnTo : '/';

  if (!code) {
    return new Response('Missing code parameter', { status: 400 });
  }

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
    return new Response(null, { status: 302, headers: { Location: loginUrl } });
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
    env.AUTH_SECRET,
  );

  const cookieDomain = getCookieDomain(url.hostname);
  const headers = new Headers({ Location: returnTo });
  setSessionCookie(headers, token, cookieDomain);
  return new Response(null, { status: 302, headers });
};
