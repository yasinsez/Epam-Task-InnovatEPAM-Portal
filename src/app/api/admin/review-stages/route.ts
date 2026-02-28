import { NextResponse } from 'next/server';

import { requireRole } from '@/lib/auth/role-guards';
import {
  getStages,
  createStage,
} from '@/lib/services/stage-service';
import { stageCreateSchema } from '@/lib/validators';

/**
 * GET /api/admin/review-stages
 * List all stages ordered by displayOrder (admin only).
 */
export const GET = requireRole('admin')(async (): Promise<Response> => {
  try {
    const stages = await getStages();
    return NextResponse.json({
      success: true,
      stages: stages.map((s) => ({
        id: s.id,
        name: s.name,
        description: s.description,
        displayOrder: s.displayOrder,
        ideaCount: s.ideaCount,
      })),
    });
  } catch {
    return NextResponse.json(
      { success: false, error: 'Failed to list stages' },
      { status: 500 },
    );
  }
});

/**
 * POST /api/admin/review-stages
 * Create a new stage (admin only). Enforces max 20 stages.
 */
export const POST = requireRole('admin')(async (request: Request): Promise<Response> => {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON body' },
        { status: 400 },
      );
    }

    const parseResult = stageCreateSchema.safeParse(body);
    if (!parseResult.success) {
      const firstError = parseResult.error.errors[0];
      const message = firstError?.message ?? 'Validation failed';
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }

    const stage = await createStage(parseResult.data);
    return NextResponse.json(
      {
        success: true,
        message: 'Stage created',
        stage: {
          id: stage.id,
          name: stage.name,
          description: stage.description,
          displayOrder: stage.displayOrder,
          createdAt: stage.createdAt.toISOString(),
        },
      },
      { status: 201 },
    );
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Failed to create stage';
    if (message.includes('Maximum of') && message.includes('stages allowed')) {
      return NextResponse.json({ success: false, error: message }, { status: 400 });
    }
    return NextResponse.json(
      { success: false, error: 'Failed to create stage' },
      { status: 500 },
    );
  }
});
