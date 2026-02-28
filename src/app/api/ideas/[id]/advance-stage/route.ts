import { getServerSession } from 'next-auth';
import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import { resolveUserIdForDb } from '@/lib/auth/roles';
import { advanceIdeaToNextStage } from '@/lib/services/evaluation-service';
import { advanceStageSchema } from '@/lib/validators';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * POST /api/ideas/[id]/advance-stage
 * Advance idea to next stage (evaluator/admin only).
 * Returns 409 if already advanced by another evaluator; 400 if in final stage.
 */
export const POST = requireRole('admin', 'evaluator')(async (
  request: Request,
  context: { params: { id: string } | Promise<{ id: string }> },
): Promise<Response> => {
  try {
    const { id } = await Promise.resolve(context.params);

    const idea = await prisma.idea.findUnique({
      where: { id },
      include: { currentStage: true },
    });

    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 },
      );
    }

    let body: unknown = {};
    try {
      const text = await request.text();
      if (text) body = JSON.parse(text);
    } catch {
      // Empty body is ok (comments optional)
    }

    const parseResult = advanceStageSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      const message = firstError?.message ?? 'Invalid request';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

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
    const result = await advanceIdeaToNextStage(
      id,
      resolvedUserId,
      parseResult.data.comments,
    );

    if (!result) {
      const stages = await prisma.reviewStage.findMany();
      const inFinalStage =
        idea.currentStageId &&
        stages.length > 0 &&
        idea.currentStage?.displayOrder === Math.max(...stages.map((s) => s.displayOrder));
      if (inFinalStage) {
        return NextResponse.json(
          { success: false, error: 'Idea is in final stage. Use evaluate to accept or reject.' },
          { status: 400 },
        );
      }
      if (!idea.currentStageId && stages.length > 0) {
        return NextResponse.json(
          { success: false, error: 'Idea is not in multi-stage pipeline' },
          { status: 400 },
        );
      }
      return NextResponse.json(
        { success: false, error: 'This idea has already been advanced' },
        { status: 409 },
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Idea advanced to next stage',
      idea: {
        id: result.id,
        status: result.status,
        currentStage: result.currentStage,
      },
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to advance idea' },
      { status: 500 },
    );
  }
});
