-- CreateTable Category
CREATE TABLE "Category" (
    "id" TEXT NOT NULL,
    "name" VARCHAR(50) NOT NULL,
    "slug" VARCHAR(50) NOT NULL,
    "description" VARCHAR(500),
    "order" INTEGER NOT NULL DEFAULT 999,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Category_pkey" PRIMARY KEY ("id")
);

-- CreateTable Idea
CREATE TABLE "Idea" (
    "id" TEXT NOT NULL,
    "title" VARCHAR(100) NOT NULL,
    "description" TEXT NOT NULL,
    "sanitizedTitle" VARCHAR(100) NOT NULL,
    "sanitizedDescription" TEXT NOT NULL,
    "categoryId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "status" VARCHAR(20) NOT NULL DEFAULT 'SUBMITTED',
    "submittedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Idea_pkey" PRIMARY KEY ("id")
);

-- CreateIndex for Category
CREATE UNIQUE INDEX "Category_name_key" ON "Category"("name");
CREATE UNIQUE INDEX "Category_slug_key" ON "Category"("slug");
CREATE INDEX "Category_slug_idx" ON "Category"("slug");
CREATE INDEX "Category_isActive_order_name_idx" ON "Category"("isActive", "order", "name");

-- CreateIndex for Idea
CREATE INDEX "Idea_userId_idx" ON "Idea"("userId");
CREATE INDEX "Idea_categoryId_idx" ON "Idea"("categoryId");
CREATE INDEX "Idea_submittedAt_idx" ON "Idea"("submittedAt");
CREATE INDEX "Idea_userId_submittedAt_idx" ON "Idea"("userId", "submittedAt");

-- AddForeignKey for Idea
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "Category"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "Idea" ADD CONSTRAINT "Idea_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- SeedData: Insert predefined categories
INSERT INTO "Category" (id, name, slug, description, "order", "isActive", "createdAt", "updatedAt") VALUES
('cat_process_improvement', 'Process Improvement', 'process-improvement', 'Ideas for improving existing workflows, processes, and operational efficiency', 1, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_technology', 'Technology', 'technology', 'Technology adoption, new tools, automation, and digital transformation', 2, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_cost_reduction', 'Cost Reduction', 'cost-reduction', 'Ideas for reducing costs and improving resource efficiency', 3, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),
('cat_culture_engagement', 'Culture & Engagement', 'culture-engagement', 'Employee engagement, company culture, and team building initiatives', 4, true, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP);

