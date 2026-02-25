-- CreateEnum
CREATE TYPE "IdeaStatus" AS ENUM ('SUBMITTED', 'UNDER_REVIEW', 'ACCEPTED', 'REJECTED');

-- AlterTable Idea: convert status from VARCHAR to IdeaStatus enum
-- Map existing string values to enum; default to SUBMITTED for any unexpected values
ALTER TABLE "Idea" ALTER COLUMN "status" DROP DEFAULT;
ALTER TABLE "Idea" ALTER COLUMN "status" TYPE "IdeaStatus" USING (
  CASE "status"
    WHEN 'SUBMITTED' THEN 'SUBMITTED'::"IdeaStatus"
    WHEN 'UNDER_REVIEW' THEN 'UNDER_REVIEW'::"IdeaStatus"
    WHEN 'ACCEPTED' THEN 'ACCEPTED'::"IdeaStatus"
    WHEN 'REJECTED' THEN 'REJECTED'::"IdeaStatus"
    ELSE 'SUBMITTED'::"IdeaStatus"
  END
);
ALTER TABLE "Idea" ALTER COLUMN "status" SET DEFAULT 'SUBMITTED'::"IdeaStatus";

-- CreateTable Evaluation
CREATE TABLE "Evaluation" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "decision" VARCHAR(20) NOT NULL,
    "comments" TEXT NOT NULL,
    "evaluatorId" TEXT,
    "evaluatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Evaluation_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Evaluation_ideaId_key" ON "Evaluation"("ideaId");

-- CreateIndex
CREATE INDEX "Evaluation_evaluatorId_idx" ON "Evaluation"("evaluatorId");

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Evaluation" ADD CONSTRAINT "Evaluation_evaluatorId_fkey" FOREIGN KEY ("evaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
