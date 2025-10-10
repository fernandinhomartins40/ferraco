# Dockerfile Multi-stage para Monorepo Ferraco CRM usando npm workspaces
# Stage 1: Build completo (Backend + Frontend)
FROM node:20-alpine AS builder

WORKDIR /app

# Copiar arquivos de configuração do monorepo
COPY package*.json tsconfig.base.json ./

# Copiar todos os workspaces
COPY packages ./packages
COPY apps ./apps

# Instalar todas as dependências (workspaces)
RUN npm ci

# Build do frontend
WORKDIR /app/apps/frontend
RUN npm run build

# Gerar Prisma Client do backend
WORKDIR /app/apps/backend
RUN npx prisma generate

# Stage 2: Runtime - Container Único
FROM node:20-alpine

WORKDIR /app

# Instalar Nginx
RUN apk add --no-cache nginx

# Copiar apenas dependências de produção do backend
COPY --from=builder /app/apps/backend/package*.json ./backend/
WORKDIR /app/backend
RUN npm ci --only=production

# Copiar código do backend e Prisma Client
WORKDIR /app
COPY --from=builder /app/apps/backend ./backend
COPY --from=builder /app/node_modules/@prisma ./node_modules/@prisma

# Copiar frontend buildado
COPY --from=builder /app/apps/frontend/dist ./frontend/dist

# Copiar configurações
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/startup.sh /app/startup.sh

# Criar diretórios necessários e ajustar permissões
RUN mkdir -p /run/nginx /var/log/nginx /app/data /app/logs && \
    chmod +x /app/startup.sh && \
    chown -R node:node /app /run/nginx /var/log/nginx

# Expor porta
EXPOSE 3050

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3050/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))" || exit 1

# Usuário não-root
USER node

# Comando de inicialização
CMD ["/app/startup.sh"]
