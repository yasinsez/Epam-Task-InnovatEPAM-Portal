import { prisma } from '@/server/db/prisma';
import type { IdeaStatus } from '@prisma/client';

export type IdeaWithEvaluation = {
  id: string;
  status: IdeaStatus;
  evaluation: {
    decision: string;
    comments: string;
    evaluatedAt: Date;
    evaluatorDisplayName: string;
  };
};

/**
 * Evaluates an idea (accept or reject) with comments.
 * Enforces first-wins concurrency: returns null if idea already evaluated.
 *
 * @param ideaId - Idea to evaluate
 * @param evaluatorId - User ID of evaluator
 * @param decision - "ACCEPTED" or "REJECTED"
 * @param comments - Required explanation (1-2000 chars)
 * @returns Updated idea with evaluation, or null if already evaluated (409 case)
 */
export async function evaluateIdea(
  ideaId: string,
  evaluatorId: string,
  decision: 'ACCEPTED' | 'REJECTED',
  comments: string,
): Promise<IdeaWithEvaluation | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { evaluation: true },
  });

  if (!idea) return null;
  if (idea.status === 'ACCEPTED' || idea.status === 'REJECTED') return null;

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.evaluation.create({
        data: {
          ideaId,
          decision,
          comments,
          evaluatorId,
        },
      });
      await tx.idea.update({
        where: { id: ideaId },
        data: { status: decision },
      });
      return tx.idea.findUnique({
        where: { id: ideaId },
        include: {
          evaluation: {
            include: { evaluator: { select: { name: true, email: true } } },
          },
        },
      });
    });

    if (!updated?.evaluation) return null;

    const evaluatorDisplayName = updated.evaluation.evaluator
      ? (updated.evaluation.evaluator.name || updated.evaluation.evaluator.email)
      : 'Administrator';

    return {
      id: updated.id,
      status: updated.status,
      evaluation: {
        decision: updated.evaluation.decision,
        comments: updated.evaluation.comments,
        evaluatedAt: updated.evaluation.evaluatedAt,
        evaluatorDisplayName,
      },
    };
  } catch (err) {
    if (err && typeof err === 'object' && 'code' in err && err.code === 'P2002') {
      return null;
    }
    throw err;
  }
}

/**
 * Transitions an idea status to UNDER_REVIEW.
 * Used when admin clicks "Start evaluation" before accepting/rejecting.
 *
 * @param ideaId - Idea to transition
 * @param evaluatorId - User ID (for auth/audit; not stored)
 * @returns Updated idea or null if not found or not in SUBMITTED status
 */
export async function startReviewIdea(
  ideaId: string,
  evaluatorId: string,
): Promise<{ id: string; status: 'UNDER_REVIEW' } | null> {
  void evaluatorId; // Reserved for future audit logging
  const result = await prisma.idea.updateMany({
    where: {
      id: ideaId,
      status: 'SUBMITTED',
    },
    data: { status: 'UNDER_REVIEW' },
  });
  if (result.count === 0) return null;
  return { id: ideaId, status: 'UNDER_REVIEW' };
}
