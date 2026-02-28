import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import {
  updateStage,
  deleteStage,
} from '@/lib/services/stage-service';
import { stageUpdateSchema } from '@/lib/validators';

/**
 * PATCH /api/admin/review-stages/[stageId]
 * Update a stage (name, description, displayOrder) - admin only.
 */
export const PATCH = requireRole('admin')(async (
  request: Request,
  context: { params: { stageId: string } | Promise<{ stageId: string }> },
): Promise<Response> => {
  try {
    const { stageId } = await Promise.resolve(context.params);

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const parseResult = stageUpdateSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      const message = firstError?.message ?? 'Validation failed';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    if (Object.keys(parseResult.data).length === 0) {
      return NextResponse.json(
        { success: false, error: 'At least one field required' },
        { status: 400 },
      );
    }

    const stage = await updateStage(stageId, parseResult.data);
    return NextResponse.json({
      success: true,
      message: 'Stage updated',
      stage: {
        id: stage.id,
        name: stage.name,
        description: stage.description,
        displayOrder: stage.displayOrder,
        updatedAt: stage.updatedAt.toISOString(),
      },
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to update stage';
    if (message === 'Stage not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to update stage' },
      { status: 500 },
    );
  }
});

/**
 * DELETE /api/admin/review-stages/[stageId]
 * Delete a stage. Rejects if ideas are in this stage - admin only.
 */
export const DELETE = requireRole('admin')(async (
  _request: Request,
  context: { params: { stageId: string } | Promise<{ stageId: string }> },
): Promise<Response> => {
  try {
    const { stageId } = await Promise.resolve(context.params);

    await deleteStage(stageId);
    return NextResponse.json({
      success: true,
      message: 'Stage removed',
    });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to delete stage';
    if (message === 'Stage not found') {
      return NextResponse.json({ success: false, error: message }, { status: 404 });
    }
    if (message.includes('ideas are currently in this stage')) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to delete stage' },
      { status: 500 },
    );
  }
});
