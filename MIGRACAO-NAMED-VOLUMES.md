# 🔄 MIGRAÇÃO PARA NAMED VOLUMES - INSTRUÇÕES

## ⚠️ IMPORTANTE - LEIA ANTES DE FAZER O PRÓXIMO DEPLOY

Este documento explica como migrar os dados atuais (imagens, sessões WhatsApp, logs) do sistema de **bind mounts** para **named volumes Docker**, garantindo que **nenhum dado seja perdido** nos próximos deploys.

---

## 📋 O QUE MUDOU?

### **ANTES (Sistema Atual - PROBLEMA):**
```yaml
volumes:
  - ./data/ferraco-uploads:/app/uploads        # ⚠️ Bind mount relativo
  - ./data/ferraco-sessions:/app/sessions      # ⚠️ Movido a cada deploy
  - ./data/ferraco-logs:/app/logs              # ⚠️ Perdido no backup
```

**Problema:** Durante o deploy, o diretório `/root/ferraco-crm` era movido para backup, **incluindo** os diretórios `./data/*`, causando perda de dados.

### **DEPOIS (Nova Solução - CORRETO):**
```yaml
volumes:
  - ferraco-uploads:/app/uploads    # ✅ Named volume (persistente)
  - ferraco-sessions:/app/sessions  # ✅ Independente do código
  - ferraco-logs:/app/logs          # ✅ Gerenciado pelo Docker
  - ferraco-data:/app/data          # ✅ Sobrevive a deploys
```

**Solução:** Named volumes são gerenciados pelo Docker e **não** são afetados por operações de `mv` ou `rm -rf` no diretório da aplicação.

---

## 🚀 INSTRUÇÕES DE MIGRAÇÃO

### **Opção 1: Migração Manual (Recomendado para dados importantes)**

#### **1. Conectar na VPS:**
```bash
ssh root@72.60.10.108
```

#### **2. Fazer backup manual dos dados atuais:**
```bash
cd /root/ferraco-crm

# Criar backup com timestamp
tar -czf ~/ferraco-data-backup-$(date +%Y%m%d-%H%M%S).tar.gz data/

# Verificar backup criado
ls -lh ~/ferraco-data-backup-*.tar.gz
```

#### **3. Executar script de migração automática:**
```bash
cd /root/ferraco-crm

# Baixar código atualizado (se ainda não tiver)
git pull origin main

# Tornar script executável
chmod +x docker/migrate-to-named-volumes.sh

# Executar migração
./docker/migrate-to-named-volumes.sh
```

O script irá:
- ✅ Fazer backup completo automático
- ✅ Parar containers
- ✅ Criar named volumes Docker
- ✅ Copiar todos os dados para os volumes
- ✅ Verificar integridade

#### **4. Fazer o próximo deploy normalmente:**

Após a migração, o próximo deploy via GitHub Actions **não perderá mais dados**!

```bash
# Push para main vai triggar deploy automático
git push origin main
```

---

### **Opção 2: Migração Automática no Próximo Deploy (Arriscado)**

Se você **não tiver dados críticos** ou for uma instalação nova, pode fazer o deploy diretamente. O sistema criará volumes vazios.

**⚠️ ATENÇÃO:** Esta opção vai **perder** dados existentes! Use apenas se:
- É uma instalação nova
- Você já fez backup manual
- Não tem dados importantes

---

## 📦 VERIFICAR VOLUMES APÓS MIGRAÇÃO

Após a migração ou deploy, verificar se os volumes foram criados:

```bash
# Listar volumes
docker volume ls --filter "name=ferraco"

# Verificar conteúdo de um volume específico
docker run --rm -v ferraco_ferraco-uploads:/data:ro alpine ls -lah /data

# Verificar montagem no container
docker exec ferraco-crm-vps ls -lah /app/uploads
docker exec ferraco-crm-vps ls -lah /app/sessions
```

---

## 🔧 COMANDOS ÚTEIS - GERENCIAMENTO DE VOLUMES

### **Backup de Named Volume:**
```bash
# Backup de uploads
docker run --rm \
  -v ferraco_ferraco-uploads:/data:ro \
  -v $(pwd):/backup \
  alpine tar -czf /backup/uploads-backup-$(date +%Y%m%d).tar.gz -C /data .

# Backup de sessões WhatsApp
docker run --rm \
  -v ferraco_ferraco-sessions:/data:ro \
  -v $(pwd):/backup \
  alpine tar -czf /backup/sessions-backup-$(date +%Y%m%d).tar.gz -C /data .
```

### **Restaurar Named Volume:**
```bash
# Restaurar uploads
docker run --rm \
  -v ferraco_ferraco-uploads:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar -xzf /backup/uploads-backup-YYYYMMDD.tar.gz"

# Restaurar sessões
docker run --rm \
  -v ferraco_ferraco-sessions:/data \
  -v $(pwd):/backup \
  alpine sh -c "cd /data && tar -xzf /backup/sessions-backup-YYYYMMDD.tar.gz"
```

### **Inspecionar Volume:**
```bash
# Ver informações do volume
docker volume inspect ferraco_ferraco-uploads

# Ver localização física no servidor
docker volume inspect ferraco_ferraco-uploads --format '{{ .Mountpoint }}'
```

### **Limpar Volume (CUIDADO!):**
```bash
# Remover conteúdo de um volume (NÃO RECOMENDADO EM PRODUÇÃO)
docker run --rm -v ferraco_ferraco-uploads:/data alpine sh -c "rm -rf /data/*"

# Remover volume completamente (apenas com containers parados)
docker volume rm ferraco_ferraco-uploads
```

---

## 🆘 ROLLBACK - SE ALGO DER ERRADO

Se após a migração algo não funcionar:

### **1. Parar containers:**
```bash
cd /root/ferraco-crm
docker compose -f docker-compose.vps.yml -p ferraco down
```

### **2. Restaurar do backup:**
```bash
# Restaurar dados locais
cd /root
tar -xzf ferraco-data-backup-YYYYMMDD-HHMMSS.tar.gz -C ferraco-crm/

# OU restaurar backup completo do script de migração
BACKUP_DIR="/root/ferraco-crm.backup.YYYYMMDD-HHMMSS"
cp -a $BACKUP_DIR/data /root/ferraco-crm/
cp $BACKUP_DIR/docker-compose.vps.yml /root/ferraco-crm/
```

### **3. Reiniciar com configuração antiga:**
```bash
cd /root/ferraco-crm
docker compose -f docker-compose.vps.yml -p ferraco up -d
```

---

## ✅ BENEFÍCIOS APÓS A MIGRAÇÃO

✅ **Imagens persistem** entre deploys
✅ **Sessões WhatsApp mantidas** (não precisa re-escanear QR code)
✅ **Banco de dados PostgreSQL protegido** (já estava correto)
✅ **Logs preservados** para auditoria
✅ **Backup simplificado** com comandos Docker
✅ **Rollback seguro** sem afetar volumes
✅ **Padrão Docker recomendado** para produção

---

## 📊 ARQUIVOS MODIFICADOS

Os seguintes arquivos foram atualizados para suportar named volumes:

1. **[docker-compose.vps.yml](docker-compose.vps.yml)**
   - Substituído bind mounts por named volumes
   - Adicionado declaração de volumes: `ferraco-uploads`, `ferraco-sessions`, `ferraco-logs`, `ferraco-data`

2. **[.github/workflows/deploy-vps.yml](.github/workflows/deploy-vps.yml)**
   - Removido `mv` do diretório inteiro (que movia os dados)
   - Substituído por limpeza seletiva de código
   - Removido criação de diretórios locais `./data`
   - Adicionado verificações de named volumes

3. **[docker/migrate-to-named-volumes.sh](docker/migrate-to-named-volumes.sh)** (NOVO)
   - Script de migração automatizada
   - Copia dados existentes para named volumes
   - Faz backup automático antes da migração

---

## 📞 SUPORTE

Se tiver problemas durante a migração:

1. **Não entre em pânico** - você tem backups!
2. Verifique os logs: `docker logs ferraco-crm-vps --tail 100`
3. Verifique os volumes: `docker volume ls --filter "name=ferraco"`
4. Execute rollback se necessário (ver seção acima)

---

## 🎯 CHECKLIST DE MIGRAÇÃO

- [ ] Conectar na VPS via SSH
- [ ] Fazer backup manual dos dados (tar.gz)
- [ ] Executar script `migrate-to-named-volumes.sh`
- [ ] Verificar que volumes foram criados
- [ ] Verificar que dados foram copiados
- [ ] Fazer commit das alterações no Git
- [ ] Fazer push para triggar deploy
- [ ] Após deploy, verificar que aplicação está rodando
- [ ] Verificar que imagens estão acessíveis
- [ ] Verificar que sessão WhatsApp está mantida
- [ ] Confirmar que próximo deploy não perde dados

---

**Data de criação deste documento:** 2025-11-24
**Versão:** 1.0
**Autor:** Claude Code (Anthropic)
