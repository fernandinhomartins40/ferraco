# 🐳 Ferraco CRM - Docker Deployment Guide

Este guia explica como fazer deploy do Ferraco CRM usando Docker com **um único container** que contém frontend, backend e nginx.

## 📋 Arquitetura

```
┌─────────────────────────────────────────┐
│         Container: ferraco-crm          │
│                                         │
│  ┌───────────────────────────────────┐ │
│  │   Nginx (Port 80/443)             │ │
│  │   • Serve frontend estático       │ │
│  │   • Proxy reverso para /api/*     │ │
│  └───────┬───────────────────────────┘ │
│          │                              │
│          │ Proxy to localhost:3002      │
│          ↓                              │
│  ┌───────────────────────────────────┐ │
│  │   Backend Node.js (Port 3002)     │ │
│  │   • Express + Prisma              │ │
│  │   • SQLite Database               │ │
│  └───────────────────────────────────┘ │
│                                         │
└─────────────────────────────────────────┘
```

## 🚀 Quick Start

### 1. Configurar Variáveis de Ambiente

```bash
# Copiar arquivo de exemplo
cp .env.example .env

# Editar e configurar o JWT_SECRET
nano .env
```

**IMPORTANTE:** Gere um JWT_SECRET seguro:

```bash
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

### 2. Build e Iniciar

```bash
# Build da imagem
docker-compose build

# Iniciar o container
docker-compose up -d

# Verificar logs
docker-compose logs -f
```

### 3. Acessar a Aplicação

- **Frontend:** http://localhost
- **API:** http://localhost/api
- **Health Check:** http://localhost/health

## 📦 Estrutura de Arquivos

```
ferraco/                       # Raiz do projeto (monorepo)
├── Dockerfile                 # Multi-stage build (frontend + backend + nginx)
├── docker-compose.yml         # Orquestração do container único
├── .dockerignore             # Arquivos ignorados no build
├── package.json              # Dependências do frontend
├── ferraco-backend/          # Código do backend
│   ├── src/                  # Código fonte backend
│   ├── prisma/               # Schema e migrations
│   ├── package.json          # Dependências do backend
│   └── tsconfig.json         # Config TypeScript backend
├── src/                      # Código fonte do frontend
├── public/                   # Assets estáticos
└── docker/
    ├── nginx.conf            # Configuração do nginx
    ├── startup.sh            # Script de inicialização
    └── README.md             # Este arquivo

Veja ESTRUTURA-PROJETO.md na raiz para detalhes completos.
```

## 🔧 Comandos Úteis

### Gerenciamento do Container

```bash
# Iniciar
docker-compose up -d

# Parar
docker-compose down

# Reiniciar
docker-compose restart

# Ver logs
docker-compose logs -f

# Ver status
docker-compose ps

# Acessar shell do container
docker-compose exec ferraco-app sh
```

### Build e Rebuild

```bash
# Build completo
docker-compose build

# Build sem cache (forçar rebuild completo)
docker-compose build --no-cache

# Build e start em um comando
docker-compose up -d --build
```

### Manutenção do Banco de Dados

```bash
# Acessar SQLite dentro do container
docker-compose exec ferraco-app sqlite3 /app/backend/data/ferraco.db

# Backup do banco de dados
docker-compose exec ferraco-app sqlite3 /app/backend/data/ferraco.db ".backup /app/backend/data/backup.db"

# Copiar backup para host
docker cp ferraco-crm:/app/backend/data/backup.db ./backup-$(date +%Y%m%d).db
```

### Logs e Debugging

```bash
# Logs completos
docker-compose logs

# Logs apenas do backend
docker-compose logs | grep "node"

# Logs apenas do nginx
docker-compose logs | grep "nginx"

# Seguir logs em tempo real
docker-compose logs -f --tail=100

# Ver logs de erro do nginx
docker-compose exec ferraco-app cat /var/log/nginx/error.log

# Ver logs de acesso do nginx
docker-compose exec ferraco-app cat /var/log/nginx/access.log
```

## 🔍 Health Checks

O container possui health checks automáticos:

```bash
# Verificar saúde do container
docker-compose ps

# Verificar endpoint de saúde manualmente
curl http://localhost/health
```

## 📊 Volumes Persistentes

O Docker Compose cria volumes persistentes para dados:

```bash
# Listar volumes
docker volume ls | grep ferraco

# Inspecionar volume de dados
docker volume inspect ferraco-data

# Backup de volume
docker run --rm -v ferraco-data:/data -v $(pwd):/backup alpine tar czf /backup/data-backup.tar.gz -C /data .

# Restaurar volume
docker run --rm -v ferraco-data:/data -v $(pwd):/backup alpine tar xzf /backup/data-backup.tar.gz -C /data
```

## 🔒 Configuração SSL/HTTPS (Opcional)

### 1. Adicionar Certificados SSL

```bash
# Criar diretório SSL
mkdir -p ssl

# Copiar certificados
cp /caminho/para/cert.pem ssl/
cp /caminho/para/key.pem ssl/
```

### 2. Descomentar Configuração HTTPS

Edite `docker/nginx.conf` e descomente as seções HTTPS (linhas 117-128).

### 3. Atualizar docker-compose.yml

Descomente o volume SSL:

```yaml
volumes:
  - ./ssl:/etc/nginx/ssl:ro
```

### 4. Rebuild

```bash
docker-compose down
docker-compose up -d --build
```

## 🚨 Troubleshooting

### Container não inicia

```bash
# Ver logs de erro
docker-compose logs ferraco-app

# Verificar se porta 80 está ocupada
netstat -tlnp | grep :80

# Iniciar em modo interativo para debug
docker-compose run --rm ferraco-app sh
```

### Backend não responde

```bash
# Verificar se backend está rodando dentro do container
docker-compose exec ferraco-app ps aux | grep node

# Verificar logs do backend
docker-compose exec ferraco-app cat /app/backend/logs/*.log

# Testar backend diretamente
docker-compose exec ferraco-app wget -O- http://localhost:3002/api/health
```

### Nginx retorna 502 Bad Gateway

```bash
# Verificar se backend está escutando na porta 3002
docker-compose exec ferraco-app netstat -tlnp | grep 3002

# Verificar configuração do nginx
docker-compose exec ferraco-app nginx -t

# Recarregar configuração do nginx
docker-compose exec ferraco-app nginx -s reload
```

### Database locked error

```bash
# Parar container
docker-compose down

# Remover arquivo de lock
docker volume inspect ferraco-data
# Acesse o diretório e remova *.db-journal

# Reiniciar
docker-compose up -d
```

## 🔄 Atualizações e Deploy

### Deploy de Nova Versão

```bash
# 1. Parar container atual
docker-compose down

# 2. Pull do código atualizado
git pull origin main

# 3. Rebuild com no-cache
docker-compose build --no-cache

# 4. Iniciar nova versão
docker-compose up -d

# 5. Verificar saúde
docker-compose ps
curl http://localhost/health
```

### Rollback

```bash
# 1. Parar container atual
docker-compose down

# 2. Voltar para versão anterior
git checkout <commit-hash>

# 3. Rebuild
docker-compose build

# 4. Iniciar
docker-compose up -d
```

## 📈 Monitoramento

### Recursos do Container

```bash
# Ver uso de recursos em tempo real
docker stats ferraco-crm

# Ver uso de disco
docker system df -v

# Ver processos do container
docker-compose top
```

### Nginx Statistics

```bash
# Acessar logs de acesso do nginx
docker-compose exec ferraco-app tail -f /var/log/nginx/access.log

# Análise de requests
docker-compose exec ferraco-app cat /var/log/nginx/access.log | awk '{print $7}' | sort | uniq -c | sort -nr | head
```

## 🧹 Limpeza

```bash
# Parar e remover container
docker-compose down

# Remover também os volumes (CUIDADO: remove dados!)
docker-compose down -v

# Limpar imagens antigas
docker image prune -a

# Limpeza completa do sistema Docker
docker system prune -a --volumes
```

## 📝 Variáveis de Ambiente

Todas as variáveis de ambiente disponíveis:

| Variável | Descrição | Padrão |
|----------|-----------|--------|
| `NODE_ENV` | Ambiente de execução | `production` |
| `PORT` | Porta interna do backend | `3002` |
| `DATABASE_URL` | Caminho do banco SQLite | `file:/app/backend/data/ferraco.db` |
| `JWT_SECRET` | Secret para tokens JWT | *obrigatório* |
| `LOG_LEVEL` | Nível de log | `info` |
| `MAX_LOGIN_ATTEMPTS` | Tentativas máximas de login | `5` |
| `LOGIN_TIMEOUT_MINUTES` | Timeout após falhas | `15` |
| `SESSION_TIMEOUT_MINUTES` | Timeout de sessão | `60` |

## 🎯 Melhores Práticas

1. **Sempre use .env para secrets** - Nunca commite secrets no git
2. **Faça backups regulares** - Use os comandos de backup acima
3. **Monitore logs** - Configure alertas para erros críticos
4. **Atualize regularmente** - Mantenha imagens base atualizadas
5. **Use volumes nomeados** - Para facilitar backups e migração
6. **Teste health checks** - Garanta que estão funcionando corretamente
7. **Configure SSL em produção** - Sempre use HTTPS em produção

## 🆘 Suporte

Para problemas ou dúvidas:

1. Verifique os logs: `docker-compose logs -f`
2. Consulte este README
3. Abra uma issue no repositório

---

**Versão:** 2.0.0
**Última atualização:** 2025-10-07
