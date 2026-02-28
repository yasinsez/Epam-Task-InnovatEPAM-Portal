import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/server/db/prisma';
import { readAttachmentFile } from '@/lib/services/attachment-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { authOptions } from '@/server/auth/route';

/**
 * GET /api/ideas/[id]/attachments/[attachmentId]
 * Returns the file content of a specific attachment.
 * Access control: idea owner, evaluator, or admin.
 * Content-Disposition: inline for images, attachment for others.
 *
 * @see contracts/api-attachments-download.md
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string; attachmentId: string }> },
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
    const { id: ideaId, attachmentId } = await params;

    const idea = await prisma.idea.findUnique({
      where: { id: ideaId },
      include: { attachments: true, user: true },
    });

    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 },
      );
    }

    const attachment = idea.attachments.find((a) => a.id === attachmentId);
    if (!attachment) {
      return NextResponse.json(
        { success: false, error: 'Attachment not found' },
        { status: 404 },
      );
    }

    const role = await getUserRole(userId);
    const isOwner = idea.userId === resolvedUserId;
    const canAccess = isOwner || role === 'evaluator' || role === 'admin';
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 },
      );
    }

    const buffer = await readAttachmentFile(attachment.storedPath);
    if (!buffer) {
      return NextResponse.json(
        { success: false, error: 'Attachment unavailable' },
        { status: 404 },
      );
    }

    const safeFileName = attachment.originalFileName.replace(/[^\w.-]/g, '_');
    const disposition =
      attachment.mimeType.startsWith('image/')
        ? `inline; filename="${safeFileName}"`
        : `attachment; filename="${safeFileName}"`;

    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': attachment.mimeType,
        'Content-Disposition': disposition,
        'Content-Length': String(attachment.fileSizeBytes),
        'Cache-Control': 'private, no-cache',
      },
    });
  } catch (error) {
    console.error('Error fetching attachment:', error);
    return NextResponse.json(
      { success: false, error: 'Attachment unavailable' },
      { status: 404 },
    );
  }
}
