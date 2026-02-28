import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { prisma } from '@/server/db/prisma';
import { getIdeasForUser } from '@/lib/services/idea-service';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { IdeaListItem } from '@/components/IdeaListItem';
import { IdeaListSkeleton } from '@/components/IdeaListSkeleton';
import { PaginationControls } from '@/components/PaginationControls';
import { CategoryFilter } from '@/components/CategoryFilter';
import { RatingSortFilter } from '@/components/RatingSortFilter';
import { authOptions } from '@/server/auth/route';

type IdeasPageProps = {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    categoryId?: string;
    sortBy?: string;
    minRating?: string;
  }>;
};

async function IdeasListContent({
  searchParams,
}: {
  searchParams: Promise<{
    page?: string;
    pageSize?: string;
    categoryId?: string;
    sortBy?: string;
    minRating?: string;
  }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    redirect('/api/auth/signin');
  }

  const role = await getUserRole(userId);
  const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 15;
  const categoryId = params.categoryId || undefined;
  const sortBy =
    params.sortBy === 'ratingDesc' || params.sortBy === 'ratingAsc'
      ? params.sortBy
      : undefined;
  const minRatingParam = params.minRating
    ? parseInt(params.minRating, 10)
    : NaN;
  const minRating =
    !isNaN(minRatingParam) && minRatingParam >= 1 && minRatingParam <= 5
      ? minRatingParam
      : undefined;

  const [categories, formConfig, { ideas, pagination }] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    }),
    getActiveConfig(),
    getIdeasForUser(resolvedUserId, role, {
      page,
      pageSize,
      categoryId,
      sortBy,
      minRating,
    }),
  ]);

  const dynamicFieldLabels: Record<string, string> = {};
  if (formConfig) {
    for (const f of formConfig.fields) dynamicFieldLabels[f.id] = f.label;
  }
  for (const idea of ideas) {
    const dvs = idea.dynamicFieldValues ?? {};
    for (const key of Object.keys(dvs)) {
      if (!(key in dynamicFieldLabels)) dynamicFieldLabels[key] = 'Unknown field';
    }
  }

  const showRatingControls = role === 'evaluator' || role === 'admin';

  const emptyMessage = categoryId
    ? 'No ideas in this category'
    : role === 'submitter'
      ? 'No ideas yet. Submit your first idea!'
      : 'No ideas pending review';

  const buildBaseUrl = () => {
    const p = new URLSearchParams();
    if (categoryId) p.set('categoryId', categoryId);
    if (sortBy) p.set('sortBy', sortBy);
    if (minRating != null) p.set('minRating', String(minRating));
    const q = p.toString();
    return `/ideas${q ? `?${q}` : ''}`;
  };

  if (ideas.length === 0) {
    return (
      <div className="page-container">
        <h1 className="text-2xl font-bold mb-4">
          {role === 'submitter' ? 'My Ideas' : 'Ideas'}
        </h1>
        <div className="flex flex-wrap items-center gap-4 mb-4">
          <Suspense fallback={null}>
            <CategoryFilter
              categories={categories}
              currentCategoryId={categoryId || null}
            />
          </Suspense>
          {showRatingControls && (
            <Suspense fallback={null}>
              <RatingSortFilter
                currentSortBy={sortBy || null}
                currentMinRating={minRating ?? null}
              />
            </Suspense>
          )}
        </div>
        <p className="text-gray-600 mt-4">{emptyMessage}</p>
      </div>
    );
  }

  return (
    <div className="page-container">
      <div className="flex flex-wrap items-center justify-between gap-4 mb-4">
        <h1 className="text-2xl font-bold">
          {role === 'submitter' ? 'My Ideas' : 'Ideas'}
        </h1>
        <div className="flex flex-wrap items-center gap-4">
          <Suspense fallback={null}>
            <CategoryFilter
              categories={categories}
              currentCategoryId={categoryId || null}
            />
          </Suspense>
          {showRatingControls && (
            <Suspense fallback={null}>
              <RatingSortFilter
                currentSortBy={sortBy || null}
                currentMinRating={minRating ?? null}
              />
            </Suspense>
          )}
        </div>
      </div>
      <div className="space-y-4">
        {ideas.map((idea) => (
          <IdeaListItem
            key={idea.id}
            id={idea.id}
            title={idea.title}
            categoryName={idea.category?.name ?? '—'}
            submittedAt={idea.submittedAt}
            hasAttachment={idea.hasAttachment}
            status={idea.status}
            currentStage={idea.currentStage}
            dynamicFieldValues={idea.dynamicFieldValues}
            dynamicFieldLabels={dynamicFieldLabels}
            rating={idea.rating}
            ratingDisplay={idea.ratingDisplay}
          />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          baseUrl={buildBaseUrl()}
        />
      )}
    </div>
  );
}

/**
 * Idea list page. Shows role-based ideas: submitters see own; evaluators/admins see all.
 */
export default async function IdeasPage({ searchParams }: IdeasPageProps) {
  return (
    <Suspense fallback={<IdeaListSkeleton />}>
      <IdeasListContent searchParams={searchParams} />
    </Suspense>
  );
}
