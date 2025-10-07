-- AlterTable
ALTER TABLE "communications" ADD COLUMN "sentAt" DATETIME;
ALTER TABLE "communications" ADD COLUMN "sentBy" TEXT;
ALTER TABLE "communications" ADD COLUMN "subject" TEXT;

-- AlterTable
ALTER TABLE "reports" ADD COLUMN "data" TEXT;
ALTER TABLE "reports" ADD COLUMN "description" TEXT;
ALTER TABLE "reports" ADD COLUMN "generatedById" TEXT;

-- CreateIndex
CREATE INDEX "communications_sentAt_idx" ON "communications"("sentAt");

-- CreateIndex
CREATE INDEX "reports_generatedById_idx" ON "reports"("generatedById");
