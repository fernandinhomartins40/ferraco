-- Migration: Migrar templates existentes para MessageTemplateLibrary
-- Data: 2025-11-27
-- Descrição: Copia templates do WhatsAppMessageTemplate para a nova biblioteca centralizada

-- Inserir templates existentes na biblioteca (somente se não existirem)
INSERT INTO "message_template_library" (
    "id",
    "name",
    "description",
    "category",
    "content",
    "mediaUrls",
    "mediaType",
    "availableVariables",
    "isActive",
    "isSystem",
    "isFavorite",
    "usageCount",
    "priority",
    "createdAt",
    "updatedAt"
)
SELECT
    gen_random_uuid(),  -- Novo ID
    wmt.name,
    'Migrado de WhatsAppMessageTemplate' AS description,
    'AUTOMATION' AS category,  -- Categoria padrão para templates de automação
    wmt.content,
    wmt."mediaUrls",
    wmt."mediaType",
    '["lead.name", "lead.phone", "lead.email", "company.name"]' AS "availableVariables",
    wmt."isActive",
    false AS "isSystem",  -- Não são templates do sistema
    false AS "isFavorite",
    0 AS "usageCount",  -- Resetar contador de uso
    10 AS priority,  -- Prioridade média
    wmt."createdAt",
    NOW() AS "updatedAt"
FROM "whatsapp_message_templates" wmt
WHERE NOT EXISTS (
    -- Evitar duplicatas: não inserir se já existe um template com o mesmo nome
    SELECT 1 FROM "message_template_library" mtl
    WHERE mtl.name = wmt.name
);
