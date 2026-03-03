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

  // NDA check for dataset downloads
  const datasetMatch = key.match(/^hackathons\/([^/]+)\/datasets\//);
  if (datasetMatch) {
    const slug = datasetMatch[1];
    const owner = env.GITHUB_OWNER || 'Synnovator';
    const repo = env.GITHUB_REPO || 'monorepo';

    // Fetch hackathon.yml from GitHub Contents API to check NDA requirement
    const hackathonYmlUrl = `https://api.github.com/repos/${owner}/${repo}/contents/hackathons/${slug}/hackathon.yml`;
    const ymlRes = await fetch(hackathonYmlUrl, {
      headers: {
        Authorization: `Bearer ${session.access_token}`,
        Accept: 'application/vnd.github.v3.raw',
        'User-Agent': 'Synnovator-Site',
      },
    });

    if (ymlRes.ok) {
      const ymlText = await ymlRes.text();
      const { default: jsYaml } = await import('js-yaml');
      const hackathonData = jsYaml.load(ymlText) as Record<string, unknown>;
      const hackathon = hackathonData?.hackathon as Record<string, unknown> | undefined;
      const legal = hackathon?.legal as Record<string, unknown> | undefined;
      const nda = legal?.nda as Record<string, unknown> | undefined;

      if (nda?.required === true) {
        // Search for user's approved NDA issue
        const issuesUrl = new URL(`https://api.github.com/repos/${owner}/${repo}/issues`);
        issuesUrl.searchParams.set('labels', 'nda-sign,nda-approved');
        issuesUrl.searchParams.set('creator', session.login);
        issuesUrl.searchParams.set('state', 'all');
        issuesUrl.searchParams.set('per_page', '100');

        const issuesRes = await fetch(issuesUrl.toString(), {
          headers: {
            Authorization: `Bearer ${session.access_token}`,
            Accept: 'application/vnd.github.v3+json',
            'User-Agent': 'Synnovator-Site',
          },
        });

        let ndaApproved = false;
        if (issuesRes.ok) {
          const issues = (await issuesRes.json()) as Array<{ title: string }>;
          ndaApproved = issues.some((issue) => issue.title.includes(slug));
        }

        if (!ndaApproved) {
          return new Response(
            JSON.stringify({
              error: 'nda_required',
              message: '请先签署 NDA / Please sign the NDA first',
              hackathon: slug,
            }),
            {
              status: 403,
              headers: { 'Content-Type': 'application/json' },
            },
          );
        }
      }
    }
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
