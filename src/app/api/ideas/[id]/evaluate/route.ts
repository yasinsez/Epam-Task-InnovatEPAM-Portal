import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { evaluateIdea } from '@/lib/services/evaluation-service';
import { evaluateIdeaSchema } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * POST /api/ideas/[id]/evaluate
 * Accept or reject an idea with required comments.
 * Admin or evaluator only. Returns 409 if idea already evaluated.
 *
 * @param request - Request with JSON body { decision, comments }
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

      const parseResult = evaluateIdeaSchema.safeParse(body);
      if (!parseResult.success) {
        const firstError = parseResult.error.errors[0];
        const message =
          firstError?.message ?? 'Invalid request. Check decision and comments.';
        return NextResponse.json(
          { success: false, error: message },
          { status: 400 },
        );
      }

      const { decision, comments } = parseResult.data;

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
      const result = await evaluateIdea(
        id,
        resolvedUserId,
        decision,
        comments.trim(),
      );

      if (!result) {
        return NextResponse.json(
          { success: false, error: 'This idea has already been evaluated' },
          { status: 409 },
        );
      }

      return NextResponse.json({
        success: true,
        idea: {
          id: result.id,
          status: result.status,
          evaluation: result.evaluation,
        },
      });
    } catch {
      return NextResponse.json(
        { success: false, error: 'Failed to evaluate idea' },
        { status: 500 },
      );
    }
  },
);
