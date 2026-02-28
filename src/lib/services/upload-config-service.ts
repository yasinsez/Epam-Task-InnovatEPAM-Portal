import { prisma } from '@/server/db/prisma';
import { UPLOAD_CONFIG_DEFAULTS } from '@/lib/constants/attachment';

/**
 * Upload configuration as returned from DB or defaults.
 */
export type UploadConfig = {
  id: string;
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  mimeByExtension: Record<string, string>;
};

/**
 * Input for updating upload configuration.
 */
export type UpdateUploadConfigInput = {
  maxFileCount: number;
  maxFileSizeBytes: number;
  maxTotalSizeBytes: number;
  allowedExtensions: string[];
  mimeByExtension: Record<string, string>;
};

/**
 * Gets the active upload configuration.
 * Uses the most recently updated row from DB, or defaults if none exists.
 *
 * @returns Upload config with limits and allowed types
 */
export async function getUploadConfig(): Promise<UploadConfig> {
  const row = await prisma.uploadConfiguration.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (!row) {
    return {
      id: '',
      maxFileCount: UPLOAD_CONFIG_DEFAULTS.maxFileCount,
      maxFileSizeBytes: UPLOAD_CONFIG_DEFAULTS.maxFileSizeBytes,
      maxTotalSizeBytes: UPLOAD_CONFIG_DEFAULTS.maxTotalSizeBytes,
      allowedExtensions: [...UPLOAD_CONFIG_DEFAULTS.allowedExtensions],
      mimeByExtension: { ...UPLOAD_CONFIG_DEFAULTS.mimeByExtension },
    };
  }

  const allowedExtensions = Array.isArray(row.allowedExtensions)
    ? (row.allowedExtensions as string[])
    : [];
  const mimeByExtension =
    row.mimeByExtension && typeof row.mimeByExtension === 'object'
      ? (row.mimeByExtension as Record<string, string>)
      : {};

  return {
    id: row.id,
    maxFileCount: row.maxFileCount,
    maxFileSizeBytes: row.maxFileSizeBytes,
    maxTotalSizeBytes: row.maxTotalSizeBytes,
    allowedExtensions,
    mimeByExtension,
  };
}

/**
 * Updates upload configuration (admin only).
 * Creates a new row if none exists.
 *
 * @param data - New config values
 * @param userId - User ID who made the change (for audit)
 * @returns Updated config
 */
export async function updateUploadConfig(
  data: UpdateUploadConfigInput,
  userId: string | null,
): Promise<UploadConfig> {
  let row = await prisma.uploadConfiguration.findFirst({
    orderBy: { updatedAt: 'desc' },
  });

  if (!row) {
    row = await prisma.uploadConfiguration.create({
      data: {
        maxFileCount: data.maxFileCount,
        maxFileSizeBytes: data.maxFileSizeBytes,
        maxTotalSizeBytes: data.maxTotalSizeBytes,
        allowedExtensions: data.allowedExtensions as object,
        mimeByExtension: data.mimeByExtension as object,
        updatedById: userId,
      },
    });
  } else {
    row = await prisma.uploadConfiguration.update({
      where: { id: row.id },
      data: {
        maxFileCount: data.maxFileCount,
        maxFileSizeBytes: data.maxFileSizeBytes,
        maxTotalSizeBytes: data.maxTotalSizeBytes,
        allowedExtensions: data.allowedExtensions as object,
        mimeByExtension: data.mimeByExtension as object,
        updatedById: userId,
      },
    });
  }

  return {
    id: row.id,
    maxFileCount: row.maxFileCount,
    maxFileSizeBytes: row.maxFileSizeBytes,
    maxTotalSizeBytes: row.maxTotalSizeBytes,
    allowedExtensions: Array.isArray(row.allowedExtensions)
      ? (row.allowedExtensions as string[])
      : [],
    mimeByExtension:
      row.mimeByExtension && typeof row.mimeByExtension === 'object'
        ? (row.mimeByExtension as Record<string, string>)
        : {},
  };
}
