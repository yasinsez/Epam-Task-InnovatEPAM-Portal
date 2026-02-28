import { z } from 'zod';

const draftListItemSchema = z.object({
  id: z.string(),
  title: z.string(),
  updatedAt: z.string(),
  createdAt: z.string(),
  attachmentCount: z.number(),
});

const listDraftsSuccessSchema = z.object({
  success: z.literal(true),
  drafts: z.array(draftListItemSchema),
  pagination: z.object({
    page: z.number(),
    pageSize: z.number(),
    totalCount: z.number(),
    totalPages: z.number(),
  }),
});

const draftDetailSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string(),
  categoryId: z.string().nullable(),
  category: z
    .object({ id: z.string(), name: z.string() })
    .nullable()
    .optional(),
  dynamicFieldValues: z.record(z.unknown()).optional(),
  status: z.literal('DRAFT'),
  createdAt: z.string(),
  updatedAt: z.string(),
  attachments: z.array(
    z.object({
      id: z.string(),
      originalFileName: z.string(),
      fileSizeBytes: z.number(),
      mimeType: z.string(),
    }),
  ),
});

const createDraftSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  draft: draftDetailSchema,
});

const getDraftSuccessSchema = z.object({
  success: z.literal(true),
  draft: draftDetailSchema,
});

const updateDraftSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  draft: draftDetailSchema,
});

const discardDraftSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
});

const submitDraftSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  idea: z.object({
    id: z.string(),
    title: z.string(),
    status: z.string(),
    submittedAt: z.union([z.string(), z.date()]),
  }),
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  details: z.record(z.array(z.string())).optional(),
});

describe('drafts API contract', () => {
  describe('GET /api/drafts - list', () => {
    it('accepts valid list response schema', () => {
      const payload = {
        success: true,
        drafts: [
          {
            id: 'clx123',
            title: 'Untitled draft',
            updatedAt: '2026-02-28T10:30:00Z',
            createdAt: '2026-02-28T09:00:00Z',
            attachmentCount: 2,
          },
        ],
        pagination: {
          page: 1,
          pageSize: 15,
          totalCount: 3,
          totalPages: 1,
        },
      };
      expect(listDraftsSuccessSchema.parse(payload)).toBeTruthy();
    });
  });

  describe('POST /api/drafts - create', () => {
    it('accepts valid create success response', () => {
      const payload = {
        success: true,
        message: 'Draft saved',
        draft: {
          id: 'clx123',
          title: 'Untitled draft',
          description: '',
          categoryId: null,
          dynamicFieldValues: {},
          status: 'DRAFT',
          createdAt: '2026-02-28T10:00:00Z',
          updatedAt: '2026-02-28T10:00:00Z',
          attachments: [],
        },
      };
      expect(createDraftSuccessSchema.parse(payload)).toBeTruthy();
    });

    it('accepts valid error response for limit reached', () => {
      const payload = {
        success: false,
        error: 'Draft limit reached. Maximum 10 drafts per user.',
      };
      expect(errorResponseSchema.parse(payload)).toBeTruthy();
    });
  });

  describe('GET /api/drafts/[id] - get', () => {
    it('accepts valid get draft response', () => {
      const payload = {
        success: true,
        draft: {
          id: 'clx123',
          title: 'My draft idea',
          description: 'Work in progress...',
          categoryId: 'cat_001',
          category: { id: 'cat_001', name: 'Process Improvement' },
          dynamicFieldValues: { field_1: 'value' },
          status: 'DRAFT',
          createdAt: '2026-02-28T09:00:00Z',
          updatedAt: '2026-02-28T10:30:00Z',
          attachments: [
            {
              id: 'att_1',
              originalFileName: 'diagram.pdf',
              fileSizeBytes: 1024,
              mimeType: 'application/pdf',
            },
          ],
        },
      };
      expect(getDraftSuccessSchema.parse(payload)).toBeTruthy();
    });
  });

  describe('PATCH /api/drafts/[id] - update', () => {
    it('accepts valid update success response', () => {
      const payload = {
        success: true,
        message: 'Draft updated',
        draft: {
          id: 'clx123',
          title: 'Updated title',
          description: 'Updated desc',
          categoryId: null,
          dynamicFieldValues: {},
          status: 'DRAFT',
          createdAt: '2026-02-28T09:00:00Z',
          updatedAt: '2026-02-28T11:00:00Z',
          attachments: [],
        },
      };
      expect(updateDraftSuccessSchema.parse(payload)).toBeTruthy();
    });
  });

  describe('DELETE /api/drafts/[id] - discard', () => {
    it('accepts valid discard success response', () => {
      const payload = {
        success: true,
        message: 'Draft discarded',
      };
      expect(discardDraftSuccessSchema.parse(payload)).toBeTruthy();
    });
  });

  describe('POST /api/drafts/[id]/submit - submit', () => {
    it('accepts valid submit success response', () => {
      const payload = {
        success: true,
        message: 'Idea submitted successfully',
        idea: {
          id: 'clx123',
          title: 'My idea',
          status: 'SUBMITTED',
          submittedAt: '2026-02-28T11:00:00Z',
        },
      };
      expect(submitDraftSuccessSchema.parse(payload)).toBeTruthy();
    });

    it('accepts valid validation error response', () => {
      const payload = {
        success: false,
        error: 'Validation failed',
        details: {
          title: ['Title must be at least 5 characters'],
          categoryId: ['Please select a category'],
        },
      };
      expect(errorResponseSchema.parse(payload)).toBeTruthy();
    });
  });
});
