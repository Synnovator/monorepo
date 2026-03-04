import type { APIRoute } from 'astro';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const clientId = env.GITHUB_CLIENT_ID;
  const siteUrl = env.SITE_URL || 'https://synnovator.pages.dev';

  const requestUrl = new URL(request.url);
  const requestOrigin = requestUrl.origin;
  const siteOrigin = new URL(siteUrl).origin;

  let returnTo = requestUrl.searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  // On preview subdomains, preserve full URL so callback can redirect back
  if (requestOrigin !== siteOrigin && !returnTo.startsWith('http')) {
    returnTo = `${requestOrigin}${returnTo}`;
  }

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
