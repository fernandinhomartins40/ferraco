# Ferraco CRM Frontend Dockerfile
FROM node:18-alpine AS builder

# Metadados
LABEL maintainer="Ferraco CRM Team"
LABEL description="Frontend para Ferraco CRM - Interface React + Vite"
LABEL version="1.0.0"

# Definir diretório de trabalho
WORKDIR /app

# Copiar arquivos de dependências primeiro para cache otimizado
COPY package*.json ./

# Instalar dependências
RUN npm ci && npm cache clean --force

# Copiar código da aplicação
COPY . .

# Build da aplicação
RUN npm run build

# Estágio de produção
FROM nginx:alpine

# Instalar dependências para health check
RUN apk add --no-cache curl

# Copiar build do estágio anterior
COPY --from=builder /app/dist /usr/share/nginx/html

# Copiar configuração personalizada do nginx (se existir)
COPY nginx.conf /etc/nginx/nginx.conf

# Criar usuário não-root para segurança
RUN addgroup -g 1001 -S nginx-user
RUN adduser -S nginx-user -u 1001

# Expor porta
EXPOSE 80

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -f http://localhost/health || exit 1

# Comando padrão
CMD ["nginx", "-g", "daemon off;"]