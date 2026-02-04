# Landing Page Lead Settings - Documentação Completa

## 📋 Visão Geral

Esta funcionalidade permite configurar **como os leads da landing page são capturados e processados**, oferecendo duas opções principais:

1. **Criar Lead no CRM + Automação WhatsApp (Padrão)** - Lead é salvo no PostgreSQL e automações são criadas automaticamente
2. **Apenas Enviar WhatsApp com Dados** - Uma mensagem WhatsApp é enviada instantaneamente com os dados do lead

---

## 🎯 Objetivo

Oferecer flexibilidade na captação de leads, permitindo:
- **Empresas maiores**: Usar o CRM completo com funil de vendas e automações
- **Empresas menores**: Receber notificações instantâneas via WhatsApp sem configurar todo o CRM

---

## 🏗️ Arquitetura

### Backend

#### **1. Migration**
- Arquivo: `apps/backend/prisma/migrations/20260204000000_add_landing_page_config_system/migration.sql`
- Cria registro na tabela `system_config` com configuração padrão
- Key: `landing_page_lead_handling`

#### **2. Serviço de Notificação WhatsApp**
- Arquivo: `apps/backend/src/services/whatsappDirectNotification.service.ts`
- Classe: `WhatsAppDirectNotificationService`
- Métodos:
  - `sendLeadNotification()` - Envia notificação com dados do lead
  - `testWhatsAppConnection()` - Testa envio de mensagem
  - `formatMessage()` - Substitui variáveis no template
  - `formatWhatsAppNumber()` - Formata número (adiciona +55 se necessário)

#### **3. Controller Atualizado**
- Arquivo: `apps/backend/src/modules/leads/public-leads.controller.ts`
- Classe: `PublicLeadsController`
- Método `create()` modificado para:
  1. Buscar configuração do sistema via `getLeadHandlingConfig()`
  2. Se modo = `whatsapp_only`:
     - Enviar notificação WhatsApp direta
     - Opcionalmente criar lead silenciosamente para histórico
  3. Se modo = `create_lead`:
     - Criar lead no CRM (comportamento atual)
     - Criar automação WhatsApp

#### **4. Rotas de Configuração**
- Módulo: `apps/backend/src/modules/landing-page-settings/`
- Controller: `LandingPageSettingsController`
- Rotas:
  - `GET /api/admin/landing-page-settings` - Buscar configuração
  - `PUT /api/admin/landing-page-settings` - Atualizar configuração
  - `POST /api/admin/landing-page-settings/test` - Testar WhatsApp
- Registrado em: `apps/backend/src/app.ts`

### Frontend

#### **1. Service**
- Arquivo: `apps/frontend/src/services/landingPageSettings.service.ts`
- Métodos:
  - `get()` - Buscar configuração
  - `update()` - Atualizar configuração
  - `test()` - Testar conexão WhatsApp
  - `validate()` - Validar antes de salvar
  - `getDefaultTemplate()` - Template padrão de mensagem

#### **2. Página Admin**
- Arquivo: `apps/frontend/src/pages/admin/AdminLandingPageSettings.tsx`
- Componente: `AdminLandingPageSettings`
- Features:
  - RadioGroup para escolher modo (Create Lead vs WhatsApp Only)
  - Campos de configuração WhatsApp (número, template)
  - Botão "Testar Envio" para validar configuração
  - Inserção de variáveis no template com botões
  - Validação client-side antes de salvar

#### **3. Rotas**
- Arquivo: `apps/frontend/src/App.tsx`
- Rota: `/admin/landing-page-settings`
- Lazy loading do componente
- Protegida por autenticação

#### **4. Menu de Navegação**
- Arquivo: `apps/frontend/src/components/admin/AdminLayout.tsx`
- Item adicionado ao menu lateral: "Config. Leads LP"
- Ícone: `Settings2`

---

## 🔧 Configuração

### Estrutura da Configuração (JSON)

```typescript
{
  mode: 'create_lead' | 'whatsapp_only',
  whatsappNumber?: string,          // Ex: "+5511999999999"
  messageTemplate?: string,          // Template com variáveis
  createLeadAnyway?: boolean         // Se true, cria lead mesmo em modo whatsapp_only
}
```

### Variáveis Disponíveis no Template

- `{{name}}` - Nome do lead
- `{{phone}}` - Telefone do lead
- `{{email}}` - Email do lead (ou "Não informado")
- `{{interest}}` - Produto de interesse (ou "Não especificado")
- `{{source}}` - Origem da captura (formatada)
- `{{timestamp}}` - Data/hora da captura

### Template Padrão

```
🎯 *Novo Lead Capturado!*

👤 *Nome:* {{name}}
📱 *Telefone:* {{phone}}
📧 *Email:* {{email}}
🎨 *Produto de Interesse:* {{interest}}
🔗 *Origem:* {{source}}

📅 Capturado em: {{timestamp}}
```

---

## 📊 Fluxo de Dados

### Modo: Create Lead (Padrão)

```
[Landing Page Modal]
       ↓
[POST /api/public/leads]
       ↓
[PublicLeadsController.create()]
       ↓
[Buscar config: mode = 'create_lead']
       ↓
[leadRecurrenceService.handleLeadCapture()]
       ↓
[Lead criado no PostgreSQL]
       ↓
[whatsappAutomationService.createAutomationFromLead()]
       ↓
[Automação WhatsApp criada]
       ↓
[Resposta ao usuário: "Lead criado com sucesso"]
```

### Modo: WhatsApp Only

```
[Landing Page Modal]
       ↓
[POST /api/public/leads]
       ↓
[PublicLeadsController.create()]
       ↓
[Buscar config: mode = 'whatsapp_only']
       ↓
[whatsappDirectNotificationService.sendLeadNotification()]
       ↓
[Formatar mensagem com variáveis]
       ↓
[whatsappWebJSService.sendMessage()]
       ↓
[Mensagem enviada via WhatsApp]
       ↓
[Opcional: criar lead silencioso se createLeadAnyway = true]
       ↓
[Resposta ao usuário: "Mensagem enviada via WhatsApp"]
```

---

## 🧪 Como Testar

### 1. Acessar Página de Configuração
1. Fazer login no admin (`/login`)
2. Navegar para `/admin/landing-page-settings`
3. Verificar que a página carrega corretamente

### 2. Modo Create Lead (Padrão)
1. Selecionar opção "Criar Lead no CRM + Automação WhatsApp"
2. Clicar em "Salvar Configurações"
3. Acessar landing page (`/`)
4. Preencher modal de produto e enviar
5. Verificar que:
   - Lead foi criado em `/admin/leads`
   - Automação WhatsApp foi criada em `/admin/whatsapp-automations`

### 3. Modo WhatsApp Only
1. Na página de configurações, selecionar "Apenas Enviar WhatsApp com Dados"
2. Preencher:
   - **Número WhatsApp**: Seu número no formato `+55 11 99999-9999`
   - **Template**: Usar o padrão ou personalizar
   - Marcar: ☑ Criar lead silenciosamente para histórico
3. Clicar em **"Enviar Mensagem de Teste"**
4. Verificar que recebeu a mensagem de teste no WhatsApp
5. Clicar em "Salvar Configurações"
6. Acessar landing page (`/`)
7. Preencher modal de produto e enviar
8. Verificar que:
   - Mensagem foi recebida no WhatsApp com dados do lead
   - Se `createLeadAnyway = true`, lead aparece em `/admin/leads`
   - **NÃO** foi criada automação em `/admin/whatsapp-automations`

---

## 🔍 Validações

### Backend
- ✅ Validação do schema via Zod
- ✅ Modo deve ser `create_lead` ou `whatsapp_only`
- ✅ Se modo = `whatsapp_only`, número e template são obrigatórios
- ✅ Número de WhatsApp deve ter formato válido
- ✅ Rate limiting na rota pública (10 requests/15min)

### Frontend
- ✅ Validação de campos obrigatórios
- ✅ Template deve conter `{{name}}` e `{{phone}}`
- ✅ Feedback visual de erros e sucessos via toast
- ✅ Loading states durante operações assíncronas

---

## 🐛 Troubleshooting

### Erro: "Configuração não encontrada"
- **Causa**: Migration não foi executada
- **Solução**: Executar migration manualmente:
  ```bash
  cd apps/backend
  npx prisma migrate deploy
  ```

### Erro: "Falha ao enviar mensagem de teste"
- **Causa**: WhatsApp não está conectado ou número inválido
- **Solução**:
  1. Verificar conexão WhatsApp em `/admin/whatsapp`
  2. Confirmar que número tem código do país (+55)
  3. Verificar logs do backend para detalhes

### Lead não aparece no CRM (modo Create Lead)
- **Causa**: Erro na criação ou validação falhou
- **Solução**:
  1. Verificar logs do backend (`apps/backend`)
  2. Confirmar que telefone é válido
  3. Verificar se há duplicata (telefone já existe)

### Mensagem WhatsApp não é enviada (modo WhatsApp Only)
- **Causa**: Número inválido ou WhatsApp desconectado
- **Solução**:
  1. Testar com botão "Enviar Mensagem de Teste"
  2. Verificar formato do número (deve ter +55)
  3. Confirmar que WhatsApp está conectado
  4. Verificar logs: `apps/backend/logs`

---

## 📁 Arquivos Criados/Modificados

### Backend
- ✅ `apps/backend/prisma/migrations/20260204000000_add_landing_page_config_system/migration.sql`
- ✅ `apps/backend/src/services/whatsappDirectNotification.service.ts`
- ✅ `apps/backend/src/modules/leads/public-leads.controller.ts` (modificado)
- ✅ `apps/backend/src/modules/landing-page-settings/landing-page-settings.controller.ts`
- ✅ `apps/backend/src/modules/landing-page-settings/landing-page-settings.routes.ts`
- ✅ `apps/backend/src/modules/landing-page-settings/index.ts`
- ✅ `apps/backend/src/app.ts` (modificado)

### Frontend
- ✅ `apps/frontend/src/services/landingPageSettings.service.ts`
- ✅ `apps/frontend/src/pages/admin/AdminLandingPageSettings.tsx`
- ✅ `apps/frontend/src/App.tsx` (modificado)
- ✅ `apps/frontend/src/components/admin/AdminLayout.tsx` (modificado)

---

## 🚀 Próximos Passos (Futuras Melhorias)

1. **Múltiplos Destinatários WhatsApp**: Permitir enviar para vários números
2. **Templates Pré-definidos**: Biblioteca de templates por tipo de produto
3. **Webhooks**: Integração com sistemas externos (Zapier, n8n)
4. **Analytics**: Dashboard com estatísticas de captação por modo
5. **A/B Testing**: Testar qual modo converte mais
6. **Notificações Email**: Além de WhatsApp, enviar por email também

---

## 📝 Notas Técnicas

### Segurança
- Rotas de configuração protegidas por autenticação
- Requer permissão `settings:update` para modificar
- Rate limiting na rota pública de captação
- Validação de número WhatsApp para prevenir spam

### Performance
- Envio WhatsApp é assíncrono (não bloqueia resposta ao usuário)
- Criação de lead silencioso usa try/catch (não impacta fluxo principal)
- Cache de configuração pode ser implementado (futuramente)

### Compatibilidade
- ✅ Compatível com sistema de recorrência existente
- ✅ Mantém suporte a detecção de produto via `source` e `interest`
- ✅ Não quebra fluxo atual de automações WhatsApp

---

## 📞 Suporte

Para dúvidas ou problemas, verificar:
1. Logs do backend: `apps/backend/logs/`
2. Console do navegador (frontend)
3. Status do WhatsApp: `/admin/whatsapp`
4. Documentação do Prisma: https://www.prisma.io/docs

---

**Última atualização**: 2026-02-04
**Versão da feature**: 1.0.0
**Autor**: Claude Code (Anthropic)

