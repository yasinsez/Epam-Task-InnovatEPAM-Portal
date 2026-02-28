import { Metadata } from 'next';
import { getServerSession } from 'next-auth';
import { redirect } from 'next/navigation';

import { SubmitIdeaForm } from '@/components/SubmitIdeaForm';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUploadConfig } from '@/lib/services/upload-config-service';
import { prisma } from '@/server/db/prisma';
import { authOptions } from '@/server/auth/route';

/**
 * Page metadata for SEO
 */
export const metadata: Metadata = {
  title: 'Submit an Idea | InnovatEPAM Portal',
  description:
    'Share your innovation ideas with the InnovatEPAM Portal. Help us improve our processes, technology, costs, and culture.',
  keywords: ['innovation', 'ideas', 'submit', 'epam'],
};

type IdeaSubmitPageProps = {
  searchParams: Promise<{ draftId?: string }>;
};

/**
 * Ideas Submission Page
 *
 * Allows authenticated users to submit innovation ideas.
 * Supports ?draftId=xxx to load and edit an existing draft.
 * Prerequisites:
 * - User must be authenticated
 * - Categories must be seeded in the database
 *
 * Flow:
 * 1. Check user authentication
 * 2. Fetch active categories from database
 * 3. Render SubmitIdeaForm with categories and optional draftId
 */
export default async function IdeaSubmitPage({ searchParams }: IdeaSubmitPageProps): Promise<JSX.Element> {
  const params = await searchParams;
  const draftId = params.draftId || null;
  // Check authentication
  const session = await getServerSession(authOptions);

  if (!session?.user?.id) {
    redirect('/auth/login');
  }

  // Fetch active categories, form config, and upload config
  const [categories, formConfig, uploadConfig] = await Promise.all([
    prisma.category.findMany({
      where: { isActive: true },
      orderBy: { order: 'asc' },
    }),
    getActiveConfig(),
    getUploadConfig(),
  ]);

  const uploadConfigDisplay = {
    maxFileCount: uploadConfig.maxFileCount,
    maxFileSizeBytes: uploadConfig.maxFileSizeBytes,
    maxTotalSizeBytes: uploadConfig.maxTotalSizeBytes,
    allowedExtensions: uploadConfig.allowedExtensions,
    allowedTypesLabel: uploadConfig.allowedExtensions
      .map((e) => e.replace(/^\./, '').toUpperCase())
      .join(', '),
  };

  return (
    <div className="page-container">
      <div className="ideas-submit-page">
        <h1>Submit an Idea</h1>
        <p className="page-subtitle">
          Share your innovation ideas and help us improve our processes, technology, costs, and
          company culture.
        </p>
        {categories.length === 0 ? (
          <div className="error-message alert" role="alert">
            No categories are available yet. Please contact an administrator to set up categories before submitting ideas.
          </div>
        ) : (
          <SubmitIdeaForm
            categories={categories}
            formConfig={formConfig}
            uploadConfig={uploadConfigDisplay}
            draftId={draftId}
          />
        )}
      </div>
    </div>
  );
}
