import { z } from 'zod';

const submitIdeaSuccessSchema = z.object({
  success: z.literal(true),
  message: z.string(),
  idea: z.object({
    id: z.string(),
    title: z.string(),
    description: z.string(),
    sanitizedTitle: z.string(),
    sanitizedDescription: z.string(),
    categoryId: z.string(),
    userId: z.string(),
    status: z.string(),
    submittedAt: z.union([z.string(), z.date()]),
    createdAt: z.union([z.string(), z.date()]),
    updatedAt: z.union([z.string(), z.date()]),
    dynamicFieldValues: z.record(z.union([z.string(), z.number(), z.boolean(), z.array(z.string())])).optional(),
  }),
});

const submitIdeaErrorSchema = z.object({
  success: z.literal(false),
  error: z.string().optional(),
  details: z.record(z.array(z.string())).optional(),
});

describe('ideas contract: submit idea', () => {
  it('accepts valid success response schema', () => {
    const payload = {
      success: true,
      message: 'Idea submitted successfully',
      idea: {
        id: 'idea-cuid-123',
        title: 'Improve Code Review Process',
        description: 'Implement an automated code review system to catch common issues early.',
        sanitizedTitle: 'Improve Code Review Process',
        sanitizedDescription:
          'Implement an automated code review system to catch common issues early.',
        categoryId: 'cat_process_improvement',
        userId: 'user-123',
        status: 'SUBMITTED',
        submittedAt: '2026-02-25T10:00:00.000Z',
        createdAt: '2026-02-25T10:00:00.000Z',
        updatedAt: '2026-02-25T10:00:00.000Z',
      },
    };

    expect(submitIdeaSuccessSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid error response schema with validation errors', () => {
    const payload = {
      success: false,
      details: {
        title: ['Title must be at least 5 characters'],
        description: ['Description must be at least 20 characters'],
      },
    };

    expect(submitIdeaErrorSchema.parse(payload)).toBeTruthy();
  });

  it('accepts valid error response schema with general error', () => {
    const payload = {
      success: false,
      error: 'Failed to submit idea. Please try again.',
    };

    expect(submitIdeaErrorSchema.parse(payload)).toBeTruthy();
  });

  it('rejects response missing required fields', () => {
    const payload = {
      success: true,
      idea: {
        id: 'idea-123',
        // missing title, description, etc.
      },
    };

    expect(() => submitIdeaSuccessSchema.parse(payload)).toThrow();
  });

  it('rejects response with wrong success value type', () => {
    const payload = {
      success: 'true', // should be boolean
      message: 'Idea submitted successfully',
      idea: {
        id: 'idea-123',
        title: 'Test',
        description: 'Test description',
        sanitizedTitle: 'Test',
        sanitizedDescription: 'Test description',
        categoryId: 'cat_001',
        userId: 'user_123',
        status: 'SUBMITTED',
        submittedAt: '2026-02-25T10:00:00.000Z',
        createdAt: '2026-02-25T10:00:00.000Z',
        updatedAt: '2026-02-25T10:00:00.000Z',
      },
    };

    expect(() => submitIdeaSuccessSchema.parse(payload)).toThrow();
  });
});
