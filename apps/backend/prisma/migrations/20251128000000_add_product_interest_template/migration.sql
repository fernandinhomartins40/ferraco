-- Migration: Add Product Interest Template
-- Descrição: Adiciona template de interesse em produto específico para landing page

-- Inserir template de interesse em produto (usar UPSERT para evitar duplicatas)
-- NOTA: a tabela recurrence_message_templates usa colunas em camelCase
-- (o modelo Prisma não declara @map), portanto os identificadores precisam
-- ser citados. A versão anterior usava snake_case e falhava em banco limpo
-- com: column "min_captures" of relation ... does not exist.
INSERT INTO recurrence_message_templates (
  "id",
  "name",
  "description",
  "trigger",
  "minCaptures",
  "maxCaptures",
  "daysSinceLastCapture",
  "conditions",
  "content",
  "mediaUrls",
  "mediaType",
  "priority",
  "isActive",
  "usageCount",
  "createdAt",
  "updatedAt"
) VALUES (
  'tpl_product_interest_001',
  'Interesse em Produto - Landing Page',
  'Mensagem automática quando lead demonstra interesse em produto específico',
  'modal-produto',
  1,
  1,
  NULL,
  '{}',
  'Olá {{lead.name}}! 👋

Obrigado pelo interesse em nosso produto **{{interest}}**! 🎯

Vi que você solicitou orçamento para:
📦 {{interest}}

Nossa equipe está preparando uma proposta personalizada para você.

Posso te ajudar com:
✅ Especificações técnicas do {{interest}}
✅ Orçamento sem compromisso
✅ Prazo de entrega
✅ Formas de pagamento

Qual informação te interessa mais?

📞 {{company.phone}}
📧 {{company.email}}

Aguardo seu retorno!
Equipe {{company.name}}',
  NULL,
  NULL,
  12,
  true,
  0,
  NOW(),
  NOW()
)
ON CONFLICT ("id") DO UPDATE SET
  "name" = EXCLUDED."name",
  "description" = EXCLUDED."description",
  "trigger" = EXCLUDED."trigger",
  "content" = EXCLUDED."content",
  "priority" = EXCLUDED."priority",
  "updatedAt" = NOW();
