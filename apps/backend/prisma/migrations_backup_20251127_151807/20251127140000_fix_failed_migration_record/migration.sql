-- Migration: Limpar registro de migration failed que está bloqueando o sistema
-- Data: 2025-11-27 14:00
-- Descrição: Remove registro da migration 20250125_create_landing_page_history da tabela _prisma_migrations
-- Razão: Migration com data futura (2025-01-25) estava marcada como failed e bloqueava todas as migrations posteriores

-- Remover registro da migration problemática
DELETE FROM "_prisma_migrations"
WHERE "migration_name" = '20250125_create_landing_page_history';

-- Nota: A tabela landing_page_config_history será recriada posteriormente se necessário
