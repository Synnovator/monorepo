import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import { themeSubmissionSchema } from '@synnovator/shared/schemas/theme';
import { getInstallationOctokit } from '@/lib/github-app';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const REPO_ROOT = path.resolve(process.cwd(), '..', '..');
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

/** Base64-encode a UTF-8 string (works in both Node.js and Cloudflare Workers). */
function toBase64(str: string): string {
  const bytes = new TextEncoder().encode(str);
  let binary = '';
  for (let i = 0; i < bytes.length; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export async function GET(request: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const themeName = searchParams.get('theme');
    const hackathonSlug = searchParams.get('hackathon');

    const themesDir = path.join(REPO_ROOT, 'config', 'themes');
    const activeFile = path.join(themesDir, '.active');

    // Action: list all platform themes
    if (action === 'list') {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : '';

      const files = fs.readdirSync(themesDir).filter((f) => f.endsWith('.yml'));
      const themes = files.map((f) => {
        const id = f.replace(/\.yml$/, '');
        const data = readYamlFile(path.join(themesDir, f));
        return {
          id,
          name: (data?.name as string) || id,
          name_zh: (data?.name_zh as string) || undefined,
          active: id === activeTheme,
        };
      });

      return NextResponse.json({ themes, activeTheme });
    }

    // Get specific platform theme
    if (themeName) {
      const themeFile = path.join(themesDir, `${themeName}.yml`);
      const themeData = readYamlFile(themeFile);
      if (!themeData) {
        return NextResponse.json({ error: `Theme "${themeName}" not found` }, { status: 404 });
      }

      // With hackathon variant
      if (hackathonSlug) {
        const variantFile = path.join(
          REPO_ROOT, 'hackathons', hackathonSlug, 'themes', `${themeName}.yml`
        );
        const overrides = readYamlFile(variantFile) ?? {};
        return NextResponse.json({ base: themeData, overrides });
      }

      return NextResponse.json(themeData);
    }

    // Fallback: legacy ?target= support
    const target = searchParams.get('target');
    if (target === 'global') {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : 'warm-orange';
      const themeFile = path.join(themesDir, `${activeTheme}.yml`);
      const themeData = readYamlFile(themeFile);
      if (!themeData) {
        return NextResponse.json({ error: 'Active theme not found' }, { status: 404 });
      }
      return NextResponse.json(themeData);
    }
    if (target) {
      const activeTheme = fs.existsSync(activeFile)
        ? fs.readFileSync(activeFile, 'utf-8').trim()
        : 'warm-orange';
      const themeFile = path.join(themesDir, `${activeTheme}.yml`);
      const themeData = readYamlFile(themeFile);
      const variantFile = path.join(REPO_ROOT, 'hackathons', target, 'themes', `${activeTheme}.yml`);
      const overrides = readYamlFile(variantFile) ?? {};
      return NextResponse.json({ global: themeData, overrides });
    }

    return NextResponse.json({ error: 'Missing query parameters' }, { status: 400 });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : 'Failed to read theme';
    console.error('GET /api/admin/theme error:', err);
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    const authSecret = process.env.AUTH_SECRET || 'dev-secret-key-min-32-chars-long!!';
    const session = await getSession(request, authSecret);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

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

    const { type, themeName, hackathonSlug, name, name_zh, description, light, dark, fonts, radius, message } = parsed.data;

    // Check required env vars
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

    const { data: ref } = await octokit.git.getRef({
      owner: OWNER, repo: REPO, ref: 'heads/main',
    });
    const mainSha = ref.object.sha;

    const timestamp = Math.floor(Date.now() / 1000);

    // --- Activate theme: PR that updates config/themes/.active ---
    if (type === 'activate') {
      const branchName = `theme/activate-${themeName}-${timestamp}`;
      await octokit.git.createRef({
        owner: OWNER, repo: REPO,
        ref: `refs/heads/${branchName}`, sha: mainSha,
      });

      const commitMsg = `theme: activate ${themeName} as default platform theme`;
      await octokit.repos.createOrUpdateFileContents({
        owner: OWNER, repo: REPO,
        path: 'config/themes/.active',
        message: commitMsg,
        content: toBase64(themeName),
        branch: branchName,
      });

      const { data: pr } = await octokit.pulls.create({
        owner: OWNER, repo: REPO,
        title: commitMsg,
        body: [
          `Submitted by @${session.login}`,
          '',
          `**Action:** Activate platform theme \`${themeName}\``,
          `**File:** \`config/themes/.active\``,
          '',
          'After merging, the platform will rebuild with this theme as the default.',
          '',
          '---',
          '> Auto-created via [Synnovator Theme Editor](https://home.synnovator.space/admin/theme)',
        ].join('\n'),
        head: branchName,
        base: 'main',
      });

      return NextResponse.json({ url: pr.html_url, number: pr.number });
    }

    // --- Platform or hackathon-variant: PR with theme YAML ---
    const themeData: Record<string, unknown> = {};
    if (type === 'platform') {
      if (name) themeData.name = name;
      if (name_zh) themeData.name_zh = name_zh;
      if (description) themeData.description = description;
    }
    if (light) themeData.light = light;
    if (dark) themeData.dark = dark;
    if (fonts) themeData.fonts = fonts;
    if (radius) themeData.radius = radius;

    const yamlContent = yaml.dump(themeData, {
      lineWidth: -1,
      quotingType: '"',
      forceQuotes: true,
    });

    const filePath = type === 'platform'
      ? `config/themes/${themeName}.yml`
      : `hackathons/${hackathonSlug}/themes/${themeName}.yml`;

    let branchName = `theme/${themeName}-${timestamp}`;
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

    const commitMsg = message || `theme(${themeName}): update ${type === 'platform' ? 'platform theme' : `variant for ${hackathonSlug}`}`;

    await octokit.repos.createOrUpdateFileContents({
      owner: OWNER, repo: REPO,
      path: filePath,
      message: commitMsg,
      content: toBase64(yamlContent),
      branch: branchName,
    });

    const { data: pr } = await octokit.pulls.create({
      owner: OWNER, repo: REPO,
      title: commitMsg,
      body: [
        `Submitted by @${session.login}`,
        '',
        `**Type:** ${type}`,
        `**Theme:** \`${themeName}\``,
        type === 'hackathon-variant' ? `**Hackathon:** \`${hackathonSlug}\`` : '',
        `**File:** \`${filePath}\``,
        '',
        '---',
        '> Auto-created via [Synnovator Theme Editor](https://home.synnovator.space/admin/theme)',
      ].filter(Boolean).join('\n'),
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
