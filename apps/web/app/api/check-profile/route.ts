import { NextRequest, NextResponse } from 'next/server';
import { listProfiles } from '@synnovator/shared/data';
import path from 'node:path';

const DATA_ROOT = path.resolve(process.cwd(), '../..');

export async function GET(request: NextRequest) {
  const username = request.nextUrl.searchParams.get('username');
  if (!username) {
    return NextResponse.json({ exists: false, slug: null });
  }

  const profiles = await listProfiles(DATA_ROOT);
  const match = profiles.find(p => p.hacker.github === username);

  return NextResponse.json({
    exists: !!match,
    slug: match ? match.hacker.github : null,
  });
}
