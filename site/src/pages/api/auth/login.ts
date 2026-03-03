import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const clientId = env.GITHUB_CLIENT_ID;
  const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';

  const returnTo = new URL(request.url).searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: 'read:user',
    state: returnTo,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  });
};
