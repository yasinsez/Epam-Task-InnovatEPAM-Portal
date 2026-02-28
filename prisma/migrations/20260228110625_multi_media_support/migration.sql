-- DropIndex
DROP INDEX "Attachment_ideaId_key";

-- AlterTable
ALTER TABLE "Attachment" ADD COLUMN     "displayOrder" INTEGER NOT NULL DEFAULT 0;

-- CreateTable
CREATE TABLE "UploadConfiguration" (
    "id" TEXT NOT NULL,
    "maxFileCount" INTEGER NOT NULL DEFAULT 10,
    "maxFileSizeBytes" INTEGER NOT NULL DEFAULT 10485760,
    "maxTotalSizeBytes" INTEGER NOT NULL DEFAULT 52428800,
    "allowedExtensions" JSONB NOT NULL,
    "mimeByExtension" JSONB NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL,
    "updatedById" TEXT,

    CONSTRAINT "UploadConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "UploadConfiguration_updatedAt_idx" ON "UploadConfiguration"("updatedAt");

-- AddForeignKey
ALTER TABLE "UploadConfiguration" ADD CONSTRAINT "UploadConfiguration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;
