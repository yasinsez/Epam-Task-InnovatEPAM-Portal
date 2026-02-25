-- CreateTable
CREATE TABLE "Attachment" (
    "id" TEXT NOT NULL,
    "ideaId" TEXT NOT NULL,
    "originalFileName" VARCHAR(255) NOT NULL,
    "storedPath" VARCHAR(500) NOT NULL,
    "fileSizeBytes" INTEGER NOT NULL,
    "mimeType" VARCHAR(100) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Attachment_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_ideaId_key" ON "Attachment"("ideaId");

-- CreateIndex
CREATE UNIQUE INDEX "Attachment_storedPath_key" ON "Attachment"("storedPath");

-- CreateIndex
CREATE INDEX "Attachment_ideaId_idx" ON "Attachment"("ideaId");

-- CreateIndex
CREATE INDEX "Attachment_storedPath_idx" ON "Attachment"("storedPath");

-- AddForeignKey
ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
