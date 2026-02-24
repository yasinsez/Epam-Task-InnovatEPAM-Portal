import { NextResponse } from 'next/server';

import { refreshToken, validateJWT } from '@/lib/auth/token';

export async function POST(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token || !validateJWT(token)) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const refreshedToken = refreshToken(token);
  if (!refreshedToken) {
    return NextResponse.json({ success: true, refreshed: false });
  }

  return NextResponse.json(
    { success: true, refreshed: true },
    {
      headers: {
        'X-Auth-Token': refreshedToken,
      },
    },
  );
}
