import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth';

import { SubmitIdeaSchema, validateAttachmentFile } from '@/lib/validators';
import { sanitizeText } from '@/lib/sanitizers';
import { getIdeasForUser } from '@/lib/services/idea-service';
import { getUserRole } from '@/lib/auth/roles';
import { prisma } from '@/server/db/prisma';
import { saveAttachmentFile } from '@/lib/services/attachment-service';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * GET /api/ideas
 * Returns paginated list of ideas per role (submitter: own; evaluator/admin: all).
 * Query: page, pageSize, categoryId
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const role = await getUserRole(userId);
    const { searchParams } = new URL(request.url);
    const pageParam = searchParams.get('page');
    const pageSizeParam = searchParams.get('pageSize');
    const categoryId = searchParams.get('categoryId') || undefined;

    let page = 1;
    let pageSize = 15;
    if (pageParam) {
      const p = parseInt(pageParam, 10);
      if (Number.isNaN(p) || p < 1) {
        return NextResponse.json(
          { success: false, error: 'Invalid pagination parameters' },
          { status: 400 },
        );
      }
      page = p;
    }
    if (pageSizeParam) {
      const ps = parseInt(pageSizeParam, 10);
      if (Number.isNaN(ps) || ps < 1 || ps > 100) {
        return NextResponse.json(
          { success: false, error: 'Invalid pagination parameters' },
          { status: 400 },
        );
      }
      pageSize = ps;
    }

    const { ideas, pagination } = await getIdeasForUser(userId, role, {
      page,
      pageSize,
      categoryId: categoryId || undefined,
    });

    const responseIdeas = ideas.map((i) => ({
      id: i.id,
      title: i.title,
      category: i.category,
      submittedAt: i.submittedAt.toISOString(),
      hasAttachment: i.hasAttachment,
    }));

    return NextResponse.json({
      success: true,
      ideas: responseIdeas,
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount: pagination.totalCount,
        totalPages: pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching ideas:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load ideas' },
      { status: 500 },
    );
  }
}

/**
 * Formats Zod validation errors into a field-level error object.
 *
 * @param zodError - ZodError from schema validation.
 * @returns Object with field names as keys and arrays of error messages as values.
 */
function formatZodErrors(zodError: ZodError): Record<string, string[]> {
  const errors: Record<string, string[]> = {};

  zodError.issues.forEach((issue) => {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = [];
    }
    errors[path].push(issue.message);
  });

  return errors;
}

type ParsedPayload = {
  title: string;
  description: string;
  categoryId: string;
  attachment: File | null;
};

/**
 * Parses request body as JSON or multipart/form-data.
 *
 * @param request - Incoming request
 * @returns Parsed title, description, categoryId, attachment (File | null)
 * @throws On parse failure
 */
async function parseRequestBody(request: Request): Promise<ParsedPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const categoryId = (formData.get('categoryId') as string) || '';
    const raw = formData.get('attachment');
    const attachment = raw instanceof File ? raw : null;

    return {
      title,
      description,
      categoryId,
      attachment,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    throw new Error('Invalid request body');
  }
  return {
    title: body.title ?? '',
    description: body.description ?? '',
    categoryId: body.categoryId ?? '',
    attachment: null,
  };
}

/**
 * POST /api/ideas
 * Submits a new idea. Accepts JSON or multipart/form-data when attachment present.
 *
 * @param request - Request with JSON body or multipart (title, description, categoryId, attachment?)
 * @returns 201 with idea (including attachment metadata if present)
 * @throws 400 on validation; 401 if unauthenticated; 500 on server error
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const payload = await parseRequestBody(request);
    const { title, description, categoryId, attachment } = payload;

    const parsed = SubmitIdeaSchema.safeParse({ title, description, categoryId });
    if (!parsed.success) {
      const errors = formatZodErrors(parsed.error);
      return NextResponse.json({ success: false, details: errors }, { status: 400 });
    }

    if (attachment) {
      const validation = validateAttachmentFile(attachment);
      if (!validation.valid) {
        return NextResponse.json(
          { success: false, error: validation.error },
          { status: 400 },
        );
      }
    }

    const category = await prisma.category.findUnique({
      where: { id: categoryId },
    });

    if (!category) {
      return NextResponse.json(
        { success: false, details: { categoryId: ['Category not found'] } },
        { status: 400 },
      );
    }

    if (!category.isActive) {
      return NextResponse.json(
        {
          success: false,
          details: { categoryId: ['This category is no longer accepting submissions'] },
        },
        { status: 400 },
      );
    }

    const sanitizedTitle = sanitizeText(title);
    const sanitizedDescription = sanitizeText(description);

    const idea = await prisma.idea.create({
      data: {
        title,
        description,
        sanitizedTitle,
        sanitizedDescription,
        categoryId,
        userId,
        status: 'SUBMITTED',
      },
      include: {
        category: true,
      },
    });

    if (attachment) {
      try {
        const storedPath = await saveAttachmentFile(idea.id, attachment);
        await prisma.attachment.create({
          data: {
            ideaId: idea.id,
            originalFileName: attachment.name.slice(0, 255),
            storedPath,
            fileSizeBytes: attachment.size,
            mimeType: attachment.type || 'application/octet-stream',
          },
        });
      } catch (err) {
        console.error('Failed to save attachment, rolling back idea:', err);
        await prisma.idea.delete({ where: { id: idea.id } });
        return NextResponse.json(
          { success: false, error: 'Failed to save attachment. Please try again.' },
          { status: 500 },
        );
      }
    }

    const ideaWithAttachment = await prisma.idea.findUnique({
      where: { id: idea.id },
      include: { category: true, attachment: true },
    });

    const responseIdea = ideaWithAttachment || idea;
    type AttachmentShape = { id: string; originalFileName: string; fileSizeBytes: number; mimeType: string };
    const att = (responseIdea && 'attachment' in responseIdea ? responseIdea.attachment : null) as AttachmentShape | null;
    const attachmentMeta =
      att
        ? { id: att.id, originalFileName: att.originalFileName, fileSizeBytes: att.fileSizeBytes, mimeType: att.mimeType }
        : null;

    return NextResponse.json(
      {
        success: true,
        message: 'Your idea has been submitted successfully',
        idea: {
          id: responseIdea.id,
          title: responseIdea.title,
          description: responseIdea.description,
          sanitizedTitle: responseIdea.sanitizedTitle,
          sanitizedDescription: responseIdea.sanitizedDescription,
          categoryId: responseIdea.categoryId,
          category: responseIdea.category,
          userId: responseIdea.userId,
          status: responseIdea.status,
          submittedAt: responseIdea.submittedAt,
          createdAt: responseIdea.createdAt,
          updatedAt: responseIdea.updatedAt,
          attachment: attachmentMeta,
        },
      },
      { status: 201 },
    );
  } catch (error) {
    console.error('Error submitting idea:', error);

    return NextResponse.json(
      { success: false, error: 'Failed to submit idea. Please try again.' },
      { status: 500 },
    );
  }
}
