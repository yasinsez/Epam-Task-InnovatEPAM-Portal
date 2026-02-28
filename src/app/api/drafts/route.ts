import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { DraftSaveSchema } from '@/lib/validators';
import { getDraftsForUser, createDraft } from '@/lib/services/draft-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { authOptions } from '@/server/auth/route';

type DraftPayload = {
  title?: string;
  description?: string;
  categoryId?: string | null;
  dynamicFieldValues?: Record<string, unknown> | null;
  attachments?: File[];
};

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

function extractAttachmentsFromFormData(formData: FormData): File[] {
  const files: File[] = [];
  const single = formData.get('attachment');
  if (single instanceof File) files.push(single);
  const multi = formData.getAll('attachments');
  const multiBrackets = formData.getAll('attachments[]');
  for (const item of [...multi, ...multiBrackets]) {
    if (item instanceof File) files.push(item);
  }
  return files;
}

async function parseDraftBody(request: Request): Promise<DraftPayload> {
  const contentType = request.headers.get('content-type') || '';

  if (contentType.includes('multipart/form-data')) {
    const formData = await request.formData();
    const title = (formData.get('title') as string) || '';
    const description = (formData.get('description') as string) || '';
    const categoryId = (formData.get('categoryId') as string) || '';
    const dynamicFieldValues = parseDynamicFieldsFromFormData(formData);
    const attachments = extractAttachmentsFromFormData(formData);

    return {
      title: title || undefined,
      description: description || undefined,
      categoryId: categoryId || null,
      dynamicFieldValues: dynamicFieldValues ?? undefined,
      attachments: attachments.length > 0 ? attachments : undefined,
    };
  }

  const body = await request.json().catch(() => null);
  if (!body) throw new Error('Invalid request body');

  const dynamicFieldValues =
    body.dynamicFieldValues && typeof body.dynamicFieldValues === 'object' && !Array.isArray(body.dynamicFieldValues)
      ? (body.dynamicFieldValues as Record<string, unknown>)
      : undefined;

  return {
    title: body.title ?? undefined,
    description: body.description ?? undefined,
    categoryId: body.categoryId ?? null,
    dynamicFieldValues: dynamicFieldValues ?? undefined,
  };
}

/**
 * GET /api/drafts
 * Lists current user's drafts. Submitter only.
 */
export async function GET(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== 'submitter') {
      return NextResponse.json(
        { success: false, error: 'Drafts are only available to submitters' },
        { status: 403 },
      );
    }

    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
    const { searchParams } = new URL(request.url);
    const page = Math.max(1, parseInt(searchParams.get('page') || '1', 10) || 1);
    const pageSize = Math.min(100, Math.max(1, parseInt(searchParams.get('pageSize') || '15', 10) || 15));

    const { drafts, pagination } = await getDraftsForUser(resolvedUserId, { page, pageSize });

    return NextResponse.json({
      success: true,
      drafts: drafts.map((d) => ({
        id: d.id,
        title: d.title,
        updatedAt: d.updatedAt.toISOString(),
        createdAt: d.createdAt.toISOString(),
        attachmentCount: d.attachmentCount,
      })),
      pagination: {
        page: pagination.page,
        pageSize: pagination.pageSize,
        totalCount: pagination.totalCount,
        totalPages: pagination.totalPages,
      },
    });
  } catch (error) {
    console.error('Error fetching drafts:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load drafts' },
      { status: 500 },
    );
  }
}

/**
 * POST /api/drafts
 * Creates a new draft. Submitter only. Enforces 10-draft limit.
 */
export async function POST(request: Request): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== 'submitter') {
      return NextResponse.json(
        { success: false, error: 'Drafts are only available to submitters' },
        { status: 403 },
      );
    }

    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
    const payload = await parseDraftBody(request);

    const parsed = DraftSaveSchema.safeParse({
      title: payload.title,
      description: payload.description,
      categoryId: payload.categoryId,
      dynamicFieldValues: payload.dynamicFieldValues,
    });

    if (!parsed.success) {
      const details: Record<string, string[]> = {};
      parsed.error.issues.forEach((i) => {
        const path = i.path.join('.');
        if (!details[path]) details[path] = [];
        details[path].push(i.message);
      });
      return NextResponse.json({ success: false, details }, { status: 400 });
    }

    try {
      const draft = await createDraft(resolvedUserId, parsed.data, payload.attachments);

      return NextResponse.json(
        {
          success: true,
          message: 'Draft saved',
          draft: {
            id: draft.id,
            title: draft.title,
            description: draft.description,
            categoryId: draft.categoryId,
            dynamicFieldValues: draft.dynamicFieldValues,
            status: draft.status,
            createdAt: draft.createdAt.toISOString(),
            updatedAt: draft.updatedAt.toISOString(),
            attachments: draft.attachments,
          },
        },
        { status: 201 },
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to save draft';
      if (message.includes('Draft limit reached')) {
        return NextResponse.json(
          { success: false, error: 'Draft limit reached. Maximum 10 drafts per user.' },
          { status: 400 },
        );
      }
      if (message.includes('Maximum file') || message.includes('exceeded')) {
        return NextResponse.json({ success: false, error: message }, { status: 400 });
      }
      throw err;
    }
  } catch (error) {
    console.error('Error creating draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to save draft' },
      { status: 500 },
    );
  }
}
