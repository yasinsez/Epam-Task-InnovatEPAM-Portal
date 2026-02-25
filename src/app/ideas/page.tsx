import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { prisma } from '@/server/db/prisma';
import { getIdeasForUser } from '@/lib/services/idea-service';
import { getUserRole } from '@/lib/auth/roles';
import { IdeaListItem } from '@/components/IdeaListItem';
import { IdeaListSkeleton } from '@/components/IdeaListSkeleton';
import { PaginationControls } from '@/components/PaginationControls';
import { CategoryFilter } from '@/components/CategoryFilter';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

type IdeasPageProps = {
  searchParams: Promise<{ page?: string; pageSize?: string; categoryId?: string }>;
};

async function IdeasListContent({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; pageSize?: string; categoryId?: string }>;
}) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    redirect('/api/auth/signin');
  }

  const role = await getUserRole(userId);
  const params = await searchParams;
  const page = params.page ? parseInt(params.page, 10) : 1;
  const pageSize = params.pageSize ? parseInt(params.pageSize, 10) : 15;
  const categoryId = params.categoryId || undefined;

  const [categories, { ideas, pagination }] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
      select: { id: true, name: true },
    }),
    getIdeasForUser(userId, role, {
      page,
      pageSize,
      categoryId,
    }),
  ]);

  const emptyMessage = categoryId
    ? 'No ideas in this category'
    : role === 'submitter'
      ? 'No ideas yet. Submit your first idea!'
      : 'No ideas pending review';

  const baseUrl = categoryId ? `/ideas?categoryId=${categoryId}` : '/ideas';

  if (ideas.length === 0) {
    return (
      <div className="page-container">
        <h1 className="text-2xl font-bold mb-4">
          {role === 'submitter' ? 'My Ideas' : 'Ideas'}
        </h1>
        <Suspense fallback={null}>
          <CategoryFilter
            categories={categories}
            currentCategoryId={categoryId || null}
          />
        </Suspense>
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
        <Suspense fallback={null}>
          <CategoryFilter
            categories={categories}
            currentCategoryId={categoryId || null}
          />
        </Suspense>
      </div>
      <div className="space-y-4">
        {ideas.map((idea) => (
          <IdeaListItem
            key={idea.id}
            id={idea.id}
            title={idea.title}
            categoryName={idea.category.name}
            submittedAt={idea.submittedAt}
            hasAttachment={idea.hasAttachment}
            status={idea.status}
          />
        ))}
      </div>
      {pagination.totalPages > 1 && (
        <PaginationControls
          page={pagination.page}
          totalPages={pagination.totalPages}
          totalCount={pagination.totalCount}
          pageSize={pagination.pageSize}
          baseUrl={baseUrl}
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
