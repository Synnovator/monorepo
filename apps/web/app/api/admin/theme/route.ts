import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { themeSubmissionSchema } from '@synnovator/shared/schemas/theme';
import { getInstallationOctokit } from '@/lib/github-app';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const REPO_ROOT = process.cwd();
const OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const REPO = process.env.GITHUB_REPO || 'monorepo';

function readYamlFile(filePath: string): Record<string, unknown> | null {
  try {
    const content = fs.readFileSync(filePath, 'utf-8');
    return yaml.load(content) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export async function GET(request: NextRequest) {
  try {
    // 1. Auth
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse target param
    const { searchParams } = new URL(request.url);
    const target = searchParams.get('target');

    if (!target) {
      return NextResponse.json({ error: 'Missing target parameter' }, { status: 400 });
    }

    // 3. Read global theme
    const globalThemePath = path.join(REPO_ROOT, 'config', 'theme.yml');
    const globalTheme = readYamlFile(globalThemePath);

    if (!globalTheme) {
      return NextResponse.json({ error: 'Global theme config not found' }, { status: 404 });
    }

    // 4. Return based on target
    if (target === 'global') {
      return NextResponse.json(globalTheme);
    }

    // Hackathon-specific: return both global and overrides
    const hackathonThemePath = path.join(REPO_ROOT, 'hackathons', target, 'theme.yml');
    const overrides = readYamlFile(hackathonThemePath) ?? {};

    return NextResponse.json({ global: globalTheme, overrides });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read theme';
    console.error('GET /api/admin/theme error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

/** Base64-encode a UTF-8 string (works in both Node.js and Cloudflare Workers). */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function POST(request: NextRequest) {
  try {
    // 1. Auth
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // 2. Parse + validate body
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 });
    }

    const parsed = themeSubmissionSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { error: 'Validation failed', details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const { target, light, dark, fonts, radius, message } = parsed.data;

    // 3. Serialize to YAML
    const themeData: Record<string, unknown> = { light, dark };
    if (fonts) themeData.fonts = fonts;
    if (radius) themeData.radius = radius;

    const yamlContent = yaml.dump(themeData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: true,
    });

    // 4. Determine file path
    const filePath =
      target === 'global'
        ? 'config/theme.yml'
        : `hackathons/${target}/theme.yml`;

    // 5. Check required env vars
    const appId = process.env.GITHUB_APP_ID;
    const privateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const installationId = process.env.GITHUB_APP_INSTALLATION_ID;
    const missing = [
      !appId && 'GITHUB_APP_ID',
      !privateKey && 'GITHUB_APP_PRIVATE_KEY',
      !installationId && 'GITHUB_APP_INSTALLATION_ID',
    ].filter(Boolean);
    if (missing.length) {
      console.error('theme POST: missing env vars:', missing.join(', '));
      return NextResponse.json(
        { error: `Server configuration error: missing ${missing.join(', ')}` },
        { status: 500 },
      );
    }

    // 6. Octokit (vars guaranteed non-null after missing check above)
    const octokit = getInstallationOctokit({
      GITHUB_APP_ID: appId!,
      GITHUB_APP_PRIVATE_KEY: privateKey!,
      GITHUB_APP_INSTALLATION_ID: installationId!,
    });

    // 7a. Get main SHA
    const { data: ref } = await octokit.git.getRef({
      owner: OWNER,
      repo: REPO,
      ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    // 7b. Create branch (retry with timestamp on conflict)
    const timestamp = Math.floor(Date.now() / 1000);
    let branchName = `theme/${target}-${timestamp}`;
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
        branchName = `${branchName}-${Math.floor(Math.random() * 10000)}`;
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

    // 7c. Commit file
    const commitMessage = message || `theme(${target}): update theme tokens`;

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER,
      repo: REPO,
      path: filePath,
      message: commitMessage,
      content: toBase64(yamlContent),
      branch: branchName,
    });

    // 7d. Create PR
    const { data: pr } = await octokit.pulls.create({
      owner: OWNER,
      repo: REPO,
      title: `theme(${target}): update theme tokens`,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**File:** \`${filePath}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Theme Editor](https://home.synnovator.space/admin/theme)',
      ].join('\n'),
      head: branchName,
      base: 'main',
    });

    return NextResponse.json({ url: pr.html_url, number: pr.number });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to create theme PR';
    console.error('POST /api/admin/theme error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
