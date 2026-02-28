import { prisma } from '@/server/db/prisma';
import type { IdeaStatus } from '@prisma/client';
import {
  getNextStage,
  isFinalStage,
} from '@/lib/services/stage-service';
import { getBlindReviewConfig } from '@/lib/config/blind-review';

export type AdvanceResult = {
  id: string;
  status: IdeaStatus;
  currentStage: {
    id: string;
    name: string;
    position: number;
    totalStages: number;
  };
};

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
 * @param evaluatorId - User ID of evaluator (resolved; use null if not in DB e.g. mock user)
 * @param decision - "ACCEPTED" or "REJECTED"
 * @param comments - Required explanation (1-2000 chars)
 * @returns Updated idea with evaluation, or null if already evaluated (409 case)
 *
 * @remarks
 * Sets evaluatedUnderBlindReview from getBlindReviewConfig().enabled at creation time.
 * This flag ensures FR-009: evaluations done under blind review stay anonymous
 * even if blind review is later disabled.
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

  const evaluatorIdForDb = evaluatorId.startsWith('mock-') ? null : evaluatorId;

  const blindReviewConfig = getBlindReviewConfig();

  try {
    const updated = await prisma.$transaction(async (tx) => {
      await tx.evaluation.create({
        data: {
          ideaId,
          decision,
          comments,
          evaluatorId: evaluatorIdForDb,
          evaluatedUnderBlindReview: blindReviewConfig.enabled,
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
 * Advance idea from current stage to next in multi-stage pipeline.
 * First-wins concurrency: returns null if another evaluator already advanced.
 *
 * @param ideaId - Idea to advance
 * @param evaluatorId - Evaluator user ID (resolved; use null if mock)
 * @param comments - Optional comments (1-2000 chars)
 * @returns AdvanceResult or null if already advanced, in final stage, or no stages
 */
export async function advanceIdeaToNextStage(
  ideaId: string,
  evaluatorId: string,
  comments?: string,
): Promise<AdvanceResult | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { currentStage: true },
  });
  if (!idea) return null;
  if (idea.status === 'ACCEPTED' || idea.status === 'REJECTED') return null;
  if (!idea.currentStageId || !idea.currentStage) return null;

  const stages = await prisma.reviewStage.findMany({ orderBy: { displayOrder: 'asc' } });
  if (stages.length === 0) return null;

  const isFinal = await isFinalStage(idea.currentStage.id);
  if (isFinal) return null;

  const nextStage = await getNextStage(idea.currentStage);
  if (!nextStage) return null;

  const evaluatorIdForDb = evaluatorId.startsWith('mock-') ? null : evaluatorId;

  try {
    const result = await prisma.$transaction(async (tx) => {
      const updateResult = await tx.idea.updateMany({
        where: {
          id: ideaId,
          currentStageId: idea.currentStageId,
        },
        data: {
          currentStageId: nextStage.id,
          status: 'UNDER_REVIEW',
        },
      });
      if (updateResult.count === 0) return null;

      await tx.stageTransition.create({
        data: {
          ideaId,
          fromStageId: idea.currentStageId,
          toStageId: nextStage.id,
          comments: comments?.trim() || null,
          evaluatorId: evaluatorIdForDb,
        },
      });

      return { nextStage, totalStages: stages.length };
    });

    if (!result) return null;

    return {
      id: ideaId,
      status: 'UNDER_REVIEW',
      currentStage: {
        id: result.nextStage.id,
        name: result.nextStage.name,
        position: result.nextStage.displayOrder + 1,
        totalStages: result.totalStages,
      },
    };
  } catch {
    throw new Error('Failed to advance idea');
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
