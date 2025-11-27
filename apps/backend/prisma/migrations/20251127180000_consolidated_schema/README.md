# Migration Consolidada - Ferraco CRM

## Data: 2025-11-27 18:00:00

### Descrição

Esta é uma **migration consolidada** que substitui todas as migrations anteriores. Foi criada para resolver problemas de migrations falhadas na produção e consolidar todo o schema do banco de dados em um único arquivo.

### O que esta migration faz

1. **Cria todos os ENUMs** (21 tipos enumerados)
2. **Cria todas as 45 tabelas** do sistema
3. **Cria todos os índices** para otimização de queries
4. **Adiciona todas as foreign keys** e constraints
5. **Popula dados iniciais** (seed data):
   - 10 templates de mensagens na tabela `message_template_library`
   - Configurações de triggers e recorrência para automações

### Tabelas Principais

#### Core System
- `users` - Usuários do sistema
- `user_permissions` - Permissões granulares
- `user_preferences` - Preferências dos usuários
- `refresh_tokens` - Tokens JWT
- `teams` - Equipes
- `team_members` - Membros das equipes

#### Lead Management
- `leads` - Leads/Contatos
- `lead_captures` - Histórico de capturas recorrentes
- `notes` - Notas e comentários
- `tags` - Tags/Etiquetas
- `lead_tags` - Relação Lead-Tag
- `partial_leads` - Leads parciais (formulários incompletos)

#### Kanban & Automation
- `kanban_columns` - Colunas do Kanban principal
- `automation_kanban_columns` - Colunas de automação de mensagens
- `automation_lead_positions` - Posição dos leads no Kanban de automação
- `automation_settings` - Configurações globais de automação

#### Templates & Messages
- `message_template_library` - **Biblioteca centralizada de templates** ⭐
- `message_templates` - Templates legados
- `whatsapp_message_templates` - Templates de WhatsApp (deprecated)
- `recurrence_message_templates` - Templates de recorrência

#### WhatsApp Integration (Stateless Architecture)
- `whatsapp_contacts` - Contatos do WhatsApp
- `whatsapp_notes` - Notas internas sobre conversas
- `whatsapp_conversations` - Conversas (deprecated - stateless)
- `whatsapp_messages` - Mensagens (deprecated - stateless)
- `whatsapp_automations` - Automações de envio
- `whatsapp_automation_messages` - Mensagens da automação
- `whatsapp_bot_sessions` - Sessões do bot
- `whatsapp_bot_messages` - Mensagens do bot

#### Communications & Interactions
- `communications` - Comunicações gerais
- `interactions` - Interações com leads
- `interaction_files` - Arquivos de interações

#### Opportunities & Pipeline
- `opportunities` - Oportunidades de venda
- `pipelines` - Pipelines de vendas
- `pipeline_stages` - Estágios dos pipelines

#### Automation & Integrations
- `automations` - Regras de automação
- `automation_executions` - Histórico de execuções
- `integrations` - Integrações externas
- `integration_sync_logs` - Logs de sincronização

#### Reports & Analytics
- `reports` - Relatórios
- `report_generations` - Gerações de relatórios
- `dashboard_configs` - Configurações de dashboard

#### AI & Intelligence
- `ai_analyses` - Análises de IA
- `ai_recommendations` - Recomendações de IA
- `conversion_predictions` - Predições de conversão
- `lead_scoring` - Pontuação de leads
- `duplicate_detections` - Detecção de duplicatas
- `duplicate_matches` - Matches de duplicatas

#### Chatbot
- `chatbot_sessions` - Sessões do chatbot web
- `chatbot_messages` - Mensagens do chatbot
- `chatbot_config` - Configuração do chatbot

#### System & Configuration
- `landing_page_config` - Configuração da landing page
- `landing_page_config_history` - Histórico de alterações
- `system_config` - Configurações do sistema
- `file_uploads` - Uploads de arquivos
- `digital_signatures` - Assinaturas digitais
- `audit_logs` - Logs de auditoria
- `notifications` - Notificações

#### External API
- `api_keys` - Chaves de API externa
- `api_usage_logs` - Logs de uso da API
- `webhooks` - Webhooks de eventos
- `webhook_deliveries` - Histórico de entregas
- `event_logs` - Log de eventos do sistema

### Templates Padrão (Seed Data)

A migration inclui 10 templates pré-configurados:

1. **Boas-vindas Inicial** (GENERIC, Sistema, Favorito)
2. **Apresentação da Empresa** (GENERIC, Sistema)
3. **Solicitação de Orçamento** (AUTOMATION)
4. **Atendimento Humano Solicitado** (AUTOMATION)
5. **Follow-up 1 Captura** (RECURRENCE)
6. **Follow-up 2-3 Capturas** (RECURRENCE)
7. **Follow-up 4+ Capturas** (RECURRENCE)
8. **Reativação Lead Frio** (RECURRENCE)
9. **Agradecimento Pós-Contato** (GENERIC)
10. **Informações de Entrega** (GENERIC)

### Como aplicar esta migration

#### Em desenvolvimento local:
```bash
cd apps/backend
npx prisma migrate deploy
```

#### Em produção (VPS):
```bash
# 1. Fazer backup do banco
ssh root@metalurgicaferraco.com "docker exec -e PGPASSWORD=ferraco123 ferraco-postgres pg_dump -U ferraco ferraco_crm > /root/backup_$(date +%Y%m%d_%H%M%S).sql"

# 2. Limpar tabela de migrations falhadas (se necessário)
ssh root@metalurgicaferraco.com "docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'DELETE FROM \"_prisma_migrations\" WHERE success = false;'"

# 3. Aplicar migration
ssh root@metalurgicaferraco.com "cd /root/ferraco-crm && git pull && docker exec ferraco-crm-vps sh -c 'cd /app/backend && npx prisma migrate deploy'"
```

### Migrations antigas

As migrations antigas foram movidas para:
- `apps/backend/prisma/migrations_backup_YYYYMMDD_HHMMSS/`

Não delete o backup até confirmar que tudo está funcionando corretamente em produção.

### Verificação

Após aplicar a migration, verificar:

```sql
-- Contar templates
SELECT COUNT(*) FROM "message_template_library";
-- Resultado esperado: 10 templates

-- Listar templates por categoria
SELECT category, COUNT(*) FROM "message_template_library" GROUP BY category;

-- Verificar templates do sistema
SELECT name, category, "isSystem", "isFavorite" FROM "message_template_library" WHERE "isSystem" = true;
```

### Rollback

**IMPORTANTE:** Esta é uma migration que recria todo o schema. Um rollback direto não é possível.

Se necessário reverter:
1. Restaurar backup do banco de dados
2. Restaurar migrations antigas do backup

### Notas Técnicas

- **Total de linhas:** 2.173 linhas SQL
- **Tamanho do arquivo:** 73KB
- **ENUMs criados:** 21
- **Tabelas criadas:** 45
- **Índices criados:** ~150+
- **Foreign Keys:** ~100+
- **Seed records:** 10 templates

### Autor

Gerado automaticamente via `prisma migrate diff` em 2025-11-27
Consolidado por: Claude Code
