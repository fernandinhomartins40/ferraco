-- ============================================================================
-- SCRIPT: Migrar Templates Existentes para MessageTemplateLibrary
-- Data: 26/11/2025
-- Descrição: Migra dados de RecurrenceMessageTemplate e WhatsAppMessageTemplate
--            para a nova tabela centralizada MessageTemplateLibrary
-- ============================================================================

-- ============================================================================
-- ETAPA 1: Migrar RecurrenceMessageTemplate → MessageTemplateLibrary
-- ============================================================================

INSERT INTO message_template_library (
  id,
  name,
  description,
  category,
  content,
  "mediaUrls",
  "mediaType",
  "availableVariables",
  "isActive",
  "isSystem",
  "isFavorite",
  "usageCount",
  "triggerType",
  "minCaptures",
  "maxCaptures",
  "daysSinceCapture",
  "triggerConditions",
  priority,
  "createdAt",
  "updatedAt"
)
SELECT
  'lib_rec_' || id AS id,
  name,
  description,
  'RECURRENCE' AS category,
  content,
  "mediaUrls",
  "mediaType",
  -- Variáveis disponíveis para templates de recorrência
  '["lead.name", "lead.phone", "lead.email", "company.name", "company.phone", "company.email", "company.website", "company.workingHours", "captureNumber", "daysSinceLastCapture", "previousInterests", "currentInterest"]' AS "availableVariables",
  "isActive",
  true AS "isSystem", -- Templates migrados são considerados do sistema
  false AS "isFavorite",
  "usageCount",
  trigger AS "triggerType",
  "minCaptures",
  "maxCaptures",
  "daysSinceLastCapture" AS "daysSinceCapture",
  conditions AS "triggerConditions",
  priority,
  "createdAt",
  "updatedAt"
FROM recurrence_message_templates
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ETAPA 2: Migrar WhatsAppMessageTemplate → MessageTemplateLibrary
-- ============================================================================

INSERT INTO message_template_library (
  id,
  name,
  description,
  category,
  content,
  "mediaUrls",
  "mediaType",
  "availableVariables",
  "isActive",
  "isSystem",
  "isFavorite",
  "usageCount",
  "triggerType",
  "minCaptures",
  "maxCaptures",
  "daysSinceCapture",
  "triggerConditions",
  priority,
  "createdAt",
  "updatedAt"
)
SELECT
  'lib_wa_' || id AS id,
  name,
  'Template de mensagem WhatsApp (migrado)' AS description,
  'AUTOMATION' AS category,
  content,
  "mediaUrls",
  "mediaType",
  -- Variáveis disponíveis para templates de automação
  '["nome", "produto", "lead.name", "lead.phone", "company.name"]' AS "availableVariables",
  "isActive",
  false AS "isSystem", -- Templates criados por usuários
  false AS "isFavorite",
  0 AS "usageCount", -- Contador inicia do zero
  NULL AS "triggerType",
  NULL AS "minCaptures",
  NULL AS "maxCaptures",
  NULL AS "daysSinceCapture",
  '{}' AS "triggerConditions",
  0 AS priority,
  "createdAt",
  "updatedAt"
FROM whatsapp_message_templates
ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- ETAPA 3: Atualizar Relacionamento de AutomationKanbanColumn
-- ============================================================================

-- Atualizar colunas existentes para usar a biblioteca centralizada
UPDATE automation_kanban_columns
SET "templateLibraryId" = 'lib_wa_' || "messageTemplateId"
WHERE "messageTemplateId" IS NOT NULL
  AND "templateLibraryId" IS NULL;

-- ============================================================================
-- ETAPA 4: Verificar Migração
-- ============================================================================

-- Contar templates migrados
SELECT
  category,
  COUNT(*) as total,
  SUM(CASE WHEN "isSystem" THEN 1 ELSE 0 END) as system_templates,
  SUM(CASE WHEN "isActive" THEN 1 ELSE 0 END) as active_templates
FROM message_template_library
GROUP BY category
ORDER BY category;

-- Verificar relacionamentos de colunas atualizados
SELECT
  COUNT(*) as total_columns,
  COUNT("templateLibraryId") as with_library_template,
  COUNT("messageTemplateId") as with_old_template
FROM automation_kanban_columns
WHERE "isActive" = true;

-- Listar templates da biblioteca
SELECT
  id,
  name,
  category,
  "isSystem",
  "isActive",
  "usageCount",
  "triggerType",
  priority
FROM message_template_library
ORDER BY category, priority DESC, name;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- ✅ Templates de RecorrenceMessageTemplate são migrados com prefixo 'lib_rec_'
-- ✅ Templates de WhatsAppMessageTemplate são migrados com prefixo 'lib_wa_'
-- ✅ Templates de recorrência são marcados como isSystem=true (não podem ser deletados)
-- ✅ Templates de automação são marcados como isSystem=false (podem ser editados)
-- ✅ Colunas de automação são atualizadas para usar templateLibraryId
-- ⚠️ As tabelas antigas NÃO são deletadas (manter compatibilidade)
--
-- ============================================================================
