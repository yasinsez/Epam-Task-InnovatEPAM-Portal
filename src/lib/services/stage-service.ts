import { prisma } from '@/server/db/prisma';
import { MAX_REVIEW_STAGES } from '@/lib/constants/evaluation';
import type { StageCreateInput, StageUpdateInput } from '@/lib/validators';
import type { ReviewStage } from '@prisma/client';

export type StageSummary = {
  id: string;
  name: string;
  description: string | null;
  displayOrder: number;
  ideaCount: number;
};

/**
 * List all stages ordered by displayOrder (ascending).
 * Each stage includes ideaCount (ideas currently in that stage).
 *
 * @returns Array of stages with idea counts
 */
export async function getStages(): Promise<StageSummary[]> {
  const stages = await prisma.reviewStage.findMany({
    orderBy: { displayOrder: 'asc' },
    include: {
      _count: { select: { ideasInStage: true } },
    },
  });
  return stages.map((s) => ({
    id: s.id,
    name: s.name,
    description: s.description,
    displayOrder: s.displayOrder,
    ideaCount: s._count.ideasInStage,
  }));
}

/**
 * Create a new stage. Enforces max 20 stages.
 * If displayOrder omitted, appends to end (max existing + 1).
 *
 * @param data - Stage create input (name required; description, displayOrder optional)
 * @returns Created stage
 * @throws Error when 20-stage limit reached
 */
export async function createStage(data: StageCreateInput): Promise<ReviewStage> {
  const count = await prisma.reviewStage.count();
  if (count >= MAX_REVIEW_STAGES) {
    throw new Error(`Maximum of ${MAX_REVIEW_STAGES} stages allowed. Remove a stage first.`);
  }

  let displayOrder = data.displayOrder;
  if (displayOrder == null) {
    const maxOrder = await prisma.reviewStage.aggregate({
      _max: { displayOrder: true },
    });
    displayOrder = (maxOrder._max.displayOrder ?? -1) + 1;
  } else {
    await shiftDisplayOrders(displayOrder, 1);
  }

  return prisma.reviewStage.create({
    data: {
      name: data.name.trim(),
      description: data.description?.trim() || null,
      displayOrder,
    },
  });
}

/**
 * Update a stage (name, description, displayOrder).
 * When displayOrder changes, shifts other stages accordingly.
 *
 * @param stageId - Stage ID to update
 * @param data - Partial update data
 * @returns Updated stage
 */
export async function updateStage(stageId: string, data: StageUpdateInput): Promise<ReviewStage> {
  const existing = await prisma.reviewStage.findUnique({ where: { id: stageId } });
  if (!existing) {
    throw new Error('Stage not found');
  }

  const updateData: { name?: string; description?: string | null; displayOrder?: number } = {};

  if (data.name !== undefined) {
    updateData.name = data.name.trim();
  }
  if (data.description !== undefined) {
    updateData.description = data.description?.trim() || null;
  }
  if (data.displayOrder !== undefined && data.displayOrder !== existing.displayOrder) {
    const oldPos = existing.displayOrder;
    const newPos = data.displayOrder;
    if (newPos > oldPos) {
      await prisma.reviewStage.updateMany({
        where: {
          displayOrder: { gt: oldPos, lte: newPos },
          id: { not: stageId },
        },
        data: { displayOrder: { decrement: 1 } },
      });
    } else if (newPos < oldPos) {
      await prisma.reviewStage.updateMany({
        where: {
          displayOrder: { gte: newPos, lt: oldPos },
          id: { not: stageId },
        },
        data: { displayOrder: { increment: 1 } },
      });
    }
    updateData.displayOrder = newPos;
  }

  return prisma.reviewStage.update({
    where: { id: stageId },
    data: updateData,
  });
}

/**
 * Delete a stage. Rejects if any ideas have currentStageId = this stage.
 *
 * @param stageId - Stage ID to delete
 * @throws Error when stage has ideas (includes count in message)
 */
export async function deleteStage(stageId: string): Promise<void> {
  const stage = await prisma.reviewStage.findUnique({
    where: { id: stageId },
  });
  if (!stage) {
    throw new Error('Stage not found');
  }

  const ideaCount = await prisma.idea.count({
    where: { currentStageId: stageId },
  });
  if (ideaCount > 0) {
    throw new Error(
      `Cannot remove stage: ${ideaCount} ideas are currently in this stage. Reassign them first.`,
    );
  }
  await prisma.reviewStage.delete({ where: { id: stageId } });
}

/**
 * Get the first stage (displayOrder = min).
 * Used when assigning new ideas to initial stage.
 *
 * @returns First stage or null if no stages exist
 */
export async function getFirstStage(): Promise<ReviewStage | null> {
  return prisma.reviewStage.findFirst({
    orderBy: { displayOrder: 'asc' },
  });
}

/**
 * Get the next stage by displayOrder (current displayOrder + 1).
 *
 * @param currentStage - Current stage
 * @returns Next stage or null if current is final
 */
export async function getNextStage(currentStage: ReviewStage): Promise<ReviewStage | null> {
  return prisma.reviewStage.findFirst({
    where: { displayOrder: currentStage.displayOrder + 1 },
  });
}

/**
 * Check if the given stage is the final stage (max displayOrder).
 *
 * @param stageId - Stage ID to check
 * @returns true if stage is final
 */
export async function isFinalStage(stageId: string): Promise<boolean> {
  const maxOrder = await prisma.reviewStage.aggregate({
    _max: { displayOrder: true },
  });
  const stage = await prisma.reviewStage.findUnique({
    where: { id: stageId },
    select: { displayOrder: true },
  });
  if (!stage || maxOrder._max.displayOrder == null) return false;
  return stage.displayOrder === maxOrder._max.displayOrder;
}

/**
 * Shift displayOrder of stages to make room for insert at targetOrder.
 * Increments displayOrder by 1 for all stages at or after targetOrder.
 *
 * @param targetOrder - Position to insert at
 * @param delta - Amount to shift (typically 1)
 */
async function shiftDisplayOrders(targetOrder: number, delta: number): Promise<void> {
  await prisma.reviewStage.updateMany({
    where: { displayOrder: { gte: targetOrder } },
    data: { displayOrder: { increment: delta } },
  });
}
