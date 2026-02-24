import { NextResponse } from 'next/server';

import { validateJWT } from '@/lib/auth/token';
import { logAuthEvent } from '@/server/db/prisma';
import { revokeSessionByJwt } from '@/server/auth/callbacks';

function extractToken(request: Request): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader?.startsWith('Bearer ')) {
    return authHeader.replace('Bearer ', '').trim();
  }

  const cookieHeader = request.headers.get('cookie') ?? '';
  const match = /(?:^|;\s*)auth-token=([^;]+)/.exec(cookieHeader);
  return match?.[1] ?? null;
}

export async function POST(request: Request): Promise<Response> {
  const token = extractToken(request);
  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = validateJWT(token);
  if (!payload?.sub) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await revokeSessionByJwt(token);

  await logAuthEvent({
    userId: payload.sub,
    action: 'logout',
    status: 'success',
    userAgent: request.headers.get('user-agent') ?? undefined,
    ipAddress: request.headers.get('x-forwarded-for') ?? undefined,
  });

  const response = NextResponse.json({ success: true, message: 'Logged out successfully' });
  response.cookies.set('auth-token', '', { path: '/', maxAge: 0 });
  return response;
}