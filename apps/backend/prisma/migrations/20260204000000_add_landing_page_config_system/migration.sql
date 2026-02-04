-- Seed inicial para configuração de captação de leads da landing page
-- Este seed será executado apenas se a configuração não existir

-- Inserir configuração padrão (modo: criar lead + automação)
INSERT INTO system_config (id, key, value, "isPublic", "updatedAt")
SELECT
  'clp_config_001',
  'landing_page_lead_handling',
  '{"mode":"create_lead","whatsappNumber":"","messageTemplate":"🎯 *Novo Lead Capturado!*\\n\\n👤 *Nome:* {{name}}\\n📱 *Telefone:* {{phone}}\\n📧 *Email:* {{email}}\\n🎨 *Produto de Interesse:* {{interest}}\\n🔗 *Origem:* {{source}}\\n\\n📅 Capturado em: {{timestamp}}","createLeadAnyway":true}',
  false,
  NOW()
WHERE NOT EXISTS (
  SELECT 1 FROM system_config WHERE key = 'landing_page_lead_handling'
);
