/**
 * Constants for idea attachment validation and storage.
 * Used by validators and attachment-service for file type and size constraints.
 */

/** Max file size in bytes (25 MB) - legacy single-file fallback */
export const MAX_ATTACHMENT_SIZE_BYTES = 25 * 1024 * 1024;

/** Allowed extensions (lowercase) - legacy single-file fallback */
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

/**
 * Upload configuration defaults used when no DB UploadConfiguration exists.
 * Per spec: maxFileCount 10, 10MB per file, 50MB total.
 */
export const UPLOAD_CONFIG_DEFAULTS = {
  maxFileCount: 10,
  maxFileSizeBytes: 10 * 1024 * 1024,
  maxTotalSizeBytes: 50 * 1024 * 1024,
  allowedExtensions: ['.pdf', '.doc', '.docx', '.png', '.jpg', '.jpeg', '.gif', '.xls', '.xlsx'] as const,
  mimeByExtension: {
    '.pdf': 'application/pdf',
    '.doc': 'application/msword',
    '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.gif': 'image/gif',
    '.xls': 'application/vnd.ms-excel',
    '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  } as Record<string, string>,
} as const;
