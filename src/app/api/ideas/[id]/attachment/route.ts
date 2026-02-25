import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { prisma } from '@/server/db/prisma';
import { readAttachmentFile } from '@/lib/services/attachment-service';
import { getUserRole } from '@/lib/auth/roles';

const authOptions = {
  secret: process.env.NEXTAUTH_SECRET,
};

/**
 * GET /api/ideas/[id]/attachment
 * Returns the file content of an idea's attachment.
 *
 * @param request - Incoming request (unused)
 * @param params - Route params with id (idea ID)
 * @returns 200 with file body, or 404/403/500 on error
 * @throws Requires session; enforces idea access control
 */
export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;

    if (!userId) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 },
      );
    }

    const { id } = await params;
    const idea = await prisma.idea.findUnique({
      where: { id },
      include: { attachment: true, user: true },
    });

    if (!idea) {
      return NextResponse.json(
        { success: false, error: 'Idea not found' },
        { status: 404 },
      );
    }

    if (!idea.attachment) {
      return NextResponse.json(
        { success: false, error: 'This idea has no attachment' },
        { status: 404 },
      );
    }

    const role = await getUserRole(userId);
    const isOwner = idea.userId === userId;
    const canAccess = isOwner || role === 'evaluator' || role === 'admin';
    if (!canAccess) {
      return NextResponse.json(
        { success: false, error: 'Access denied' },
        { status: 403 },
      );
    }

    const buffer = await readAttachmentFile(idea.attachment.storedPath);
    if (!buffer) {
      return NextResponse.json(
        { success: false, error: 'Attachment unavailable' },
        { status: 404 },
      );
    }

    const safeFileName = idea.attachment.originalFileName.replace(/[^\w.-]/g, '_');
    const disposition =
      idea.attachment.mimeType.startsWith('image/')
        ? `inline; filename="${safeFileName}"`
        : `attachment; filename="${safeFileName}"`;

    const body = new Uint8Array(buffer);
    return new NextResponse(body, {
      status: 200,
      headers: {
        'Content-Type': idea.attachment.mimeType,
        'Content-Disposition': disposition,
        'Content-Length': String(idea.attachment.fileSizeBytes),
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
