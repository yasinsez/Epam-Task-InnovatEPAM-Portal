import path from 'path';
import fs from 'fs/promises';
import { randomUUID } from 'crypto';
import { ALLOWED_EXTENSIONS } from '@/lib/constants/attachment';

const UPLOADS_BASE = process.env.UPLOADS_BASE_PATH || './uploads';

/**
 * Saves an uploaded file to the filesystem and returns the stored path.
 *
 * @param ideaId - Idea ID for directory structure (uploads/ideas/<ideaId>/)
 * @param file - The File from FormData
 * @returns Stored relative path (e.g., ideas/<ideaId>/<uuid>.<ext>)
 * @throws {Error} If directory creation or file write fails
 *
 * @example
 *   const storedPath = await saveAttachmentFile(idea.id, file);
 *   await prisma.attachment.create({ data: { ideaId, storedPath, ... } });
 */
export async function saveAttachmentFile(ideaId: string, file: File): Promise<string> {
  const ext = getValidatedExtension(file.name);
  const safeFilename = `${randomUUID()}${ext}`;
  const relativePath = path.join('ideas', ideaId, safeFilename);
  const absolutePath = path.join(UPLOADS_BASE, relativePath);
  const dir = path.dirname(absolutePath);

  await fs.mkdir(dir, { recursive: true });

  const buffer = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(absolutePath, buffer);

  return relativePath.replace(/\\/g, '/');
}

/**
 * Reads file bytes from the filesystem by stored path.
 *
 * @param storedPath - Relative path from Attachment (e.g., ideas/<ideaId>/<uuid>.<ext>)
 * @returns Buffer with file contents, or null if file not found
 *
 * @example
 *   const buf = await readAttachmentFile(attachment.storedPath);
 *   if (buf) return new Response(buf, { headers: { 'Content-Type': attachment.mimeType } });
 */
export async function readAttachmentFile(storedPath: string): Promise<Buffer | null> {
  const absolutePath = path.join(UPLOADS_BASE, storedPath);

  try {
    const buf = await fs.readFile(absolutePath);
    return buf;
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code === 'ENOENT') {
      return null;
    }
    throw err;
  }
}

/**
 * Deletes attachment file from filesystem.
 * Used on Idea delete (cascade) or when replacing an attachment.
 *
 * @param storedPath - Relative path from Attachment
 * @returns Resolves when file is deleted; no-op if file does not exist
 *
 * @example
 *   await deleteAttachmentFile(attachment.storedPath);
 */
export async function deleteAttachmentFile(storedPath: string): Promise<void> {
  const absolutePath = path.join(UPLOADS_BASE, storedPath);

  try {
    await fs.unlink(absolutePath);
  } catch (err) {
    if ((err as NodeJS.ErrnoException).code !== 'ENOENT') {
      throw err;
    }
  }
}

/**
 * Extracts and validates extension against allowed list.
 * @throws {Error} If extension is not in allowed list
 */
function getValidatedExtension(filename: string): string {
  const lastDot = filename.lastIndexOf('.');
  if (lastDot === -1) throw new Error('No file extension');
  const ext = filename.slice(lastDot).toLowerCase();
  if (!ALLOWED_EXTENSIONS.includes(ext as (typeof ALLOWED_EXTENSIONS)[number])) {
    throw new Error(`Extension ${ext} not allowed`);
  }
  return ext;
}
