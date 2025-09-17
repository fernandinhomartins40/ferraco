# Ferraco CRM Backend Dockerfile
FROM node:18-alpine

# Metadados
LABEL maintainer="Ferraco CRM Team"
LABEL description="Backend para Ferraco CRM - Sistema completo de gestão de leads"
LABEL version="1.0.0"

# Instalar dependências do sistema necessárias para SQLite e Prisma
RUN apk add --no-cache \
    sqlite \
    openssl \
    libc6-compat

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nodejs
RUN adduser -S ferraco -u 1001

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro para cache otimizado
COPY package*.json ./
COPY prisma ./prisma/

# Instalar dependências
RUN npm ci --only=production && npm cache clean --force

# Gerar cliente Prisma
RUN npx prisma generate

# Copiar código da aplicação
COPY --chown=ferraco:nodejs . .

# Criar diretórios necessários
RUN mkdir -p data uploads logs && chown -R ferraco:nodejs data uploads logs

# Alterar para usuário não-root
USER ferraco

# Expor porta
EXPOSE 3000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD node -e "require('http').get('http://localhost:3000/api/health', (res) => { process.exit(res.statusCode === 200 ? 0 : 1) })"

# Comando padrão
CMD ["npm", "start"]