-- ============================================================================
-- MIGRAÇÃO: ARQUITETURA STATELESS WHATSAPP 2025
-- ============================================================================
-- 🔄 Remove tabelas de mensagens/conversas (dados vêm do WhatsApp)
-- ✅ Mantém WhatsAppContact com novos campos (tags)
-- ✅ Adiciona WhatsAppNote para anotações internas
-- ============================================================================

-- 1. Criar tabela de notas internas
CREATE TABLE "whatsapp_notes" (
    "id" TEXT NOT NULL,
    "contactPhone" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "content" TEXT NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "whatsapp_notes_pkey" PRIMARY KEY ("id")
);

-- 2. Adicionar campo tags ao WhatsAppContact
ALTER TABLE "whatsapp_contacts" ADD COLUMN "tags" TEXT[] DEFAULT ARRAY[]::TEXT[];

-- 3. Remover tabelas obsoletas (STATELESS)
DROP TABLE IF EXISTS "whatsapp_messages" CASCADE;
DROP TABLE IF EXISTS "whatsapp_conversations" CASCADE;

-- 4. Criar índices para WhatsAppNote
CREATE INDEX "whatsapp_notes_contactPhone_idx" ON "whatsapp_notes"("contactPhone");
CREATE INDEX "whatsapp_notes_userId_idx" ON "whatsapp_notes"("userId");
CREATE INDEX "whatsapp_notes_createdAt_idx" ON "whatsapp_notes"("createdAt");

-- 5. Adicionar foreign key constraint
ALTER TABLE "whatsapp_notes" ADD CONSTRAINT "whatsapp_notes_contactPhone_fkey" FOREIGN KEY ("contactPhone") REFERENCES "whatsapp_contacts"("phone") ON DELETE CASCADE ON UPDATE CASCADE;
