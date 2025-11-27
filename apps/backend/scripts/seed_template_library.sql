-- ============================================================================
-- SCRIPT: Popular Biblioteca de Templates com Templates Padrão
-- Data: 26/11/2025
-- Descrição: Insere templates iniciais na MessageTemplateLibrary
-- ============================================================================

-- ============================================================================
-- TEMPLATES DE AUTOMAÇÃO (AUTOMATION)
-- ============================================================================

INSERT INTO message_template_library (
  id, name, description, category, content,
  "availableVariables", "isActive", "isSystem", "isFavorite",
  priority, "createdAt", "updatedAt"
) VALUES
-- Template 1: Boas-vindas Geral
(
  'lib_auto_001',
  'Boas-vindas - Padrão',
  'Mensagem de boas-vindas para novos leads',
  'AUTOMATION',
  'Olá {{lead.name}}! 👋

Seja bem-vindo(a) à {{company.name}}!

Nossa equipe está à disposição para ajudá-lo(a).

📞 {{company.phone}}
📧 {{company.email}}

Aguardamos seu contato!',
  '["lead.name", "company.name", "company.phone", "company.email"]',
  true, false, false, 10,
  NOW(), NOW()
),

-- Template 2: Seguimento de Interesse
(
  'lib_auto_002',
  'Seguimento - Produto de Interesse',
  'Mensagem de seguimento para produtos de interesse',
  'AUTOMATION',
  'Olá {{lead.name}}!

Vi que você demonstrou interesse em nossos produtos.

Temos ótimas soluções que podem atender suas necessidades!

Posso enviar mais informações sobre {{produto}}?

Atenciosamente,
{{company.name}}',
  '["lead.name", "produto", "company.name"]',
  true, false, false, 8,
  NOW(), NOW()
),

-- Template 3: Lembrete de Follow-up
(
  'lib_auto_003',
  'Lembrete - Follow-up',
  'Lembrete para dar continuidade ao atendimento',
  'AUTOMATION',
  'Olá {{lead.name}},

Estava pensando em você e gostaria de saber se ainda tem interesse em nossos produtos.

Temos algumas novidades que podem te interessar!

Quando podemos conversar?

Abraços,
Equipe {{company.name}}',
  '["lead.name", "company.name"]',
  true, false, true, 7,
  NOW(), NOW()
)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEMPLATES DE RECORRÊNCIA (RECURRENCE) - Migrados
-- ============================================================================

-- Estes serão populados pelo script de migração migrate_templates_to_library.sql

-- ============================================================================
-- TEMPLATES GENÉRICOS (GENERIC)
-- ============================================================================

INSERT INTO message_template_library (
  id, name, description, category, content,
  "availableVariables", "isActive", "isSystem", "isFavorite",
  priority, "createdAt", "updatedAt"
) VALUES
-- Template 1: Agradecimento
(
  'lib_gen_001',
  'Agradecimento - Padrão',
  'Mensagem de agradecimento genérica',
  'GENERIC',
  'Olá {{lead.name}}!

Muito obrigado pelo seu contato e interesse em {{company.name}}.

Valorizamos muito sua confiança e estamos aqui para ajudar no que precisar!

Até breve! 😊',
  '["lead.name", "company.name"]',
  true, false, false, 5,
  NOW(), NOW()
),

-- Template 2: Informações da Empresa
(
  'lib_gen_002',
  'Informações - Empresa',
  'Template com informações completas da empresa',
  'GENERIC',
  '📢 *{{company.name}}* - Informações de Contato

📞 Telefone: {{company.phone}}
📧 Email: {{company.email}}
🌐 Website: {{company.website}}

⏰ Horário de Atendimento:
{{company.workingHours}}

Estamos à disposição para atendê-lo(a)!',
  '["company.name", "company.phone", "company.email", "company.website", "company.workingHours"]',
  true, false, true, 6,
  NOW(), NOW()
)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- TEMPLATES CUSTOMIZADOS (CUSTOM) - Exemplos
-- ============================================================================

INSERT INTO message_template_library (
  id, name, description, category, content,
  "availableVariables", "isActive", "isSystem", "isFavorite",
  priority, "createdAt", "updatedAt"
) VALUES
-- Template 1: Promoção
(
  'lib_cust_001',
  'Promoção - Exemplo',
  'Template de exemplo para promoções',
  'CUSTOM',
  '🎉 *PROMOÇÃO ESPECIAL* 🎉

Olá {{lead.name}}!

Temos uma oferta exclusiva para você!

Entre em contato e saiba mais sobre nossos produtos com condições especiais.

📞 {{company.phone}}

Aproveite! Oferta válida por tempo limitado.

Equipe {{company.name}}',
  '["lead.name", "company.name", "company.phone"]',
  true, false, false, 3,
  NOW(), NOW()
)

ON CONFLICT (id) DO NOTHING;

-- ============================================================================
-- VERIFICAÇÃO
-- ============================================================================

-- Contar templates por categoria
SELECT
  category,
  COUNT(*) as total,
  SUM(CASE WHEN "isActive" THEN 1 ELSE 0 END) as active,
  SUM(CASE WHEN "isFavorite" THEN 1 ELSE 0 END) as favorites
FROM message_template_library
GROUP BY category
ORDER BY category;

-- Listar todos os templates criados
SELECT
  id,
  name,
  category,
  "isSystem",
  "isActive",
  "isFavorite",
  priority
FROM message_template_library
ORDER BY category, priority DESC, name;

-- ============================================================================
-- NOTAS
-- ============================================================================
--
-- ✅ 3 templates de AUTOMATION criados
-- ✅ 2 templates GENERIC criados
-- ✅ 1 template CUSTOM de exemplo criado
-- ℹ️ Templates de RECURRENCE serão migrados do script migrate_templates_to_library.sql
-- ℹ️ Templates marcados como isFavorite aparecem no topo das listagens
--
-- ============================================================================
