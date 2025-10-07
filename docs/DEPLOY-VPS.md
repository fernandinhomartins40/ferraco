# 🚀 Deploy Automático via GitHub Actions - VPS

Este guia explica como funciona o deploy automático do Ferraco CRM na VPS via GitHub Actions.

## 📋 Visão Geral

O deploy é **totalmente automatizado** e acontece a cada push para a branch `main`. O sistema usa:

- **GitHub Actions** para CI/CD
- **Docker** para containerização
- **Container Único** (Frontend + Backend + Nginx)
- **Porta 3050** na VPS
- **IP VPS**: 72.60.10.108

## 🏗️ Arquitetura de Deploy

```
┌─────────────────────────────────────────────┐
│          GitHub Repository (main)            │
│                                              │
│  Push/Merge → Trigger GitHub Actions        │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│         GitHub Actions Workflow              │
│                                              │
│  1. Checkout código                          │
│  2. Validar estrutura                        │
│  3. Criar pacote (tar.gz)                    │
│  4. Upload via SCP para VPS                  │
│  5. SSH na VPS e executar deploy             │
└──────────────────┬──────────────────────────┘
                   │
                   ↓
┌─────────────────────────────────────────────┐
│         VPS (72.60.10.108:3050)              │
│                                              │
│  1. Extrair código                           │
│  2. Build da imagem Docker                   │
│  3. Iniciar container                        │
│  4. Health checks                            │
│  5. ✅ Deploy concluído                      │
└─────────────────────────────────────────────┘
```

## ⚙️ Configuração Necessária

### 1. Secrets do GitHub

Configure o seguinte secret no repositório:

**Settings → Secrets and variables → Actions → New repository secret**

| Nome | Valor | Descrição |
|------|-------|-----------|
| `VPS_PASSWORD` | senha_root_vps | Senha do usuário root da VPS |

### 2. Variáveis de Ambiente (no workflow)

Já estão configuradas no arquivo [.github/workflows/deploy.yml](../.github/workflows/deploy.yml):

```yaml
env:
  VPS_HOST: '72.60.10.108'     # IP da VPS
  VPS_USER: 'root'              # Usuário SSH
  APP_DIR: '/root/ferraco-crm'  # Diretório na VPS
  APP_PORT: '3050'              # Porta da aplicação
  COMPOSE_PROJECT: 'ferraco'    # Nome do projeto Docker
  DOMAIN: 'painelcheckar.com.br' # Domínio (futuro)
```

## 🚀 Como Fazer Deploy

### Deploy Automático (Recomendado)

```bash
# 1. Fazer alterações no código
git add .
git commit -m "feat: minha alteração"

# 2. Push para main (dispara deploy automático)
git push origin main

# 3. Acompanhar deploy no GitHub
# Actions → Deploy Ferraco CRM - Full Stack
```

### Deploy Manual (via GitHub)

1. Acesse o repositório no GitHub
2. Vá em **Actions**
3. Selecione **Deploy Ferraco CRM - Full Stack**
4. Clique em **Run workflow**
5. Selecione a branch `main`
6. Clique em **Run workflow**

## 📦 Arquivos de Deploy

### Estrutura

```
ferraco/
├── .github/workflows/
│   └── deploy.yml                # Workflow GitHub Actions ⭐
├── Dockerfile                    # Build multi-stage
├── docker-compose.yml            # Local (porta 80)
├── docker-compose.vps.yml        # VPS (porta 3050) ⭐
├── docker-compose.production.yml # Produção com SSL
└── docker/
    ├── nginx.conf                # Configuração Nginx
    └── startup.sh                # Script de inicialização
```

### docker-compose.vps.yml

Configuração específica para VPS:

```yaml
services:
  ferraco-app:
    ports:
      - "3050:80"  # Mapeia porta 3050 externa → 80 interna
    environment:
      - NODE_ENV=production
      - PORT=3002
      - JWT_SECRET=${JWT_SECRET}
      - CORS_ORIGIN=http://72.60.10.108:3050
```

## 🔍 Processo de Deploy Detalhado

### Step 1: Pre-Deploy Validation

Valida se todos os arquivos necessários estão presentes:

- ✅ Dockerfile
- ✅ docker-compose.vps.yml
- ✅ docker/nginx.conf
- ✅ docker/startup.sh
- ✅ Frontend (src/, package.json)
- ✅ Backend (ferraco-backend/)

### Step 2: Package Creation

Cria arquivo `deploy.tar.gz` excluindo:

- `.git/`
- `node_modules/`
- `dist/`, `build/`
- Arquivos `.env` locais
- Logs e caches

### Step 3: Upload to VPS

Upload via SCP:

```bash
scp deploy.tar.gz root@72.60.10.108:/tmp/
```

### Step 4: Deploy on VPS

Na VPS, executa:

1. **Instala Docker** (se não existir)
2. **Para containers anteriores**
3. **Limpa imagens antigas** (apenas do Ferraco)
4. **Faz backup** da versão anterior
5. **Extrai código novo**
6. **Valida estrutura**
7. **Build da imagem** (pode levar 5-10 min)
8. **Inicia container**
9. **Aguarda 45 segundos**
10. **Executa health checks**

### Step 5: Health Checks

Testa os endpoints:

- `http://localhost:3050/health` (frontend)
- `http://localhost:3050/api/health` (backend)

Se ambos retornarem 200 OK → **Deploy bem-sucedido!**

## 🔗 URLs de Acesso

Após deploy bem-sucedido:

| Serviço | URL | Descrição |
|---------|-----|-----------|
| **Frontend** | http://72.60.10.108:3050 | Interface React |
| **API** | http://72.60.10.108:3050/api | Backend API REST |
| **Health** | http://72.60.10.108:3050/health | Health check frontend |
| **API Health** | http://72.60.10.108:3050/api/health | Health check backend |
| **Admin** | http://72.60.10.108:3050/admin | Painel administrativo |

## 📊 Monitoramento

### Ver Logs do Deploy

No GitHub:

1. **Actions** → Último workflow
2. Clicar no job **Deploy Full Stack para VPS**
3. Expandir os steps para ver logs

### Ver Logs na VPS

SSH na VPS e execute:

```bash
# Conectar na VPS
ssh root@72.60.10.108

# Ver logs em tempo real
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml logs -f

# Ver apenas backend
docker-compose -f docker-compose.vps.yml logs -f ferraco-app | grep "node"

# Ver apenas nginx
docker-compose -f docker-compose.vps.yml logs -f ferraco-app | grep "nginx"

# Ver status dos containers
docker-compose -f docker-compose.vps.yml ps

# Ver recursos utilizados
docker stats ferraco-crm-vps
```

## 🚨 Troubleshooting

### Deploy falhou no GitHub Actions

**Sintomas**: Workflow mostra erro vermelho

**Soluções**:

```bash
# 1. Verificar se secret VPS_PASSWORD está configurado
# GitHub → Settings → Secrets → VPS_PASSWORD

# 2. Testar conexão SSH manualmente
ssh root@72.60.10.108

# 3. Verificar se Docker está funcionando na VPS
ssh root@72.60.10.108 "docker --version"

# 4. Ver logs detalhados no GitHub Actions
```

### Aplicação não responde após deploy

**Sintomas**: Deploy bem-sucedido mas app não abre

**Soluções**:

```bash
# 1. SSH na VPS
ssh root@72.60.10.108

# 2. Ver logs do container
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml logs --tail 100

# 3. Verificar se container está rodando
docker ps | grep ferraco

# 4. Verificar se porta está aberta
netstat -tlnp | grep 3050

# 5. Testar health check localmente
curl http://localhost:3050/health
curl http://localhost:3050/api/health

# 6. Se necessário, reiniciar container
docker-compose -f docker-compose.vps.yml restart
```

### Porta 3050 ocupada

**Sintomas**: Erro "address already in use"

**Soluções**:

```bash
# SSH na VPS
ssh root@72.60.10.108

# Ver o que está usando a porta
lsof -i :3050

# Matar processo na porta
fuser -k 3050/tcp

# Reiniciar deploy
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml down
docker-compose -f docker-compose.vps.yml up -d
```

### Build demora muito

**Sintomas**: Build leva mais de 10 minutos

**Explicação**: É normal na primeira vez. Próximos deploys usam cache.

**Otimizações**:

```bash
# Na VPS, limpar apenas imagens antigas do Ferraco
docker images | grep ferraco | awk '{print $3}' | xargs docker rmi -f

# Nunca fazer docker system prune (remove cache de TUDO)
```

## 🔄 Rollback

Se algo der errado, fazer rollback:

```bash
# SSH na VPS
ssh root@72.60.10.108

# Listar backups disponíveis
ls -la /root/ | grep ferraco-crm.backup

# Exemplo: /root/ferraco-crm.backup.20251007-143022

# Parar versão atual
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml down

# Restaurar backup
mv /root/ferraco-crm /root/ferraco-crm.failed
mv /root/ferraco-crm.backup.20251007-143022 /root/ferraco-crm

# Reiniciar
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml up -d
```

## 📝 Comandos Úteis

### Na máquina local:

```bash
# Testar build localmente antes de push
npm run vps:build
npm run vps:up

# Acessar em http://localhost:3050
```

### Na VPS:

```bash
# Conectar na VPS
ssh root@72.60.10.108

# Ver status
cd /root/ferraco-crm
docker-compose -f docker-compose.vps.yml ps

# Reiniciar aplicação
docker-compose -f docker-compose.vps.yml restart

# Ver logs
docker-compose -f docker-compose.vps.yml logs -f

# Acessar shell do container
docker-compose -f docker-compose.vps.yml exec ferraco-app sh

# Parar aplicação
docker-compose -f docker-compose.vps.yml down

# Iniciar aplicação
docker-compose -f docker-compose.vps.yml up -d

# Ver uso de recursos
docker stats

# Ver espaço em disco
df -h
```

## 🔐 Segurança

### Secrets Protegidos

- ✅ `VPS_PASSWORD` nunca aparece em logs
- ✅ JWT_SECRET gerado por commit (único por deploy)
- ✅ Dados persistidos em volumes Docker
- ✅ Backups automáticos antes de cada deploy

### Melhorias Futuras

- [ ] Usar chave SSH em vez de senha
- [ ] Implementar SSL/HTTPS (Let's Encrypt)
- [ ] Adicionar autenticação 2FA na VPS
- [ ] Configurar firewall (ufw)
- [ ] Implementar rate limiting no Nginx
- [ ] Adicionar alertas de falha no deploy

## 📚 Referências

- [Workflow atual](.github/workflows/deploy.yml)
- [Configuração VPS](docker-compose.vps.yml)
- [Deploy Produção](DEPLOY-PRODUCAO.md)
- [Estrutura do Projeto](../ESTRUTURA-PROJETO.md)

---

**VPS**: 72.60.10.108:3050
**Versão**: 2.0.0
**Última atualização**: 2025-10-07
