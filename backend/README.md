# 🚀 Ferraco CRM Backend

Backend API para o sistema Ferraco CRM, construído com Node.js, Express, Prisma ORM e SQLite.

## 📋 Pré-requisitos

- Node.js 18+
- npm 8+
- Docker (opcional)

## ⚡ Quick Start

### 1. Instalação

```bash
# Clone o repositório e navegue para o backend
cd backend

# Instale as dependências
npm install

# Configure as variáveis de ambiente
cp .env.example .env
```

### 2. Configuração

Edite o arquivo `.env` com suas configurações:

```env
NODE_ENV=development
PORT=3000
DATABASE_URL=file:./data/ferraco.db
JWT_SECRET=your_super_secret_jwt_key
CORS_ORIGIN=http://localhost:80
```

### 3. Executar

```bash
# Desenvolvimento
npm run dev

# Produção
npm start
```

## 🐳 Docker

### Build e Run

```bash
# Build da imagem
docker build -t ferraco-backend .

# Run container
docker run -p 3000:3000 ferraco-backend
```

### Docker Compose (Recomendado)

```bash
# Na raiz do projeto
docker-compose up -d
```

## 📡 API Endpoints

### Health Checks

- `GET /api/health` - Status básico
- `GET /api/health/detailed` - Status detalhado com métricas
- `GET /api/health/ready` - Readiness probe
- `GET /api/health/live` - Liveness probe

### Exemplo de Resposta

```json
{
  "status": "healthy",
  "timestamp": "2024-01-15T10:30:00.000Z",
  "uptime": 3600,
  "environment": "development",
  "version": "1.0.0",
  "service": "ferraco-crm-backend"
}
```

## 🏗️ Estrutura do Projeto

```
backend/
├── src/
│   ├── controllers/     # Route handlers
│   ├── services/        # Business logic
│   ├── middleware/      # Express middleware
│   ├── routes/          # API routes
│   ├── utils/           # Utility functions
│   └── app.js          # Express app configuration
├── prisma/
│   ├── schema.prisma   # Database schema
│   └── migrations/     # Database migrations
├── data/               # SQLite database
├── uploads/            # File uploads
├── logs/               # Application logs
├── package.json
├── Dockerfile
└── README.md
```

## 🛠️ Scripts Disponíveis

```bash
# Desenvolvimento com auto-reload
npm run dev

# Produção
npm start

# Testes
npm test

# Database
npm run db:generate    # Gerar cliente Prisma
npm run db:push       # Push schema para DB
npm run db:migrate    # Executar migrations
npm run db:seed       # Popular com dados de exemplo

# Docker
npm run docker:build  # Build da imagem Docker
npm run docker:run    # Run container local
```

## 🔧 Configuração Avançada

### Rate Limiting

O backend inclui rate limiting configurado:

- **API Geral**: 100 requests / 15 minutos
- **Autenticação**: 5 requests / 15 minutos

### Security Headers

Configurado com Helmet.js:
- XSS Protection
- Content Type nosniff
- Frame Options
- Content Security Policy

### Logging

Sistema de logs estruturado com Winston:
- **Desenvolvimento**: Console + arquivo
- **Produção**: Arquivo com rotação
- **Níveis**: error, warn, info, debug

## 📊 Monitoramento

### Health Checks

Múltiplos endpoints para monitoramento:

```bash
# Status básico
curl http://localhost:3000/api/health

# Status detalhado com métricas do sistema
curl http://localhost:3000/api/health/detailed

# Readiness para Kubernetes
curl http://localhost:3000/api/health/ready

# Liveness para Kubernetes
curl http://localhost:3000/api/health/live
```

### Logs

```bash
# Logs em tempo real
tail -f logs/combined.log

# Apenas erros
tail -f logs/error.log
```

## 🚀 Deploy

### Docker Compose (Recomendado)

```bash
# Build e deploy completo
docker-compose up -d --build

# Verificar status
docker-compose ps

# Logs
docker-compose logs -f backend
```

### Manual

```bash
# Build do frontend (na raiz)
npm run build

# Start do backend
cd backend
npm start
```

## 🔒 Segurança

### Variáveis Sensíveis

Nunca commitar:
- `.env` files
- Chaves JWT
- Credentials de APIs

### CORS

Configure `CORS_ORIGIN` para seu domínio em produção:

```env
CORS_ORIGIN=https://meudominio.com
```

### Rate Limiting

Ajuste os limites conforme necessário:

```env
RATE_LIMIT_MAX_REQUESTS=100
AUTH_RATE_LIMIT_MAX=5
```

## 🐛 Debugging

### Desenvolvimento

```bash
# Logs detalhados
LOG_LEVEL=debug npm run dev

# Inspect mode
node --inspect src/app.js
```

### Docker

```bash
# Logs do container
docker-compose logs -f backend

# Shell no container
docker-compose exec backend sh

# Verificar health check
docker-compose exec backend wget -qO- http://localhost:3000/api/health
```

## 📈 Performance

### Recomendações

1. **Produção**: Use `NODE_ENV=production`
2. **Database**: Configure connection pooling
3. **Caching**: Implemente Redis para sessions
4. **Monitoring**: Use ferramentas como PM2

### Métricas

O endpoint `/api/health/detailed` fornece:
- Uso de memória
- CPU usage
- Uptime
- Status do sistema

## 🤝 Contribuição

1. Fork do projeto
2. Crie uma branch (`git checkout -b feature/nova-funcionalidade`)
3. Commit (`git commit -am 'Adiciona nova funcionalidade'`)
4. Push (`git push origin feature/nova-funcionalidade`)
5. Abra um Pull Request

## 📝 License

MIT License - veja [LICENSE](LICENSE) para detalhes.

---

## 🆘 Troubleshooting

### Problemas Comuns

**Port já em uso:**
```bash
# Mudar porta no .env
PORT=3001
```

**Permissões no Docker:**
```bash
# Ajustar permissões de diretórios
chmod 755 data uploads logs
```

**Database não encontrado:**
```bash
# Criar diretórios necessários
mkdir -p data uploads logs
```

### Support

Para problemas e dúvidas, abra uma issue no repositório.

---

**🎉 Backend da Fase 1 implementado com sucesso!**