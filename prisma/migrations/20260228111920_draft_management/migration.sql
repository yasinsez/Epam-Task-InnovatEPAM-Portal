-- AlterEnum
ALTER TYPE "IdeaStatus" ADD VALUE 'DRAFT';

-- DropForeignKey
ALTER TABLE "Idea" DROP CONSTRAINT "Idea_categoryId_fkey";

-- AlterTable
ALTER TABLE "Idea" ALTER COLUMN "categoryId" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "Idea_userId_status_idx" ON "Idea"("userId", "status");

-- AddForeignKey
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE SET NULL ON UPDATE CASCADE;
