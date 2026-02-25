import { Metadata } from 'next';
import Link from 'next/link';
import { getServerSession } from 'next-auth';
import { notFound } from 'next/navigation';

import { prisma } from '@/server/db/prisma';
import { getUserRole } from '@/lib/auth/roles';

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
  const idea = await prisma.idea.findUnique({
    where: { id },
    select: { title: true },
  });
  return {
    title: idea ? `${idea.title} | InnovatEPAM Portal` : 'Idea | InnovatEPAM Portal',
  };
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
  const session = await getServerSession(authOptions);
  const userId = session?.user?.id;

  if (!userId) {
    notFound();
  }

  const { id } = await params;
  const idea = await prisma.idea.findUnique({
    where: { id },
    include: { category: true, attachment: true, user: true },
  });

  if (!idea) {
    notFound();
  }

  const role = await getUserRole(userId);
  const isOwner = idea.userId === userId;
  const canAccess = isOwner || role === 'evaluator' || role === 'admin';

  if (!canAccess) {
    notFound();
  }

  return (
    <div className="page-container">
      <div className="idea-detail-page">
        <Link href="/ideas/submit" className="back-link">
          ← Back to Submit Idea
        </Link>
        <h1>{idea.title}</h1>
        <p className="idea-meta">
          Category: {idea.category.name} | Status: {idea.status}
        </p>
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
