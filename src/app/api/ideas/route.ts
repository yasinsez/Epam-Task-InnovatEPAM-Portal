import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import { getServerSession } from 'next-auth';

import { SubmitIdeaSchema, validateAttachments } from '@/lib/validators';
import { sanitizeText } from '@/lib/sanitizers';
import { createSubmissionSchema } from '@/lib/utils/dynamic-schema';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUploadConfig } from '@/lib/services/upload-config-service';
import { getIdeasForUser } from '@/lib/services/idea-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { prisma } from '@/server/db/prisma';
import { saveAttachmentFile } from '@/lib/services/attachment-service';
import { authOptions } from '@/server/auth/route';

/**
 * GET /api/ideas
 * Returns paginated list of ideas per role (submitter: own; evaluator/admin: all).
 * Query: page, pageSize, categoryId
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const role = await getUserRole(userId);
    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
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

    const { ideas, pagination } = await getIdeasForUser(resolvedUserId, role, {
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
      dynamicFieldValues: i.dynamicFieldValues ?? undefined,
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
  dynamicFieldValues: Record<string, unknown> | null;
  attachments: File[];
};

/**
 * Parses dynamicFieldValues from form data (JSON string or keyed params).
 *
 * @param formData - FormData from multipart request
 * @returns Parsed dynamicFieldValues object or null
 */
function parseDynamicFieldsFromFormData(formData: FormData): Record<string, unknown> | null {
  const raw = formData.get('dynamicFieldValues');
  if (typeof raw === 'string') {
    try {
      const parsed = JSON.parse(raw) as unknown;
      return parsed && typeof parsed === 'object' && !Array.isArray(parsed)
        ? (parsed as Record<string, unknown>)
        : null;
    } catch {
      return null;
    }
  }
  return null;
}

/**
 * Parses request body as JSON or multipart/form-data.
 *
 * @param request - Incoming request
 * @returns Parsed title, description, categoryId, dynamicFieldValues, attachment
 * @throws On parse failure
 */
async function parseRequestBody(request: Request): Promise<ParsedPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const categoryId = (formData.get('categoryId') as string) || '';
    const attachments = extractAttachmentsFromFormData(formData);
    const dynamicFieldValues = parseDynamicFieldsFromFormData(formData);

    return {
      title,
      description,
      categoryId,
      dynamicFieldValues,
      attachments,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body) {
    throw new Error('Invalid request body');
  }
  const dynamicFieldValues =
    body.dynamicFieldValues && typeof body.dynamicFieldValues === 'object' && !Array.isArray(body.dynamicFieldValues)
      ? (body.dynamicFieldValues as Record<string, unknown>)
      : null;

  return {
    title: body.title ?? '',
    description: body.description ?? '',
    categoryId: body.categoryId ?? '',
    dynamicFieldValues,
    attachments: [],
  };
}

/**
 * Extracts attachment(s) from FormData.
 * Accepts `attachment` (single, legacy), `attachments`, or `attachments[]`.
 * Includes empty files so validation can reject them.
 */
function extractAttachmentsFromFormData(formData: FormData): File[] {
  const files: File[] = [];
  const single = formData.get('attachment');
  if (single instanceof File) {
    files.push(single);
  }
  const multi = formData.getAll('attachments');
  const multiBrackets = formData.getAll('attachments[]');
  for (const item of [...multi, ...multiBrackets]) {
    if (item instanceof File) files.push(item);
  }
  return files;
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
    let userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    // Mock users (e.g. mock-submitter) don't exist in DB - resolve to real user for idea creation
    if (userId.startsWith('mock-') && userEmail) {
      const realUser = await prisma.user.findUnique({
        where: { email: userEmail.toLowerCase() },
        select: { id: true },
      });
      if (realUser) {
        userId = realUser.id;
      } else if (process.env.NODE_ENV === 'development') {
        // Create dev user for mock credentials so submission works
        const { hashPassword } = await import('@/lib/auth/password');
        const realUser = await prisma.user.upsert({
          where: { email: userEmail.toLowerCase() },
          create: {
            email: userEmail.toLowerCase(),
            name: session?.user?.name ?? 'Dev User',
            passwordHash: await hashPassword('Dev@12345'),
            role: userId === 'mock-submitter' ? 'SUBMITTER' : userId === 'mock-evaluator' ? 'EVALUATOR' : 'ADMIN',
          },
          update: {},
          select: { id: true },
        });
        userId = realUser.id;
      } else {
        return NextResponse.json(
          { success: false, error: 'Please register an account to submit ideas.' },
          { status: 403 },
        );
      }
    }

    const payload = await parseRequestBody(request);
    const { title, description, categoryId, dynamicFieldValues: rawDynamic, attachments } = payload;

    const parsed = SubmitIdeaSchema.safeParse({ title, description, categoryId });
    if (!parsed.success) {
      const errors = formatZodErrors(parsed.error);
      return NextResponse.json({ success: false, details: errors }, { status: 400 });
    }

    const uploadConfig = await getUploadConfig();
    const configForValidation = {
      maxFileCount: uploadConfig.maxFileCount,
      maxFileSizeBytes: uploadConfig.maxFileSizeBytes,
      maxTotalSizeBytes: uploadConfig.maxTotalSizeBytes,
      allowedExtensions: uploadConfig.allowedExtensions,
      mimeByExtension: uploadConfig.mimeByExtension,
    };
    if (attachments.length > 0) {
      const validation = validateAttachments(attachments, configForValidation);
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

    // Validate dynamic fields against current form config
    const formConfig = await getActiveConfig();
    const rawDynamicValues: Record<string, unknown> | null = rawDynamic ?? null;
    const validatedDynamicFields: Record<string, unknown> = {};

    if (formConfig && formConfig.fields.length > 0) {
      const dynamicSchema = createSubmissionSchema(formConfig.fields);
      const dynamicParsed = dynamicSchema.safeParse(rawDynamicValues ?? {});
      if (!dynamicParsed.success) {
        const details: Record<string, string[]> = {};
        dynamicParsed.error.issues.forEach((issue) => {
          const path = `dynamicFieldValues.${issue.path.join('.')}`;
          if (!details[path]) details[path] = [];
          details[path].push(issue.message);
        });
        return NextResponse.json({ success: false, details }, { status: 400 });
      }
      const validated = dynamicParsed.data as Record<string, unknown>;
      const knownIds = new Set(formConfig.fields.map((f) => f.id));
      for (const [k, v] of Object.entries(validated)) {
        if (knownIds.has(k) && v !== undefined && v !== null && v !== '') {
          if (Array.isArray(v) && v.length === 0) continue;
          validatedDynamicFields[k] = v;
        }
      }
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
        dynamicFieldValues:
          Object.keys(validatedDynamicFields).length > 0
            ? (validatedDynamicFields as object)
            : undefined,
      },
      include: {
        category: true,
      },
    });

    if (attachments.length > 0) {
      try {
        const allowedExts = uploadConfig.allowedExtensions;
        for (let i = 0; i < attachments.length; i++) {
          const file = attachments[i];
          const storedPath = await saveAttachmentFile(idea.id, file, allowedExts);
          await prisma.attachment.create({
            data: {
              ideaId: idea.id,
              originalFileName: file.name.slice(0, 255),
              storedPath,
              fileSizeBytes: file.size,
              mimeType: file.type || 'application/octet-stream',
              displayOrder: i,
            },
          });
        }
      } catch (err) {
        console.error('Failed to save attachment, rolling back idea:', err);
        const ideaWithAtts = await prisma.idea.findUnique({
          where: { id: idea.id },
          include: { attachments: true },
        });
        const { deleteAttachmentFile } = await import('@/lib/services/attachment-service');
        for (const att of ideaWithAtts?.attachments ?? []) {
          await deleteAttachmentFile(att.storedPath);
        }
        await prisma.idea.delete({ where: { id: idea.id } });
        return NextResponse.json(
          { success: false, error: 'Failed to save attachment. Please try again.' },
          { status: 500 },
        );
      }
    }

    const ideaWithAttachments = await prisma.idea.findUnique({
      where: { id: idea.id },
      include: { category: true, attachments: true },
    });

    const responseIdea = ideaWithAttachments ?? idea;
    type AttachmentShape = { id: string; originalFileName: string; fileSizeBytes: number; mimeType: string };
    const atts = (responseIdea && 'attachments' in responseIdea ? responseIdea.attachments : []) as AttachmentShape[];
    const attachmentsMeta = atts.map((a) => ({
      id: a.id,
      originalFileName: a.originalFileName,
      fileSizeBytes: a.fileSizeBytes,
      mimeType: a.mimeType,
    }));

    const responseCategory =
      'category' in responseIdea && responseIdea.category
        ? responseIdea.category
        : idea.category;
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
          category: responseCategory,
          userId: responseIdea.userId,
          status: responseIdea.status,
          submittedAt: responseIdea.submittedAt,
          createdAt: responseIdea.createdAt,
          updatedAt: responseIdea.updatedAt,
          attachments: attachmentsMeta,
          dynamicFieldValues: validatedDynamicFields,
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
