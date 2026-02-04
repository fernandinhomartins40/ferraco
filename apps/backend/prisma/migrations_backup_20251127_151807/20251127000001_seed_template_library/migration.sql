-- Migration: Popular biblioteca de templates com dados iniciais
-- Data: 2025-11-27
-- Descrição: Insere 10 templates padrão na MessageTemplateLibrary

-- Inserir templates padrão (somente se não existirem)
INSERT INTO "message_template_library" (
    "id",
    "name",
    "description",
    "category",
    "content",
    "availableVariables",
    "isActive",
    "isSystem",
    "isFavorite",
    "usageCount",
    "priority",
    "createdAt",
    "updatedAt"
) VALUES
-- 1. Boas-vindas Inicial
(
    'mtl_' || gen_random_uuid()::text,
    'Boas-vindas Inicial',
    'Mensagem de boas-vindas para novos leads',
    'GENERIC',
    E'Olá {{lead.name}}! 👋\n\nSeja bem-vindo(a) à Metalúrgica Ferraco!\n\nSomos especialistas em equipamentos agropecuários de alta qualidade.\n\nComo podemos ajudá-lo(a) hoje?',
    '["lead.name", "lead.phone", "lead.email", "company.name"]',
    true,
    true,
    true,
    0,
    100,
    NOW(),
    NOW()
),
-- 2. Apresentação da Empresa
(
    'mtl_' || gen_random_uuid()::text,
    'Apresentação da Empresa',
    'Template para apresentar a empresa',
    'GENERIC',
    E'A *{{company.name}}* é líder em soluções agropecuárias há mais de 30 anos.\n\n✅ Produtos de alta qualidade\n✅ Entrega em todo o Brasil\n✅ Garantia e suporte especializado\n\nConheça nossos principais produtos:\n- Bebedouros\n- Comedouros\n- Sistemas de contenção\n- Free stall',
    '["lead.name", "company.name"]',
    true,
    true,
    false,
    0,
    90,
    NOW(),
    NOW()
),
-- 3. Solicitação de Orçamento
(
    'mtl_' || gen_random_uuid()::text,
    'Solicitação de Orçamento',
    'Template para leads que solicitam orçamento',
    'AUTOMATION',
    E'Olá {{lead.name}}!\n\nObrigado pelo interesse em nossos produtos! 📋\n\nPara elaborar um orçamento personalizado, preciso de algumas informações:\n\n1️⃣ Qual produto você tem interesse?\n2️⃣ Quantidade desejada\n3️⃣ Cidade/Estado para cálculo do frete\n\nAguardo seu retorno!',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    95,
    NOW(),
    NOW()
),
-- 4. Atendimento Humano Solicitado
(
    'mtl_' || gen_random_uuid()::text,
    'Atendimento Humano Solicitado',
    'Template quando o cliente solicita falar com atendente',
    'AUTOMATION',
    E'{{lead.name}}, entendo! 👨‍💼\n\nVou transferir você para um de nossos consultores especializados.\n\nEm breve alguém da nossa equipe entrará em contato.\n\nObrigado pela preferência!',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    98,
    NOW(),
    NOW()
),
-- 5. Follow-up 1 Captura
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 1 Captura',
    'Primeira mensagem de recorrência após captura',
    'RECURRENCE',
    E'Oi {{lead.name}}! 😊\n\nNotei que você demonstrou interesse em nossos produtos.\n\nGostaria de saber mais sobre:\n\n🐄 Bebedouros para gado\n🌾 Comedouros automáticos\n🔒 Sistemas de contenção\n\nQual te interessa mais?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    80,
    NOW(),
    NOW()
),
-- 6. Follow-up 2-3 Capturas
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 2-3 Capturas',
    'Mensagem para leads com 2-3 capturas',
    'RECURRENCE',
    E'Olá {{lead.name}}!\n\nVejo que você já nos visitou algumas vezes. 🌟\n\n*Oferta Especial:*\nPeça um orçamento hoje e ganhe *10% de desconto* em sua primeira compra!\n\nQuer aproveitar?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    75,
    NOW(),
    NOW()
),
-- 7. Follow-up 4+ Capturas
(
    'mtl_' || gen_random_uuid()::text,
    'Follow-up 4+ Capturas',
    'Mensagem para leads engajados (4+ capturas)',
    'RECURRENCE',
    E'Oi {{lead.name}}! 🎯\n\nPercebo que você é um lead super engajado com a Ferraco!\n\nQue tal agendar uma *consulta gratuita* com nosso especialista?\n\nPodemos encontrar a solução perfeita para sua necessidade.\n\nInteresse?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    85,
    NOW(),
    NOW()
),
-- 8. Reativação Lead Frio
(
    'mtl_' || gen_random_uuid()::text,
    'Reativação Lead Frio',
    'Mensagem para reativar leads inativos',
    'RECURRENCE',
    E'{{lead.name}}, sentimos sua falta! 💙\n\nHá um tempo você demonstrou interesse em nossos produtos.\n\n*Novidades:*\n✨ Novos modelos de bebedouros\n✨ Linha premium de comedouros\n✨ Condições especiais de pagamento\n\nVamos conversar?',
    '["lead.name"]',
    true,
    false,
    false,
    0,
    60,
    NOW(),
    NOW()
),
-- 9. Agradecimento Pós-Contato
(
    'mtl_' || gen_random_uuid()::text,
    'Agradecimento Pós-Contato',
    'Template de agradecimento após interação',
    'GENERIC',
    E'Obrigado pelo contato, {{lead.name}}! 🙏\n\nFoi um prazer atendê-lo(a).\n\nEstamos sempre à disposição para ajudar.\n\nAté breve!\n\n*{{company.name}}*\n📞 WhatsApp: {{company.phone}}',
    '["lead.name", "company.name", "company.phone"]',
    true,
    false,
    false,
    0,
    70,
    NOW(),
    NOW()
),
-- 10. Informações de Entrega
(
    'mtl_' || gen_random_uuid()::text,
    'Informações de Entrega',
    'Template com informações sobre entrega',
    'GENERIC',
    E'Informações sobre Entrega - {{company.name}}\n\n📦 *Frete:*\nRealizamos entregas para todo o Brasil via transportadora\n\n⏱️ *Prazo:*\n- Sul/Sudeste: 5-7 dias úteis\n- Norte/Nordeste: 10-15 dias úteis\n\n💰 *Pagamento:*\nAceitamos PIX, cartão e boleto\n\nPrecisa de um orçamento, {{lead.name}}?',
    '["lead.name", "company.name"]',
    true,
    false,
    false,
    0,
    65,
    NOW(),
    NOW()
)
ON CONFLICT DO NOTHING;

-- Atualizar triggers em templates de automação
UPDATE "message_template_library"
SET "triggerType" = 'modal_orcamento'
WHERE "name" = 'Solicitação de Orçamento'
AND "triggerType" IS NULL;

UPDATE "message_template_library"
SET "triggerType" = 'human_contact_request'
WHERE "name" = 'Atendimento Humano Solicitado'
AND "triggerType" IS NULL;

-- Atualizar configurações de recorrência
UPDATE "message_template_library"
SET
    "minCaptures" = 1,
    "maxCaptures" = 1,
    "daysSinceCapture" = 1
WHERE "name" = 'Follow-up 1 Captura'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET
    "minCaptures" = 2,
    "maxCaptures" = 3,
    "daysSinceCapture" = 3
WHERE "name" = 'Follow-up 2-3 Capturas'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET
    "minCaptures" = 4,
    "daysSinceCapture" = 5
WHERE "name" = 'Follow-up 4+ Capturas'
AND "minCaptures" IS NULL;

UPDATE "message_template_library"
SET "daysSinceCapture" = 15
WHERE "name" = 'Reativação Lead Frio'
AND "daysSinceCapture" IS NULL;
