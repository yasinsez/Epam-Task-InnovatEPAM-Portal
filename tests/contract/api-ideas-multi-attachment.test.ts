import { z } from 'zod';

/**
 * Contract test for POST /api/ideas multi-attachment response shape.
 * @see specs/009-multi-media-support/contracts/api-ideas-multi-attachment.md
 */

const attachmentItemSchema = z.object({
  id: z.string(),
  originalFileName: z.string(),
  fileSizeBytes: z.number(),
  mimeType: z.string(),
});

const ideaWithAttachmentsSchema = z.object({
  success: z.literal(true),
  message: z.string().optional(),
  idea: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    categoryId: z.string(),
    userId: z.string(),
    status: z.string(),
    submittedAt: z.union([z.string(), z.date()]),
    attachments: z.array(attachmentItemSchema),
  }),
});

const errorResponseSchema = z.object({
  success: z.literal(false),
  error: z.string(),
  details: z.record(z.array(z.string())).optional(),
});

describe('POST /api/ideas multi-attachment contract', () => {
  it('accepts valid success response with attachments array', () => {
    const payload = {
      success: true,
      message: 'Your idea has been submitted successfully',
      idea: {
        id: 'cm9lk4m2kd8f9g0',
        title: 'Implement AI-powered document processing',
        description: 'A detailed description of the idea.',
        categoryId: 'cat_002',
        userId: 'user_456',
        status: 'SUBMITTED',
        submittedAt: '2026-02-28T15:45:00Z',
        attachments: [
          {
            id: 'att_001',
            originalFileName: 'design-mockup.png',
            fileSizeBytes: 524288,
            mimeType: 'image/png',
          },
          {
            id: 'att_002',
            originalFileName: 'summary.docx',
            fileSizeBytes: 204800,
            mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          },
        ],
      },
    };

    expect(ideaWithAttachmentsSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid success response with empty attachments', () => {
    const payload = {
      success: true,
      idea: {
        id: 'idea-123',
        title: 'Title',
        description: 'Description.',
        categoryId: 'cat_001',
        userId: 'user_1',
        status: 'SUBMITTED',
        submittedAt: '2026-02-28T15:45:00Z',
        attachments: [],
      },
    };

    expect(ideaWithAttachmentsSchema.parse(payload)).toBeTruthy();
  });

  it('accepts validation error response (file count exceeded)', () => {
    const payload = {
      success: false,
      error: 'Maximum file count exceeded. Maximum is 10 files per idea',
    };

    expect(errorResponseSchema.parse(payload)).toBeTruthy();
  });

  it('accepts validation error response (per-file size)', () => {
    const payload = {
      success: false,
      error: "File 'large.pdf' exceeds the per-file size limit (max 10 MB)",
    };

    expect(errorResponseSchema.parse(payload)).toBeTruthy();
  });

  it('accepts validation error response (file type not allowed)', () => {
    const payload = {
      success: false,
      error: 'File type not allowed. Accepted formats: PDF, DOC, DOCX, PNG, JPG, GIF, XLS, XLSX',
    };

    expect(errorResponseSchema.parse(payload)).toBeTruthy();
  });
});
