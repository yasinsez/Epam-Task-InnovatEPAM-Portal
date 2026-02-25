-- CreateEnum
CREATE TYPE "UserRole" AS ENUM ('SUBMITTER', 'EVALUATOR', 'ADMIN');

-- AlterTable
ALTER TABLE "User" ADD COLUMN "role" "UserRole" NOT NULL DEFAULT 'SUBMITTER';

-- CreateIndex
CREATE INDEX "User_role_idx" ON "User"("role");
