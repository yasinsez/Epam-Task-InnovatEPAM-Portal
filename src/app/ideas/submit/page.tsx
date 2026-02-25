import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { SubmitIdeaForm } from '@/components/SubmitIdeaForm';
import { prisma } from '@/server/db/prisma';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * Page metadata for SEO
 */
export const metadata: Metadata = {
  title: 'Submit an Idea | InnovatEPAM Portal',
  description:
    'Share your innovation ideas with the InnovatEPAM Portal. Help us improve our processes, technology, costs, and culture.',
  keywords: ['innovation', 'ideas', 'submit', 'epam'],
};

/**
 * Ideas Submission Page
 *
 * Allows authenticated users to submit innovation ideas.
 * Prerequisites:
 * - User must be authenticated
 * - Categories must be seeded in the database
 *
 * Flow:
 * 1. Check user authentication
 * 2. Fetch active categories from database
 * 3. Render SubmitIdeaForm with categories
 */
export default async function IdeaSubmitPage(): Promise<JSX.Element> {
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch active categories
  const categories = await prisma.category.findMany({
    where: { isActive: true },
    orderBy: { order: 'asc' },
  });

  return (
    <div className="page-container">
      <div className="ideas-submit-page">
        <h1>Submit an Idea</h1>
        <p className="page-subtitle">
          Share your innovation ideas and help us improve our processes, technology, costs, and
          company culture.
        </p>

        <SubmitIdeaForm categories={categories} />
      </div>
    </div>
  );
}
