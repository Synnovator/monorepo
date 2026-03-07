import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';

export async function POST(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET!;
  const session = await getSession(request, authSecret);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  let body: { key?: string };
  try {
    body = (await request.json()) as { key?: string };
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 });
  }

  const { key } = body;
  if (!key || typeof key !== 'string') {
    return NextResponse.json({ error: 'Missing key parameter' }, { status: 400 });
  }

  if (!key.startsWith('hackathons/') || key.includes('..')) {
    return NextResponse.json({ error: 'Invalid key path' }, { status: 403 });
  }

  // NDA check for dataset downloads
  const datasetMatch = key.match(/^hackathons\/([^/]+)\/datasets\//);
  if (datasetMatch) {
    const slug = datasetMatch[1];
    const owner = process.env.GITHUB_OWNER || 'Synnovator';
    const repo = process.env.GITHUB_REPO || 'monorepo';

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
          return NextResponse.json(
            {
              error: 'nda_required',
              message: '请先签署 NDA / Please sign the NDA first',
              hackathon: slug,
            },
            { status: 403 },
          );
        }
      }
    }
  }

  // Dynamic import to avoid bundling S3 client if not used
  const { S3Client, GetObjectCommand } = await import('@aws-sdk/client-s3');
  const { getSignedUrl } = await import('@aws-sdk/s3-request-presigner');

  const s3 = new S3Client({
    region: 'auto',
    endpoint: process.env.R2_ENDPOINT!,
    credentials: {
      accessKeyId: process.env.R2_ACCESS_KEY_ID!,
      secretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    },
  });

  const expiresIn = 4 * 60 * 60;
  const command = new GetObjectCommand({
    Bucket: process.env.R2_BUCKET_NAME!,
    Key: key,
  });

  const url = await getSignedUrl(s3, command, { expiresIn });
  const expiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

  return NextResponse.json({ url, expires_at: expiresAt });
}
