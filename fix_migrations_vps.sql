-- ============================================================================
-- SCRIPT: Corrigir Migrations Falhadas na VPS
-- Data: 2025-11-27
-- Objetivo: Remover migrations falhadas e preparar para migration consolidada
-- ============================================================================

-- Passo 1: Verificar migrations falhadas
SELECT
    migration_name,
    started_at,
    finished_at,
    success,
    rolled_back_at
FROM "_prisma_migrations"
WHERE success = false
ORDER BY started_at DESC;

-- Passo 2: Deletar TODAS as migrations falhadas
DELETE FROM "_prisma_migrations" WHERE success = false;

-- Passo 3: Verificar que foi deletado
SELECT COUNT(*) as total_failed_migrations FROM "_prisma_migrations" WHERE success = false;
-- Resultado esperado: 0

-- Passo 4: Verificar se a tabela message_template_library existe
SELECT table_name
FROM information_schema.tables
WHERE table_schema = 'public'
AND table_name = 'message_template_library';

-- Se retornar vazio, a tabela NÃO existe

-- Passo 5: Contar migrations aplicadas com sucesso
SELECT COUNT(*) as total_success_migrations FROM "_prisma_migrations" WHERE success = true;

-- ============================================================================
-- INSTRUÇÕES DE USO:
-- ============================================================================
--
-- Executar na VPS:
--
-- docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm < fix_migrations_vps.sql
--
-- Ou manualmente (linha por linha):
--
-- docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c "DELETE FROM _prisma_migrations WHERE success = false;"
--
-- Depois executar a migration consolidada:
--
-- docker exec ferraco-crm-vps sh -c 'cd /app/backend && npx prisma migrate deploy'
--
-- ============================================================================
