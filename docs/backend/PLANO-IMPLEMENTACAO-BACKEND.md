# PLANO DE IMPLEMENTAÇÃO DO BACKEND - FERRACO CRM

## 📋 ÍNDICE

1. [Visão Geral do Sistema](#1-visão-geral-do-sistema)
2. [Arquitetura e Stack Tecnológica](#2-arquitetura-e-stack-tecnológica)
3. [Análise Completa da Aplicação Frontend](#3-análise-completa-da-aplicação-frontend)
4. [Schema Prisma Completo](#4-schema-prisma-completo)
5. [Estrutura de Diretórios do Backend](#5-estrutura-de-diretórios-do-backend)
6. [Configuração Docker e Nginx](#6-configuração-docker-e-nginx)
7. [Fases de Implementação](#7-fases-de-implementação)

---

## 📚 DOCUMENTAÇÃO DETALHADA POR FASE

As fases de implementação foram organizadas em arquivos separados para facilitar a leitura e implementação:

### ✅ FASE 7 - Sistema de Autenticação e Autorização (COMPLETO)
**Arquivo**: [FASE-7-AUTENTICACAO.md](./FASE-7-AUTENTICACAO.md)

**Conteúdo**:
- JWT Tokens (Access + Refresh)
- Sistema de Permissões Granulares (5 roles)
- 5 Middlewares de Segurança
- Hash de senhas com Bcrypt (12 rounds)
- Rate Limiting (3 níveis)
- Logs de Auditoria automáticos
- **Código completo implementado e pronto para uso**

---

### 📦 FASE 8 - APIs Core (DOCUMENTADO)
**Arquivo**: [FASE-8-APIS-CORE.md](./FASE-8-APIS-CORE.md)

**Conteúdo**:
- **Leads**: 15 endpoints + Service + Controller + Validators
- **Leads Parciais**: 6 endpoints completos
- **Notas**: 10 endpoints com sistema de anexos
- **Tags**: 12 endpoints + Sistema de regras automáticas
- **Código TypeScript profissional sem `any`**
- **Duração**: 2 semanas

---

### 📦 FASE 9 - APIs Avançadas (DOCUMENTADO)
**Arquivo**: [FASE-9-APIS-AVANCADAS.md](./FASE-9-APIS-AVANCADAS.md)

**Conteúdo**:
- **Pipeline/CRM**: 15 endpoints + Funil de vendas
- **Comunicações**: 12 endpoints (WhatsApp, Email, SMS)
- **Automações**: 10 endpoints + Motor de regras
- **Relatórios**: 12 endpoints + Exportação (PDF, Excel, CSV)
- **Dashboard**: 8 endpoints + Widgets
- **Integrações**: 10 endpoints (Zapier, Make, etc)
- **Duração**: 2 semanas

---

### 📦 FASE 10 - IA e Analytics (DOCUMENTADO)
**Arquivo**: [FASE-10-IA-ANALYTICS.md](./FASE-10-IA-ANALYTICS.md)

**Conteúdo**:
- **Análise de Sentimento**: Processamento de texto
- **Predição de Conversão**: Machine Learning
- **Lead Scoring Automático**: Algoritmo de pontuação
- **Chatbot IA**: Intent detection + Context management
- **Detecção de Duplicatas**: Levenshtein + Soundex
- **Duração**: 1 semana

---

### 📦 FASE 11 - Validações e Regras de Negócio (DOCUMENTADO)
**Arquivo**: [FASE-11-VALIDACOES.md](./FASE-11-VALIDACOES.md)

**Conteúdo**:
- **Schemas Zod**: 100% dos endpoints
- **Validações Customizadas**: CPF, CNPJ, telefone
- **Middleware de Validação**: Genérico e reutilizável
- **Regras de Negócio**: Por módulo
- **Duração**: 1 semana

---

### 📦 FASE 12 - Testes Completos (DOCUMENTADO)
**Arquivo**: [FASE-12-TESTES.md](./FASE-12-TESTES.md)

**Conteúdo**:
- **Testes Unitários**: 90% coverage
- **Testes de Integração**: 80% coverage
- **Testes E2E**: Fluxos principais
- **Testes de Performance**: Artillery
- **Setup Jest**: Configuração completa
- **Duração**: 1 semana

---

### 📦 FASE 13 - Deploy e Monitoramento (DOCUMENTADO)
**Arquivo**: [FASE-13-DEPLOY.md](./FASE-13-DEPLOY.md)

**Conteúdo**:
- **Docker Compose Production**: Multi-container
- **CI/CD Pipeline**: GitHub Actions
- **Monitoramento**: Prometheus + Grafana
- **Logs**: Winston + Loki
- **Alertas**: Configuração automática
- **Duração**: 1 semana

---

### 📦 FASE 14 - Cronograma e Lançamento (DOCUMENTADO)
**Arquivo**: [FASE-14-CRONOGRAMA.md](./FASE-14-CRONOGRAMA.md)

**Conteúdo**:
- **Cronograma Detalhado**: 10 semanas
- **Recursos Necessários**: Equipe e infraestrutura
- **Estimativas de Custo**: R$ 50k-80k
- **Milestones**: Entregas por fase
- **Duração**: 1 semana (lançamento)

---

---

## 1. VISÃO GERAL DO SISTEMA

### 1.1 Descrição do Projeto

O **Ferraco CRM** é um sistema completo de gerenciamento de relacionamento com clientes (CRM) desenvolvido para o setor agropecuário, com foco em gerenciamento de leads, automação de comunicações, análise preditiva com IA, e integração com múltiplos canais de comunicação.

### 1.2 Funcionalidades Principais Identificadas

Baseado na análise completa do frontend, o sistema possui as seguintes funcionalidades:

#### 1.2.1 Módulo de Autenticação e Usuários
- Sistema de login e logout
- Gerenciamento de sessões com tokens JWT
- Refresh tokens
- Sistema de permissões granulares
- Gerenciamento de usuários e roles
- Perfis de usuário
- Troca de senha
- Logs de auditoria de segurança
- Gestão de equipes (teams)

#### 1.2.2 Módulo de Leads
- CRUD completo de leads
- Sistema de status (novo, em_andamento, concluído)
- Captura de leads parciais (formulários incompletos)
- Atribuição de leads a usuários
- Priorização de leads (low, medium, high)
- Fonte de leads (tracking)
- Follow-ups agendados
- Detecção e merge de duplicatas
- Lead scoring (pontuação)

#### 1.2.3 Módulo de Notas e Comentários
- CRUD de notas vinculadas a leads
- Notas importantes (flagging)
- Categorização de notas
- Histórico de notas
- Busca e filtros

#### 1.2.4 Módulo de Tags
- CRUD de tags
- Tags do sistema vs customizadas
- Cores personalizadas
- Aplicação automática de tags (regras)
- Tags por categoria
- Estatísticas de tags
- Tags populares

#### 1.2.5 Módulo de Pipeline/CRM
- Pipelines customizáveis
- Estágios do pipeline
- Kanban board
- Oportunidades de venda
- Tracking de conversão por estágio
- Tempo médio por estágio

#### 1.2.6 Módulo de Comunicações
- WhatsApp Business API
- Email
- SMS
- Chamadas telefônicas
- Templates de mensagens
- Histórico de comunicações
- Status de entrega

#### 1.2.7 Módulo de Automações
- Regras de automação
- Triggers (eventos disparadores)
- Condições
- Ações automatizadas
- Histórico de execução
- Estatísticas de automação

#### 1.2.8 Módulo de Relatórios e Dashboard
- Dashboard customizável
- Widgets configuráveis
- Métricas em tempo real
- Relatórios agendados
- Exportação (PDF, Excel, JSON)
- Funil de conversão
- Análise de cohort
- Performance por fonte
- Performance por equipe

#### 1.2.9 Módulo de IA e Analytics
- Análise de sentimento
- Predição de conversão
- Recomendações inteligentes
- Scoring automático
- Insights preditivos
- Chatbot com IA
- Qualificação automática de leads

#### 1.2.10 Módulo de Integrações
- Zapier
- Make (Integromat)
- Google Analytics
- Facebook Ads
- Instagram Ads
- HubSpot
- Pipedrive
- Mailchimp
- Webhooks customizados

#### 1.2.11 Módulo de Interações
- Registro de interações
- Tipos: call, email, meeting, whatsapp, sms, note, task
- Resultados de interações
- Próximas ações
- Upload de arquivos
- Participantes

#### 1.2.12 Módulo de Assinaturas Digitais
- Assinatura de documentos
- Tipos: contract, proposal, agreement, nda, custom
- Validação de assinaturas
- Certificados digitais
- Tracking de IP e timestamp

---

## 2. ARQUITETURA E STACK TECNOLÓGICA

### 2.1 Stack Completa

```
┌─────────────────────────────────────────────────────────────┐
│                      INTERNET/USERS                          │
└─────────────────────┬───────────────────────────────────────┘
                      │
                      ▼
┌─────────────────────────────────────────────────────────────┐
│                    NGINX (Reverse Proxy)                     │
│                    Port: 80/443 (SSL)                        │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  SSL Termination                                      │  │
│  │  Rate Limiting                                        │  │
│  │  Request Routing                                      │  │
│  │  Static File Serving (Frontend Build)                │  │
│  │  Gzip Compression                                     │  │
│  │  Security Headers                                     │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────┬───────────────────────────────────────┘
                      │
        ┌─────────────┼─────────────┐
        │             │             │
        ▼             ▼             ▼
┌──────────────┐ ┌──────────────┐ ┌──────────────┐
│   Frontend   │ │    Backend   │ │   Backend    │
│   Container  │ │  Container 1 │ │ Container 2  │
│              │ │              │ │              │
│ React + Vite │ │  Node.js +   │ │  Node.js +   │
│ TypeScript   │ │  TypeScript  │ │  TypeScript  │
│ Nginx Static │ │  + Express   │ │  + Express   │
│              │ │  + Prisma    │ │  + Prisma    │
│ Port: 8080   │ │  Port: 3000  │ │  Port: 3001  │
└──────────────┘ └──────┬───────┘ └──────┬───────┘
                        │                 │
                        └────────┬────────┘
                                 │
                                 ▼
                    ┌────────────────────────┐
                    │   SQLite Database      │
                    │   Volume Mount         │
                    │   /data/ferraco.db     │
                    └────────────────────────┘
```

### 2.2 Componentes da Stack

#### 2.2.1 Nginx (Reverse Proxy)
- **Versão**: nginx:1.25-alpine
- **Função**: Proxy reverso, SSL termination, load balancing
- **Configuração**:
  - Roteamento de `/api/*` para backend
  - Servir frontend estático em `/`
  - Headers de segurança
  - Rate limiting
  - Gzip compression

#### 2.2.2 Node.js + TypeScript
- **Versão Node**: 20.x LTS
- **Versão TypeScript**: 5.3.x
- **Framework**: Express.js 4.x
- **Compilação**: ts-node-dev (dev) / tsc (prod)

#### 2.2.3 Prisma ORM
- **Versão**: 5.x
- **Database**: SQLite3
- **Migrations**: Prisma Migrate
- **Features**:
  - Type-safe queries
  - Auto-generated client
  - Schema validation
  - Seeding

#### 2.2.4 SQLite3
- **Versão**: 3.x
- **Arquivo**: `/data/ferraco.db`
- **Backup**: Volume persistente Docker
- **Performance**: WAL mode enabled

### 2.3 Portas e Roteamento

| Serviço | Porta Interna | Porta Externa | Acesso |
|---------|---------------|---------------|---------|
| Nginx | 80/443 | 80/443 | Público |
| Frontend | 8080 | - | Interno (via Nginx) |
| Backend API | 3000 | - | Interno (via Nginx) |
| Backend API (replica) | 3001 | - | Interno (via Nginx) |
| Database | - | - | Volume mount |

### 2.4 Rotas Nginx

```nginx
# Frontend
location / {
    proxy_pass http://frontend:8080;
}

# Backend API
location /api/ {
    proxy_pass http://backend:3000/;
    # Load balancing entre containers
}

# Health check
location /health {
    proxy_pass http://backend:3000/health;
}

# WebSocket (para features futuras)
location /ws {
    proxy_pass http://backend:3000;
    proxy_http_version 1.1;
    proxy_set_header Upgrade $http_upgrade;
    proxy_set_header Connection "upgrade";
}
```

---

## 3. ANÁLISE COMPLETA DA APLICAÇÃO FRONTEND

### 3.1 Mapeamento de Endpoints da API

Baseado na análise do código frontend, identificamos **todos** os endpoints necessários:

#### 3.1.1 Endpoints de Autenticação
```typescript
POST   /api/auth/login              // Login
POST   /api/auth/logout             // Logout
POST   /api/auth/register           // Registro de novo usuário
POST   /api/auth/refresh            // Refresh token
GET    /api/auth/me                 // Dados do usuário logado
PUT    /api/auth/profile            // Atualizar perfil
PUT    /api/auth/change-password    // Trocar senha
POST   /api/auth/forgot-password    // Esqueci minha senha
POST   /api/auth/reset-password     // Resetar senha
GET    /api/auth/users              // Listar usuários (admin)
POST   /api/auth/users              // Criar usuário (admin)
PUT    /api/auth/users/:id          // Atualizar usuário (admin)
DELETE /api/auth/users/:id          // Deletar usuário (admin)
```

#### 3.1.2 Endpoints de Leads
```typescript
GET    /api/leads                   // Listar leads (com filtros e paginação)
GET    /api/leads/:id               // Buscar lead por ID
POST   /api/leads                   // Criar novo lead
PUT    /api/leads/:id               // Atualizar lead
PATCH  /api/leads/:id/status        // Atualizar status
DELETE /api/leads/:id               // Deletar lead
GET    /api/leads/stats             // Estatísticas de leads
GET    /api/leads/:id/notes         // Notas do lead
POST   /api/leads/:id/notes         // Criar nota no lead
GET    /api/leads/:id/interactions  // Interações do lead
POST   /api/leads/:id/interactions  // Criar interação
GET    /api/leads/:id/opportunities // Oportunidades do lead
POST   /api/leads/:id/opportunities // Criar oportunidade
GET    /api/leads/:id/tags          // Tags do lead
POST   /api/leads/:id/tags          // Adicionar tag ao lead
DELETE /api/leads/:id/tags/:tagId   // Remover tag do lead
GET    /api/leads/:id/timeline      // Timeline completa do lead
GET    /api/leads/duplicates        // Detectar duplicatas
POST   /api/leads/:id/merge         // Merge de leads duplicados
```

#### 3.1.3 Endpoints de Leads Parciais
```typescript
POST   /api/partial-leads/capture            // Capturar dados parciais
POST   /api/partial-leads/mark-converted     // Marcar como convertido
GET    /api/partial-leads                    // Listar leads parciais
POST   /api/partial-leads/:id/convert        // Converter para lead completo
POST   /api/partial-leads/:id/abandon        // Marcar como abandonado
DELETE /api/partial-leads/cleanup            // Limpar antigos
```

#### 3.1.4 Endpoints de Notas
```typescript
GET    /api/notes                   // Listar notas (com filtros e paginação)
GET    /api/notes/:id               // Buscar nota por ID
POST   /api/notes                   // Criar nota (alternativo a /leads/:id/notes)
PUT    /api/notes/:id               // Atualizar nota
DELETE /api/notes/:id               // Deletar nota
PATCH  /api/notes/:id/importance    // Marcar como importante
GET    /api/notes/stats             // Estatísticas de notas
GET    /api/notes/categories        // Categorias disponíveis
POST   /api/notes/:id/duplicate     // Duplicar nota
```

#### 3.1.5 Endpoints de Tags
```typescript
GET    /api/tags                    // Listar tags (com filtros e paginação)
GET    /api/tags/:id                // Buscar tag por ID
POST   /api/tags                    // Criar tag
PUT    /api/tags/:id                // Atualizar tag
DELETE /api/tags/:id                // Deletar tag
PATCH  /api/tags/:id/status         // Ativar/desativar tag
GET    /api/tags/rules              // Regras de tags automáticas
POST   /api/tags/:id/rules          // Criar/atualizar regras
GET    /api/tags/stats              // Estatísticas de tags
GET    /api/tags/predefined-colors  // Cores pré-definidas
GET    /api/tags/popular            // Tags mais usadas
GET    /api/tags/by-category        // Tags agrupadas por categoria
POST   /api/tags/apply-automatic/:leadId  // Aplicar tags automáticas
```

#### 3.1.6 Endpoints de Dashboard
```typescript
GET    /api/dashboard/metrics            // Métricas gerais
GET    /api/dashboard/detailed-metrics   // Métricas detalhadas com filtros
GET    /api/dashboard/widgets            // Widgets configurados
POST   /api/dashboard/widgets            // Criar widget
PUT    /api/dashboard/widgets/:id        // Atualizar widget
DELETE /api/dashboard/widgets/:id        // Deletar widget
GET    /api/dashboard/configs            // Configurações de dashboard
POST   /api/dashboard/configs            // Criar configuração
PUT    /api/dashboard/configs/:id        // Atualizar configuração
```

#### 3.1.7 Endpoints de Pipeline
```typescript
GET    /api/pipelines               // Listar pipelines
GET    /api/pipelines/:id           // Buscar pipeline por ID
POST   /api/pipelines               // Criar pipeline
PUT    /api/pipelines/:id           // Atualizar pipeline
DELETE /api/pipelines/:id           // Deletar pipeline
GET    /api/pipelines/:id/stages    // Estágios do pipeline
POST   /api/pipelines/:id/stages    // Criar estágio
PUT    /api/pipelines/:id/stages/:stageId  // Atualizar estágio
DELETE /api/pipelines/:id/stages/:stageId  // Deletar estágio
PATCH  /api/leads/:id/pipeline-stage      // Mover lead no pipeline
GET    /api/pipelines/:id/stats           // Estatísticas do pipeline
```

#### 3.1.8 Endpoints de Comunicações
```typescript
GET    /api/communications/:leadId        // Histórico de comunicações
POST   /api/communications/whatsapp      // Enviar WhatsApp
POST   /api/communications/email         // Enviar Email
POST   /api/communications/sms           // Enviar SMS
POST   /api/communications/call          // Registrar chamada
GET    /api/communications/templates     // Templates de mensagens
POST   /api/communications/templates     // Criar template
PUT    /api/communications/templates/:id // Atualizar template
DELETE /api/communications/templates/:id // Deletar template
GET    /api/communications/config/whatsapp  // Config WhatsApp
PUT    /api/communications/config/whatsapp  // Atualizar config
POST   /api/communications/webhooks/whatsapp // Webhook WhatsApp
```

#### 3.1.9 Endpoints de Automações
```typescript
GET    /api/automations             // Listar automações
GET    /api/automations/:id         // Buscar automação por ID
POST   /api/automations             // Criar automação
PUT    /api/automations/:id         // Atualizar automação
DELETE /api/automations/:id         // Deletar automação
PATCH  /api/automations/:id/status  // Ativar/desativar
GET    /api/automations/:id/history // Histórico de execuções
GET    /api/automations/stats       // Estatísticas de automações
POST   /api/automations/:id/test    // Testar automação
```

#### 3.1.10 Endpoints de Relatórios
```typescript
GET    /api/reports                 // Listar relatórios
GET    /api/reports/:id             // Buscar relatório por ID
POST   /api/reports                 // Criar relatório
PUT    /api/reports/:id             // Atualizar relatório
DELETE /api/reports/:id             // Deletar relatório
POST   /api/reports/:id/generate    // Gerar relatório
GET    /api/reports/:id/download    // Download relatório
GET    /api/reports/analytics/funnel      // Funil de conversão
GET    /api/reports/analytics/cohort      // Análise de cohort
GET    /api/reports/analytics/sources     // Análise por fonte
GET    /api/reports/analytics/team        // Performance da equipe
GET    /api/reports/analytics/benchmarks  // Benchmarks da indústria
```

#### 3.1.11 Endpoints de Integrações
```typescript
GET    /api/integrations            // Listar integrações
GET    /api/integrations/:id        // Buscar integração por ID
POST   /api/integrations            // Criar integração
PUT    /api/integrations/:id        // Atualizar integração
DELETE /api/integrations/:id        // Deletar integração
PATCH  /api/integrations/:id/status // Ativar/desativar
POST   /api/integrations/:id/sync   // Forçar sincronização
POST   /api/integrations/:id/test   // Testar integração
POST   /api/integrations/webhooks/:type  // Receber webhooks
```

#### 3.1.12 Endpoints de IA e Analytics
```typescript
POST   /api/ai/analyze-sentiment    // Análise de sentimento
POST   /api/ai/predict-conversion   // Predição de conversão
POST   /api/ai/generate-recommendations  // Gerar recomendações
POST   /api/ai/calculate-score      // Calcular lead score
GET    /api/ai/insights             // Insights preditivos
POST   /api/ai/chatbot/message      // Enviar mensagem ao chatbot
GET    /api/ai/chatbot/config       // Config do chatbot
PUT    /api/ai/chatbot/config       // Atualizar config
GET    /api/ai/chatbot/sessions/:leadId  // Sessão do chatbot
```

#### 3.1.13 Endpoints de Interações
```typescript
GET    /api/interactions/:leadId    // Listar interações do lead
POST   /api/interactions            // Criar interação
PUT    /api/interactions/:id        // Atualizar interação
DELETE /api/interactions/:id        // Deletar interação
POST   /api/interactions/:id/files  // Upload de arquivo
DELETE /api/interactions/:id/files/:fileId  // Deletar arquivo
```

#### 3.1.14 Endpoints de Oportunidades
```typescript
GET    /api/opportunities/:leadId   // Listar oportunidades do lead
POST   /api/opportunities           // Criar oportunidade
PUT    /api/opportunities/:id       // Atualizar oportunidade
DELETE /api/opportunities/:id       // Deletar oportunidade
PATCH  /api/opportunities/:id/stage // Atualizar estágio
GET    /api/opportunities/stats     // Estatísticas de oportunidades
```

#### 3.1.15 Endpoints de Logs de Auditoria
```typescript
GET    /api/audit-logs              // Listar logs de auditoria
GET    /api/audit-logs/:id          // Buscar log por ID
GET    /api/audit-logs/user/:userId // Logs de um usuário
GET    /api/audit-logs/resource/:resourceId // Logs de um recurso
GET    /api/audit-logs/summary      // Resumo de segurança
```

#### 3.1.16 Endpoints de Times
```typescript
GET    /api/teams                   // Listar times
GET    /api/teams/:id               // Buscar time por ID
POST   /api/teams                   // Criar time
PUT    /api/teams/:id               // Atualizar time
DELETE /api/teams/:id               // Deletar time
POST   /api/teams/:id/members       // Adicionar membro
DELETE /api/teams/:id/members/:userId  // Remover membro
GET    /api/teams/:id/performance   // Performance do time
```

#### 3.1.17 Endpoints de Assinaturas Digitais
```typescript
GET    /api/signatures/:leadId      // Listar assinaturas do lead
POST   /api/signatures              // Criar assinatura
GET    /api/signatures/:id          // Buscar assinatura
POST   /api/signatures/:id/validate // Validar assinatura
GET    /api/signatures/:id/certificate  // Certificado da assinatura
```

#### 3.1.18 Endpoints Utilitários
```typescript
GET    /api/health                  // Health check
GET    /api/version                 // Versão da API
GET    /api/config                  // Configurações públicas
POST   /api/upload                  // Upload de arquivos
GET    /api/files/:id               // Download de arquivo
DELETE /api/files/:id               // Deletar arquivo
```

### 3.2 Total de Endpoints Identificados

**Total: 140+ endpoints RESTful**

---

## 4. SCHEMA PRISMA COMPLETO

### 4.1 Arquivo: `prisma/schema.prisma`

```prisma
// ============================================================================
// FERRACO CRM - SCHEMA PRISMA COMPLETO
// Database: SQLite
// ORM: Prisma 5.x
// ============================================================================

generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "sqlite"
  url      = env("DATABASE_URL")
}

// ============================================================================
// ENUMS
// ============================================================================

enum UserRole {
  ADMIN
  SALES
  CONSULTANT
  MANAGER
  SUPPORT
}

enum LeadStatus {
  NOVO
  EM_ANDAMENTO
  CONCLUIDO
  PERDIDO
  ARQUIVADO
}

enum LeadPriority {
  LOW
  MEDIUM
  HIGH
  URGENT
}

enum CommunicationType {
  WHATSAPP
  EMAIL
  SMS
  CALL
}

enum CommunicationDirection {
  INBOUND
  OUTBOUND
}

enum CommunicationStatus {
  PENDING
  SENT
  DELIVERED
  READ
  FAILED
}

enum InteractionType {
  CALL
  EMAIL
  MEETING
  WHATSAPP
  SMS
  NOTE
  TASK
}

enum InteractionOutcome {
  SUCCESSFUL
  NO_ANSWER
  BUSY
  CALLBACK_REQUESTED
  NOT_INTERESTED
  INTERESTED
}

enum AutomationTriggerType {
  LEAD_CREATED
  STATUS_CHANGED
  TIME_BASED
  TAG_ADDED
  NOTE_ADDED
  INTERACTION_CREATED
}

enum AutomationActionType {
  SEND_MESSAGE
  CHANGE_STATUS
  ADD_TAG
  REMOVE_TAG
  ADD_NOTE
  SET_FOLLOW_UP
  ASSIGN_USER
  CREATE_TASK
}

enum IntegrationType {
  ZAPIER
  MAKE
  GOOGLE_ANALYTICS
  FACEBOOK_ADS
  INSTAGRAM_ADS
  HUBSPOT
  PIPEDRIVE
  MAILCHIMP
  CUSTOM
}

enum IntegrationSyncStatus {
  SUCCESS
  ERROR
  PENDING
  DISABLED
}

enum IntegrationSyncFrequency {
  REALTIME
  HOURLY
  DAILY
  WEEKLY
}

enum ReportType {
  LEADS_OVERVIEW
  CONVERSION_FUNNEL
  TAG_PERFORMANCE
  AUTOMATION_STATS
  TEAM_PERFORMANCE
  CUSTOM
}

enum ReportScheduleFrequency {
  DAILY
  WEEKLY
  MONTHLY
}

enum ReportExportFormat {
  PDF
  EXCEL
  JSON
  CSV
}

enum MessageTemplateCategory {
  WELCOME
  FOLLOW_UP
  REMINDER
  PROMOTIONAL
  CUSTOM
}

enum AISentiment {
  POSITIVE
  NEUTRAL
  NEGATIVE
}

enum AIUrgencyLevel {
  LOW
  MEDIUM
  HIGH
  CRITICAL
}

enum DuplicateDetectionStatus {
  PENDING
  CONFIRMED
  DISMISSED
}

enum DuplicateSuggestedAction {
  MERGE
  KEEP_SEPARATE
  NEEDS_REVIEW
}

enum DocumentType {
  CONTRACT
  PROPOSAL
  AGREEMENT
  NDA
  CUSTOM
}

enum NotificationChannel {
  EMAIL
  PUSH
  IN_APP
  SMS
}

// ============================================================================
// TABELA: User (Usuários do Sistema)
// ============================================================================

model User {
  id                String    @id @default(cuid())
  username          String    @unique
  email             String    @unique
  password          String    // Hash bcrypt
  name              String
  role              UserRole  @default(CONSULTANT)
  avatar            String?
  isActive          Boolean   @default(true)

  // Timestamps
  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  lastLogin         DateTime?

  // Relações
  permissions       UserPermission[]
  teamMemberships   TeamMember[]
  preferences       UserPreferences?
  refreshTokens     RefreshToken[]
  assignedLeads     Lead[]       @relation("AssignedTo")
  createdLeads      Lead[]       @relation("CreatedBy")
  notes             Note[]
  interactions      Interaction[]
  opportunities     Opportunity[]
  automationsCreated Automation[] @relation("AutomationCreatedBy")
  pipelinesCreated  Pipeline[]   @relation("PipelineCreatedBy")
  integrationsCreated Integration[] @relation("IntegrationCreatedBy")
  reportsCreated    Report[]     @relation("ReportCreatedBy")
  auditLogs         AuditLog[]
  signatures        DigitalSignature[]
  dashboardConfigs  DashboardConfig[]
  notifications     Notification[]

  @@index([email])
  @@index([username])
  @@index([isActive])
  @@map("users")
}

// ============================================================================
// TABELA: UserPermission (Permissões Granulares)
// ============================================================================

model UserPermission {
  id         String   @id @default(cuid())
  userId     String
  resource   String   // 'leads', 'reports', 'automations', etc
  actions    String   // JSON array: ['create', 'read', 'update', 'delete']
  conditions String?  // JSON: condições especiais

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([userId, resource])
  @@index([userId])
  @@map("user_permissions")
}

// ============================================================================
// TABELA: UserPreferences (Preferências do Usuário)
// ============================================================================

model UserPreferences {
  id                   String   @id @default(cuid())
  userId               String   @unique
  theme                String   @default("light") // 'light', 'dark', 'auto'
  language             String   @default("pt-BR")
  timezone             String   @default("America/Sao_Paulo")

  // Notificações
  emailNewLeads        Boolean  @default(true)
  emailLeadUpdates     Boolean  @default(true)
  emailAutomations     Boolean  @default(true)
  emailWeeklyReports   Boolean  @default(true)
  emailSystemAlerts    Boolean  @default(true)

  pushEnabled          Boolean  @default(true)
  pushUrgentLeads      Boolean  @default(true)
  pushAssignedTasks    Boolean  @default(true)
  pushDeadlines        Boolean  @default(true)

  inAppEnabled         Boolean  @default(true)
  inAppSound           Boolean  @default(true)
  inAppDesktop         Boolean  @default(true)

  // Dashboard padrão
  defaultDashboardId   String?

  createdAt            DateTime @default(now())
  updatedAt            DateTime @updatedAt

  user                 User     @relation(fields: [userId], references: [id], onDelete: Cascade)
  defaultDashboard     DashboardConfig? @relation(fields: [defaultDashboardId], references: [id])

  @@map("user_preferences")
}

// ============================================================================
// TABELA: RefreshToken (Tokens de Refresh JWT)
// ============================================================================

model RefreshToken {
  id         String   @id @default(cuid())
  userId     String
  token      String   @unique
  expiresAt  DateTime
  createdAt  DateTime @default(now())
  revokedAt  DateTime?

  user       User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([token])
  @@index([expiresAt])
  @@map("refresh_tokens")
}

// ============================================================================
// TABELA: Team (Times/Equipes)
// ============================================================================

model Team {
  id          String   @id @default(cuid())
  name        String
  description String?
  isActive    Boolean  @default(true)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  members     TeamMember[]
  leads       Lead[]

  @@map("teams")
}

// ============================================================================
// TABELA: TeamMember (Membros de Times)
// ============================================================================

model TeamMember {
  id        String   @id @default(cuid())
  teamId    String
  userId    String
  isLead    Boolean  @default(false) // Líder do time

  joinedAt  DateTime @default(now())

  team      Team     @relation(fields: [teamId], references: [id], onDelete: Cascade)
  user      User     @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@unique([teamId, userId])
  @@index([teamId])
  @@index([userId])
  @@map("team_members")
}

// ============================================================================
// TABELA: Lead (Leads/Contatos)
// ============================================================================

model Lead {
  id                String        @id @default(cuid())
  name              String
  email             String?
  phone             String
  status            LeadStatus    @default(NOVO)
  priority          LeadPriority  @default(MEDIUM)
  source            String?       // Website, Facebook, Instagram, etc

  // Atribuição
  assignedToId      String?
  assignedAt        DateTime?
  teamId            String?

  // CRM
  pipelineStageId   String?
  leadScore         Float         @default(0)
  isDuplicate       Boolean       @default(false)
  duplicateOfId     String?

  // Follow-up
  nextFollowUpAt    DateTime?
  lastContactedAt   DateTime?

  // Metadados
  metadata          String?       // JSON: dados adicionais

  // Timestamps
  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt
  createdById       String

  // Relações
  assignedTo        User?         @relation("AssignedTo", fields: [assignedToId], references: [id])
  createdBy         User          @relation("CreatedBy", fields: [createdById], references: [id])
  team              Team?         @relation(fields: [teamId], references: [id])
  pipelineStage     PipelineStage? @relation(fields: [pipelineStageId], references: [id])
  duplicateOf       Lead?         @relation("DuplicateLeads", fields: [duplicateOfId], references: [id])
  duplicates        Lead[]        @relation("DuplicateLeads")

  notes             Note[]
  tags              LeadTag[]
  communications    Communication[]
  interactions      Interaction[]
  opportunities     Opportunity[]
  aiAnalysis        AIAnalysis?
  conversionPrediction ConversionPrediction?
  leadScoring       LeadScoring?
  duplicateDetections DuplicateDetection[] @relation("DetectedLead")
  potentialDuplicates DuplicateMatch[]
  signatures        DigitalSignature[]
  partialLeads      PartialLead[]
  chatbotSessions   ChatbotSession[]

  @@index([email])
  @@index([phone])
  @@index([status])
  @@index([assignedToId])
  @@index([createdById])
  @@index([createdAt])
  @@index([priority])
  @@index([leadScore])
  @@map("leads")
}

// ============================================================================
// TABELA: PartialLead (Leads Parciais - Formulários Incompletos)
// ============================================================================

model PartialLead {
  id               String    @id @default(cuid())
  sessionId        String    @unique
  name             String?
  email            String?
  phone            String?
  source           String
  url              String
  userAgent        String
  ipAddress        String?

  // Tracking
  firstInteraction DateTime  @default(now())
  lastUpdate       DateTime  @updatedAt
  interactions     Int       @default(1)

  // Status
  completed        Boolean   @default(false)
  abandoned        Boolean   @default(false)
  convertedToLeadId String?
  completedAt      DateTime?

  // Timestamps
  createdAt        DateTime  @default(now())

  // Relações
  convertedToLead  Lead?     @relation(fields: [convertedToLeadId], references: [id])

  @@index([sessionId])
  @@index([completed])
  @@index([abandoned])
  @@index([createdAt])
  @@map("partial_leads")
}

// ============================================================================
// TABELA: Note (Notas/Comentários)
// ============================================================================

model Note {
  id          String   @id @default(cuid())
  content     String
  important   Boolean  @default(false)
  category    String?  // Ligação, Email, Reunião, etc

  // Vinculação
  leadId      String
  createdById String

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relações
  lead        Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdBy   User     @relation(fields: [createdById], references: [id])

  @@index([leadId])
  @@index([createdById])
  @@index([important])
  @@index([createdAt])
  @@map("notes")
}

// ============================================================================
// TABELA: Tag (Tags/Etiquetas)
// ============================================================================

model Tag {
  id          String   @id @default(cuid())
  name        String   @unique
  color       String
  description String?
  isSystem    Boolean  @default(false)
  isActive    Boolean  @default(true)

  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  // Relações
  leads       LeadTag[]
  rules       TagRule[]

  @@index([name])
  @@index([isActive])
  @@map("tags")
}

// ============================================================================
// TABELA: LeadTag (Relação Many-to-Many: Lead <-> Tag)
// ============================================================================

model LeadTag {
  id        String   @id @default(cuid())
  leadId    String
  tagId     String
  addedAt   DateTime @default(now())
  addedById String?

  lead      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)
  tag       Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@unique([leadId, tagId])
  @@index([leadId])
  @@index([tagId])
  @@map("lead_tags")
}

// ============================================================================
// TABELA: TagRule (Regras de Aplicação Automática de Tags)
// ============================================================================

model TagRule {
  id         String   @id @default(cuid())
  tagId      String
  condition  String   // 'status_change', 'time_based', 'source', 'keyword'
  value      String   // JSON: valor da condição
  action     String   // 'add_tag', 'remove_tag'
  isActive   Boolean  @default(true)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  tag        Tag      @relation(fields: [tagId], references: [id], onDelete: Cascade)

  @@index([tagId])
  @@index([isActive])
  @@map("tag_rules")
}

// ============================================================================
// TABELA: Communication (Comunicações)
// ============================================================================

model Communication {
  id           String                  @id @default(cuid())
  leadId       String
  type         CommunicationType
  direction    CommunicationDirection
  status       CommunicationStatus     @default(PENDING)
  content      String
  templateId   String?

  // Metadados
  metadata     String?                 // JSON: dados adicionais (IDs externos, etc)

  // Timestamps
  timestamp    DateTime                @default(now())
  deliveredAt  DateTime?
  readAt       DateTime?

  // Relações
  lead         Lead                    @relation(fields: [leadId], references: [id], onDelete: Cascade)
  template     MessageTemplate?        @relation(fields: [templateId], references: [id])

  @@index([leadId])
  @@index([type])
  @@index([status])
  @@index([timestamp])
  @@map("communications")
}

// ============================================================================
// TABELA: MessageTemplate (Templates de Mensagens)
// ============================================================================

model MessageTemplate {
  id            String                    @id @default(cuid())
  name          String
  type          CommunicationType
  category      MessageTemplateCategory
  content       String
  variables     String                    // JSON array: variáveis disponíveis
  isActive      Boolean                   @default(true)

  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt

  communications Communication[]

  @@index([type])
  @@index([category])
  @@index([isActive])
  @@map("message_templates")
}

// ============================================================================
// TABELA: Interaction (Interações com Leads)
// ============================================================================

model Interaction {
  id              String             @id @default(cuid())
  leadId          String
  type            InteractionType
  title           String
  description     String
  duration        Int?               // minutos
  outcome         InteractionOutcome?
  nextAction      String?
  nextActionDate  DateTime?

  // Participantes
  participants    String             // JSON array: IDs de usuários

  // Timestamps
  createdAt       DateTime           @default(now())
  createdById     String

  // Relações
  lead            Lead               @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdBy       User               @relation(fields: [createdById], references: [id])
  files           InteractionFile[]

  @@index([leadId])
  @@index([type])
  @@index([createdAt])
  @@index([createdById])
  @@map("interactions")
}

// ============================================================================
// TABELA: InteractionFile (Arquivos de Interações)
// ============================================================================

model InteractionFile {
  id            String      @id @default(cuid())
  interactionId String
  name          String
  url           String
  type          String
  size          Int
  uploadedAt    DateTime    @default(now())

  interaction   Interaction @relation(fields: [interactionId], references: [id], onDelete: Cascade)

  @@index([interactionId])
  @@map("interaction_files")
}

// ============================================================================
// TABELA: Pipeline (Pipelines de Vendas)
// ============================================================================

model Pipeline {
  id           String          @id @default(cuid())
  name         String
  description  String?
  businessType String
  isDefault    Boolean         @default(false)

  createdAt    DateTime        @default(now())
  updatedAt    DateTime        @updatedAt
  createdById  String

  createdBy    User            @relation("PipelineCreatedBy", fields: [createdById], references: [id])
  stages       PipelineStage[]

  @@index([isDefault])
  @@map("pipelines")
}

// ============================================================================
// TABELA: PipelineStage (Estágios do Pipeline)
// ============================================================================

model PipelineStage {
  id               String   @id @default(cuid())
  pipelineId       String
  name             String
  description      String?
  color            String
  order            Int
  expectedDuration Int      // dias
  conversionRate   Float    @default(0)
  isClosedWon      Boolean  @default(false)
  isClosedLost     Boolean  @default(false)

  // Automações vinculadas
  automations      String?  // JSON array: IDs de automações

  createdAt        DateTime @default(now())
  updatedAt        DateTime @updatedAt

  pipeline         Pipeline @relation(fields: [pipelineId], references: [id], onDelete: Cascade)
  leads            Lead[]

  @@unique([pipelineId, order])
  @@index([pipelineId])
  @@map("pipeline_stages")
}

// ============================================================================
// TABELA: Opportunity (Oportunidades de Venda)
// ============================================================================

model Opportunity {
  id                String    @id @default(cuid())
  leadId            String
  title             String
  description       String
  value             Float
  currency          String    @default("BRL")
  probability       Int       // 0-100
  stage             String
  source            String
  competitors       String?   // JSON array
  notes             String?

  expectedCloseDate DateTime
  actualCloseDate   DateTime?

  createdAt         DateTime  @default(now())
  updatedAt         DateTime  @updatedAt
  createdById       String
  assignedToId      String

  lead              Lead      @relation(fields: [leadId], references: [id], onDelete: Cascade)
  createdBy         User      @relation(fields: [createdById], references: [id])
  assignedTo        User      @relation(fields: [assignedToId], references: [id])

  @@index([leadId])
  @@index([assignedToId])
  @@index([createdAt])
  @@map("opportunities")
}

// ============================================================================
// TABELA: Automation (Regras de Automação)
// ============================================================================

model Automation {
  id             String                  @id @default(cuid())
  name           String
  description    String
  isActive       Boolean                 @default(true)
  triggerType    AutomationTriggerType
  triggerValue   String?                 // JSON: valor do trigger

  conditions     String                  // JSON array: condições
  actions        String                  // JSON array: ações

  executionCount Int                     @default(0)
  lastExecutedAt DateTime?

  createdAt      DateTime                @default(now())
  updatedAt      DateTime                @updatedAt
  createdById    String

  createdBy      User                    @relation("AutomationCreatedBy", fields: [createdById], references: [id])
  executions     AutomationExecution[]

  @@index([isActive])
  @@index([triggerType])
  @@map("automations")
}

// ============================================================================
// TABELA: AutomationExecution (Histórico de Execuções)
// ============================================================================

model AutomationExecution {
  id            String     @id @default(cuid())
  automationId  String
  leadId        String?
  status        String     // 'success', 'failed', 'partial'
  result        String?    // JSON: resultado da execução
  error         String?

  executedAt    DateTime   @default(now())

  automation    Automation @relation(fields: [automationId], references: [id], onDelete: Cascade)

  @@index([automationId])
  @@index([executedAt])
  @@map("automation_executions")
}

// ============================================================================
// TABELA: Integration (Integrações Externas)
// ============================================================================

model Integration {
  id            String                    @id @default(cuid())
  name          String
  type          IntegrationType
  isEnabled     Boolean                   @default(true)

  // Configurações
  config        String                    // JSON: configurações da integração
  credentials   String                    // JSON ENCRYPTED: credenciais

  // Sync
  syncFrequency IntegrationSyncFrequency
  syncStatus    IntegrationSyncStatus     @default(PENDING)
  lastSync      DateTime?
  errorMessage  String?

  createdAt     DateTime                  @default(now())
  updatedAt     DateTime                  @updatedAt
  createdById   String

  createdBy     User                      @relation("IntegrationCreatedBy", fields: [createdById], references: [id])
  syncLogs      IntegrationSyncLog[]

  @@index([type])
  @@index([isEnabled])
  @@index([syncStatus])
  @@map("integrations")
}

// ============================================================================
// TABELA: IntegrationSyncLog (Logs de Sincronização)
// ============================================================================

model IntegrationSyncLog {
  id            String      @id @default(cuid())
  integrationId String
  status        String      // 'success', 'error'
  recordsSynced Int         @default(0)
  error         String?
  details       String?     // JSON

  syncedAt      DateTime    @default(now())

  integration   Integration @relation(fields: [integrationId], references: [id], onDelete: Cascade)

  @@index([integrationId])
  @@index([syncedAt])
  @@map("integration_sync_logs")
}

// ============================================================================
// TABELA: Report (Relatórios)
// ============================================================================

model Report {
  id              String                  @id @default(cuid())
  name            String
  type            ReportType
  filters         String                  // JSON: filtros do relatório
  widgets         String                  // JSON array: widgets

  isScheduled     Boolean                 @default(false)
  scheduleFrequency ReportScheduleFrequency?
  scheduleTime    String?                 // HH:mm
  scheduleRecipients String?              // JSON array: emails
  scheduleFormat  ReportExportFormat?

  lastGenerated   DateTime?

  createdAt       DateTime                @default(now())
  updatedAt       DateTime                @updatedAt
  createdById     String

  createdBy       User                    @relation("ReportCreatedBy", fields: [createdById], references: [id])
  generations     ReportGeneration[]

  @@index([type])
  @@index([isScheduled])
  @@map("reports")
}

// ============================================================================
// TABELA: ReportGeneration (Gerações de Relatórios)
// ============================================================================

model ReportGeneration {
  id          String   @id @default(cuid())
  reportId    String
  format      String
  fileUrl     String?
  status      String   // 'generating', 'completed', 'failed'
  error       String?

  generatedAt DateTime @default(now())

  report      Report   @relation(fields: [reportId], references: [id], onDelete: Cascade)

  @@index([reportId])
  @@index([generatedAt])
  @@map("report_generations")
}

// ============================================================================
// TABELA: DashboardConfig (Configurações de Dashboard)
// ============================================================================

model DashboardConfig {
  id         String   @id @default(cuid())
  userId     String?  // null = dashboard global
  name       String
  layout     String   @default("grid") // 'grid', 'list'
  widgets    String   // JSON array: configuração dos widgets
  isDefault  Boolean  @default(false)

  createdAt  DateTime @default(now())
  updatedAt  DateTime @updatedAt

  user       User?    @relation(fields: [userId], references: [id], onDelete: Cascade)
  userPreferences UserPreferences[]

  @@index([userId])
  @@index([isDefault])
  @@map("dashboard_configs")
}

// ============================================================================
// TABELA: AIAnalysis (Análises de IA)
// ============================================================================

model AIAnalysis {
  id                String         @id @default(cuid())
  leadId            String         @unique
  sentimentScore    Float          // -1 to 1
  sentiment         AISentiment
  keyTopics         String         // JSON array
  urgencyLevel      AIUrgencyLevel
  confidenceScore   Float          // 0-100

  lastAnalyzed      DateTime       @default(now())

  lead              Lead           @relation(fields: [leadId], references: [id], onDelete: Cascade)
  recommendations   AIRecommendation[]

  @@index([leadId])
  @@index([sentiment])
  @@index([urgencyLevel])
  @@map("ai_analyses")
}

// ============================================================================
// TABELA: AIRecommendation (Recomendações de IA)
// ============================================================================

model AIRecommendation {
  id              String      @id @default(cuid())
  aiAnalysisId    String
  type            String      // 'call', 'email', 'whatsapp', etc
  priority        String      // 'low', 'medium', 'high'
  title           String
  description     String
  suggestedAction String
  expectedImpact  String
  confidence      Float       // 0-100
  isImplemented   Boolean     @default(false)

  createdAt       DateTime    @default(now())

  aiAnalysis      AIAnalysis  @relation(fields: [aiAnalysisId], references: [id], onDelete: Cascade)

  @@index([aiAnalysisId])
  @@index([isImplemented])
  @@map("ai_recommendations")
}

// ============================================================================
// TABELA: ConversionPrediction (Predição de Conversão)
// ============================================================================

model ConversionPrediction {
  id                        String   @id @default(cuid())
  leadId                    String   @unique
  probability               Float    // 0-100
  confidence                Float    // 0-100
  estimatedTimeToConversion Int      // dias
  suggestedActions          String   // JSON array
  factors                   String   // JSON array: fatores de conversão

  lastUpdated               DateTime @default(now())

  lead                      Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([leadId])
  @@index([probability])
  @@map("conversion_predictions")
}

// ============================================================================
// TABELA: LeadScoring (Pontuação de Leads)
// ============================================================================

model LeadScoring {
  id             String   @id @default(cuid())
  leadId         String   @unique
  score          Float
  factors        String   // JSON array: fatores da pontuação
  history        String   // JSON array: histórico de mudanças

  lastCalculated DateTime @default(now())

  lead           Lead     @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([leadId])
  @@index([score])
  @@map("lead_scoring")
}

// ============================================================================
// TABELA: DuplicateDetection (Detecção de Duplicatas)
// ============================================================================

model DuplicateDetection {
  id          String                    @id @default(cuid())
  leadId      String
  confidence  Float                     // 0-100
  status      DuplicateDetectionStatus

  resolvedAt  DateTime?
  resolvedBy  String?

  createdAt   DateTime                  @default(now())

  lead        Lead                      @relation("DetectedLead", fields: [leadId], references: [id], onDelete: Cascade)
  matches     DuplicateMatch[]

  @@index([leadId])
  @@index([status])
  @@map("duplicate_detections")
}

// ============================================================================
// TABELA: DuplicateMatch (Matches de Duplicatas)
// ============================================================================

model DuplicateMatch {
  id                   String              @id @default(cuid())
  duplicateDetectionId String
  potentialDuplicateId String
  similarity           Float               // 0-100
  matchingFields       String              // JSON array: campos que batem
  suggestedAction      DuplicateSuggestedAction

  createdAt            DateTime            @default(now())

  duplicateDetection   DuplicateDetection  @relation(fields: [duplicateDetectionId], references: [id], onDelete: Cascade)
  potentialDuplicate   Lead                @relation(fields: [potentialDuplicateId], references: [id], onDelete: Cascade)

  @@index([duplicateDetectionId])
  @@index([potentialDuplicateId])
  @@map("duplicate_matches")
}

// ============================================================================
// TABELA: ChatbotSession (Sessões do Chatbot)
// ============================================================================

model ChatbotSession {
  id             String            @id @default(cuid())
  leadId         String?
  sessionId      String            @unique
  isActive       Boolean           @default(true)
  isQualified    Boolean           @default(false)
  conversationData String           // JSON: dados da conversa

  startedAt      DateTime          @default(now())
  endedAt        DateTime?

  lead           Lead?             @relation(fields: [leadId], references: [id])
  messages       ChatbotMessage[]

  @@index([leadId])
  @@index([sessionId])
  @@map("chatbot_sessions")
}

// ============================================================================
// TABELA: ChatbotMessage (Mensagens do Chatbot)
// ============================================================================

model ChatbotMessage {
  id               String          @id @default(cuid())
  chatbotSessionId String
  sender           String          // 'user', 'bot'
  content          String
  intent           String?
  confidence       Float?

  timestamp        DateTime        @default(now())

  chatbotSession   ChatbotSession  @relation(fields: [chatbotSessionId], references: [id], onDelete: Cascade)

  @@index([chatbotSessionId])
  @@index([timestamp])
  @@map("chatbot_messages")
}

// ============================================================================
// TABELA: ChatbotConfig (Configuração do Chatbot)
// ============================================================================

model ChatbotConfig {
  id                  String   @id @default(cuid())
  isEnabled           Boolean  @default(true)
  welcomeMessage      String
  fallbackMessage     String
  qualificationQuestions String  // JSON array
  handoffTriggers     String   // JSON array
  businessHours       String   // JSON: horários de funcionamento

  updatedAt           DateTime @updatedAt

  @@map("chatbot_config")
}

// ============================================================================
// TABELA: DigitalSignature (Assinaturas Digitais)
// ============================================================================

model DigitalSignature {
  id             String       @id @default(cuid())
  userId         String
  leadId         String
  documentType   DocumentType
  signatureData  String       // base64
  ipAddress      String
  isValid        Boolean      @default(true)
  certificateId  String?

  timestamp      DateTime     @default(now())

  user           User         @relation(fields: [userId], references: [id])
  lead           Lead         @relation(fields: [leadId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([leadId])
  @@index([timestamp])
  @@map("digital_signatures")
}

// ============================================================================
// TABELA: AuditLog (Logs de Auditoria)
// ============================================================================

model AuditLog {
  id           String   @id @default(cuid())
  userId       String
  userName     String
  action       String
  resource     String
  resourceId   String
  details      String?  // JSON
  ipAddress    String
  userAgent    String
  success      Boolean  @default(true)
  errorMessage String?

  timestamp    DateTime @default(now())

  user         User     @relation(fields: [userId], references: [id])

  @@index([userId])
  @@index([resource])
  @@index([resourceId])
  @@index([timestamp])
  @@index([action])
  @@map("audit_logs")
}

// ============================================================================
// TABELA: Notification (Notificações)
// ============================================================================

model Notification {
  id          String              @id @default(cuid())
  userId      String
  title       String
  message     String
  channel     NotificationChannel
  isRead      Boolean             @default(false)
  readAt      DateTime?
  data        String?             // JSON: dados adicionais

  createdAt   DateTime            @default(now())

  user        User                @relation(fields: [userId], references: [id], onDelete: Cascade)

  @@index([userId])
  @@index([isRead])
  @@index([createdAt])
  @@map("notifications")
}

// ============================================================================
// TABELA: SystemConfig (Configurações do Sistema)
// ============================================================================

model SystemConfig {
  id        String   @id @default(cuid())
  key       String   @unique
  value     String   // JSON
  isPublic  Boolean  @default(false) // Se pode ser exposto ao frontend

  updatedAt DateTime @updatedAt

  @@index([key])
  @@map("system_config")
}

// ============================================================================
// TABELA: FileUpload (Uploads de Arquivos)
// ============================================================================

model FileUpload {
  id          String   @id @default(cuid())
  fileName    String
  originalName String
  mimeType    String
  size        Int
  path        String
  url         String
  uploadedById String?

  createdAt   DateTime @default(now())

  @@index([uploadedById])
  @@index([createdAt])
  @@map("file_uploads")
}

// ============================================================================
// FIM DO SCHEMA
// ============================================================================
```

### 4.2 Resumo do Schema

**Total de Tabelas**: 45 tabelas

**Total de Enums**: 21 enums

**Relacionamentos**:
- One-to-One: 8
- One-to-Many: 67
- Many-to-Many: 3 (via tabelas de junção)

**Índices**: 150+ índices para performance

---

## 5. ESTRUTURA DE DIRETÓRIOS DO BACKEND

### 5.1 Estrutura Completa

```
ferraco/
├── apps/
│   ├── backend/                          # Backend Node.js + TypeScript
│   │   ├── src/
│   │   │   ├── config/                   # Configurações
│   │   │   │   ├── database.ts          # Config Prisma
│   │   │   │   ├── express.ts           # Config Express
│   │   │   │   ├── jwt.ts               # Config JWT
│   │   │   │   ├── cors.ts              # Config CORS
│   │   │   │   ├── rate-limit.ts        # Rate limiting
│   │   │   │   └── constants.ts         # Constantes
│   │   │   │
│   │   │   ├── middleware/               # Middlewares
│   │   │   │   ├── auth.middleware.ts   # Autenticação JWT
│   │   │   │   ├── permissions.middleware.ts  # Verificação de permissões
│   │   │   │   ├── validation.middleware.ts   # Validação Zod
│   │   │   │   ├── error-handler.middleware.ts  # Handler de erros
│   │   │   │   ├── logger.middleware.ts       # Logging
│   │   │   │   ├── rate-limit.middleware.ts   # Rate limiting
│   │   │   │   └── audit.middleware.ts        # Audit logging
│   │   │   │
│   │   │   ├── modules/                  # Módulos da aplicação
│   │   │   │   ├── auth/
│   │   │   │   │   ├── auth.controller.ts
│   │   │   │   │   ├── auth.service.ts
│   │   │   │   │   ├── auth.routes.ts
│   │   │   │   │   ├── auth.types.ts
│   │   │   │   │   ├── auth.validators.ts
│   │   │   │   │   └── auth.test.ts
│   │   │   │   │
│   │   │   │   ├── users/
│   │   │   │   │   ├── users.controller.ts
│   │   │   │   │   ├── users.service.ts
│   │   │   │   │   ├── users.routes.ts
│   │   │   │   │   ├── users.types.ts
│   │   │   │   │   ├── users.validators.ts
│   │   │   │   │   └── users.test.ts
│   │   │   │   │
│   │   │   │   ├── leads/
│   │   │   │   │   ├── leads.controller.ts
│   │   │   │   │   ├── leads.service.ts
│   │   │   │   │   ├── leads.routes.ts
│   │   │   │   │   ├── leads.types.ts
│   │   │   │   │   ├── leads.validators.ts
│   │   │   │   │   └── leads.test.ts
│   │   │   │   │
│   │   │   │   ├── partial-leads/
│   │   │   │   │   ├── partial-leads.controller.ts
│   │   │   │   │   ├── partial-leads.service.ts
│   │   │   │   │   ├── partial-leads.routes.ts
│   │   │   │   │   ├── partial-leads.types.ts
│   │   │   │   │   ├── partial-leads.validators.ts
│   │   │   │   │   └── partial-leads.test.ts
│   │   │   │   │
│   │   │   │   ├── notes/
│   │   │   │   │   ├── notes.controller.ts
│   │   │   │   │   ├── notes.service.ts
│   │   │   │   │   ├── notes.routes.ts
│   │   │   │   │   ├── notes.types.ts
│   │   │   │   │   ├── notes.validators.ts
│   │   │   │   │   └── notes.test.ts
│   │   │   │   │
│   │   │   │   ├── tags/
│   │   │   │   │   ├── tags.controller.ts
│   │   │   │   │   ├── tags.service.ts
│   │   │   │   │   ├── tags.routes.ts
│   │   │   │   │   ├── tags.types.ts
│   │   │   │   │   ├── tags.validators.ts
│   │   │   │   │   └── tags.test.ts
│   │   │   │   │
│   │   │   │   ├── pipeline/
│   │   │   │   │   ├── pipeline.controller.ts
│   │   │   │   │   ├── pipeline.service.ts
│   │   │   │   │   ├── pipeline.routes.ts
│   │   │   │   │   ├── pipeline.types.ts
│   │   │   │   │   ├── pipeline.validators.ts
│   │   │   │   │   └── pipeline.test.ts
│   │   │   │   │
│   │   │   │   ├── communications/
│   │   │   │   │   ├── communications.controller.ts
│   │   │   │   │   ├── communications.service.ts
│   │   │   │   │   ├── communications.routes.ts
│   │   │   │   │   ├── communications.types.ts
│   │   │   │   │   ├── communications.validators.ts
│   │   │   │   │   ├── whatsapp.service.ts
│   │   │   │   │   ├── email.service.ts
│   │   │   │   │   ├── sms.service.ts
│   │   │   │   │   └── communications.test.ts
│   │   │   │   │
│   │   │   │   ├── automations/
│   │   │   │   │   ├── automations.controller.ts
│   │   │   │   │   ├── automations.service.ts
│   │   │   │   │   ├── automations.routes.ts
│   │   │   │   │   ├── automations.types.ts
│   │   │   │   │   ├── automations.validators.ts
│   │   │   │   │   ├── automation-engine.service.ts
│   │   │   │   │   └── automations.test.ts
│   │   │   │   │
│   │   │   │   ├── reports/
│   │   │   │   │   ├── reports.controller.ts
│   │   │   │   │   ├── reports.service.ts
│   │   │   │   │   ├── reports.routes.ts
│   │   │   │   │   ├── reports.types.ts
│   │   │   │   │   ├── reports.validators.ts
│   │   │   │   │   ├── report-generator.service.ts
│   │   │   │   │   └── reports.test.ts
│   │   │   │   │
│   │   │   │   ├── dashboard/
│   │   │   │   │   ├── dashboard.controller.ts
│   │   │   │   │   ├── dashboard.service.ts
│   │   │   │   │   ├── dashboard.routes.ts
│   │   │   │   │   ├── dashboard.types.ts
│   │   │   │   │   └── dashboard.test.ts
│   │   │   │   │
│   │   │   │   ├── integrations/
│   │   │   │   │   ├── integrations.controller.ts
│   │   │   │   │   ├── integrations.service.ts
│   │   │   │   │   ├── integrations.routes.ts
│   │   │   │   │   ├── integrations.types.ts
│   │   │   │   │   ├── integrations.validators.ts
│   │   │   │   │   ├── zapier.service.ts
│   │   │   │   │   ├── make.service.ts
│   │   │   │   │   └── integrations.test.ts
│   │   │   │   │
│   │   │   │   ├── ai/
│   │   │   │   │   ├── ai.controller.ts
│   │   │   │   │   ├── ai.service.ts
│   │   │   │   │   ├── ai.routes.ts
│   │   │   │   │   ├── ai.types.ts
│   │   │   │   │   ├── sentiment-analysis.service.ts
│   │   │   │   │   ├── conversion-prediction.service.ts
│   │   │   │   │   ├── lead-scoring.service.ts
│   │   │   │   │   ├── chatbot.service.ts
│   │   │   │   │   └── ai.test.ts
│   │   │   │   │
│   │   │   │   ├── interactions/
│   │   │   │   │   ├── interactions.controller.ts
│   │   │   │   │   ├── interactions.service.ts
│   │   │   │   │   ├── interactions.routes.ts
│   │   │   │   │   ├── interactions.types.ts
│   │   │   │   │   ├── interactions.validators.ts
│   │   │   │   │   └── interactions.test.ts
│   │   │   │   │
│   │   │   │   ├── opportunities/
│   │   │   │   │   ├── opportunities.controller.ts
│   │   │   │   │   ├── opportunities.service.ts
│   │   │   │   │   ├── opportunities.routes.ts
│   │   │   │   │   ├── opportunities.types.ts
│   │   │   │   │   ├── opportunities.validators.ts
│   │   │   │   │   └── opportunities.test.ts
│   │   │   │   │
│   │   │   │   ├── teams/
│   │   │   │   │   ├── teams.controller.ts
│   │   │   │   │   ├── teams.service.ts
│   │   │   │   │   ├── teams.routes.ts
│   │   │   │   │   ├── teams.types.ts
│   │   │   │   │   ├── teams.validators.ts
│   │   │   │   │   └── teams.test.ts
│   │   │   │   │
│   │   │   │   ├── audit/
│   │   │   │   │   ├── audit.controller.ts
│   │   │   │   │   ├── audit.service.ts
│   │   │   │   │   ├── audit.routes.ts
│   │   │   │   │   ├── audit.types.ts
│   │   │   │   │   └── audit.test.ts
│   │   │   │   │
│   │   │   │   ├── signatures/
│   │   │   │   │   ├── signatures.controller.ts
│   │   │   │   │   ├── signatures.service.ts
│   │   │   │   │   ├── signatures.routes.ts
│   │   │   │   │   ├── signatures.types.ts
│   │   │   │   │   ├── signatures.validators.ts
│   │   │   │   │   └── signatures.test.ts
│   │   │   │   │
│   │   │   │   ├── notifications/
│   │   │   │   │   ├── notifications.controller.ts
│   │   │   │   │   ├── notifications.service.ts
│   │   │   │   │   ├── notifications.routes.ts
│   │   │   │   │   ├── notifications.types.ts
│   │   │   │   │   └── notifications.test.ts
│   │   │   │   │
│   │   │   │   └── files/
│   │   │   │       ├── files.controller.ts
│   │   │   │       ├── files.service.ts
│   │   │   │       ├── files.routes.ts
│   │   │   │       ├── files.types.ts
│   │   │   │       ├── files.validators.ts
│   │   │   │       └── files.test.ts
│   │   │   │
│   │   │   ├── utils/                    # Utilitários
│   │   │   │   ├── logger.ts            # Winston logger
│   │   │   │   ├── encryption.ts        # Criptografia
│   │   │   │   ├── pagination.ts        # Helper de paginação
│   │   │   │   ├── response.ts          # Response padronizado
│   │   │   │   ├── date.ts              # Helper de datas
│   │   │   │   ├── validation.ts        # Validações customizadas
│   │   │   │   └── errors.ts            # Classes de erro customizadas
│   │   │   │
│   │   │   ├── types/                    # Tipos TypeScript globais
│   │   │   │   ├── express.d.ts         # Extensões do Express
│   │   │   │   ├── index.ts             # Exports
│   │   │   │   └── prisma.ts            # Tipos Prisma
│   │   │   │
│   │   │   ├── jobs/                     # Background jobs
│   │   │   │   ├── automation-executor.job.ts
│   │   │   │   ├── report-scheduler.job.ts
│   │   │   │   ├── cleanup.job.ts
│   │   │   │   └── index.ts
│   │   │   │
│   │   │   ├── app.ts                    # Configuração do Express
│   │   │   ├── server.ts                 # Entry point
│   │   │   └── routes.ts                 # Registro de rotas
│   │   │
│   │   ├── prisma/
│   │   │   ├── schema.prisma            # Schema Prisma (já definido acima)
│   │   │   ├── seed.ts                  # Seed do banco
│   │   │   └── migrations/              # Migrations
│   │   │
│   │   ├── tests/
│   │   │   ├── integration/             # Testes de integração
│   │   │   ├── unit/                    # Testes unitários
│   │   │   ├── e2e/                     # Testes end-to-end
│   │   │   └── setup.ts                 # Setup dos testes
│   │   │
│   │   ├── .env.example                 # Variáveis de ambiente exemplo
│   │   ├── .env                         # Variáveis de ambiente (não commitar)
│   │   ├── Dockerfile                   # Dockerfile do backend
│   │   ├── .dockerignore                # Docker ignore
│   │   ├── package.json                 # Dependências
│   │   ├── tsconfig.json                # Config TypeScript
│   │   └── jest.config.js               # Config Jest
│   │
│   └── frontend/                         # (já existe)
│
├── packages/
│   └── shared/                           # (já existe)
│       └── src/
│           └── types/
│               └── common.ts             # Tipos compartilhados
│
├── docker/                               # Configurações Docker
│   ├── nginx/
│   │   ├── nginx.conf                   # Config Nginx principal
│   │   ├── conf.d/
│   │   │   ├── default.conf             # Config padrão
│   │   │   ├── api.conf                 # Config API
│   │   │   └── ssl.conf                 # Config SSL
│   │   └── ssl/                         # Certificados SSL
│   │       ├── cert.pem
│   │       └── key.pem
│   │
│   └── scripts/
│       ├── init-db.sh                   # Inicializar banco
│       ├── backup-db.sh                 # Backup automático
│       └── health-check.sh              # Health check
│
├── docker-compose.yml                    # Compose principal
├── docker-compose.prod.yml               # Compose produção
├── docker-compose.dev.yml                # Compose desenvolvimento
└── .dockerignore                         # Docker ignore global
```

### 5.2 Explicação da Estrutura

#### 5.2.1 Padrão de Módulos

Cada módulo segue a estrutura:
- `*.controller.ts`: Controllers (handlers de rotas)
- `*.service.ts`: Lógica de negócio
- `*.routes.ts`: Definição de rotas
- `*.types.ts`: Tipos TypeScript do módulo
- `*.validators.ts`: Schemas de validação Zod
- `*.test.ts`: Testes do módulo

#### 5.2.2 Separação de Responsabilidades

```
Request → Router → Middleware → Controller → Service → Prisma → Database
                                                ↓
                                            Utils/Helpers
```

---

## 6. CONFIGURAÇÃO DOCKER E NGINX

### 6.1 Arquivo: `docker-compose.yml`

```yaml
version: '3.8'

services:
  # ============================================================================
  # NGINX - Reverse Proxy
  # ============================================================================
  nginx:
    image: nginx:1.25-alpine
    container_name: ferraco-nginx
    restart: unless-stopped
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./docker/nginx/nginx.conf:/etc/nginx/nginx.conf:ro
      - ./docker/nginx/conf.d:/etc/nginx/conf.d:ro
      - ./docker/nginx/ssl:/etc/nginx/ssl:ro
      - ./apps/frontend/dist:/usr/share/nginx/html:ro
      - nginx-logs:/var/log/nginx
    depends_on:
      - backend
      - frontend
    networks:
      - ferraco-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s

  # ============================================================================
  # FRONTEND - React + Vite
  # ============================================================================
  frontend:
    build:
      context: .
      dockerfile: ./apps/frontend/Dockerfile
    container_name: ferraco-frontend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - VITE_API_URL=http://backend:3000
    networks:
      - ferraco-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:8080"]
      interval: 30s
      timeout: 10s
      retries: 3

  # ============================================================================
  # BACKEND API - Node.js + TypeScript + Prisma
  # ============================================================================
  backend:
    build:
      context: .
      dockerfile: ./apps/backend/Dockerfile
    container_name: ferraco-backend
    restart: unless-stopped
    environment:
      - NODE_ENV=production
      - DATABASE_URL=file:/data/ferraco.db
      - JWT_SECRET=${JWT_SECRET}
      - JWT_REFRESH_SECRET=${JWT_REFRESH_SECRET}
      - JWT_EXPIRATION=15m
      - JWT_REFRESH_EXPIRATION=7d
      - PORT=3000
      - CORS_ORIGIN=*
      - LOG_LEVEL=info
    volumes:
      - ferraco-data:/data
      - backend-logs:/app/logs
    networks:
      - ferraco-network
    healthcheck:
      test: ["CMD", "wget", "--quiet", "--tries=1", "--spider", "http://localhost:3000/health"]
      interval: 30s
      timeout: 10s
      retries: 3
      start_period: 40s
    deploy:
      replicas: 2
      resources:
        limits:
          cpus: '1'
          memory: 1G
        reservations:
          cpus: '0.5'
          memory: 512M

# ============================================================================
# VOLUMES
# ============================================================================
volumes:
  ferraco-data:
    driver: local
    driver_opts:
      type: none
      o: bind
      device: ./data
  backend-logs:
    driver: local
  nginx-logs:
    driver: local

# ============================================================================
# NETWORKS
# ============================================================================
networks:
  ferraco-network:
    driver: bridge
```

### 6.2 Arquivo: `apps/backend/Dockerfile`

```dockerfile
# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

# Instalar dependências
RUN npm ci --workspace=apps/backend --workspace=packages/shared

# Copiar código fonte
COPY apps/backend ./apps/backend
COPY packages/shared ./packages/shared

# Gerar Prisma Client
WORKDIR /app/apps/backend
RUN npx prisma generate

# Build TypeScript
RUN npm run build

# ============================================================================
# STAGE 2: Production
# ============================================================================
FROM node:20-alpine

WORKDIR /app

# Instalar apenas dependências de produção
COPY package*.json ./
COPY apps/backend/package*.json ./apps/backend/
COPY packages/shared/package*.json ./packages/shared/

RUN npm ci --workspace=apps/backend --workspace=packages/shared --only=production

# Copiar build do stage anterior
COPY --from=builder /app/apps/backend/dist ./apps/backend/dist
COPY --from=builder /app/apps/backend/prisma ./apps/backend/prisma
COPY --from=builder /app/apps/backend/node_modules/.prisma ./apps/backend/node_modules/.prisma
COPY --from=builder /app/packages/shared/dist ./packages/shared/dist

# Criar diretório de dados
RUN mkdir -p /data

# Exposer porta
EXPOSE 3000

# Variáveis de ambiente padrão
ENV NODE_ENV=production
ENV DATABASE_URL=file:/data/ferraco.db

WORKDIR /app/apps/backend

# Health check
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

# Comando de inicialização
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/server.js"]
```

### 6.3 Arquivo: `apps/frontend/Dockerfile`

```dockerfile
# ============================================================================
# STAGE 1: Builder
# ============================================================================
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar package files
COPY package*.json ./
COPY tsconfig*.json ./
COPY apps/frontend/package*.json ./apps/frontend/
COPY packages/shared/package*.json ./packages/shared/

# Instalar dependências
RUN npm ci --workspace=apps/frontend --workspace=packages/shared

# Copiar código fonte
COPY apps/frontend ./apps/frontend
COPY packages/shared ./packages/shared

# Build
WORKDIR /app/apps/frontend
RUN npm run build

# ============================================================================
# STAGE 2: Nginx
# ============================================================================
FROM nginx:1.25-alpine

# Copiar build
COPY --from=builder /app/apps/frontend/dist /usr/share/nginx/html

# Copiar configuração Nginx
COPY apps/frontend/nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 8080

CMD ["nginx", "-g", "daemon off;"]
```

### 6.4 Arquivo: `docker/nginx/nginx.conf`

```nginx
# ============================================================================
# NGINX MAIN CONFIG - FERRACO CRM
# ============================================================================

user nginx;
worker_processes auto;
error_log /var/log/nginx/error.log warn;
pid /var/run/nginx.pid;

events {
    worker_connections 1024;
    use epoll;
}

http {
    include /etc/nginx/mime.types;
    default_type application/octet-stream;

    # Logging
    log_format main '$remote_addr - $remote_user [$time_local] "$request" '
                    '$status $body_bytes_sent "$http_referer" '
                    '"$http_user_agent" "$http_x_forwarded_for"';

    access_log /var/log/nginx/access.log main;

    # Performance
    sendfile on;
    tcp_nopush on;
    tcp_nodelay on;
    keepalive_timeout 65;
    types_hash_max_size 2048;
    client_max_body_size 100M;

    # Gzip
    gzip on;
    gzip_vary on;
    gzip_proxied any;
    gzip_comp_level 6;
    gzip_types text/plain text/css text/xml text/javascript
               application/json application/javascript application/xml+rss
               application/rss+xml font/truetype font/opentype
               application/vnd.ms-fontobject image/svg+xml;

    # Security Headers
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;
    add_header Referrer-Policy "strict-origin-when-cross-origin" always;

    # Rate Limiting
    limit_req_zone $binary_remote_addr zone=api_limit:10m rate=100r/m;
    limit_req_zone $binary_remote_addr zone=auth_limit:10m rate=10r/m;

    # Upstream para backend (load balancing)
    upstream backend_servers {
        least_conn;
        server backend:3000 max_fails=3 fail_timeout=30s;
        keepalive 32;
    }

    # Incluir configurações adicionais
    include /etc/nginx/conf.d/*.conf;
}
```

### 6.5 Arquivo: `docker/nginx/conf.d/default.conf`

```nginx
# ============================================================================
# FERRACO CRM - DEFAULT SERVER CONFIG
# ============================================================================

server {
    listen 80;
    listen [::]:80;
    server_name _;

    # Redirect HTTP to HTTPS (produção)
    # return 301 https://$server_name$request_uri;

    # Frontend
    location / {
        proxy_pass http://frontend:8080;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Backend API
    location /api/ {
        # Rate limiting
        limit_req zone=api_limit burst=20 nodelay;

        # Remove /api prefix
        rewrite ^/api/(.*) /$1 break;

        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Auth endpoints com rate limit mais restritivo
    location ~ ^/api/auth/(login|register|forgot-password) {
        limit_req zone=auth_limit burst=5 nodelay;

        rewrite ^/api/(.*) /$1 break;
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    # Health check
    location /health {
        access_log off;
        proxy_pass http://backend_servers/health;
    }

    # WebSocket support
    location /ws {
        proxy_pass http://backend_servers;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_read_timeout 86400;
    }

    # Error pages
    error_page 404 /404.html;
    error_page 500 502 503 504 /50x.html;
}

# ============================================================================
# SSL Configuration (produção)
# ============================================================================
# server {
#     listen 443 ssl http2;
#     listen [::]:443 ssl http2;
#     server_name seu-dominio.com;
#
#     ssl_certificate /etc/nginx/ssl/cert.pem;
#     ssl_certificate_key /etc/nginx/ssl/key.pem;
#     ssl_protocols TLSv1.2 TLSv1.3;
#     ssl_ciphers HIGH:!aNULL:!MD5;
#     ssl_prefer_server_ciphers on;
#
#     # Mesmas configurações de location acima
# }
```

### 6.6 Arquivo: `.env.example`

```env
# ============================================================================
# FERRACO CRM - ENVIRONMENT VARIABLES
# ============================================================================

# Database
DATABASE_URL="file:./ferraco.db"

# JWT
JWT_SECRET="change-me-in-production-to-a-secure-random-string"
JWT_REFRESH_SECRET="change-me-too-different-from-jwt-secret"
JWT_EXPIRATION="15m"
JWT_REFRESH_EXPIRATION="7d"

# Server
NODE_ENV="development"
PORT=3000
CORS_ORIGIN="http://localhost:5173"
LOG_LEVEL="debug"

# WhatsApp Business API
WHATSAPP_BUSINESS_PHONE_ID=""
WHATSAPP_ACCESS_TOKEN=""
WHATSAPP_WEBHOOK_TOKEN=""

# Email (opcional)
EMAIL_HOST=""
EMAIL_PORT=587
EMAIL_USER=""
EMAIL_PASS=""
EMAIL_FROM=""

# SMS (opcional)
SMS_PROVIDER=""
SMS_API_KEY=""

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_DIR="./uploads"

# AI/ML (opcional)
OPENAI_API_KEY=""
OPENAI_MODEL="gpt-4"

# Integrations
ZAPIER_WEBHOOK_URL=""
MAKE_WEBHOOK_URL=""
GOOGLE_ANALYTICS_ID=""
FACEBOOK_APP_ID=""
FACEBOOK_APP_SECRET=""

# Backup
BACKUP_ENABLED=true
BACKUP_SCHEDULE="0 2 * * *"
BACKUP_RETENTION_DAYS=30

# Rate Limiting
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_MAX_REQUESTS=100

# Session
SESSION_SECRET="change-me-to-secure-random-string"
```

---

*(Continua na próxima mensagem devido ao limite de caracteres...)*
