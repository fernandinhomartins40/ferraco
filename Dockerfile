# Dockerfile Multi-stage para Monorepo Ferraco CRM
# Stage 1: Build Backend
FROM node:20-alpine AS backend-builder

WORKDIR /app

# Copiar package files do backend
COPY apps/backend/package*.json ./apps/backend/
COPY package*.json ./

# Instalar dependências do backend
WORKDIR /app/apps/backend
RUN npm ci --only=production

# Copiar código do backend
COPY apps/backend ./

# Gerar Prisma Client
RUN npx prisma generate

# Stage 2: Build Frontend
FROM node:20-alpine AS frontend-builder

WORKDIR /app

# Copiar package files do frontend
COPY apps/frontend/package*.json ./apps/frontend/
COPY package*.json ./

# Instalar dependências do frontend
WORKDIR /app/apps/frontend
RUN npm ci

# Copiar código do frontend
COPY apps/frontend ./

# Build do frontend
RUN npm run build

# Stage 3: Runtime - Container Único
FROM node:20-alpine

WORKDIR /app

# Instalar Nginx
RUN apk add --no-cache nginx supervisor

# Copiar backend compilado
COPY --from=backend-builder /app/apps/backend ./backend

# Copiar frontend buildado
COPY --from=frontend-builder /app/apps/frontend/dist ./frontend/dist

# Copiar configurações
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/startup.sh /app/startup.sh

# Criar diretórios necessários
RUN mkdir -p /run/nginx /var/log/nginx /app/data /app/logs && \
    chmod +x /app/startup.sh && \
    chown -R node:node /app /run/nginx /var/log/nginx

# Expor porta
EXPOSE 3050

# Usuário não-root
USER node

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3050/health', (r) => process.exit(r.statusCode === 200 ? 0 : 1))"

# Comando de inicialização
CMD ["/app/startup.sh"]
