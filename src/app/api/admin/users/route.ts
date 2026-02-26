import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * Lists users with their roles (admin only).
 * Includes currentUserId (resolved) so the client can disable role change for self.
 *
 * @param request Incoming request.
 * @returns List of users with roles.
 */
export const GET = requireRole('admin')(async (request: Request): Promise<Response> => {
  const { searchParams } = new URL(request.url);
  const requestedLimit = Number(searchParams.get('limit') ?? '50');
  const limit = Number.isFinite(requestedLimit) ? Math.min(Math.max(requestedLimit, 1), 50) : 50;

  const session = await getServerSession(authOptions);
  const currentUserId = session?.user?.id;
  const userEmail = session?.user?.email;
  const currentUserDbId =
    currentUserId && userEmail
      ? await resolveUserIdForDb(currentUserId, userEmail)
      : null;

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
    currentUserId: currentUserDbId,
    users: users.map((user) => ({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role.toLowerCase(),
    })),
  });
});
