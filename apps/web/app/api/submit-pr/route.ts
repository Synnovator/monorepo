import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { getInstallationOctokit } from '@/lib/github-app';

const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

const VALID_TYPES = ['hackathon', 'proposal', 'profile'] as const;
type SubmitType = (typeof VALID_TYPES)[number];

const FILENAME_PATTERNS: RegExp[] = [
  /^hackathons\/[a-z0-9-]+\/hackathon\.yml$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/project\.yml$/,
  /^profiles\/[a-z0-9][\w.-]*\.yml$/,
];

const BRANCH_PREFIX: Record<SubmitType, string> = {
  hackathon: 'data/create-hackathon',
  proposal: 'data/submit',
  profile: 'data/create-profile',
};

export async function POST(request: NextRequest) {
  // 1. Auth
  const session = await getSession(request, process.env.AUTH_SECRET!);
  if (!session) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // 2. Parse + validate
  let body: { type: string; filename: string; content: string; slug: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
  }

  const { type, filename, content, slug } = body;

  if (!VALID_TYPES.includes(type as SubmitType)) {
    return NextResponse.json({ error: 'invalid type' }, { status: 400 });
  }
  if (!filename || !FILENAME_PATTERNS.some(p => p.test(filename))) {
    return NextResponse.json({ error: 'invalid filename' }, { status: 400 });
  }
  if (!content?.trim()) {
    return NextResponse.json({ error: 'empty content' }, { status: 400 });
  }
  if (!slug?.trim()) {
    return NextResponse.json({ error: 'missing slug' }, { status: 400 });
  }

  // 3. Octokit
  const octokit = getInstallationOctokit({
    GITHUB_APP_ID: process.env.GITHUB_APP_ID!,
    GITHUB_APP_PRIVATE_KEY: process.env.GITHUB_APP_PRIVATE_KEY!,
    GITHUB_APP_INSTALLATION_ID: process.env.GITHUB_APP_INSTALLATION_ID!,
  });

  const submitType = type as SubmitType;

  try {
    // 4a. Get main SHA
    const { data: ref } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: 'heads/main' });
    const mainSha = ref.object.sha;

    // 4b. Create branch (retry with timestamp on conflict)
    let branchName = `${BRANCH_PREFIX[submitType]}-${slug}`;
    try {
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 422) {
        branchName = `${branchName}-${Math.floor(Date.now() / 1000)}`;
        await octokit.git.createRef({
          owner: OWNER, repo: REPO,
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        });
      } else {
        throw err;
      }
    }

    // 4c. Commit file
    const commitMessage =
      submitType === 'hackathon' ? `feat(hackathons): create ${slug}` :
      submitType === 'proposal' ? `feat(submissions): submit ${slug}` :
      `feat(profiles): create profile for ${session.login}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filename,
      message: commitMessage,
      content: Buffer.from(content).toString('base64'),
      branch: branchName,
    });

    // 4d. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMessage,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**File:** \`${filename}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ pr_url: pr.html_url });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create PR';
    console.error('submit-pr error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
