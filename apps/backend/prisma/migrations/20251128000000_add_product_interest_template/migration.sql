-- Migration: Add Product Interest Template
-- Descrição: Adiciona template de interesse em produto específico para landing page

-- Inserir template de interesse em produto (usar UPSERT para evitar duplicatas)
INSERT INTO recurrence_message_templates (
  id,
  name,
  description,
  trigger,
  min_captures,
  max_captures,
  days_since_last_capture,
  conditions,
  content,
  media_urls,
  media_type,
  priority,
  is_active,
  usage_count,
  created_at,
  updated_at
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
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  description = EXCLUDED.description,
  trigger = EXCLUDED.trigger,
  content = EXCLUDED.content,
  priority = EXCLUDED.priority,
  updated_at = NOW();
