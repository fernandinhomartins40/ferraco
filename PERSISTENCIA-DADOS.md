# 📦 Persistência de Dados - Ferraco CRM

## 🎯 Problema Identificado e Resolvido

### ❌ Problema Anterior
Após cada deploy via GitHub Actions, os dados e imagens upadas eram perdidos porque:

1. O workflow movia **todo o diretório** `/root/ferraco-crm/` para backup
2. Criava um novo diretório vazio
3. Os volumes Docker apontavam para o novo diretório vazio
4. **Resultado**: Perda de todas as imagens e dados persistentes

### ✅ Solução Implementada
O workflow agora:

1. **Preserva** a pasta `data/` antes de mover o diretório para backup
2. Move temporariamente para `/tmp/ferraco-data-backup`
3. Extrai o novo código
4. **Restaura** a pasta `data/` com todos os arquivos persistentes
5. **Resultado**: Imagens e dados são mantidos após cada deploy! 🎉

## 📂 Estrutura de Volumes Persistentes

```
/root/ferraco-crm/
├── data/
│   ├── ferraco-data/         # Dados gerais da aplicação
│   ├── ferraco-logs/         # Logs da aplicação
│   ├── ferraco-uploads/      # ✅ IMAGENS UPADAS (persistente)
│   └── ferraco-whatsapp-sessions/  # Sessões WhatsApp
```

### Mapeamento Docker (docker-compose.vps.yml)

```yaml
volumes:
  - ./data/ferraco-data:/app/data
  - ./data/ferraco-logs:/app/logs
  - ./data/ferraco-uploads:/app/uploads          # ✅ Imagens persistem aqui
  - ./data/ferraco-whatsapp-sessions:/app/sessions
```

### PostgreSQL (Banco de Dados)

```yaml
volumes:
  - postgres-data:/var/lib/postgresql/data  # ✅ Volume Docker nomeado (nunca é removido)
```

## 🔄 Como o Deploy Funciona Agora

1. **Parar containers** (sem remover volumes)
2. **Preservar** pasta `data/` em `/tmp/ferraco-data-backup`
3. **Backup** do código antigo para `.backup.TIMESTAMP`
4. **Extrair** novo código
5. **Restaurar** pasta `data/` preservada
6. **Criar diretórios** se não existirem (primeiro deploy)
7. **Ajustar permissões** (777 para uploads)
8. **Build e start** dos containers
9. **Aplicar migrations** do Prisma
10. **Verificar** volumes e permissões

## 📊 Verificação de Dados Persistentes

### No GitHub Actions (após deploy)
O workflow automaticamente verifica:

```bash
# Verificação pós-deploy
🔍 2. Verificando Volumes...
   📁 data/ferraco-data: [lista arquivos]
   📁 data/ferraco-logs: [lista arquivos]
   📁 data/ferraco-uploads: [lista arquivos]  # ✅ Suas imagens estão aqui!

🔍 3. Verificando Permissões...
   data/ferraco-uploads: 777 (drwxrwxrwx)

🔍 4. Verificando Montagem no Container...
   /app/uploads: [lista arquivos]

🔍 5. Testando Escrita no Volume...
   ✅ Volume /app/uploads com escrita OK
```

### Manual (SSH na VPS)

```bash
# Conectar na VPS
ssh root@72.60.10.108

# Verificar volumes persistentes
cd /root/ferraco-crm
ls -lah data/ferraco-uploads/

# Verificar dentro do container
docker exec ferraco-crm-vps ls -lah /app/uploads/

# Testar escrita
docker exec ferraco-crm-vps sh -c "echo 'test' > /app/uploads/.test && rm /app/uploads/.test"
```

## 🗄️ Backup Manual (Recomendado)

### Backup Completo de Dados

```bash
# SSH na VPS
ssh root@72.60.10.108
cd /root/ferraco-crm

# Criar backup com timestamp
BACKUP_DATE=$(date +%Y%m%d-%H%M%S)
tar -czf ~/backups/ferraco-data-$BACKUP_DATE.tar.gz data/

# Backup do PostgreSQL
docker exec ferraco-postgres pg_dump -U ferraco -d ferraco_crm > ~/backups/ferraco-db-$BACKUP_DATE.sql

# Listar backups
ls -lh ~/backups/
```

### Restauração de Backup

```bash
# Restaurar arquivos
cd /root/ferraco-crm
tar -xzf ~/backups/ferraco-data-YYYYMMDD-HHMMSS.tar.gz

# Restaurar banco de dados (cuidado!)
cat ~/backups/ferraco-db-YYYYMMDD-HHMMSS.sql | docker exec -i ferraco-postgres psql -U ferraco -d ferraco_crm
```

### Automação de Backup (Cron)

```bash
# Editar crontab
crontab -e

# Adicionar backup diário às 3h da manhã
0 3 * * * cd /root/ferraco-crm && tar -czf ~/backups/ferraco-data-$(date +\%Y\%m\%d-\%H\%M\%S).tar.gz data/ && docker exec ferraco-postgres pg_dump -U ferraco -d ferraco_crm > ~/backups/ferraco-db-$(date +\%Y\%m\%d-\%H\%M\%S).sql

# Limpar backups antigos (manter últimos 7 dias)
0 4 * * * find ~/backups/ -name "ferraco-*" -mtime +7 -delete
```

## 🚨 Recuperação de Dados Perdidos

### Se os dados foram perdidos em um deploy anterior

1. **Verificar backups automáticos** do workflow:
   ```bash
   ssh root@72.60.10.108
   ls -lah /root/ferraco-crm.backup.*
   ```

2. **Restaurar de backup mais recente**:
   ```bash
   # Encontrar backup mais recente
   LATEST_BACKUP=$(ls -dt /root/ferraco-crm.backup.* | head -1)
   echo "Backup mais recente: $LATEST_BACKUP"

   # Copiar dados do backup
   cp -r $LATEST_BACKUP/data/ferraco-uploads/* /root/ferraco-crm/data/ferraco-uploads/

   # Ajustar permissões
   chmod 777 /root/ferraco-crm/data/ferraco-uploads
   chown -R 1000:1000 /root/ferraco-crm/data/ferraco-uploads
   ```

3. **Verificar se dados foram restaurados**:
   ```bash
   ls -lah /root/ferraco-crm/data/ferraco-uploads/
   docker exec ferraco-crm-vps ls -lah /app/uploads/
   ```

## 📝 Checklist de Segurança

- [x] ✅ Volumes Docker configurados corretamente
- [x] ✅ Workflow preserva pasta `data/` durante deploys
- [x] ✅ PostgreSQL usa volume nomeado (nunca removido)
- [x] ✅ Permissões corretas (777) em uploads
- [x] ✅ Verificação automática pós-deploy
- [ ] ⚠️ **TODO**: Configurar backup automático diário (cron)
- [ ] ⚠️ **TODO**: Configurar backup para cloud storage (S3, Backblaze, etc.)

## 🎓 Boas Práticas

1. **Sempre fazer backup manual antes de mudanças críticas**
   ```bash
   cd /root/ferraco-crm
   tar -czf ~/backup-pre-mudanca.tar.gz data/
   ```

2. **Monitorar tamanho dos volumes**
   ```bash
   du -sh /root/ferraco-crm/data/*
   ```

3. **Limpar arquivos antigos periodicamente** (se necessário)
   ```bash
   # Exemplo: remover imagens não referenciadas há mais de 90 dias
   find /root/ferraco-crm/data/ferraco-uploads/ -mtime +90 -type f
   ```

4. **Testar restauração de backup regularmente**

## 🔗 Referências

- [docker-compose.vps.yml](docker-compose.vps.yml) - Configuração de volumes
- [.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml) - Workflow de deploy
- [Dockerfile](Dockerfile) - Build da aplicação
- [apps/backend/src/controllers/upload.controller.ts](apps/backend/src/controllers/upload.controller.ts) - Controller de upload

## ✅ Validação

Para validar que a persistência está funcionando:

1. **Fazer upload de uma imagem** na landing page
2. **Fazer deploy** via GitHub Actions (push para main)
3. **Verificar se a imagem ainda existe** após o deploy
4. **Acessar a landing page** e verificar se a imagem é exibida

**Se a imagem persistir após o deploy, tudo está funcionando! 🎉**
