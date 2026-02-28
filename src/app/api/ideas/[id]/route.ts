import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';

import { getIdeaForDetail } from '@/lib/services/idea-service';
import { getActiveConfig } from '@/lib/services/form-config-service';
import { getUserRole, resolveUserIdForDb } from '@/lib/auth/roles';
import { authOptions } from '@/server/auth/route';

/**
 * GET /api/ideas/[id]
 * Returns idea detail with dynamicFieldValues and dynamicFieldLabels.
 * Access: owner, evaluator, admin.
 */
export async function GET(
  request: Request,
  context: { params: Promise<{ id: string }> },
): Promise<Response> {
  try {
    const session = await getServerSession(authOptions);
    const userId = session?.user?.id;
    const userEmail = session?.user?.email;

    if (!userId) {
      return NextResponse.json({ success: false, error: 'Authentication required' }, { status: 401 });
    }

    const role = await getUserRole(userId);
    const resolvedUserId = await resolveUserIdForDb(userId, userEmail);
    const { id } = await context.params;

    const idea = await getIdeaForDetail(id, resolvedUserId, role);

    if (!idea) {
      return NextResponse.json({ success: false, error: 'Idea not found' }, { status: 404 });
    }

    const formConfig = await getActiveConfig();
    const dynamicFieldLabels: Record<string, string> = {};
    if (formConfig) {
      for (const f of formConfig.fields) {
        dynamicFieldLabels[f.id] = f.label;
      }
    }
    // For historical keys not in current config, use "Unknown field"
    const dvs = idea.dynamicFieldValues ?? {};
    for (const key of Object.keys(dvs)) {
      if (!(key in dynamicFieldLabels)) {
        dynamicFieldLabels[key] = 'Unknown field';
      }
    }

    return NextResponse.json({
      success: true,
      idea: {
        id: idea.id,
        title: idea.title,
        description: idea.description,
        category: idea.category,
        submittedAt: idea.submittedAt,
        submitter: idea.submitter,
        status: idea.status,
        dynamicFieldValues: idea.dynamicFieldValues,
        attachments: idea.attachments,
        evaluation: idea.evaluation,
      },
      dynamicFieldLabels,
    });
  } catch (error) {
    console.error('Error fetching idea:', error);
    return NextResponse.json(
      { success: false, error: 'Failed to load idea' },
      { status: 500 },
    );
  }
}
