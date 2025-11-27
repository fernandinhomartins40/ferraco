# 🚀 DEPLOYMENT: Sistema de Biblioteca de Templates

## 📋 Resumo da Implementação

Este documento descreve o deployment do **Sistema Unificado de Biblioteca de Templates**, implementado para centralizar e gerenciar todos os templates de mensagens do Ferraco CRM.

---

## ✅ O que foi implementado

### 1. **Backend**

#### Schema Prisma
- ✅ Novo enum `TemplateLibraryCategory` (AUTOMATION, RECURRENCE, GENERIC, CUSTOM, SYSTEM)
- ✅ Novo model `MessageTemplateLibrary` com todos os campos necessários
- ✅ Relacionamento `AutomationKanbanColumn.templateLibraryId` (novo campo)
- ✅ Mantida compatibilidade com `messageTemplateId` (deprecated)

#### Serviços
- ✅ `TemplateProcessorService` - Processamento centralizado de variáveis
  - Validação de templates
  - Substituição de variáveis
  - Preview com dados de exemplo
  - Catálogo de 20+ variáveis disponíveis

#### Módulo Template Library
- ✅ `template-library.service.ts` - CRUD completo + lógica de negócio
- ✅ `template-library.controller.ts` - Endpoints REST
- ✅ `template-library.routes.ts` - Rotas configuradas
- ✅ `template-library.validators.ts` - Validação Zod
- ✅ `template-library.types.ts` - TypeScript types

#### API Endpoints
```
GET    /api/template-library              - Listar templates (com filtros)
GET    /api/template-library/:id          - Buscar por ID
POST   /api/template-library              - Criar template
PUT    /api/template-library/:id          - Atualizar template
DELETE /api/template-library/:id          - Deletar template
POST   /api/template-library/:id/duplicate - Duplicar template
POST   /api/template-library/preview      - Preview de template
GET    /api/template-library/stats        - Estatísticas
GET    /api/template-library/variables    - Variáveis disponíveis
```

### 2. **Frontend**

#### Componentes
- ✅ **TemplateLibrary** (`pages/TemplateLibrary.tsx`)
  - Listagem com cards
  - Filtros por categoria, status, favoritos
  - Busca por nome/descrição/conteúdo
  - Estatísticas em cards
  - Ações: Criar, Editar, Duplicar, Deletar, Favoritar

- ✅ **TemplateEditor** (`components/admin/TemplateEditor.tsx`)
  - Modal de criação/edição
  - Editor com tabs (Editor/Preview)
  - Validação em tempo real
  - Preview com dados de exemplo
  - Suporte a variáveis

- ✅ **VariablePicker** (`components/admin/VariablePicker.tsx`)
  - Popover com lista de variáveis
  - Busca por variável
  - Agrupamento por categoria
  - Exemplos de uso
  - Inserção automática no cursor

#### Service
- ✅ `templateLibrary.service.ts` - Client HTTP para API

#### Rota
- ✅ `/admin/template-library` - Página principal registrada

### 3. **Scripts SQL**

- ✅ `migrate_templates_to_library.sql` - Migra dados antigos
- ✅ `seed_template_library.sql` - Popula templates iniciais

---

## 🔄 Passos do Deployment

### **PASSO 1: Verificar o código**
O código já está commitado e pronto. Verificar:
```bash
git status
git log --oneline -5
```

### **PASSO 2: Deploy via GitHub Actions**
Ao fazer push para `main`, o workflow automático irá:
1. Fazer SSH na VPS
2. Fazer git pull
3. Executar `npx prisma migrate deploy` (aplica migrations)
4. Executar `npx prisma generate` (gera Prisma Client)
5. Rebuild do Docker
6. Restart dos containers

### **PASSO 3: Executar Scripts SQL (Pós-Deploy)**

Após o deploy automático, executar manualmente via SSH:

```bash
# 1. Conectar na VPS
ssh root@72.60.10.108

# 2. Navegar para o projeto
cd /root/ferraco

# 3. Executar script de migração de dados antigos
docker exec -i ferraco-backend-1 psql $DATABASE_URL < apps/backend/scripts/migrate_templates_to_library.sql

# 4. Executar script de seed (templates iniciais)
docker exec -i ferraco-backend-1 psql $DATABASE_URL < apps/backend/scripts/seed_template_library.sql
```

### **PASSO 4: Verificar no Banco**

```bash
# Conectar no PostgreSQL
docker exec -it ferraco-backend-1 psql $DATABASE_URL

# Verificar tabela criada
\d message_template_library

# Contar templates
SELECT category, COUNT(*) FROM message_template_library GROUP BY category;

# Sair
\q
```

### **PASSO 5: Testar no Frontend**

1. Acessar: `https://seu-dominio/admin/template-library`
2. Verificar se templates aparecem
3. Criar um novo template de teste
4. Editar e duplicar
5. Verificar preview
6. Testar VariablePicker

---

## 📊 Comandos Úteis

### Verificar logs
```bash
docker logs ferraco-backend-1 --tail 100 -f
```

### Reiniciar apenas o backend
```bash
docker-compose restart backend
```

### Acessar banco de dados
```bash
docker exec -it ferraco-backend-1 psql $DATABASE_URL
```

### Verificar migrations aplicadas
```bash
docker exec ferraco-backend-1 npx prisma migrate status
```

---

## 🔍 Checklist Pós-Deploy

- [ ] Migrations aplicadas com sucesso
- [ ] Tabela `message_template_library` criada
- [ ] Coluna `templateLibraryId` adicionada em `automation_kanban_columns`
- [ ] Scripts SQL executados (migrate + seed)
- [ ] Templates antigos migrados
- [ ] Templates iniciais populados
- [ ] API `/api/template-library` respondendo
- [ ] Página `/admin/template-library` acessível
- [ ] Variáveis disponíveis carregando
- [ ] Preview funcionando
- [ ] CRUD completo funcionando

---

## 🚨 Troubleshooting

### Migration falhou
```bash
# Verificar status
npx prisma migrate status

# Forçar reset (CUIDADO: apenas em dev)
npx prisma migrate reset

# Aplicar migrations manualmente
npx prisma migrate deploy
```

### Templates não aparecem
```bash
# Verificar no banco
SELECT COUNT(*) FROM message_template_library;

# Re-executar seed
psql $DATABASE_URL < apps/backend/scripts/seed_template_library.sql
```

### API retorna 500
```bash
# Verificar logs
docker logs ferraco-backend-1 --tail 100

# Verificar Prisma Client gerado
npx prisma generate
```

---

## 📝 Notas Importantes

1. **Compatibilidade**: O sistema mantém os campos antigos (`messageTemplateId`) para compatibilidade
2. **Templates do Sistema**: Não podem ser deletados (apenas desativados)
3. **Validação**: Templates são validados antes de salvar
4. **Variáveis**: 20+ variáveis disponíveis (lead, company, system, capture)
5. **Prioridade**: Templates com maior prioridade aparecem primeiro

---

## 🎯 Próximos Passos (Futuro)

1. Adicionar upload de mídia nos templates
2. Criar templates de email (além de WhatsApp)
3. Sistema de versionamento de templates
4. Analytics de performance dos templates
5. A/B testing de templates
6. Templates com condicionais (if/else)

---

## 📚 Documentação Técnica

### Variáveis Disponíveis

**Lead:**
- `{{lead.name}}` - Nome do lead
- `{{lead.phone}}` - Telefone
- `{{lead.email}}` - Email
- `{{lead.company}}` - Empresa do lead

**Company:**
- `{{company.name}}` - Nome da empresa
- `{{company.phone}}` - Telefone da empresa
- `{{company.email}}` - Email
- `{{company.website}}` - Website
- `{{company.workingHours}}` - Horário de funcionamento

**System:**
- `{{system.currentDate}}` - Data atual

**Capture/Recurrence:**
- `{{captureNumber}}` - Número da captura
- `{{daysSinceLastCapture}}` - Dias desde última captura
- `{{previousInterests}}` - Interesses anteriores
- `{{currentInterest}}` - Interesse atual

### Categorias

- **AUTOMATION**: Templates para automações de colunas
- **RECURRENCE**: Templates para leads recorrentes
- **GENERIC**: Templates genéricos reutilizáveis
- **CUSTOM**: Templates customizados pelo usuário
- **SYSTEM**: Templates do sistema (pré-definidos)

---

## ✅ Conclusão

A implementação está **100% completa** e pronta para deployment.

Após executar os passos acima, o sistema de Biblioteca de Templates estará totalmente funcional e integrado ao Ferraco CRM.

**Data da Implementação:** 26/11/2025
**Implementado por:** Claude Code (Assistente IA)
