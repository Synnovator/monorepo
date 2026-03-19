import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { getInstallationOctokit } from '@/lib/github-app';

const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

const VALID_TYPES = ['hackathon', 'proposal', 'profile', 'team', 'team-join', 'team-leave'] as const;
type SubmitType = (typeof VALID_TYPES)[number];

const FILENAME_PATTERNS: RegExp[] = [
  /^hackathons\/[a-z0-9-]+\/hackathon\.yml$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/project\.yml$/,
  /^profiles\/[a-z0-9][\w.-]*\.yml$/,
  // MDX content
  /^hackathons\/[a-z0-9-]+\/description(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/tracks\/[a-z0-9-]+(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/stages\/(draft|registration|development|submission|judging|announcement|award)(\.zh)?\.mdx$/,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/README(\.zh)?\.mdx$/,
  /^profiles\/[a-z0-9][\w.-]*\/bio(\.zh)?\.mdx$/,
  // Assets
  /^hackathons\/[a-z0-9-]+\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
  /^hackathons\/[a-z0-9-]+\/submissions\/[a-z0-9-]+\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
  /^profiles\/[a-z0-9][\w.-]*\/assets\/[a-z0-9._-]+\.(png|jpg|jpeg|gif|webp|pdf)$/i,
  // Teams
  /^teams\/[a-z0-9-]+\/team\.yml$/,
];

const BRANCH_PREFIX: Record<SubmitType, string> = {
  hackathon: 'data/create-hackathon',
  proposal: 'data/submit',
  profile: 'data/create-profile',
  team: 'data/create-team',
  'team-join': 'data/team-join',
  'team-leave': 'data/team-leave',
};

interface FileEntry {
  path: string;
  content?: string;       // text content (YAML, MDX)
  base64Content?: string; // binary content (images, PDFs)
}

interface SubmitMetadata {
  hackathonSlug?: string;
  hackathonName?: string;
  hackathonNameZh?: string;
  trackName?: string;
  trackNameZh?: string;
  projectName?: string;
  projectNameZh?: string;
}

const REQUIRED_METADATA: Record<SubmitType, (keyof SubmitMetadata)[]> = {
  proposal: ['hackathonSlug', 'hackathonName', 'hackathonNameZh', 'trackName', 'projectName'],
  hackathon: ['hackathonName', 'hackathonNameZh'],
  profile: [],
  team: [],
  'team-join': [],
  'team-leave': [],
};

async function commitMultipleFiles(
  octokit: any,
  params: {
    owner: string;
    repo: string;
    branchName: string;
    files: FileEntry[];
    commitMessage: string;
  },
) {
  const { owner, repo, branchName, files, commitMessage } = params;

  // Get the current commit SHA of the branch
  const { data: refData } = await octokit.git.getRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
  });
  const baseSha = refData.object.sha;

  // Build tree entries
  const treeEntries = await Promise.all(
    files.map(async (file) => {
      if (file.base64Content) {
        // Binary file — create blob first
        const { data: blob } = await octokit.git.createBlob({
          owner,
          repo,
          content: file.base64Content,
          encoding: 'base64',
        });
        return {
          path: file.path,
          mode: '100644' as const,
          type: 'blob' as const,
          sha: blob.sha,
        };
      }
      // Text file — inline content
      return {
        path: file.path,
        mode: '100644' as const,
        type: 'blob' as const,
        content: file.content!,
      };
    }),
  );

  // Create tree
  const { data: tree } = await octokit.git.createTree({
    owner,
    repo,
    base_tree: baseSha,
    tree: treeEntries,
  });

  // Create commit
  const { data: commit } = await octokit.git.createCommit({
    owner,
    repo,
    message: commitMessage,
    tree: tree.sha,
    parents: [baseSha],
  });

  // Update branch ref
  await octokit.git.updateRef({
    owner,
    repo,
    ref: `heads/${branchName}`,
    sha: commit.sha,
  });

  return commit;
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const session = await getSession(request, process.env.AUTH_SECRET!);
    if (!session) {
      return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
    }

    // 2. Parse + validate
    let body: {
      type: string;
      slug: string;
      // Old format
      filename?: string;
      content?: string;
      // New format
      files?: FileEntry[];
      metadata?: SubmitMetadata;
    };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'invalid JSON' }, { status: 400 });
    }

    const { type, slug } = body;

    if (!VALID_TYPES.includes(type as SubmitType)) {
      return NextResponse.json({ error: 'invalid type' }, { status: 400 });
    }
    if (!slug?.trim()) {
      return NextResponse.json({ error: 'missing slug' }, { status: 400 });
    }

    const submitType = type as SubmitType;

    // Validate metadata
    const metadata: SubmitMetadata = body.metadata ?? {};
    const requiredFields = REQUIRED_METADATA[submitType];
    const missingMeta = requiredFields.filter(f => !metadata[f]?.trim());
    if (missingMeta.length > 0) {
      return NextResponse.json(
        { error: `missing metadata: ${missingMeta.join(', ')}` },
        { status: 400 },
      );
    }

    // Normalize to files array (support both old and new format)
    let files: FileEntry[];
    if (body.files && Array.isArray(body.files)) {
      // New format
      files = body.files;
    } else if (body.filename && body.content !== undefined) {
      // Old format — convert to single-element files array
      files = [{ path: body.filename, content: body.content }];
    } else {
      return NextResponse.json(
        { error: 'must provide either "files" array or "filename"+"content"' },
        { status: 400 },
      );
    }

    if (files.length === 0) {
      return NextResponse.json({ error: 'files array is empty' }, { status: 400 });
    }

    // Validate each file path
    for (const file of files) {
      if (!file.path || !FILENAME_PATTERNS.some((p) => p.test(file.path))) {
        return NextResponse.json(
          { error: `invalid filename: ${file.path}` },
          { status: 400 },
        );
      }
      if (!file.content?.trim() && !file.base64Content?.trim()) {
        return NextResponse.json(
          { error: `empty content for file: ${file.path}` },
          { status: 400 },
        );
      }
    }

    // 3. Check required env vars
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const missing = [
      !appId && 'GITHUB_APP_ID',
      !privateKey && 'GITHUB_APP_PRIVATE_KEY',
      !installationId && 'GITHUB_APP_INSTALLATION_ID',
    ].filter(Boolean);
    if (missing.length) {
      console.error('submit-pr: missing env vars:', missing.join(', '));
      return NextResponse.json(
        { error: `Server configuration error: missing ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    // 4. Octokit (vars guaranteed non-null after missing check above)
    const octokit = getInstallationOctokit({
      GITHUB_APP_ID: appId!,
      GITHUB_APP_PRIVATE_KEY: privateKey!,
      GITHUB_APP_INSTALLATION_ID: installationId!,
    });

    // 5a. Get main SHA
    const { data: ref } = await octokit.git.getRef({ owner: OWNER, repo: REPO, ref: 'heads/main' });
    const mainSha = ref.object.sha;

    // 5b. Create branch (retry with timestamp on conflict)
    let branchName = submitType === 'proposal'
      ? `data/submit-${metadata.hackathonSlug}-${slug}`
      : `${BRANCH_PREFIX[submitType]}-${slug}`;
    try {
      await octokit.git.createRef({
        owner: OWNER,
        repo: REPO,
        ref: `refs/heads/${branchName}`,
        sha: mainSha,
      });
    } catch (err: unknown) {
      const status = (err as { status?: number }).status;
      if (status === 422) {
        branchName = `${branchName}-${Math.floor(Date.now() / 1000)}`;
        await octokit.git.createRef({
          owner: OWNER,
          repo: REPO,
          ref: `refs/heads/${branchName}`,
          sha: mainSha,
        });
      } else {
        throw err;
      }
    }

    // 5c. Build PR title and body
    const isTeamType = submitType === 'team' || submitType === 'team-join' || submitType === 'team-leave';
    const prTitle =
      submitType === 'proposal'
        ? `[提交] ${metadata.projectName} → ${metadata.hackathonNameZh} · ${metadata.trackNameZh || metadata.trackName}赛道`
        : submitType === 'hackathon'
          ? `[创建比赛] ${metadata.hackathonNameZh} / ${metadata.hackathonName}`
          : submitType === 'team'
            ? `[创建团队] ${slug} by @${session.login}`
            : submitType === 'team-join'
              ? `[加入团队] @${session.login} → ${slug}`
              : submitType === 'team-leave'
                ? `[退出团队] @${session.login} ← ${slug}`
                : `[创建档案] @${session.login}`;

    const filePaths = files.map((f) => f.path);
    const filesList = filePaths.map((p) => `- \`${p}\``).join('\n');

    let prBody: string;
    if (submitType === 'proposal') {
      prBody = [
        `提交者 / Submitted by: @${session.login}`,
        `比赛 / Hackathon: ${metadata.hackathonNameZh} / ${metadata.hackathonName}`,
        `赛道 / Track: ${metadata.trackNameZh || metadata.trackName} / ${metadata.trackName}`,
        `项目 / Project: ${metadata.projectNameZh || metadata.projectName} / ${metadata.projectName}`,
        `队伍 / Team: ${slug}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    } else if (submitType === 'hackathon') {
      prBody = [
        `提交者 / Submitted by: @${session.login}`,
        `比赛 / Hackathon: ${metadata.hackathonNameZh} / ${metadata.hackathonName}`,
        `类型 / Type: ${slug}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    } else if (isTeamType) {
      prBody = [
        `操作者 / Operator: @${session.login}`,
        `团队 / Team: ${slug}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    } else {
      prBody = [
        `提交者 / Submitted by: @${session.login}`,
        '',
        `文件 / Files:`,
        filesList,
        '',
        '---',
        '> Auto-created via [Synnovator Platform](https://home.synnovator.space)',
      ].join('\n');
    }

    // 5d. Commit files via Git Tree API
    const commitMessage = submitType === 'team'
      ? `data(teams): create team ${slug}`
      : submitType === 'team-join'
        ? `data(teams): ${session.login} join ${slug}`
        : submitType === 'team-leave'
          ? `data(teams): ${session.login} leave ${slug}`
          : prTitle;

    await commitMultipleFiles(octokit, {
      owner: OWNER,
      repo: REPO,
      branchName,
      files,
      commitMessage,
    });

    // 5e. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: prTitle,
      body: prBody,
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
