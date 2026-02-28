-- CreateTable (idempotent for DBs that already have Attachment from 20260225082055)
CREATE TABLE IF NOT EXISTS "Attachment" (
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
CREATE UNIQUE INDEX IF NOT EXISTS "Attachment_ideaId_key" ON "Attachment"("ideaId");
CREATE UNIQUE INDEX IF NOT EXISTS "Attachment_storedPath_key" ON "Attachment"("storedPath");
CREATE INDEX IF NOT EXISTS "Attachment_ideaId_idx" ON "Attachment"("ideaId");
CREATE INDEX IF NOT EXISTS "Attachment_storedPath_idx" ON "Attachment"("storedPath");

-- AddForeignKey (only if not exists)
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'Attachment_ideaId_fkey'
  ) THEN
    ALTER TABLE "Attachment" ADD CONSTRAINT "Attachment_ideaId_fkey" FOREIGN KEY ("ideaId") REFERENCES "Idea"("id") ON DELETE CASCADE ON UPDATE CASCADE;
  END IF;
END $$;
