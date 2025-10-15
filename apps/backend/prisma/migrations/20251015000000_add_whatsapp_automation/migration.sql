-- CreateEnum
CREATE TYPE "WhatsAppAutomationStatus" AS ENUM ('PENDING', 'PROCESSING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateTable
CREATE TABLE "whatsapp_automations" (
    "id" TEXT NOT NULL,
    "leadId" TEXT NOT NULL,
    "status" "WhatsAppAutomationStatus" NOT NULL DEFAULT 'PENDING',
    "scheduledFor" TIMESTAMP(3),
    "productsToSend" TEXT NOT NULL,
    "messagesSent" INTEGER NOT NULL DEFAULT 0,
    "messagesTotal" INTEGER NOT NULL DEFAULT 0,
    "executionLog" TEXT,
    "error" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),

    CONSTRAINT "whatsapp_automations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_automation_messages" (
    "id" TEXT NOT NULL,
    "automationId" TEXT NOT NULL,
    "messageType" TEXT NOT NULL,
    "content" TEXT,
    "mediaUrl" TEXT,
    "fileName" TEXT,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappMessageId" TEXT,
    "order" INTEGER NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "deliveredAt" TIMESTAMP(3),

    CONSTRAINT "whatsapp_automation_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "whatsapp_automations_leadId_idx" ON "whatsapp_automations"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_automations_status_idx" ON "whatsapp_automations"("status");

-- CreateIndex
CREATE INDEX "whatsapp_automations_scheduledFor_idx" ON "whatsapp_automations"("scheduledFor");

-- CreateIndex
CREATE INDEX "whatsapp_automation_messages_automationId_idx" ON "whatsapp_automation_messages"("automationId");

-- CreateIndex
CREATE INDEX "whatsapp_automation_messages_status_idx" ON "whatsapp_automation_messages"("status");

-- AddForeignKey
ALTER TABLE "whatsapp_automations" ADD CONSTRAINT "whatsapp_automations_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_automation_messages" ADD CONSTRAINT "whatsapp_automation_messages_automationId_fkey" FOREIGN KEY ("automationId") REFERENCES "whatsapp_automations"("id") ON DELETE CASCADE ON UPDATE CASCADE;
