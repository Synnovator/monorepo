import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@synnovator/shared/auth';
import fs from 'node:fs';
import path from 'node:path';
import yaml from 'js-yaml';

const REPO_ROOT = process.cwd();

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
