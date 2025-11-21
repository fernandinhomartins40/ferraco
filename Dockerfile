# Dockerfile Multi-stage para Monorepo Ferraco CRM usando npm workspaces
# Stage 1: Build completo (Backend + Frontend)
FROM node:20-alpine AS builder

WORKDIR /app

# Instalar bash e dependências do Puppeteer/Chromium (necessário para WPPConnect)
# ✅ ENHANCED 2025: Dependências extras para QR Code generation (Issue #2066)
RUN apk add --no-cache \
    bash \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    freetype-dev \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    font-noto-cjk \
    font-noto-arabic \
    libx11 \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxi \
    libxtst \
    cups-libs \
    libxscrnsaver \
    libxrandr \
    alsa-lib \
    pango \
    gtk+3.0 \
    libdrm \
    mesa-gbm

# Variáveis de ambiente para Puppeteer
# ✅ CRITICAL FIX 2025: Adicionar flags extras para Chromium headless
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROMIUM_FLAGS="--disable-software-rasterizer --disable-dev-shm-usage"

# Copiar arquivos de configuração do monorepo
COPY package*.json tsconfig.base.json ./

# Copiar todos os workspaces
COPY packages ./packages
COPY apps ./apps

# Instalar todas as dependências (workspaces)
RUN npm ci

# Gerar Prisma Client ANTES do build (tipos necessários para TypeScript)
RUN npm run prisma:generate

# Build do backend (deve ser executado da raiz do monorepo)
RUN npm run build:backend

# Build do frontend (deve ser executado da raiz do monorepo)
RUN npm run build:frontend

# Stage 2: Runtime - Container Único
FROM node:20-alpine

WORKDIR /app

# Definir variáveis de ambiente padrão
ENV NODE_ENV=production
ENV PORT=3000

# Instalar Nginx, OpenSSL, bash, PostgreSQL client e dependências do Chromium/Puppeteer
# ✅ ENHANCED 2025: Dependências extras para QR Code generation (Issue #2066)
RUN apk add --no-cache \
    bash \
    nginx \
    openssl \
    postgresql-client \
    chromium \
    chromium-chromedriver \
    nss \
    freetype \
    harfbuzz \
    ca-certificates \
    ttf-freefont \
    font-noto-emoji \
    font-noto-cjk \
    font-noto-arabic \
    libx11 \
    libxcomposite \
    libxcursor \
    libxdamage \
    libxi \
    libxtst \
    cups-libs \
    libxscrnsaver \
    libxrandr \
    alsa-lib \
    pango \
    gtk+3.0 \
    libdrm \
    mesa-gbm

# Variáveis de ambiente para Puppeteer
# ✅ CRITICAL FIX 2025: Adicionar flags extras para Chromium headless
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser \
    CHROME_BIN=/usr/bin/chromium-browser \
    CHROMIUM_FLAGS="--disable-software-rasterizer --disable-dev-shm-usage"

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
RUN mkdir -p /run/nginx /var/log/nginx /var/lib/nginx/tmp/client_body /app/data /app/logs /app/uploads /app/sessions && \
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
