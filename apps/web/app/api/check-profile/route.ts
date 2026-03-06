import { NextRequest, NextResponse } from 'next/server';

const GITHUB_OWNER = process.env.GITHUB_OWNER || 'Synnovator';
const GITHUB_REPO = process.env.GITHUB_REPO || 'monorepo';

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json({ exists: false, slug: null });
  }

  try {
    const res = await fetch(
      `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/profiles/${encodeURIComponent(username)}.yml`,
      {
        method: 'HEAD',
        headers: { 'User-Agent': 'Synnovator' },
      },
    );

    return NextResponse.json({
      exists: res.ok,
      slug: res.ok ? username : null,
    });
  } catch {
    return NextResponse.json({ exists: false, slug: null });
  }
}
