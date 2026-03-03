import type { APIRoute } from 'astro';
import { encrypt, setSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const url = new URL(request.url);
  const code = url.searchParams.get('code');
  const returnTo = url.searchParams.get('state') || '/';

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
      client_id: env.GITHUB_CLIENT_ID,
      client_secret: env.GITHUB_CLIENT_SECRET,
      code,
    }),
  });

  const tokenData = (await tokenRes.json()) as { access_token?: string; error?: string };
  if (!tokenData.access_token) {
    // Redirect back to login on failure (e.g. expired code) instead of showing raw error
    const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';
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

  const headers = new Headers({ Location: returnTo });
  setSessionCookie(headers, token);
  return new Response(null, { status: 302, headers });
};
