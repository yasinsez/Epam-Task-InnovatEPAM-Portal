import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import { getIdeaForDetail } from '@/lib/services/idea-service';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { IdeaDetailSkeleton } from '@/components/IdeaDetailSkeleton';
import { IdeaAttachmentsList } from '@/components/IdeaAttachmentsList';
import { EvaluationForm } from '@/components/EvaluationForm';
import { StartReviewButton } from '@/components/StartReviewButton';
import { StageProgressDisplay } from '@/components/StageProgressDisplay';

import { authOptions } from '@/server/auth/route';

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
  const userEmail = session?.user?.email;
  if (!userId) {
    return { title: 'Idea | InnovatEPAM Portal' };
  }
  const role = await getUserRole(userId);
  const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
  const idea = await getIdeaForDetail(id, resolvedUserId, role);
  return {
    title: idea ? `${idea.title} | InnovatEPAM Portal` : 'Idea | InnovatEPAM Portal',
  };
}

async function IdeaDetailContent({ id }: { id: string }) {
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;
  const userEmail = session?.user?.email;

  if (!userId) {
    notFound();
  }

  const role = await getUserRole(userId);
  const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
  const [idea, formConfig] = await Promise.all([
    getIdeaForDetail(id, resolvedUserId, role),
    getActiveConfig(),
  ]);

  if (!idea) {
    notFound();
  }

  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  }).format(idea.submittedAt);

  const dynamicFieldLabels: Record<string, string> = {};
  if (formConfig) {
    for (const f of formConfig.fields) dynamicFieldLabels[f.id] = f.label;
  }
  const dvs = idea.dynamicFieldValues ?? {};
  for (const key of Object.keys(dvs)) {
    if (!(key in dynamicFieldLabels)) dynamicFieldLabels[key] = 'Unknown field';
  }

  const formatValue = (v: unknown): string => {
    if (v == null) return '—';
    if (typeof v === 'boolean') return v ? 'Yes' : 'No';
    if (Array.isArray(v)) return v.join(', ');
    return String(v);
  };

  return (
    <div className="page-container">
      <div className="idea-detail-page">
        <Link href="/ideas" className="back-link">
          ← Back to Ideas
        </Link>
        <h1>{idea.title}</h1>
        <p className="idea-meta">
          Category: {idea.category?.name ?? '—'} | {formattedDate} | Status:{' '}
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
        {idea.currentStage && (
          <StageProgressDisplay
            currentStage={idea.currentStage}
            completedStageNames={idea.completedStageNames}
          />
        )}
        <section className="idea-description">
          <h2>Description</h2>
          <p>{idea.description}</p>
        </section>
        {Object.keys(dvs).length > 0 && (
          <section className="idea-dynamic-fields mt-6">
            <h2>Additional Details</h2>
            <dl className="mt-2 space-y-2">
              {Object.entries(dvs).map(([key, val]) => (
                <div key={key} className="flex gap-2">
                  <dt className="font-medium text-gray-700 min-w-[140px]">
                    {dynamicFieldLabels[key]}
                  </dt>
                  <dd className="text-gray-600">{formatValue(val)}</dd>
                </div>
              ))}
            </dl>
          </section>
        )}
        {idea.attachments && idea.attachments.length > 0 && (
          <IdeaAttachmentsList
            attachments={idea.attachments}
            ideaId={idea.id}
            showImagePreviews
          />
        )}
        {(role === 'evaluator' || role === 'admin') &&
          (idea.status === 'SUBMITTED' || idea.status === 'UNDER_REVIEW') && (
            <>
              {idea.status === 'SUBMITTED' && !idea.currentStage && (
                <div className="mb-4">
                  <StartReviewButton ideaId={idea.id} />
                </div>
              )}
              <EvaluationForm ideaId={idea.id} currentStage={idea.currentStage} />
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
