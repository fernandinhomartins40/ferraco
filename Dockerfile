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

# T-10 (F-29/F-10): o Chromium e suas dependências foram REMOVIDOS deste stage.
# Nada os executa durante o build — apenas `npm ci` e compilação TypeScript/Vite.
# Medido: 130,5 MB -> 897,2 MB, ou ~767 MB de camada desperdiçada por build.
# O Chromium continua instalado no stage de runtime, onde o Puppeteer o usa.
# `bash` é mantido: scripts de build podem depender dele.
RUN apk add --no-cache bash

# PUPPETEER_SKIP_CHROMIUM_DOWNLOAD permanece OBRIGATÓRIO aqui: sem ele o
# `npm ci` baixaria o Chromium do próprio Puppeteer (~170 MB), anulando o ganho.
ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true

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

# F-102 (achado em T-14, ao testar a imagem construída): o postinstall do
# `@prisma/engines` baixa apenas os engines da plataforma NATIVA do builder
# (linux-musl). A imagem roda OpenSSL 3.x, então o CLI procura os engines
# `linux-musl-openssl-3.0.x` em node_modules/@prisma/engines/ — não encontra, e
# tenta BAIXAR de binaries.prisma.sh EM RUNTIME. Sem internet no container, as
# migrations falham a TODO boot (verificado: o fallback `db push` também falhava,
# e o seed em seguida).
#
# `prisma generate` com PRISMA_CLI_BINARY_TARGETS baixa a variante correta para
# @prisma/engines/ em build-time, eliminando a dependência de rede no runtime.
RUN PRISMA_CLI_BINARY_TARGETS=linux-musl-openssl-3.0.x npm run prisma:generate \
    && echo "=== engines disponíveis para o CLI ===" \
    && ls node_modules/@prisma/engines/ | grep -iE "engine"

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
# T-11 (F-37): as duas portas são intencionais e NÃO devem ser unificadas.
#   3050 = nginx dentro do container, é o que o compose publica (3050:3050)
#   3000 = Node atrás do nginx (ENV PORT), acessível só internamente
# A divergência aparente entre EXPOSE e PORT é a arquitetura, não um defeito.
EXPOSE 3050

# Healthcheck
# T-14 (F-51): aponta para o Node (3000), não para o nginx (3050). O nginx
# responde mesmo com o backend morto ou o banco fora — o healthcheck precisa
# exercitar a cadeia inteira, e /health agora consulta o banco.
HEALTHCHECK --interval=30s --timeout=10s --start-period=40s --retries=3 \
  CMD wget --no-verbose --tries=1 --spider http://localhost:3000/health || exit 1

# Rodar como root (Nginx precisa de root para iniciar)
# O startup.sh vai dropar privilégios para o backend Node.js
USER root

# Comando de inicialização
CMD ["/app/startup.sh"]
