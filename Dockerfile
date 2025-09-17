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

# Configuração básica do nginx para SPA
RUN echo 'server { \
    listen 80; \
    server_name localhost; \
    root /usr/share/nginx/html; \
    index index.html index.htm; \
    \
    # Health check endpoint \
    location /health { \
        return 200 "OK"; \
        add_header Content-Type text/plain; \
    } \
    \
    # SPA routing - todas as rotas vão para index.html \
    location / { \
        try_files $uri $uri/ /index.html; \
    } \
    \
    # Cache para assets estáticos \
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ { \
        expires 1y; \
        add_header Cache-Control "public, immutable"; \
    } \
}' > /etc/nginx/conf.d/default.conf

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