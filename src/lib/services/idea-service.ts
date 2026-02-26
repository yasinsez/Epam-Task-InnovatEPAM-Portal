import { prisma } from '@/server/db/prisma';
import { deleteAttachmentFile } from '@/lib/services/attachment-service';
import type { UserRole } from '@/lib/auth/roles';
import type { IdeaStatus } from '@prisma/client';

// --- Types for idea listing and detail ---

export type IdeaListItem = {
  id: string;
  title: string;
  category: { id: string; name: string };
  submittedAt: Date;
  hasAttachment: boolean;
  status: IdeaStatus;
};

export type IdeaDetail = {
  id: string;
  title: string;
  description: string;
  category: { id: string; name: string };
  submittedAt: Date;
  submitter?: string; // name || email; only for evaluator/admin
  status: IdeaStatus;
  evaluation?: {
    decision: string;
    comments: string;
    evaluatedAt: Date;
    evaluatorDisplayName: string;
  } | null;
  attachment?: {
    id: string;
    originalFileName: string;
    fileSizeBytes: number;
    mimeType: string;
  } | null;
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

export type GetIdeasOptions = {
  page?: number;
  pageSize?: number;
  categoryId?: string;
};

export type SubmissionStats = {
  total: number;
  drafts: number;
  pendingReview: number;
  approved: number;
  rejected: number;
};

export type EvaluatorStats = {
  pendingReviews: number;
  completedReviews: number;
  averageReviewTimeHours: number;
};

/**
 * Fetches evaluation queue stats for evaluators/admins.
 * Pending = ideas in SUBMITTED or UNDER_REVIEW (awaiting evaluation).
 * Completed = ideas with evaluation (ACCEPTED or REJECTED).
 *
 * @returns Counts and average review time
 */
export async function getEvaluatorStats(): Promise<EvaluatorStats> {
  const [pendingReviews, completedReviews, reviewedIdeas] = await Promise.all([
    prisma.idea.count({
      where: { status: { in: ['SUBMITTED', 'UNDER_REVIEW'] } },
    }),
    prisma.idea.count({
      where: { evaluation: { isNot: null } },
    }),
    prisma.idea.findMany({
      where: { evaluation: { isNot: null } },
      select: {
        submittedAt: true,
        evaluation: { select: { evaluatedAt: true } },
      },
    }),
  ]);

  let averageReviewTimeHours = 0;
  if (reviewedIdeas.length > 0) {
    const totalMs = reviewedIdeas.reduce(
      (sum, i) =>
        sum + (i.evaluation!.evaluatedAt.getTime() - i.submittedAt.getTime()),
      0
    );
    averageReviewTimeHours = Math.round((totalMs / (1000 * 60 * 60)) / reviewedIdeas.length * 10) / 10;
  }

  return {
    pendingReviews,
    completedReviews,
    averageReviewTimeHours,
  };
}

/**
 * Fetches submission stats (counts by status) for a submitter's ideas.
 * Drafts are always 0 as the schema does not support draft status.
 *
 * @param userId - Resolved user ID (real DB id, not mock)
 * @returns Counts by status
 */
export async function getSubmissionStats(userId: string): Promise<SubmissionStats> {
  const where = { userId };

  const [total, submitted, underReview, accepted, rejected] = await Promise.all([
    prisma.idea.count({ where }),
    prisma.idea.count({ where: { ...where, status: 'SUBMITTED' } }),
    prisma.idea.count({ where: { ...where, status: 'UNDER_REVIEW' } }),
    prisma.idea.count({ where: { ...where, status: 'ACCEPTED' } }),
    prisma.idea.count({ where: { ...where, status: 'REJECTED' } }),
  ]);

  return {
    total,
    drafts: 0,
    pendingReview: submitted + underReview,
    approved: accepted,
    rejected,
  };
}

/**
 * Fetches paginated ideas for the current user with role-based visibility.
 * Submitters see only their own ideas; evaluators and admins see all submitted ideas.
 *
 * @param userId - Current user ID from session
 * @param role - User role (submitter, evaluator, admin)
 * @param options - Pagination and filter options (page, pageSize, categoryId)
 * @returns Ideas array and pagination metadata
 * @throws May throw on Prisma/database errors
 *
 * @example
 *   const { ideas, pagination } = await getIdeasForUser(userId, role, { page: 1, pageSize: 15 });
 */
export async function getIdeasForUser(
  userId: string,
  role: UserRole,
  options: GetIdeasOptions = {},
): Promise<{ ideas: IdeaListItem[]; pagination: PaginationMeta }> {
  const { page = 1, pageSize = 15, categoryId } = options;

  const safePage = Math.max(1, Math.floor(Number(page)) || 1);
  const safePageSize = Math.min(100, Math.max(1, Math.floor(Number(pageSize)) || 15));

  const where: { userId?: string; categoryId?: string } = {};
  if (role === 'submitter') {
    where.userId = userId;
  }
  if (categoryId) {
    where.categoryId = categoryId;
  }

  const totalCount = await prisma.idea.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / safePageSize));
  const normalizedPage = Math.max(1, Math.min(safePage, totalPages));

  const resultIdeas = await prisma.idea.findMany({
    where,
    orderBy: { submittedAt: 'desc' },
    skip: (normalizedPage - 1) * safePageSize,
    take: safePageSize,
    include: {
      category: { select: { id: true, name: true } },
      attachment: { select: { id: true } },
    },
  });

  return {
    ideas: resultIdeas.map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      submittedAt: i.submittedAt,
      hasAttachment: !!i.attachment,
      status: i.status,
    })),
    pagination: {
      page: normalizedPage,
      pageSize: safePageSize,
      totalCount,
      totalPages,
    },
  };
}

/**
 * Fetches a single idea for detail view with access check.
 * Submitters see their own; evaluators/admins see all and get submitter display name.
 *
 * @param ideaId - Idea ID
 * @param userId - Current user ID from session
 * @param role - User role (submitter, evaluator, admin)
 * @returns Idea detail or null if not found/access denied
 * @throws May throw on Prisma/database errors
 *
 * @example
 *   const idea = await getIdeaForDetail(ideaId, userId, role);
 */
export async function getIdeaForDetail(
  ideaId: string,
  userId: string,
  role: UserRole,
): Promise<IdeaDetail | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: {
      category: { select: { id: true, name: true } },
      attachment: true,
      user: { select: { name: true, email: true } },
      evaluation: {
        include: {
          evaluator: { select: { name: true, email: true } },
        },
      },
    },
  });

  if (!idea) return null;

  const isOwner = idea.userId === userId;
  const canAccess = isOwner || role === 'evaluator' || role === 'admin';
  if (!canAccess) return null;

  const submitter =
    role === 'evaluator' || role === 'admin' ? (idea.user?.name || idea.user?.email) : undefined;

  const evaluatorDisplayName = idea.evaluation?.evaluator
    ? (idea.evaluation.evaluator.name || idea.evaluation.evaluator.email)
    : idea.evaluation
      ? 'Administrator'
      : undefined;

  return {
    id: idea.id,
    title: idea.title,
    description: idea.description,
    category: idea.category,
    submittedAt: idea.submittedAt,
    submitter,
    status: idea.status,
    evaluation: idea.evaluation
      ? {
          decision: idea.evaluation.decision,
          comments: idea.evaluation.comments,
          evaluatedAt: idea.evaluation.evaluatedAt,
          evaluatorDisplayName: evaluatorDisplayName ?? 'Administrator',
        }
      : null,
    attachment: idea.attachment
      ? {
          id: idea.attachment.id,
          originalFileName: idea.attachment.originalFileName,
          fileSizeBytes: idea.attachment.fileSizeBytes,
          mimeType: idea.attachment.mimeType,
        }
      : null,
  };
}

/**
 * Deletes an idea and removes its attachment file from the filesystem if present.
 * Attachment record is cascade-deleted by Prisma; this ensures the file is removed.
 *
 * @param ideaId - Idea ID to delete
 * @throws If idea not found or delete fails
 *
 * @example
 *   await deleteIdeaWithCleanup('idea-123');
 */
export async function deleteIdeaWithCleanup(ideaId: string): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { attachment: true },
  });

  if (!idea) {
    throw new Error('Idea not found');
  }

  if (idea.attachment) {
    await deleteAttachmentFile(idea.attachment.storedPath);
  }

  await prisma.idea.delete({ where: { id: ideaId } });
}
