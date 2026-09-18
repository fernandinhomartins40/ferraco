# =============================================================================
# ⚠️  ARQUIVO OBSOLETO — NAO E USADO POR NENHUM BUILD (T-31 / F-38)
# =============================================================================
# Verificado em 2026-09-18: nenhum docker-compose, workflow do GitHub Actions
# ou script referencia este Dockerfile. O build de producao usa o `Dockerfile`
# da RAIZ do repositorio, que constroi frontend + backend na mesma imagem.
#
# Por que nao foi apagado: manter o arquivo preserva o historico e permite
# retomar um build isolado do backend, se um dia for necessario. O risco dele
# nao e ocupar espaco — e alguem edita-lo achando que afeta producao.
#
# DIVERGENCIA CONHECIDA: este arquivo fixa node:18-alpine, enquanto o Dockerfile
# da raiz usa node:20-alpine. Se voltar a ser usado, alinhe a versao ANTES —
# o Prisma 5.22 e o whatsapp-web.js sao validados no Node 20 neste projeto.
#
# ATENCAO ao `engines`: os package.json (raiz e backend) declaram
# `"node": ">=18.0.0"`, entao o Node 18 daqui NAO viola a restricao declarada.
# A divergencia real e entre o que o `engines` PERMITE (>=18) e o que de fato
# roda em producao (20). O `engines` nao serve como garantia de compatibilidade
# aqui — verifique contra o Dockerfile da raiz, nao contra o package.json.
#
# Antes de usar este arquivo, confira tambem: binaryTargets do Prisma e as
# libs do Chromium exigidas pelo whatsapp-web.js.
# =============================================================================

# Multi-stage build for production
FROM node:18-alpine AS base

# Install dependencies only when needed
FROM base AS deps
WORKDIR /app

# Copy package files
COPY package.json package-lock.json* ./
COPY prisma ./prisma/

# Install dependencies
RUN npm ci --only=production && \
    npm cache clean --force

# Generate Prisma Client
RUN npx prisma generate

# Development stage
FROM base AS dev
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate

EXPOSE 3000

CMD ["npm", "run", "dev"]

# Build stage
FROM base AS builder
WORKDIR /app

COPY package.json package-lock.json* ./
RUN npm ci

COPY . .
RUN npx prisma generate
RUN npm run build

# Production stage
FROM base AS runner
WORKDIR /app

ENV NODE_ENV=production

# Create non-root user
RUN addgroup --system --gid 1001 nodejs && \
    adduser --system --uid 1001 app

# Copy necessary files
COPY --from=deps --chown=app:nodejs /app/node_modules ./node_modules
COPY --from=builder --chown=app:nodejs /app/dist ./dist
COPY --from=builder --chown=app:nodejs /app/prisma ./prisma
COPY --chown=app:nodejs package.json ./

# Switch to non-root user
USER app

EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=40s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/health', (r) => {process.exit(r.statusCode === 200 ? 0 : 1)})"

CMD ["node", "dist/server.js"]
