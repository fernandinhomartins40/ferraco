# Evolution API em Container Separado

## 📋 Arquitetura

A Evolution API agora roda em um **container Docker separado** da aplicação principal.

```
┌─────────────────────────────────┐
│ docker-compose.vps.yml          │
│ - postgres (ferraco-postgres)   │
│ - backend (ferraco-crm-vps)     │
└─────────────────────────────────┘
              ↕ HTTP/WebSocket
┌─────────────────────────────────┐
│ docker-compose.evolution.yml    │
│ - evolution-api (ferraco-evolution) │
└─────────────────────────────────┘
```

**Rede compartilhada:** `ferraco-network`

---

## 🎯 Vantagens

✅ **Reiniciar Evolution não afeta backend e postgres**
✅ **Atualizar versão WhatsApp = apenas restart da Evolution**
✅ **Sistema principal continua funcionando**
✅ **Zero conflitos de containers**
✅ **Monitoramento automático pode reiniciar Evolution sem risco**
✅ **Deploy independente de cada parte**

---

## 🚀 Como Usar

### 1. **Subir aplicação principal (primeira vez)**

```bash
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml up -d
```

Isso sobe:
- `ferraco-postgres` (PostgreSQL)
- `ferraco-crm-vps` (Backend da aplicação)

### 2. **Subir Evolution API (separadamente)**

```bash
cd /root/ferraco-crm
docker-compose -f docker-compose.evolution.yml up -d
```

Isso sobe:
- `ferraco-evolution` (Evolution API)

### 3. **Verificar containers rodando**

```bash
docker ps | grep ferraco
```

Deve mostrar:
```
ferraco-postgres    (healthy)
ferraco-crm-vps     (healthy)
ferraco-evolution   (healthy)
```

---

## 🔄 Atualizar Versão WhatsApp

**Método 1: Script Automático (Recomendado)**

```bash
cd /root/ferraco-crm
./update-whatsapp-version.sh
```

O script:
1. Detecta versão atual do WhatsApp Web via Baileys
2. Atualiza `docker-compose.evolution.yml`
3. Reinicia **APENAS** Evolution API
4. Backend e Postgres continuam funcionando

**Método 2: Manual**

```bash
# 1. Editar docker-compose.evolution.yml
nano docker-compose.evolution.yml

# Atualizar linha:
# - CONFIG_SESSION_PHONE_VERSION=2.3000.XXXXXXXX

# 2. Reiniciar Evolution API
docker-compose -f docker-compose.evolution.yml down
docker-compose -f docker-compose.evolution.yml up -d
```

---

## 📊 Monitoramento

### Ver logs da Evolution API

```bash
docker logs ferraco-evolution -f
```

### Ver logs do backend

```bash
docker logs ferraco-crm-vps -f
```

### Status de saúde

```bash
docker ps --format "table {{.Names}}\t{{.Status}}"
```

---

## 🛠️ Troubleshooting

### Evolution API não conecta ao Postgres

**Problema:** `Can't reach database server at ferraco-postgres:5432`

**Solução:** Verificar se ambos containers estão na mesma rede:

```bash
docker network inspect ferraco-network
```

Ambos `ferraco-postgres` e `ferraco-evolution` devem aparecer na lista de containers conectados.

### QR Code não gera

**Problema:** Versão WhatsApp desatualizada

**Solução:**

```bash
# 1. Deletar instância atual
curl -X DELETE http://localhost:8080/instance/delete/ferraco-crm \
  -H 'apikey: FERRACO2025'

# 2. Atualizar versão
./update-whatsapp-version.sh

# 3. Criar nova instância
curl -X POST http://localhost:8080/instance/create \
  -H 'apikey: FERRACO2025' \
  -H 'Content-Type: application/json' \
  -d '{
    "instanceName": "ferraco-crm",
    "qrcode": true,
    "integration": "WHATSAPP-BAILEYS"
  }'

# 4. Buscar QR Code
curl http://localhost:8080/instance/connect/ferraco-crm \
  -H 'apikey: FERRACO2025'
```

### Container Evolution continua reiniciando

**Problema:** Erro de configuração ou dependência

**Solução:**

```bash
# Ver logs detalhados
docker logs ferraco-evolution --tail 100

# Verificar variáveis de ambiente
docker exec ferraco-evolution env | grep -i version
```

---

## 🔐 Variáveis Importantes

| Variável | Valor | Onde Usar |
|----------|-------|-----------|
| `EVOLUTION_API_URL` | `http://ferraco-evolution:8080` | Backend (docker-compose.vps.yml) |
| `EVOLUTION_API_KEY` | `FERRACO2025` | Backend + Evolution |
| `EVOLUTION_INSTANCE_NAME` | `ferraco-crm` | Backend |
| `CONFIG_SESSION_PHONE_VERSION` | `2.3000.XXXXXXXX` | Evolution (docker-compose.evolution.yml) |

---

## 📦 Deploy Completo (Ordem Correta)

```bash
# 1. Parar tudo
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.evolution.yml down

# 2. Subir aplicação principal
docker-compose -f docker-compose.vps.yml up -d

# 3. Aguardar backend e postgres ficarem healthy
sleep 30

# 4. Subir Evolution API
docker-compose -f docker-compose.evolution.yml up -d

# 5. Verificar
docker ps | grep ferraco
```

---

## 🤖 Monitoramento Automático (Backend)

O backend possui um serviço de monitoramento inteligente que:

- **Verifica saúde da Evolution API a cada 30 minutos**
- **Detecta erros consecutivos (3+)**
- **Busca versão atual do WhatsApp via Baileys**
- **Atualiza docker-compose.evolution.yml na VPS via SSH**
- **Reinicia container Evolution automaticamente**
- **Sessão reconecta sozinha (sem escanear QR Code novamente)**

**Trigger manual via API:**

```bash
curl -X POST http://localhost:3050/api/whatsapp/version/check \
  -H 'Authorization: Bearer SEU_TOKEN' \
  -H 'Content-Type: application/json'
```

---

## 📝 Notas Importantes

⚠️ **A versão do WhatsApp Web muda frequentemente (~30 minutos)**
⚠️ **Sempre verifique a versão atual antes de criar instâncias**
⚠️ **Mantenha o script `update-whatsapp-version.sh` atualizado**
⚠️ **Logs são essenciais para debug - sempre consulte antes de reiniciar**

✅ **Backend e Evolution podem ser atualizados INDEPENDENTEMENTE**
✅ **Reiniciar Evolution NÃO afeta usuários no site**
✅ **Postgres é compartilhado mas cada serviço tem seu banco**

---

## 🔗 Links Úteis

- **Evolution API Docs:** https://doc.evolution-api.com/
- **Baileys (lib base):** https://github.com/WhiskeySockets/Baileys
- **Verificar versão WhatsApp manualmente:**
  1. Acesse https://web.whatsapp.com
  2. Pressione F12
  3. Console → digite `window.Debug`
  4. Copie o número da versão
