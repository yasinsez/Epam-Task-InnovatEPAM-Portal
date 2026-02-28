import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { assignRating } from '@/lib/services/rating-service';
import { assignRatingSchema } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * POST /api/ideas/[id]/assign-rating
 * Assign or update a 1–5 rating on an idea.
 * Admin or evaluator only. Rating allowed only when idea is SUBMITTED or UNDER_REVIEW.
 * Returns 409 if idea is ACCEPTED or REJECTED (rating immutable).
 *
 * @param request - Request with JSON body { rating: number }
 * @param context - Route params with id (idea ID)
 */
export const POST = requireRole('admin', 'evaluator')(
  async (
    request: Request,
    context: { params: { id: string } | Promise<{ id: string }> },
  ): Promise<Response> => {
    try {
      const { id } = await Promise.resolve(context.params);

      const idea = await prisma.idea.findUnique({
        where: { id },
        select: { id: true, status: true },
      });

      if (!idea) {
        return NextResponse.json(
          { success: false, error: 'Idea not found' },
          { status: 404 },
        );
      }

      let body: unknown;
      try {
        body = await request.json();
      } catch {
        return NextResponse.json(
          { success: false, error: 'Invalid JSON body' },
          { status: 400 },
        );
      }

      const parseResult = assignRatingSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        const message =
          firstError?.message ?? 'Rating must be between 1 and 5';
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 },
        );
      }

      const { rating } = parseResult.data;

      const session = await getServerSession(authOptions);
      const userId = session?.user?.id;
      const userEmail = session?.user?.email;
      if (!userId) {
        return NextResponse.json(
          { success: false, error: 'Authentication required' },
          { status: 401 },
        );
      }

      const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
      const result = await assignRating(id, resolvedUserId, rating);

      if (!result) {
        const isImmutable =
          idea.status === 'ACCEPTED' || idea.status === 'REJECTED';
        return NextResponse.json(
          {
            success: false,
            error: isImmutable
              ? 'Rating cannot be changed after idea has been accepted or rejected'
              : 'Idea must be in Submitted or Under Review to assign a rating',
          },
          { status: isImmutable ? 409 : 400 },
        );
      }

      return NextResponse.json({
        success: true,
        idea: {
          id: result.id,
          rating: result.rating,
          ratingDisplay: result.ratingDisplay,
          ratingAssignedAt: result.ratingAssignedAt.toISOString(),
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to assign rating' },
        { status: 500 },
      );
    }
  },
);
