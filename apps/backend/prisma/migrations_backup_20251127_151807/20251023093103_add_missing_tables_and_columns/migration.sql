-- CreateTable: automation_settings
CREATE TABLE IF NOT EXISTS "automation_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "columnIntervalSeconds" INTEGER NOT NULL DEFAULT 300,
    "maxMessagesPerHour" INTEGER NOT NULL DEFAULT 30,
    "maxMessagesPerDay" INTEGER NOT NULL DEFAULT 200,
    "sendOnlyBusinessHours" BOOLEAN NOT NULL DEFAULT true,
    "businessHourStart" INTEGER NOT NULL DEFAULT 8,
    "businessHourEnd" INTEGER NOT NULL DEFAULT 18,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- CreateTable: landing_page_config
CREATE TABLE IF NOT EXISTS "landing_page_config" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "header" TEXT NOT NULL,
    "hero" TEXT NOT NULL,
    "marquee" TEXT NOT NULL,
    "about" TEXT NOT NULL,
    "products" TEXT NOT NULL,
    "experience" TEXT NOT NULL,
    "contact" TEXT NOT NULL,
    "footer" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- Add missing columns to chatbot_sessions
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "currentStage" INTEGER DEFAULT 1;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "currentStepId" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "capturedName" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "capturedEmail" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "capturedPhone" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "interest" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "segment" TEXT;
ALTER TABLE "chatbot_sessions" ADD COLUMN IF NOT EXISTS "userResponses" TEXT DEFAULT '{}';

-- Insert default automation settings
INSERT INTO "automation_settings" ("id") VALUES ('default') ON CONFLICT ("id") DO NOTHING;
