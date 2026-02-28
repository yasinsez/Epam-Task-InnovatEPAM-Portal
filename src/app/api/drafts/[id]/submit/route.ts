import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { submitDraft } from '@/lib/services/draft-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { authOptions } from '@/server/auth/route';

/**
 * POST /api/drafts/[id]/submit
 * Submits a draft (converts to idea). Full validation applied.
 */
export async function POST(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
    }

    const role = await getUserRole(userId);
    if (role !== 'submitter') {
      return NextResponse.json(
        { success: false, error: 'Drafts are only available to submitters' },
        { status: 403 },
      );
    }

    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
    const { id } = await context.params;

    let payload: Record<string, unknown> = {};
    const contentType = request.headers.get('content-type') || '';
    if (contentType.includes('application/json')) {
      const body = await request.json().catch(() => null);
      if (body && typeof body === 'object') {
        payload = body;
      }
    }

    try {
      const idea = await submitDraft(id, resolvedUserId, {
        title: payload.title as string | undefined,
        description: payload.description as string | undefined,
        categoryId: payload.categoryId as string | null | undefined,
        dynamicFieldValues: payload.dynamicFieldValues as Record<
          string,
          string | number | boolean | string[]
        > | undefined,
      });

      return NextResponse.json({
        success: true,
        message: 'Idea submitted successfully',
        idea: {
          id: idea.id,
          title: idea.title,
          status: idea.status,
          submittedAt: idea.submittedAt,
          categoryId: idea.categoryId,
          category: idea.category,
          description: idea.description,
          dynamicFieldValues: idea.dynamicFieldValues,
        },
      });
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to submit draft';
      if (message === 'Draft not found') {
        return NextResponse.json({ success: false, error: 'Draft not found' }, { status: 404 });
      }
      if (message.includes('validationErrors') || message.startsWith('{')) {
        try {
          const parsed = JSON.parse(message) as { validationErrors?: Array<{ field: string; message: string }> };
          if (parsed.validationErrors) {
            const details: Record<string, string[]> = {};
            for (const e of parsed.validationErrors) {
              if (!details[e.field]) details[e.field] = [];
              details[e.field].push(e.message);
            }
            return NextResponse.json(
              { success: false, error: 'Validation failed', details },
              { status: 400 },
            );
          }
        } catch {
          // fall through
        }
      }
      throw err;
    }
  } catch (error) {
    console.error('Error submitting draft:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to submit draft' },
      { status: 500 },
    );
  }
}
