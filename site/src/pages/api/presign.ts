import type { APIRoute } from 'astro';
import { S3Client, GetObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';
import { getSession } from '../../lib/auth';

export const prerender = false;

export const POST: APIRoute = async ({ request, locals }) => {
  const { env } = locals.runtime;

  const session = await getSession(request, env.AUTH_SECRET);
  if (!session) {
    return new Response(JSON.stringify({ error: 'Unauthorized' }), {
      status: 401,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  let body: { key?: string };
  try {
    body = (await request.json()) as { key?: string };
  } catch {
    return new Response(JSON.stringify({ error: 'Invalid JSON body' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const { key } = body;
  if (!key || typeof key !== 'string') {
    return new Response(JSON.stringify({ error: 'Missing key parameter' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  if (!key.startsWith('hackathons/') || key.includes('..')) {
    return new Response(JSON.stringify({ error: 'Invalid key path' }), {
      status: 403,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const s3 = new S3Client({
    region: 'auto',
    endpoint: env.R2_ENDPOINT,
    credentials: {
      accessKeyId: env.R2_ACCESS_KEY_ID,
      secretAccessKey: env.R2_SECRET_ACCESS_KEY,
    },
  });

  const expiresIn = 4 * 60 * 60;
  const command = new GetObjectCommand({
    Bucket: env.R2_BUCKET_NAME,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return new Response(
    JSON.stringify({ url, expires_at: expiresAt }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    },
  );
};
