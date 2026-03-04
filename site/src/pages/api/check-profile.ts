import type { APIRoute } from 'astro';
import { getCollection } from 'astro:content';

export const prerender = false;

export const GET: APIRoute = async ({ url }) => {
  const username = url.searchParams.get('username');
  if (!username) {
    return new Response(JSON.stringify({ exists: false, slug: null }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const profiles = await getCollection('profiles');
  const match = profiles.find(p => p.data.hacker.github === username);

  return new Response(
    JSON.stringify({
      exists: !!match,
      slug: match ? match.id : null,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
