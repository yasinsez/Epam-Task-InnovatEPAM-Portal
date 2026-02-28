-- AlterTable
ALTER TABLE "Idea" ADD COLUMN     "rating" INTEGER,
ADD COLUMN     "ratingAssignedAt" TIMESTAMP(3),
ADD COLUMN     "ratingEvaluatorId" TEXT;

-- CreateIndex
CREATE INDEX "Idea_rating_idx" ON "Idea"("rating");

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_ratingEvaluatorId_fkey" FOREIGN KEY ("ratingEvaluatorId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
