-- ============================================================================
-- SCRIPT: Inserir Templates de Automação no Banco de Dados
-- Data: 26/11/2025
-- Descrição: Cria 4 templates padrão para automação WhatsApp
-- ============================================================================

-- Template 1: Modal de Orçamento
INSERT INTO recurrence_message_templates (
  id, name, description, trigger,
  "minCaptures", "maxCaptures", "daysSinceLastCapture",
  conditions, content, "mediaUrls", "mediaType",
  priority, "isActive", "usageCount", "createdAt", "updatedAt"
) VALUES (
  'tpl_modal_orcamento_001',
  'Confirmação de Orçamento - Modal',
  'Mensagem automática enviada quando lead solicita orçamento via modal',
  'modal_orcamento',
  1,
  1,
  NULL,
  '{}',
  'Olá {{lead.name}}! 👋

Recebemos sua solicitação de orçamento através do nosso site.

Nossa equipe comercial da {{company.name}} entrará em contato com você em até *2 horas úteis* pelo WhatsApp ou telefone.

Enquanto isso, fique à vontade para:
📞 Ligar para {{company.phone}}
📧 Enviar email para {{company.email}}
🌐 Acessar nosso site: {{company.website}}

Obrigado pelo interesse!
Equipe {{company.name}}',
  NULL,
  NULL,
  10,
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Template 2: Solicitação de Atendimento Humano
INSERT INTO recurrence_message_templates (
  id, name, description, trigger,
  "minCaptures", "maxCaptures", "daysSinceLastCapture",
  conditions, content, "mediaUrls", "mediaType",
  priority, "isActive", "usageCount", "createdAt", "updatedAt"
) VALUES (
  'tpl_human_contact_001',
  'Solicitação de Atendimento Humano',
  'Mensagem enviada quando lead solicita falar com consultor',
  'human_contact_request',
  1,
  NULL,
  NULL,
  '{}',
  'Olá {{lead.name}}! 👋

Entendemos que você gostaria de falar com um de nossos consultores.

Um especialista da {{company.name}} entrará em contato em breve para atendê-lo pessoalmente.

*Horário de atendimento:* {{company.workingHours}}

Obrigado pela confiança!
Equipe {{company.name}}',
  NULL,
  NULL,
  8,
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Template 3: Contato Genérico (Landing Page)
INSERT INTO recurrence_message_templates (
  id, name, description, trigger,
  "minCaptures", "maxCaptures", "daysSinceLastCapture",
  conditions, content, "mediaUrls", "mediaType",
  priority, "isActive", "usageCount", "createdAt", "updatedAt"
) VALUES (
  'tpl_generic_inquiry_001',
  'Contato Genérico - Landing Page',
  'Mensagem padrão para leads sem interesse específico',
  'generic_inquiry',
  1,
  NULL,
  NULL,
  '{}',
  'Olá {{lead.name}}! 👋

Obrigado por entrar em contato com a {{company.name}}.

Nossa equipe entrará em contato em breve para entender melhor como podemos ajudá-lo.

📞 {{company.phone}}
📧 {{company.email}}

Até breve!',
  NULL,
  NULL,
  5,
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Template 4: Chat sem Produtos (Reengajamento)
INSERT INTO recurrence_message_templates (
  id, name, description, trigger,
  "minCaptures", "maxCaptures", "daysSinceLastCapture",
  conditions, content, "mediaUrls", "mediaType",
  priority, "isActive", "usageCount", "createdAt", "updatedAt"
) VALUES (
  'tpl_chat_no_product_001',
  'Chat sem Interesse em Produtos',
  'Mensagem para leads do chat que não selecionaram produtos',
  'chat_no_interest',
  1,
  NULL,
  NULL,
  '{}',
  'Olá {{lead.name}}! 👋

Vi que você iniciou uma conversa conosco pelo chat, mas não conseguimos finalizar.

Gostaria de conhecer nossos produtos?

*Principais soluções da {{company.name}}:*
🐄 Bebedouros para gado
🏗️ Freestalls
🌾 Equipamentos para fazendas

Um consultor da nossa equipe pode te ajudar a escolher a melhor solução para sua propriedade.

📞 {{company.phone}}

Estou à disposição!
Equipe {{company.name}}',
  NULL,
  NULL,
  6,
  true,
  0,
  NOW(),
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verificar resultados
SELECT
  id,
  name,
  trigger,
  priority,
  "isActive",
  LENGTH(content) as content_length
FROM recurrence_message_templates
WHERE trigger IN ('modal_orcamento', 'human_contact_request', 'generic_inquiry', 'chat_no_interest')
ORDER BY priority DESC;
