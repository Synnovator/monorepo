import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { createGitHubClient } from '@synnovator/shared/data';

export async function POST(request: NextRequest) {
  const authSecret = process.env.AUTH_SECRET!;
  const session = await getSession(request, authSecret);

  if (!session) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const { prNumber, action, comment } = (await request.json()) as {
    prNumber: number;
    action: 'approve' | 'reject' | 'request_changes';
    comment?: string;
  };

  if (session.access_token === 'dev-token') {
    // Dev mode: simulate success
    return NextResponse.json({ success: true, dev: true });
  }

  const client = createGitHubClient(session.access_token);
  const owner = process.env.GITHUB_OWNER || 'Synnovator';
  const repo = process.env.GITHUB_REPO || 'monorepo';

  if (action === 'approve') {
    await client.mergePR(owner, repo, prNumber);
  } else if (action === 'reject') {
    await client.closePR(owner, repo, prNumber, comment);
  } else if (action === 'request_changes') {
    // Use closePR's comment mechanism to add a review comment
    // In a real implementation this would use the reviews API
    if (comment) {
      await client.closePR(owner, repo, prNumber, `Request changes: ${comment}`);
    }
  }

  return NextResponse.json({ success: true });
}
