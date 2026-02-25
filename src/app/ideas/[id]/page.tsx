import { Metadata } from 'next';
import Link from 'next/link';
import { Suspense } from 'react';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import { getIdeaForDetail } from '@/lib/services/idea-service';
import { getUserRole } from '@/lib/auth/roles';
import { IdeaDetailSkeleton } from '@/components/IdeaDetailSkeleton';

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
          Category: {idea.category.name} | {formattedDate}
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
