-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "currentStageId" TEXT;

-- CreateTable
CREATE TABLE "ReviewStage" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(100) NOT NULL,
    "description" VARCHAR(500),
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ReviewStage_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "StageTransition" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "fromStageId" TEXT,
    "toStageId" TEXT,
    "comments" TEXT,
    "evaluatorId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "StageTransition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "ReviewStage_displayOrder_idx" ON "ReviewStage"("displayOrder");

-- CreateIndex
CREATE INDEX "StageTransition_ideaId_idx" ON "StageTransition"("ideaId");

-- CreateIndex
CREATE INDEX "StageTransition_evaluatorId_idx" ON "StageTransition"("evaluatorId");

-- CreateIndex
CREATE INDEX "StageTransition_createdAt_idx" ON "StageTransition"("createdAt");

-- CreateIndex
CREATE INDEX "Idea_currentStageId_idx" ON "Idea"("currentStageId");

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_fromStageId_fkey" FOREIGN KEY ("fromStageId") REFERENCES "ReviewStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_toStageId_fkey" FOREIGN KEY ("toStageId") REFERENCES "ReviewStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "StageTransition" ADD CONSTRAINT "StageTransition_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_currentStageId_fkey" FOREIGN KEY ("currentStageId") REFERENCES "ReviewStage"("id") ON DELETE SET NULL ON UPDATE CASCADE;
