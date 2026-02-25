/**
 * Constants for idea attachment validation and storage.
 * Used by validators and attachment-service for file type and size constraints.
 */

/** Max file size in bytes (25 MB) */
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed extensions (lowercase) */
export const ALLOWED_EXTENSIONS = ['.pdf', '.docx', '.png', '.jpg', '.jpeg', '.gif'] as const;

/** Extension → MIME type mapping for validation */
export const MIME_BY_EXTENSION: Record<string, string> = {
  '.pdf': 'application/pdf',
  '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.gif': 'image/gif',
};
