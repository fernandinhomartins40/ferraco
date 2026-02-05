# Dockerfile Multi-stage para Monorepo Ferraco CRM usando npm workspaces
# Stage 1: Build completo (Backend + Frontend)
FROM node:20-alpine AS builder

# Build args para forçar rebuild quando código mudar
ARG BUILD_TIMESTAMP=0
ARG GIT_COMMIT=unknown

WORKDIR /app

# Labels para rastreamento
LABEL build.timestamp="${BUILD_TIMESTAMP}"
LABEL git.commit="${GIT_COMMIT}"

# Instalar bash e dependências do Puppeteer/Chromium (necessário para WPPConnect)
RUN apk add --no-cache \
    bash \
    chromium \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Cache busting: usar BUILD_TIMESTAMP para forçar rebuild
RUN echo "Build timestamp: ${BUILD_TIMESTAMP}" && \
    echo "Git commit: ${GIT_COMMIT}"

# Copiar arquivos de configuração do monorepo
COPY package*.json tsconfig.base.json ./

# Copiar todos os workspaces
COPY packages ./packages
COPY apps ./apps

# Instalar todas as dependências (workspaces) - sempre limpo
RUN npm ci --prefer-offline=false --no-audit --no-fund

# Gerar Prisma Client ANTES do build (tipos necessários para TypeScript)
RUN npm run prisma:generate

# Limpar builds anteriores (garantir build limpo)
RUN rm -rf apps/backend/dist apps/frontend/dist

# Cache busting: invalidar cache antes dos builds
RUN echo "Starting builds at: ${BUILD_TIMESTAMP}"

# Build do backend (deve ser executado da raiz do monorepo)
RUN npm run build:backend || { echo "❌ ERRO: Build do backend falhou!"; cat apps/backend/typescript-errors.txt 2>/dev/null || true; exit 1; }

# Verificar se dist/ foi criado
RUN ls -la apps/backend/dist/ || { echo "❌ ERRO: Diretório dist/ não foi criado!"; exit 1; }

# Build do frontend (deve ser executado da raiz do monorepo)
RUN npm run build:frontend || { echo "❌ ERRO: Build do frontend falhou!"; exit 1; }

# Stage 2: Runtime - Container Único
FROM node:20-alpine

# Build args (passar do stage anterior)
ARG BUILD_TIMESTAMP=0
ARG GIT_COMMIT=unknown

WORKDIR /app

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000
ENV BUILD_TIMESTAMP=${BUILD_TIMESTAMP}
ENV GIT_COMMIT=${GIT_COMMIT}

# Instalar Nginx, OpenSSL, bash, PostgreSQL client e dependências do Chromium/Puppeteer
RUN apk add --no-cache \
    bash \
    nginx \
    openssl \
    postgresql-client \
    chromium \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji

# Variáveis de ambiente para Puppeteer
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

# Copiar backend completo com node_modules do builder
COPY --from=builder /app/apps/backend ./backend
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

# Copiar frontend buildado
COPY --from=builder /app/apps/frontend/dist ./frontend/dist

# Copiar configurações
COPY docker/nginx.conf /etc/nginx/http.d/default.conf
COPY docker/startup.sh /app/startup.sh

# Criar diretórios necessários e ajustar permissões
# CORREÇÃO: Remover /app/uploads e /app/sessions (serão volumes Docker montados em runtime)
RUN mkdir -p /run/nginx /var/log/nginx /var/lib/nginx/tmp/client_body /app/data /app/logs && \
    chmod +x /app/startup.sh && \
    chown -R nginx:nginx /var/log/nginx /var/lib/nginx /run/nginx && \
    chown -R node:node /app

# Expor porta
EXPOSE 3050

# Healthcheck
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3050/health || exit 1

# Rodar como root (Nginx precisa de root para iniciar)
# O startup.sh vai dropar privilégios para o backend Node.js
USER root

# Comando de inicialização
CMD ["/app/startup.sh"]
