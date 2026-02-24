import { NextResponse } from 'next/server';

import { validateJWT } from '@/lib/auth/token';
import { prisma } from '@/server/db/prisma';

export async function POST(
  request: Request,
  context: { params: { sessionId: string } },
): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = validateJWT(token);
  if (!payload?.sub) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  await prisma.session.deleteMany({
    where: {
      id: context.params.sessionId,
      userId: payload.sub,
    },
  });

  return NextResponse.json({ success: true, message: 'Session revoked' });
}
