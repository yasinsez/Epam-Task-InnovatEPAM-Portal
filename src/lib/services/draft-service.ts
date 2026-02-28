import { prisma } from '@/server/db/prisma';
import { sanitizeText } from '@/lib/sanitizers';
import { saveAttachmentFile } from '@/lib/services/attachment-service';
import { deleteIdeaWithCleanup } from '@/lib/services/idea-service';
import { getFirstStage } from '@/lib/services/stage-service';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUploadConfig } from '@/lib/services/upload-config-service';
import { createSubmissionSchema } from '@/lib/utils/dynamic-schema';
import { SubmitIdeaSchema, validateAttachments, type DraftCreateInput } from '@/lib/validators';

const MAX_DRAFTS_PER_USER = 10;

export type DraftListItem = {
  id: string;
  title: string;
  updatedAt: Date;
  createdAt: Date;
  attachmentCount: number;
};

export type DraftDetail = {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  dynamicFieldValues: Record<string, unknown>;
  status: 'DRAFT';
  createdAt: Date;
  updatedAt: Date;
  attachments: {
    id: string;
    originalFileName: string;
    fileSizeBytes: number;
    mimeType: string;
  }[];
};

export type PaginationMeta = {
  page: number;
  pageSize: number;
  totalCount: number;
  totalPages: number;
};

/**
 * Lists drafts for a user (submitter only). Paginated.
 *
 * @param userId - User ID (resolved DB id)
 * @param options - Optional page and pageSize (default page=1, pageSize=15)
 * @returns Drafts and pagination metadata
 */
export async function getDraftsForUser(
  userId: string,
  options?: { page?: number; pageSize?: number },
): Promise<{ drafts: DraftListItem[]; pagination: PaginationMeta }> {
  const page = Math.max(1, options?.page ?? 1);
  const pageSize = Math.min(100, Math.max(1, options?.pageSize ?? 15));

  const where = { userId, status: 'DRAFT' as const };
  const totalCount = await prisma.idea.count({ where });
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));
  const skip = (page - 1) * pageSize;

  const ideas = await prisma.idea.findMany({
    where,
    orderBy: { updatedAt: 'desc' },
    skip,
    take: pageSize,
    include: {
      attachments: { select: { id: true } },
    },
  });

  const drafts: DraftListItem[] = ideas.map((i) => ({
    id: i.id,
    title: i.title || 'Untitled draft',
    updatedAt: i.updatedAt,
    createdAt: i.createdAt,
    attachmentCount: i.attachments?.length ?? 0,
  }));

  return {
    drafts,
    pagination: {
      page,
      pageSize,
      totalCount,
      totalPages,
    },
  };
}

/**
 * Creates a draft with partial data. Enforces 10-draft limit per user.
 *
 * @param userId - User ID (resolved DB id)
 * @param data - Draft data (title, description, categoryId, dynamicFieldValues)
 * @param attachments - Optional files to attach
 * @returns Created draft detail
 * @throws Error when draft limit (10) reached
 */
export async function createDraft(
  userId: string,
  data: DraftCreateInput,
  attachments?: File[],
): Promise<DraftDetail> {
  const count = await prisma.idea.count({
    where: { userId, status: 'DRAFT' },
  });
  if (count >= MAX_DRAFTS_PER_USER) {
    throw new Error('Draft limit reached. Maximum 10 drafts per user.');
  }

  const title = (data.title ?? 'Untitled draft').trim() || 'Untitled draft';
  const description = (data.description ?? '').trim();
  const categoryId = data.categoryId && data.categoryId !== '' ? data.categoryId : null;
  const dynamicFieldValues =
    data.dynamicFieldValues && typeof data.dynamicFieldValues === 'object'
      ? (data.dynamicFieldValues as Record<string, unknown>)
      : {};

  if (attachments && attachments.length > 0) {
    const uploadConfig = await getUploadConfig();
    const validation = validateAttachments(attachments, {
      maxFileCount: uploadConfig.maxFileCount,
      maxFileSizeBytes: uploadConfig.maxFileSizeBytes,
      maxTotalSizeBytes: uploadConfig.maxTotalSizeBytes,
      allowedExtensions: uploadConfig.allowedExtensions,
      mimeByExtension: uploadConfig.mimeByExtension,
    });
    if (!validation.valid) {
      throw new Error(validation.error);
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
      status: 'DRAFT',
      dynamicFieldValues:
        Object.keys(dynamicFieldValues).length > 0 ? (dynamicFieldValues as object) : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
      attachments: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (attachments && attachments.length > 0) {
    const allowedExts = (await getUploadConfig()).allowedExtensions;
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
  }

  const withAttachments = await prisma.idea.findUnique({
    where: { id: idea.id },
    include: {
      category: { select: { id: true, name: true } },
      attachments: { orderBy: { displayOrder: 'asc' } },
    },
  });

  return mapToDraftDetail(withAttachments!);
}

/**
 * Gets a draft by ID. Owner only - returns null if not found or not owner.
 *
 * @param draftId - Draft (idea) ID
 * @param userId - User ID (resolved DB id)
 * @returns Draft detail or null
 */
export async function getDraftById(draftId: string, userId: string): Promise<DraftDetail | null> {
  const idea = await prisma.idea.findUnique({
    where: { id: draftId, userId, status: 'DRAFT' },
    include: {
      category: { select: { id: true, name: true } },
      attachments: { orderBy: { displayOrder: 'asc' } },
    },
  });

  if (!idea) return null;
  return mapToDraftDetail(idea);
}

/**
 * Updates a draft. Last-save-wins; no conflict detection.
 *
 * @param draftId - Draft (idea) ID
 * @param userId - User ID (resolved DB id)
 * @param data - Updated draft data
 * @param attachments - Optional new attachments (replaces existing? No - API should append or replace based on contract)
 * @returns Updated draft detail
 * @throws Error when draft not found or not owner
 */
export async function updateDraft(
  draftId: string,
  userId: string,
  data: DraftCreateInput,
  attachments?: File[],
): Promise<DraftDetail> {
  const existing = await prisma.idea.findUnique({
    where: { id: draftId, userId, status: 'DRAFT' },
  });

  if (!existing) {
    throw new Error('Draft not found');
  }

  const title = (data.title ?? existing.title ?? 'Untitled draft').trim() || 'Untitled draft';
  const description = (data.description ?? existing.description ?? '').trim();
  const categoryId = data.categoryId && data.categoryId !== '' ? data.categoryId : null;
  const dynamicFieldValues =
    data.dynamicFieldValues && typeof data.dynamicFieldValues === 'object'
      ? (data.dynamicFieldValues as Record<string, unknown>)
      : (existing.dynamicFieldValues as Record<string, unknown>) ?? {};

  if (attachments && attachments.length > 0) {
    const uploadConfig = await getUploadConfig();
    const existingCount = await prisma.attachment.count({ where: { ideaId: draftId } });
    const totalCount = existingCount + attachments.length;
    if (totalCount > uploadConfig.maxFileCount) {
      throw new Error(
        `Maximum file count exceeded. Maximum is ${uploadConfig.maxFileCount} files per draft`,
      );
    }
    const validation = validateAttachments(attachments, {
      maxFileCount: uploadConfig.maxFileCount - existingCount,
      maxFileSizeBytes: uploadConfig.maxFileSizeBytes,
      maxTotalSizeBytes: uploadConfig.maxTotalSizeBytes,
      allowedExtensions: uploadConfig.allowedExtensions,
      mimeByExtension: uploadConfig.mimeByExtension,
    });
    if (!validation.valid) {
      throw new Error(validation.error);
    }
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedDescription = sanitizeText(description);

  await prisma.idea.update({
    where: { id: draftId },
    data: {
      title,
      description,
      sanitizedTitle,
      sanitizedDescription,
      categoryId,
      dynamicFieldValues:
        Object.keys(dynamicFieldValues).length > 0 ? (dynamicFieldValues as object) : undefined,
    },
  });

  if (attachments && attachments.length > 0) {
    const allowedExts = (await getUploadConfig()).allowedExtensions;
    const startOrder = await prisma.attachment.count({ where: { ideaId: draftId } });
    for (let i = 0; i < attachments.length; i++) {
      const file = attachments[i];
      const storedPath = await saveAttachmentFile(draftId, file, allowedExts);
      await prisma.attachment.create({
        data: {
          ideaId: draftId,
          originalFileName: file.name.slice(0, 255),
          storedPath,
          fileSizeBytes: file.size,
          mimeType: file.type || 'application/octet-stream',
          displayOrder: startOrder + i,
        },
      });
    }
  }

  const updated = await getDraftById(draftId, userId);
  if (!updated) throw new Error('Draft not found after update');
  return updated;
}

/**
 * Discards a draft permanently. Removes idea and all attachments (filesystem cleanup).
 *
 * @param draftId - Draft (idea) ID
 * @param userId - User ID (resolved DB id)
 * @throws Error when draft not found or not owner
 */
export async function discardDraft(draftId: string, userId: string): Promise<void> {
  const existing = await prisma.idea.findUnique({
    where: { id: draftId, userId, status: 'DRAFT' },
  });

  if (!existing) {
    throw new Error('Draft not found');
  }

  await deleteIdeaWithCleanup(draftId);
}

export type SubmitDraftValidationError = {
  field: string;
  message: string;
};

/**
 * Submits a draft - full validation (SubmitIdeaSchema + dynamic fields), then converts to submitted idea.
 *
 * @param draftId - Draft (idea) ID
 * @param userId - User ID (resolved DB id)
 * @param data - Optional final edits (merged with draft)
 * @returns Submitted idea detail
 * @throws Error with validation details when validation fails
 */
export async function submitDraft(
  draftId: string,
  userId: string,
  data?: Partial<DraftCreateInput>,
): Promise<{
  id: string;
  title: string;
  status: string;
  submittedAt: Date;
  [key: string]: unknown;
}> {
  const draft = await getDraftById(draftId, userId);
  if (!draft) {
    throw new Error('Draft not found');
  }

  const title = (data?.title ?? draft.title ?? '').trim();
  const description = (data?.description ?? draft.description ?? '').trim();
  const categoryId = data?.categoryId && data.categoryId !== '' ? data.categoryId : draft.categoryId;
  const dynamicFieldValues =
    data?.dynamicFieldValues && typeof data.dynamicFieldValues === 'object'
      ? { ...draft.dynamicFieldValues, ...data.dynamicFieldValues }
      : draft.dynamicFieldValues;

  const fixedValidation = SubmitIdeaSchema.safeParse({
    title,
    description,
    categoryId: categoryId ?? '',
  });

  if (!fixedValidation.success) {
    const errors: SubmitDraftValidationError[] = fixedValidation.error.issues.map((i) => ({
      field: i.path.join('.'),
      message: i.message,
    }));
    throw new Error(JSON.stringify({ validationErrors: errors }));
  }

  const formConfig = await getActiveConfig();
  if (formConfig && formConfig.fields.length > 0) {
    const dynamicSchema = createSubmissionSchema(formConfig.fields);
    const dynamicParsed = dynamicSchema.safeParse(dynamicFieldValues ?? {});
    if (!dynamicParsed.success) {
      const errors: SubmitDraftValidationError[] = dynamicParsed.error.issues.map((i) => ({
        field: `dynamicFieldValues.${i.path.join('.')}`,
        message: i.message,
      }));
      throw new Error(JSON.stringify({ validationErrors: errors }));
    }
  }

  const sanitizedTitle = sanitizeText(title);
  const sanitizedDescription = sanitizeText(description);

  const firstStage = await getFirstStage();

  const idea = await prisma.idea.update({
    where: { id: draftId },
    data: {
      title: fixedValidation.data.title,
      description: fixedValidation.data.description,
      sanitizedTitle,
      sanitizedDescription,
      categoryId: fixedValidation.data.categoryId,
      status: 'SUBMITTED',
      submittedAt: new Date(),
      currentStageId: firstStage?.id ?? null,
      dynamicFieldValues:
        dynamicFieldValues && Object.keys(dynamicFieldValues).length > 0
          ? (dynamicFieldValues as object)
          : undefined,
    },
    include: {
      category: { select: { id: true, name: true } },
    },
  });

  return {
    id: idea.id,
    title: idea.title,
    status: idea.status,
    submittedAt: idea.submittedAt,
    categoryId: idea.categoryId,
    category: idea.category,
    description: idea.description,
    dynamicFieldValues: idea.dynamicFieldValues,
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
  };
}

function mapToDraftDetail(idea: {
  id: string;
  title: string;
  description: string;
  categoryId: string | null;
  category: { id: string; name: string } | null;
  dynamicFieldValues: unknown;
  createdAt: Date;
  updatedAt: Date;
  attachments: { id: string; originalFileName: string; fileSizeBytes: number; mimeType: string }[];
}): DraftDetail {
  return {
    id: idea.id,
    title: idea.title || 'Untitled draft',
    description: idea.description,
    categoryId: idea.categoryId,
    category: idea.category,
    dynamicFieldValues: (idea.dynamicFieldValues as Record<string, unknown>) ?? {},
    status: 'DRAFT',
    createdAt: idea.createdAt,
    updatedAt: idea.updatedAt,
    attachments: (idea.attachments ?? []).map((a) => ({
      id: a.id,
      originalFileName: a.originalFileName,
      fileSizeBytes: a.fileSizeBytes,
      mimeType: a.mimeType,
    })),
  };
}
