import type { APIRoute } from 'astro';
import { clearSessionCookie, getCookieDomain } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async ({ request }) => {
  const cookieDomain = getCookieDomain(new URL(request.url).hostname);
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers, cookieDomain);
  return new Response(null, { status: 302, headers });
};
