-- CreateEnum
CREATE TYPE "FormFieldType" AS ENUM ('TEXT', 'LONG_TEXT', 'NUMBER', 'SINGLE_SELECT', 'MULTI_SELECT', 'CHECKBOX', 'DATE');

-- CreateTable FormConfiguration
CREATE TABLE "FormConfiguration" (
    "id" TEXT NOT NULL,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedById" TEXT,

    CONSTRAINT "FormConfiguration_pkey" PRIMARY KEY ("id")
);

-- CreateTable FormFieldDefinition
CREATE TABLE "FormFieldDefinition" (
    "id" TEXT NOT NULL,
    "formConfigurationId" TEXT NOT NULL,
    "label" VARCHAR(100) NOT NULL,
    "fieldType" "FormFieldType" NOT NULL,
    "required" BOOLEAN NOT NULL DEFAULT false,
    "displayOrder" INTEGER NOT NULL DEFAULT 0,
    "options" JSONB,
    "minValue" DOUBLE PRECISION,
    "maxValue" DOUBLE PRECISION,
    "maxLength" INTEGER,

    CONSTRAINT "FormFieldDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "FormConfiguration_updatedAt_idx" ON "FormConfiguration"("updatedAt");

-- CreateIndex
CREATE INDEX "FormFieldDefinition_formConfigurationId_displayOrder_idx" ON "FormFieldDefinition"("formConfigurationId", "displayOrder");

-- AddForeignKey
ALTER TABLE "FormConfiguration" ADD CONSTRAINT "FormConfiguration_updatedById_fkey" FOREIGN KEY ("updatedById") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "FormFieldDefinition" ADD CONSTRAINT "FormFieldDefinition_formConfigurationId_fkey" FOREIGN KEY ("formConfigurationId") REFERENCES "FormConfiguration"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AlterTable Idea: add dynamicFieldValues
ALTER TABLE "Idea" ADD COLUMN "dynamicFieldValues" JSONB;
