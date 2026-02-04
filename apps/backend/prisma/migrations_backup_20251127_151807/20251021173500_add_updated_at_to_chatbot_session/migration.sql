-- AddUpdatedAtToChatbotSession
ALTER TABLE "ChatbotSession" ADD COLUMN "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP;

-- Update existing records to set updatedAt to startedAt
UPDATE "ChatbotSession" SET "updatedAt" = "startedAt" WHERE "updatedAt" IS NULL;
