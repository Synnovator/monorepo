import type { APIRoute } from 'astro';
import { getOAuthConfig, isPreviewHost } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;
  const requestUrl = new URL(request.url);
  const preview = isPreviewHost(requestUrl.hostname);
  const { clientId, siteUrl } = getOAuthConfig(preview, env);

  const requestOrigin = requestUrl.origin;
  const siteOrigin = new URL(siteUrl).origin;

  let returnTo = requestUrl.searchParams.get('returnTo')
    || request.headers.get('Referer')
    || '/';

  // On preview subdomains, preserve full URL so callback can redirect back
  if (requestOrigin !== siteOrigin && !returnTo.startsWith('http')) {
    returnTo = `${requestOrigin}${returnTo}`;
  }

  // Encode preview flag in state so callback uses the right OAuth credentials.
  // Callback lands on the production hostname, so it can't detect preview from hostname.
  const state = preview ? `preview:${returnTo}` : returnTo;

  const params = new URLSearchParams({
    client_id: clientId,
    redirect_uri: `${siteUrl}/api/auth/callback`,
    scope: 'read:user',
    state,
  });

  return new Response(null, {
    status: 302,
    headers: { Location: `https://github.com/login/oauth/authorize?${params}` },
  });
};
