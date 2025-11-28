-- Migration: Add WhatsApp Opt-in Fields
-- Adiciona campos para rastrear consentimento de contato via WhatsApp
-- e qualificação de leads vindos de mensagens inbound

-- Adicionar novos campos ao modelo Lead
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "whatsappOptIn" BOOLEAN DEFAULT false;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "whatsappOptInDate" TIMESTAMP;
ALTER TABLE "leads" ADD COLUMN IF NOT EXISTS "needsVerification" BOOLEAN DEFAULT false;

-- Comentários para documentação
COMMENT ON COLUMN "leads"."whatsappOptIn" IS 'Indica se o lead autorizou contato via WhatsApp';
COMMENT ON COLUMN "leads"."whatsappOptInDate" IS 'Data em que o lead autorizou contato via WhatsApp';
COMMENT ON COLUMN "leads"."needsVerification" IS 'Indica se o lead precisa de verificação manual pela equipe';

-- Atualizar leads existentes vindos de formulários públicos/chatbot como opt-in automático
UPDATE "leads"
SET
  "whatsappOptIn" = true,
  "whatsappOptInDate" = "createdAt"
WHERE
  "source" IN ('landing-page', 'chatbot-web', 'whatsapp-bot', 'modal-orcamento')
  AND "whatsappOptIn" IS NULL;

-- Marcar leads antigos vindos de WhatsApp inbound como "precisa verificação"
UPDATE "leads"
SET
  "needsVerification" = true,
  "whatsappOptIn" = false
WHERE
  "source" = 'WHATSAPP'
  AND "whatsappOptIn" IS NULL;

-- Criar índice para performance em queries
CREATE INDEX IF NOT EXISTS "idx_leads_whatsapp_optin" ON "leads"("whatsappOptIn");
CREATE INDEX IF NOT EXISTS "idx_leads_needs_verification" ON "leads"("needsVerification");
