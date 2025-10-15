-- Add sync flags to WhatsApp conversations for intelligent caching
-- This allows us to track which conversations have been fully synced

ALTER TABLE "whatsapp_conversations" ADD COLUMN "fullySynced" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "whatsapp_conversations" ADD COLUMN "lastSyncedAt" TIMESTAMP(3);
ALTER TABLE "whatsapp_conversations" ADD COLUMN "syncedMessageCount" INTEGER NOT NULL DEFAULT 0;
