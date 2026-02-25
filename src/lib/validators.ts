import { z } from 'zod';

/**
 * Schema for idea submission form validation.
 * Validates title (5-100 chars), description (20-2000 chars), and categoryId.
 *
 * @example
 *   const data = { title: 'My Idea', description: 'This is a detailed description...', categoryId: 'cat_001' };
 *   const validated = SubmitIdeaSchema.parse(data); // throws on error
 *
 *   // Using safeParse for error handling
 *   const result = SubmitIdeaSchema.safeParse(data);
 *   if (!result.success) {
 *     console.error(result.error.issues);
 *   }
 */
export const SubmitIdeaSchema = z.object({
  title: z
    .string()
    .trim()
    .min(5, 'Title must be at least 5 characters')
    .max(100, 'Title must not exceed 100 characters'),
  description: z
    .string()
    .trim()
    .min(20, 'Description must be at least 20 characters')
    .max(2000, 'Description must not exceed 2000 characters'),
  categoryId: z.string().min(1, 'Please select a category'),
});

export type SubmitIdeaInput = z.infer<typeof SubmitIdeaSchema>;
