import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import { getIdeaForDetail } from '@/lib/services/idea-service';
import { getUserRole } from '@/lib/auth/roles';
import { IdeaDetailSkeleton } from '@/components/IdeaDetailSkeleton';
import { EvaluationForm } from '@/components/EvaluationForm';
import { StartReviewButton } from '@/components/StartReviewButton';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Page metadata for idea detail
 */
export async function generateMetadata({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<Metadata> {
  const { id } = await params;
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  if (!userId) {
    return { title: 'Idea | InnovatEPAM Portal' };
  }
  const role = await getUserRole(userId);
  const idea = await getIdeaForDetail(id, userId, role);
  return {
    title: idea ? `${idea.title} | InnovatEPAM Portal` : 'Idea | InnovatEPAM Portal',
  };
}

async function IdeaDetailContent({ id }: { id: string }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const role = await getUserRole(userId);
  const idea = await getIdeaForDetail(id, userId, role);

  if (!idea) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(idea.submittedAt);

  return (
    <div className="page-container">
      <div className="idea-detail-page">
        <Link href="/ideas" className="back-link">
          ← Back to Ideas
        </Link>
        <h1>{idea.title}</h1>
        <p className="idea-meta">
          Category: {idea.category.name} | {formattedDate} | Status:{' '}
          <span
            className="inline-flex rounded px-2 py-0.5 text-xs font-medium"
            style={{
              backgroundColor:
                idea.status === 'ACCEPTED'
                  ? '#dcfce7'
                  : idea.status === 'REJECTED'
                    ? '#fee2e2'
                    : idea.status === 'UNDER_REVIEW'
                      ? '#fef3c7'
                      : '#e5e7eb',
              color:
                idea.status === 'ACCEPTED'
                  ? '#166534'
                  : idea.status === 'REJECTED'
                    ? '#991b1b'
                    : idea.status === 'UNDER_REVIEW'
                      ? '#92400e'
                      : '#374151',
            }}
          >
            {idea.status === 'SUBMITTED'
              ? 'Submitted'
              : idea.status === 'UNDER_REVIEW'
                ? 'Under Review'
                : idea.status === 'ACCEPTED'
                  ? 'Accepted'
                  : 'Rejected'}
          </span>
        </p>
        {(role === 'evaluator' || role === 'admin') && idea.submitter && (
          <p className="idea-submitter">Submitted by: {idea.submitter}</p>
        )}
        <section className="idea-description">
          <h2>Description</h2>
          <p>{idea.description}</p>
        </section>
        {idea.attachment && (
          <section className="idea-attachment">
            <h2>Attachment</h2>
            <a
              href={`/api/ideas/${idea.id}/attachment`}
              download={idea.attachment.originalFileName}
              className="attachment-download-link"
            >
              Download {idea.attachment.originalFileName}
            </a>
          </section>
        )}
        {(role === 'evaluator' || role === 'admin') &&
          (idea.status === 'SUBMITTED' || idea.status === 'UNDER_REVIEW') && (
            <>
              {idea.status === 'SUBMITTED' && (
                <div className="mb-4">
                  <StartReviewButton ideaId={idea.id} />
                </div>
              )}
              <EvaluationForm ideaId={idea.id} />
            </>
          )}
        {idea.evaluation && (
          <section className="idea-evaluation mt-6 rounded border border-gray-200 p-4">
            <h2>Evaluation</h2>
            <p className="mt-2">
              <strong>Decision:</strong>{' '}
              <span
                className={
                  idea.evaluation.decision === 'ACCEPTED'
                    ? 'text-green-700'
                    : 'text-red-700'
                }
              >
                {idea.evaluation.decision === 'ACCEPTED' ? 'Accepted' : 'Rejected'}
              </span>
            </p>
            <p className="mt-2">
              <strong>Comments:</strong> {idea.evaluation.comments}
            </p>
            <p className="mt-2 text-sm text-gray-600">
              Evaluated by {idea.evaluation.evaluatorDisplayName} on{' '}
              {new Intl.DateTimeFormat('en-US', {
                year: 'numeric',
                month: 'short',
                day: 'numeric',
                hour: '2-digit',
                minute: '2-digit',
              }).format(idea.evaluation.evaluatedAt)}
            </p>
          </section>
        )}
      </div>
    </div>
  );
}

/**
 * Idea Detail Page
 *
 * Displays a single idea with optional attachment download link.
 * Access: owner, evaluator, admin.
 */
export default async function IdeaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}): Promise<JSX.Element> {
  const { id } = await params;
  return (
    <Suspense fallback={<IdeaDetailSkeleton />}>
      <IdeaDetailContent id={id} />
    </Suspense>
  );
}
