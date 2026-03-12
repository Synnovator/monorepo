import { NextRequest, NextResponse } from 'next/server';
import { clearSessionCookie } from '@synnovator/shared/auth';

export async function GET(request: NextRequest) {
  const isSecure = request.nextUrl.protocol === 'https:';
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers, isSecure);
  return new NextResponse(null, { status: 302, headers });
}
