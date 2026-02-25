import { z } from 'zod';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  MIME_BY_EXTENSION,
} from '@/lib/constants/attachment';

/**
 * Validates an attachment file (size, type, non-empty).
 * Uses server-side File API (from FormData).
 *
 * @param file - The File from FormData
 * @returns { valid: true } if valid, or { valid: false, error: string } with specific error message
 * @example
 *   const result = validateAttachmentFile(file);
 *   if (!result.valid) return NextResponse.json({ error: result.error }, 400);
 */
export function validateAttachmentFile(
  file: File,
): { valid: true } | { valid: false; error: string } {
  if (!file || file.size === 0) {
    return { valid: false, error: 'File is empty. Please select a valid file' };
  }

  if (file.size > MAX_ATTACHMENT_SIZE_BYTES) {
    return {
      valid: false,
      error: 'File is too large. Maximum size is 25 MB',
    };
  }

  const ext = getExtension(file.name);
  if (!ext || !(ALLOWED_EXTENSIONS as readonly string[]).includes(ext)) {
    return {
      valid: false,
      error: 'File type not supported. Accepted formats: PDF, DOCX, PNG, JPG, GIF',
    };
  }

  const expectedMime = MIME_BY_EXTENSION[ext];
  const actualMime = file.type?.toLowerCase();
  if (!actualMime || expectedMime !== actualMime) {
    return {
      valid: false,
      error: 'File type not supported. Accepted formats: PDF, DOCX, PNG, JPG, GIF',
    };
  }

  return { valid: true };
}

/**
 * Extracts lowercase file extension including the dot (e.g. ".pdf").
 */
function getExtension(filename: string): string | null {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) return null;
  return filename.slice(lastDot).toLowerCase();
}

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
