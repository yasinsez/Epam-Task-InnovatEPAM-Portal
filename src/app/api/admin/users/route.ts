import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { prisma } from '@/server/db/prisma';

/**
 * Lists users with their roles (admin only).
 *
 * @param request Incoming request.
 * @returns List of users with roles.
 */
export const GET = requireRole('admin')(async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 50;

  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      role: true,
    },
    orderBy: { createdAt: 'desc' },
    take: limit,
  });

  return NextResponse.json({
    success: true,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
    })),
  });
});
