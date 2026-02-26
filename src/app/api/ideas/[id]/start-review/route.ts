import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { startReviewIdea } from '@/lib/services/evaluation-service';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * PATCH /api/ideas/[id]/start-review
 * Transitions idea status from SUBMITTED to UNDER_REVIEW.
 * Admin or evaluator only.
 */
export const PATCH = requireRole('admin', 'evaluator')(
  async (
    _request: Request,
    context: { params: { id: string } | Promise<{ id: string }> },
  ): Promise<Response> => {
    try {
      const { id } = await Promise.resolve(context.params);

      const idea = await prisma.idea.findUnique({
        where: { id },
      });
      if (!idea) {
        return NextResponse.json(
          { success: false, error: 'Idea not found' },
          { status: 404 },
        );
      }

      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 },
        );
      }

      const result = await startReviewIdea(id, userId);
      if (!result) {
        return NextResponse.json(
          { success: false, error: 'Idea cannot be started for review (already under review or evaluated)' },
          { status: 400 },
        );
      }

      return NextResponse.json({
        success: true,
        idea: { id: result.id, status: result.status },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to start review' },
        { status: 500 },
      );
    }
  },
);
