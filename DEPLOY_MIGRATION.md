# Guia de Deploy - Migration Consolidada

## ⚠️ IMPORTANTE - LEIA ANTES DE EXECUTAR

Esta migration consolidada **recria todo o schema do banco de dados**. Siga os passos com atenção.

## Problema Identificado

Na VPS de produção, a tabela `MessageTemplate` não existe porque:
1. Havia uma migration falhada (`20250125_create_landing_page_history`)
2. O Prisma bloqueou a execução de novas migrations
3. A tabela `message_template_library` nunca foi criada

## Solução Implementada

Consolidamos todas as 17+ migrations em **uma única migration** que:
- Cria todo o schema do zero
- Inclui todos os ENUMs, tabelas, índices e foreign keys
- Popula 10 templates padrão na `message_template_library`

## Pré-requisitos

1. **Backup completo do banco de dados** ✅
2. **Acesso SSH à VPS** ✅
3. **Docker rodando na VPS** ✅

## Passo a Passo - Deploy na VPS

### 1. Fazer Backup do Banco de Dados

```bash
# Conectar à VPS
ssh root@metalurgicaferraco.com

# Criar backup
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres pg_dump -U ferraco ferraco_crm > /root/backup_pre_migration_$(date +%Y%m%d_%H%M%S).sql

# Verificar que o backup foi criado
ls -lh /root/backup_pre_migration_*.sql
```

### 2. Verificar Estado Atual das Migrations

```bash
# Ver migrations com falha
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'SELECT migration_name, started_at, finished_at, success FROM "_prisma_migrations" WHERE success = false ORDER BY started_at DESC;'
```

### 3. Limpar Migrations Falhadas

```bash
# Deletar registros de migrations falhadas
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'DELETE FROM "_prisma_migrations" WHERE success = false;'

# Confirmar limpeza
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'SELECT COUNT(*) as total_failed FROM "_prisma_migrations" WHERE success = false;'
# Resultado esperado: 0
```

### 4. Atualizar Código na VPS

```bash
# Ir para o diretório do projeto
cd /root/ferraco-crm

# Fazer backup do código atual
cp -r apps/backend/prisma apps/backend/prisma.backup.$(date +%Y%m%d_%H%M%S)

# Atualizar código do repositório
git fetch origin
git pull origin main

# Verificar que a nova migration existe
ls -la apps/backend/prisma/migrations/20251127180000_consolidated_schema/
```

### 5. Opção A - Migração Limpa (RECOMENDADO)

**⚠️ ATENÇÃO:** Esta opção **recria o schema do zero**. Use apenas se:
- O banco está corrompido ou inconsistente
- Você tem backup confiável
- Pode recriar os dados

```bash
# 1. Deletar TODAS as migrations da tabela _prisma_migrations
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'DELETE FROM "_prisma_migrations";'

# 2. Aplicar migration consolidada
docker exec ferraco-crm-vps sh -c 'cd /app/backend && npx prisma migrate deploy'

# 3. Gerar Prisma Client
docker exec ferraco-crm-vps sh -c 'cd /app/backend && npx prisma generate'

# 4. Reiniciar aplicação
docker restart ferraco-crm-vps
```

### 6. Opção B - Migração Resolve (Usar com Cuidado)

**⚠️ Use apenas se** você quer marcar a migration como aplicada SEM executar o SQL.

```bash
# Marcar migration consolidada como resolvida (não executa SQL)
docker exec ferraco-crm-vps sh -c 'cd /app/backend && npx prisma migrate resolve --applied 20251127180000_consolidated_schema'

# Depois, criar/popular tabelas manualmente ou via script
```

### 7. Opção C - Aplicação Parcial Manual (Avançado)

Se quiser aplicar apenas partes específicas:

```bash
# 1. Extrair apenas a criação da tabela message_template_library
docker exec ferraco-crm-vps sh -c 'cd /app/backend && cat prisma/migrations/20251127180000_consolidated_schema/migration.sql' | grep -A 100 "message_template_library"

# 2. Executar SQL manualmente
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm <<'EOF'
-- Cole aqui apenas o SQL necessário
EOF
```

## Verificação Pós-Deploy

### 1. Verificar que a tabela foi criada

```bash
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c '\dt message_template_library'
```

**Resultado esperado:**
```
                       List of relations
 Schema |           Name            | Type  | Owner
--------+---------------------------+-------+--------
 public | message_template_library  | table | ferraco
```

### 2. Verificar templates populados

```bash
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'SELECT COUNT(*) as total_templates FROM "message_template_library";'
```

**Resultado esperado:** `10 templates`

### 3. Listar templates por categoria

```bash
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm -c 'SELECT category, COUNT(*) as total FROM "message_template_library" GROUP BY category ORDER BY total DESC;'
```

**Resultado esperado:**
```
    category    | total
----------------+-------
 GENERIC        |     5
 RECURRENCE     |     4
 AUTOMATION     |     2
```

### 4. Testar API de Templates

```bash
# Dentro da VPS ou localmente
curl -X GET https://metalurgicaferraco.com/api/templates \
  -H "Authorization: Bearer SEU_TOKEN_JWT"
```

### 5. Verificar Logs do Backend

```bash
docker logs ferraco-crm-vps --tail=50 | grep -i template
```

## Rollback (Em Caso de Emergência)

### Restaurar Backup

```bash
# 1. Parar aplicação
docker stop ferraco-crm-vps

# 2. Restaurar backup
docker exec -e PGPASSWORD=ferraco123 ferraco-postgres psql -U ferraco -d ferraco_crm < /root/backup_pre_migration_YYYYMMDD_HHMMSS.sql

# 3. Reiniciar aplicação
docker start ferraco-crm-vps
```

### Restaurar Código Antigo

```bash
cd /root/ferraco-crm

# Restaurar prisma backup
rm -rf apps/backend/prisma
cp -r apps/backend/prisma.backup.YYYYMMDD_HHMMSS apps/backend/prisma

# Reverter Git
git reset --hard HEAD~1
```

## Checklist Final

- [ ] Backup do banco criado
- [ ] Backup do código criado
- [ ] Migrations falhadas limpas
- [ ] Código atualizado via Git
- [ ] Migration consolidada aplicada
- [ ] Prisma Client regenerado
- [ ] Aplicação reiniciada
- [ ] Tabela `message_template_library` existe
- [ ] 10 templates foram inseridos
- [ ] API `/api/templates` retorna dados
- [ ] Painel admin exibe templates
- [ ] Logs sem erros

## Suporte

Se encontrar problemas:

1. **Não entre em pânico** - você tem backup
2. **Verifique os logs:** `docker logs ferraco-crm-vps --tail=100`
3. **Verifique as migrations:** Query na tabela `_prisma_migrations`
4. **Consulte este documento** para rollback

## Arquivos Importantes

- Migration consolidada: `apps/backend/prisma/migrations/20251127180000_consolidated_schema/migration.sql`
- Schema Prisma: `apps/backend/prisma/schema.prisma`
- Backup migrations antigas: `apps/backend/prisma/migrations_backup_*/`

---

**Data de criação:** 2025-11-27
**Autor:** Claude Code
**Status:** Pronto para deploy
