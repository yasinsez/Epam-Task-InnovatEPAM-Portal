import { NextResponse } from 'next/server';
import { z } from 'zod';
import type { UserRole } from '@prisma/client';
import { getServerSession } from 'next-auth';

import { requireRole } from '@/lib/auth/role-guards';
import { prisma } from '@/server/db/prisma';

// Get auth options from route handler
const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

const roleSchema = z.object({
  role: z.enum(['submitter', 'evaluator', 'admin']),
});

/**
 * Updates a user's role (admin only).
 *
 * @param request Incoming request.
 * @param context Route context with userId param.
 * @returns Updated user role.
 */
export const PATCH = requireRole('admin')(
  async (request: Request, context: { params: { userId: string } }): Promise<Response> => {
    const session = await getServerSession(authOptions);
    const actingUserId = session?.user?.id ?? null;

    if (actingUserId && actingUserId === context.params.userId) {
      return NextResponse.json({ success: false, error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json().catch(() => null);
    const parsed = roleSchema.safeParse(body);

    if (!parsed.success) {
      return NextResponse.json({ success: false, error: 'Invalid role' }, { status: 400 });
    }

    const targetUser = await prisma.user.findUnique({
      where: { id: context.params.userId },
      select: { id: true },
    });

    if (!targetUser) {
      return NextResponse.json({ success: false, error: 'User not found' }, { status: 404 });
    }

    const updated = await prisma.user.update({
      where: { id: context.params.userId },
      data: { role: parsed.data.role.toUpperCase() as UserRole },
      select: { id: true, role: true },
    });

    return NextResponse.json({
      success: true,
      user: {
        id: updated.id,
        role: updated.role.toLowerCase(),
      },
    });
  },
);
