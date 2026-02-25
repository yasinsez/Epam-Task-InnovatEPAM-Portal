import { prisma } from '@/server/db/prisma';
import { deleteAttachmentFile } from '@/lib/services/attachment-service';

/**
 * Deletes an idea and removes its attachment file from the filesystem if present.
 * Attachment record is cascade-deleted by Prisma; this ensures the file is removed.
 *
 * @param ideaId - Idea ID to delete
 * @throws If idea not found or delete fails
 *
 * @example
 *   await deleteIdeaWithCleanup('idea-123');
 */
export async function deleteIdeaWithCleanup(ideaId: string): Promise<void> {
  const idea = await prisma.idea.findUnique({
    where: { id: ideaId },
    include: { attachment: true },
  });

  if (!idea) {
    throw new Error('Idea not found');
  }

  if (idea.attachment) {
    await deleteAttachmentFile(idea.attachment.storedPath);
  }

  await prisma.idea.delete({ where: { id: ideaId } });
}
