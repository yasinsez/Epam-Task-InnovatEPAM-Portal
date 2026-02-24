import { NextResponse } from 'next/server';

import { validateJWT } from '@/lib/auth/token';
import { prisma } from '@/server/db/prisma';

export async function GET(request: Request): Promise<Response> {
  const authHeader = request.headers.get('authorization');
  const token = authHeader?.startsWith('Bearer ') ? authHeader.replace('Bearer ', '').trim() : null;

  if (!token) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const payload = validateJWT(token);
  if (!payload?.sub) {
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  const sessions = await prisma.session.findMany({
    where: { userId: payload.sub },
    select: {
      id: true,
      userAgent: true,
      ipAddress: true,
      createdAt: true,
      expiresAt: true,
    },
    orderBy: { createdAt: 'desc' },
  });

  return NextResponse.json({ success: true, sessions });
}
