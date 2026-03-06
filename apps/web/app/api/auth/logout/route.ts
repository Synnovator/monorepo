import { NextResponse } from 'next/server';
import { clearSessionCookie } from '@synnovator/shared/auth';

export async function GET() {
  const headers = new Headers({ Location: '/' });
  clearSessionCookie(headers);
  return new NextResponse(null, { status: 302, headers });
}
