import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { canEditHackathon } from '@/lib/permissions';
import { getInstallationOctokit } from '@/lib/github-app';
import { getHackathon } from '@/app/_generated/data';
import yaml from 'js-yaml';

const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function fromBase64(b64: string): string {
  const binary = atob(b64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new TextDecoder().decode(bytes);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Validate session
    const authSecret = process.env.AUTH_SECRET!;
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse and validate body
    let body: { type?: string; slug?: string; visibility?: string };
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const { type, slug, visibility } = body;
    if (!type || !slug || !visibility) {
      return NextResponse.json({ error: 'Missing required fields: type, slug, visibility' }, { status: 400 });
    }
    if (type !== 'hackathon' && type !== 'submission') {
      return NextResponse.json({ error: 'type must be hackathon or submission' }, { status: 400 });
    }
    if (visibility !== 'public' && visibility !== 'private') {
      return NextResponse.json({ error: 'visibility must be public or private' }, { status: 400 });
    }

    // 3. Check permission: admin or hackathon managed_by
    const hackathonSlugForPerm = type === 'hackathon' ? slug : slug.split('/')[0];
    const hackathonEntry = getHackathon(hackathonSlugForPerm);
    const managedBy = hackathonEntry?.hackathon.managed_by ?? [];
    if (!canEditHackathon(session.login, managedBy)) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // 4. Check GitHub App env vars
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const missing = [
      !appId && 'GITHUB_APP_ID',
      !privateKey && 'GITHUB_APP_PRIVATE_KEY',
      !installationId && 'GITHUB_APP_INSTALLATION_ID',
    ].filter(Boolean);
    if (missing.length) {
      return NextResponse.json(
        { error: `Server configuration error: missing ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    const octokit = getInstallationOctokit({
      GITHUB_APP_ID: appId!,
      GITHUB_APP_PRIVATE_KEY: privateKey!,
      GITHUB_APP_INSTALLATION_ID: installationId!,
    });

    // 5. Determine YAML file path
    let filePath: string;
    if (type === 'hackathon') {
      filePath = `hackathons/${slug}/hackathon.yml`;
    } else {
      // slug format: "hackathon-slug/team-slug"
      const [hackathonSlug, teamSlug] = slug.split('/');
      filePath = `hackathons/${hackathonSlug}/submissions/${teamSlug}/project.yml`;
    }

    // 6. Get main branch SHA
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER, repo: REPO, ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    // 7. Create branch
    const timestamp = Math.floor(Date.now() / 1000);
    const action = visibility === 'public' ? 'publish' : 'unpublish';
    const branchSlug = slug.replace(/\//g, '-');
    let branchName = `data/visibility-${type}-${branchSlug}-${timestamp}`;

    try {
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`, sha: mainSha,
      });
    } catch (err: unknown) {
      if ((err as { status?: number }).status === 422) {
        branchName = `${branchName}-${Math.floor(Math.random() * 10000)}`;
        await octokit.git.createRef({
          owner: OWNER, repo: REPO,
          ref: `refs/heads/${branchName}`, sha: mainSha,
        });
      } else throw err;
    }

    // 8. Read current YAML
    let fileSha: string | undefined;
    let currentContent: string;
    try {
      const { data: existing } = await octokit.repos.getContent({
        owner: OWNER, repo: REPO,
        path: filePath,
        ref: branchName,
      });
      if (Array.isArray(existing) || existing.type !== 'file') {
        return NextResponse.json({ error: 'Path is not a file' }, { status: 400 });
      }
      fileSha = existing.sha;
      currentContent = fromBase64(existing.content as string);
    } catch {
      // Cleanup branch on file not found
      try {
        await octokit.git.deleteRef({ owner: OWNER, repo: REPO, ref: `heads/${branchName}` });
      } catch { /* ignore cleanup error */ }
      return NextResponse.json({ error: `File not found: ${filePath}` }, { status: 404 });
    }

    // 9. Update visibility in YAML
    const yamlData = yaml.load(currentContent) as Record<string, any>;
    const innerKey = type === 'hackathon' ? 'hackathon' : 'project';
    if (yamlData[innerKey]) {
      yamlData[innerKey].visibility = visibility;
    }
    const updatedYaml = yaml.dump(yamlData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: false,
    });

    // 10. Commit
    const commitMsg = `data(visibility): ${action} ${type} ${slug}`;
    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filePath,
      message: commitMsg,
      content: toBase64(updatedYaml),
      sha: fileSha,
      branch: branchName,
    });

    // 11. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMsg,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**Action:** ${action} ${type}`,
        `**Target:** \`${slug}\``,
        `**File:** \`${filePath}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Admin Panel](https://home.synnovator.space/admin)',
      ].join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ url: pr.html_url, number: pr.number });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to update visibility';
    console.error('POST /api/admin/visibility error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
