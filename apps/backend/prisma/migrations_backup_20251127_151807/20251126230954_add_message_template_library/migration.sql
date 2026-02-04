-- CreateEnum
CREATE TYPE "TemplateLibraryCategory" AS ENUM ('AUTOMATION', 'RECURRENCE', 'GENERIC', 'CUSTOM', 'SYSTEM');

-- CreateTable
CREATE TABLE "message_template_library" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "category" "TemplateLibraryCategory" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrls" TEXT,
    "mediaType" TEXT,
    "availableVariables" TEXT NOT NULL DEFAULT '[]',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "isFavorite" BOOLEAN NOT NULL DEFAULT false,
    "usageCount" INTEGER NOT NULL DEFAULT 0,
    "triggerType" TEXT,
    "minCaptures" INTEGER,
    "maxCaptures" INTEGER,
    "daysSinceCapture" INTEGER,
    "triggerConditions" TEXT DEFAULT '{}',
    "priority" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "message_template_library_pkey" PRIMARY KEY ("id")
);

-- AlterTable
ALTER TABLE "automation_kanban_columns" ADD COLUMN     "templateLibraryId" TEXT;

-- CreateIndex
CREATE INDEX "message_template_library_category_idx" ON "message_template_library"("category");

-- CreateIndex
CREATE INDEX "message_template_library_isActive_idx" ON "message_template_library"("isActive");

-- CreateIndex
CREATE INDEX "message_template_library_isSystem_idx" ON "message_template_library"("isSystem");

-- CreateIndex
CREATE INDEX "message_template_library_triggerType_idx" ON "message_template_library"("triggerType");

-- CreateIndex
CREATE INDEX "message_template_library_priority_idx" ON "message_template_library"("priority");

-- CreateIndex
CREATE INDEX "message_template_library_usageCount_idx" ON "message_template_library"("usageCount");

-- AddForeignKey
ALTER TABLE "automation_kanban_columns" ADD CONSTRAINT "automation_kanban_columns_templateLibraryId_fkey" FOREIGN KEY ("templateLibraryId") REFERENCES "message_template_library"("id") ON DELETE SET NULL ON UPDATE CASCADE;
