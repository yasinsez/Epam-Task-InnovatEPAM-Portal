import { z } from 'zod';
import {
  MAX_ATTACHMENT_SIZE_BYTES,
  ALLOWED_EXTENSIONS,
  MIME_BY_EXTENSION,
} from '@/lib/constants/attachment';
import { MAX_EVALUATION_COMMENTS_LENGTH } from '@/lib/constants/evaluation';

/** Config shape for validateAttachments */
export type UploadConfigForValidation = {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  mimeByExtension: Record<string, string>;
};

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
 * Validates an array of attachment files against config-driven limits.
 * Checks count, per-file size, total size, extension, and MIME type.
 *
 * @param files - Array of Files from FormData
 * @param config - Upload config (from getUploadConfig)
 * @returns { valid: true } or { valid: false, error: string }
 */
export function validateAttachments(
  files: File[],
  config: UploadConfigForValidation,
): { valid: true } | { valid: false; error: string } {
  if (files.length === 0) return { valid: true };

  if (files.length > config.maxFileCount) {
    return {
      valid: false,
      error: `Maximum file count exceeded. Maximum is ${config.maxFileCount} files per idea`,
    };
  }

  const totalBytes = files.reduce((sum, f) => sum + f.size, 0);
  if (totalBytes > config.maxTotalSizeBytes) {
    return {
      valid: false,
      error: `Total attachment size exceeds ${Math.round(config.maxTotalSizeBytes / (1024 * 1024))} MB limit`,
    };
  }

  const allowedSet = new Set(config.allowedExtensions.map((e) => e.toLowerCase()));
  const extLabel = config.allowedExtensions
    .map((e) => e.replace(/^\./, '').toUpperCase())
    .join(', ');

  for (const file of files) {
    if (!file || file.size === 0) {
      return { valid: false, error: 'File is empty. Please select a valid file' };
    }
    if (file.size > config.maxFileSizeBytes) {
      const maxMb = Math.round(config.maxFileSizeBytes / (1024 * 1024));
      return {
        valid: false,
        error: `File '${file.name}' exceeds the per-file size limit (max ${maxMb} MB)`,
      };
    }
    const ext = getExtension(file.name);
    if (!ext || !allowedSet.has(ext.toLowerCase())) {
      return {
        valid: false,
        error: `File type not allowed. Accepted formats: ${extLabel}`,
      };
    }
    const expectedMime = config.mimeByExtension[ext] ?? config.mimeByExtension[ext.toLowerCase()];
    const actualMime = file.type?.toLowerCase();
    if (!actualMime || (expectedMime && expectedMime.toLowerCase() !== actualMime)) {
      return {
        valid: false,
        error: 'File type validation failed: extension and MIME type must match allowed mapping',
      };
    }
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

/**
 * Schema for evaluate idea API payload.
 * Validates decision (ACCEPTED|REJECTED) and required comments (1-2000 chars).
 *
 * @example
 *   const data = { decision: 'ACCEPTED', comments: 'Great idea!' };
 *   const validated = evaluateIdeaSchema.parse(data);
 */
export const evaluateIdeaSchema = z.object({
  decision: z.enum(['ACCEPTED', 'REJECTED'], {
    errorMap: () => ({ message: 'Decision must be ACCEPTED or REJECTED' }),
  }),
  comments: z
    .string()
    .min(1, 'Comments are required')
    .max(
      MAX_EVALUATION_COMMENTS_LENGTH,
      `Comments must not exceed ${MAX_EVALUATION_COMMENTS_LENGTH} characters`,
    ),
});

export type EvaluateIdeaInput = z.infer<typeof evaluateIdeaSchema>;
