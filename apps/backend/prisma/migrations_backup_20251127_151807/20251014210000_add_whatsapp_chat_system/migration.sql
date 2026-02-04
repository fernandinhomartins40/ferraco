-- CreateEnum
CREATE TYPE "MessageType" AS ENUM ('TEXT', 'IMAGE', 'VIDEO', 'AUDIO', 'DOCUMENT', 'STICKER', 'LOCATION', 'CONTACT', 'LINK');

-- CreateEnum
CREATE TYPE "MessageStatus" AS ENUM ('PENDING', 'SENT', 'DELIVERED', 'READ', 'FAILED');

-- CreateTable
CREATE TABLE "whatsapp_contacts" (
    "id" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "name" TEXT,
    "profilePicUrl" TEXT,
    "leadId" TEXT,
    "isBlocked" BOOLEAN NOT NULL DEFAULT false,
    "lastSeenAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_contacts_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_conversations" (
    "id" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "lastMessageAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "lastMessagePreview" TEXT,
    "unreadCount" INTEGER NOT NULL DEFAULT 0,
    "isArchived" BOOLEAN NOT NULL DEFAULT false,
    "isPinned" BOOLEAN NOT NULL DEFAULT false,
    "assignedToId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_conversations_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "whatsapp_messages" (
    "id" TEXT NOT NULL,
    "conversationId" TEXT NOT NULL,
    "contactId" TEXT NOT NULL,
    "type" "MessageType" NOT NULL,
    "content" TEXT NOT NULL,
    "mediaUrl" TEXT,
    "mediaType" TEXT,
    "mediaSize" INTEGER,
    "thumbnailUrl" TEXT,
    "fromMe" BOOLEAN NOT NULL,
    "status" "MessageStatus" NOT NULL DEFAULT 'PENDING',
    "whatsappMessageId" TEXT,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "deliveredAt" TIMESTAMP(3),
    "readAt" TIMESTAMP(3),
    "metadata" TEXT,
    "isDeleted" BOOLEAN NOT NULL DEFAULT false,

    CONSTRAINT "whatsapp_messages_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_phone_key" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_contacts_leadId_key" ON "whatsapp_contacts"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_phone_idx" ON "whatsapp_contacts"("phone");

-- CreateIndex
CREATE INDEX "whatsapp_contacts_leadId_idx" ON "whatsapp_contacts"("leadId");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_contactId_idx" ON "whatsapp_conversations"("contactId");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_lastMessageAt_idx" ON "whatsapp_conversations"("lastMessageAt");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_unreadCount_idx" ON "whatsapp_conversations"("unreadCount");

-- CreateIndex
CREATE INDEX "whatsapp_conversations_assignedToId_idx" ON "whatsapp_conversations"("assignedToId");

-- CreateIndex
CREATE UNIQUE INDEX "whatsapp_messages_whatsappMessageId_key" ON "whatsapp_messages"("whatsappMessageId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_conversationId_idx" ON "whatsapp_messages"("conversationId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_contactId_idx" ON "whatsapp_messages"("contactId");

-- CreateIndex
CREATE INDEX "whatsapp_messages_timestamp_idx" ON "whatsapp_messages"("timestamp");

-- CreateIndex
CREATE INDEX "whatsapp_messages_fromMe_idx" ON "whatsapp_messages"("fromMe");

-- CreateIndex
CREATE INDEX "whatsapp_messages_whatsappMessageId_idx" ON "whatsapp_messages"("whatsappMessageId");

-- AddForeignKey
ALTER TABLE "whatsapp_contacts" ADD CONSTRAINT "whatsapp_contacts_leadId_fkey" FOREIGN KEY ("leadId") REFERENCES "leads"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "whatsapp_contacts"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_conversations" ADD CONSTRAINT "whatsapp_conversations_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_conversationId_fkey" FOREIGN KEY ("conversationId") REFERENCES "whatsapp_conversations"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "whatsapp_messages" ADD CONSTRAINT "whatsapp_messages_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "whatsapp_contacts"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
