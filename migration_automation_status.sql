-- Migration: Add AutomationSendStatus and fields to automation_lead_positions

-- 1. Criar enum AutomationSendStatus
DO $$ BEGIN
  CREATE TYPE "AutomationSendStatus" AS ENUM ('PENDING', 'SENDING', 'SENT', 'FAILED', 'WHATSAPP_DISCONNECTED', 'SCHEDULED');
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

-- 2. Adicionar coluna status com valor padrão
ALTER TABLE automation_lead_positions
ADD COLUMN IF NOT EXISTS status "AutomationSendStatus" DEFAULT 'PENDING';

-- 3. Adicionar coluna lastError
ALTER TABLE automation_lead_positions
ADD COLUMN IF NOT EXISTS "lastError" TEXT;

-- 4. Adicionar coluna lastAttemptAt
ALTER TABLE automation_lead_positions
ADD COLUMN IF NOT EXISTS "lastAttemptAt" TIMESTAMP(3);

-- 5. Criar índice em status para performance
CREATE INDEX IF NOT EXISTS automation_lead_positions_status_idx ON automation_lead_positions(status);

-- 6. Verificar se as colunas foram criadas
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'automation_lead_positions'
AND column_name IN ('status', 'lastError', 'lastAttemptAt')
ORDER BY column_name;
