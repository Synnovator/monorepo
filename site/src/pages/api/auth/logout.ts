import type { APIRoute } from 'astro';
import { clearSessionCookie } from '../../../lib/auth';

export const prerender = false;

export const GET: APIRoute = async () => {
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers);
  return new Response(null, { status: 302, headers });
};
