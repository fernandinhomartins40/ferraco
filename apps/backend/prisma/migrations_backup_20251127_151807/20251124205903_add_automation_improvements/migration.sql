-- AlterEnum: Adicionar novo status RATE_LIMITED ao AutomationSendStatus
-- Deprecar SCHEDULED (manter para compatibilidade)
ALTER TYPE "AutomationSendStatus" ADD VALUE IF NOT EXISTS 'RATE_LIMITED';

-- AlterTable: Adicionar novos campos à tabela AutomationSettings
ALTER TABLE "automation_settings" ADD COLUMN IF NOT EXISTS "blockWeekends" BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE "automation_settings" ADD COLUMN IF NOT EXISTS "timezone" TEXT NOT NULL DEFAULT 'America/Sao_Paulo';

-- AlterTable: Atualizar businessHourEnd padrão de 18 para 20
ALTER TABLE "automation_settings" ALTER COLUMN "businessHourEnd" SET DEFAULT 20;

-- AlterTable: Adicionar campos de bypass à tabela AutomationLeadPosition
ALTER TABLE "automation_lead_positions" ADD COLUMN IF NOT EXISTS "bypassBusinessHours" BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE "automation_lead_positions" ADD COLUMN IF NOT EXISTS "isManualRetry" BOOLEAN NOT NULL DEFAULT false;

-- Migração de dados: Converter status SCHEDULED para RATE_LIMITED onde apropriado
-- (Mantém SCHEDULED para agendamentos futuros reais, converte para RATE_LIMITED quando for limite de envio)
UPDATE "automation_lead_positions"
SET status = 'RATE_LIMITED'
WHERE status = 'SCHEDULED'
  AND "lastError" LIKE '%Limite de envios atingido%';

-- Comentários de documentação
COMMENT ON COLUMN "automation_settings"."blockWeekends" IS 'Se true, não envia automações em finais de semana (sábado e domingo)';
COMMENT ON COLUMN "automation_settings"."timezone" IS 'Fuso horário IANA para horário comercial (ex: America/Sao_Paulo, America/New_York)';
COMMENT ON COLUMN "automation_lead_positions"."bypassBusinessHours" IS 'Se true, ignora horário comercial e rate limits (usado em retries manuais urgentes)';
COMMENT ON COLUMN "automation_lead_positions"."isManualRetry" IS 'Se true, bypassa proteção anti-recorrência (usado em retries manuais)';
