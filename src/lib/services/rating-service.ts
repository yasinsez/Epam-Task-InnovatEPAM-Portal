import { prisma } from '@/server/db/prisma';

/** Idea statuses that allow rating assignment or update. */
const RATABLE_STATUSES = ['SUBMITTED', 'UNDER_REVIEW'] as const;

/** Idea statuses after which rating is immutable. */
const IMMUTABLE_AFTER = ['ACCEPTED', 'REJECTED'] as const;

export type AssignRatingResult = {
  id: string;
  rating: number;
  ratingDisplay: string;
  ratingAssignedAt: Date;
};

/**
 * Assigns or updates a 1–5 rating on an idea.
 * Only allowed when idea is SUBMITTED or UNDER_REVIEW.
 * Blocks updates when idea is ACCEPTED or REJECTED.
 *
 * @param ideaId - Idea ID (CUID)
 * @param evaluatorId - User ID of evaluator (resolved real DB id)
 * @param rating - Rating 1–5 (validated externally via ratingSchema)
 * @returns Updated idea rating fields, or null if idea not found or status blocks update
 * @throws Never throws; returns null on errors
 *
 * @example
 *   const result = await assignRating('idea-123', 'user-456', 4);
 *   if (!result) return NextResponse.json({ error: '...' }, 409);
 */
export async function assignRating(
  ideaId: string,
  evaluatorId: string,
  rating: number,
): Promise<AssignRatingResult | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    select: { id: true, status: true },
  });

  if (!idea) return null;

  if (IMMUTABLE_AFTER.includes(idea.status as (typeof IMMUTABLE_AFTER)[number])) {
    return null;
  }

  if (!RATABLE_STATUSES.includes(idea.status as (typeof RATABLE_STATUSES)[number])) {
    return null;
  }

  const now = new Date();
  await prisma.idea.update({
    where: { id: ideaId },
    data: {
      rating,
      ratingEvaluatorId: evaluatorId,
      ratingAssignedAt: now,
    },
  });

  return {
    id: idea.id,
    rating,
    ratingDisplay: `${rating}/5`,
    ratingAssignedAt: now,
  };
}
