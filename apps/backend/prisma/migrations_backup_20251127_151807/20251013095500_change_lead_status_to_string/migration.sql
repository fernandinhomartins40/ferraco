-- AlterTable: Mudar status de enum para String para suportar colunas dinâmicas
-- IMPORTANTE: Esta migration preserva os dados existentes

-- 1. Criar coluna temporária com tipo String
ALTER TABLE "leads" ADD COLUMN "status_new" TEXT NOT NULL DEFAULT 'NOVO';

-- 2. Copiar dados do enum para a nova coluna String
UPDATE "leads" SET "status_new" = "status"::text;

-- 3. Remover coluna antiga
ALTER TABLE "leads" DROP COLUMN "status";

-- 4. Renomear coluna nova para o nome original
ALTER TABLE "leads" RENAME COLUMN "status_new" TO "status";

-- 5. Recriar índice no status (agora como String)
CREATE INDEX "leads_status_idx" ON "leads"("status");

-- Nota: O enum LeadStatus não é removido para manter compatibilidade com outras tabelas
-- que possam estar usando-o. Ele simplesmente não é mais usado pela tabela leads.
