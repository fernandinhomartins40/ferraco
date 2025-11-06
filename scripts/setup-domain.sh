#!/bin/bash
# Script para configurar o domínio metalurgicaferraco.com.br no Nginx
# Execute na VPS como root

set -e

DOMAIN="metalurgicaferraco.com.br"
WWW_DOMAIN="www.${DOMAIN}"
EMAIL="admin@${DOMAIN}"
NGINX_CONF="/etc/nginx/sites-available/ferraco"
NGINX_ENABLED="/etc/nginx/sites-enabled/ferraco"

echo "======================================"
echo "Configuração do domínio ${DOMAIN}"
echo "======================================"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
    echo "Por favor, execute como root (sudo)"
    exit 1
fi

# 1. Instalar Certbot se não estiver instalado
echo "1. Verificando Certbot..."
if ! command -v certbot &> /dev/null; then
    echo "Instalando Certbot..."
    apt update
    apt install -y certbot python3-certbot-nginx
else
    echo "Certbot já instalado"
fi

# 2. Criar diretório para ACME challenge
echo "2. Criando diretório para validação SSL..."
mkdir -p /var/www/certbot

# 3. Backup da configuração atual do Nginx (se existir)
if [ -f "$NGINX_CONF" ]; then
    echo "3. Fazendo backup da configuração atual..."
    cp "$NGINX_CONF" "${NGINX_CONF}.backup.$(date +%Y%m%d_%H%M%S)"
fi

# 4. Copiar nova configuração Nginx
echo "4. Copiando configuração do Nginx..."
cat > "$NGINX_CONF" << 'EOF'
# Nginx Configuration for Ferraco CRM - VPS Production
# Supports multiple domains: metalurgicaferraco.com.br and www.metalurgicaferraco.com.br

# Redirect HTTP to HTTPS
server {
    listen 80;
    listen [::]:80;
    server_name metalurgicaferraco.com.br www.metalurgicaferraco.com.br;

    # Certbot ACME challenge
    location /.well-known/acme-challenge/ {
        root /var/www/certbot;
    }

    location / {
        return 301 https://$host$request_uri;
    }
}

# HTTPS Server
server {
    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name metalurgicaferraco.com.br www.metalurgicaferraco.com.br;

    # SSL Configuration (Certbot will manage these paths)
    ssl_certificate /etc/letsencrypt/live/metalurgicaferraco.com.br/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/metalurgicaferraco.com.br/privkey.pem;
    ssl_trusted_certificate /etc/letsencrypt/live/metalurgicaferraco.com.br/chain.pem;

    # SSL Settings
    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers 'ECDHE-ECDSA-AES128-GCM-SHA256:ECDHE-RSA-AES128-GCM-SHA256:ECDHE-ECDSA-AES256-GCM-SHA384:ECDHE-RSA-AES256-GCM-SHA384';
    ssl_prefer_server_ciphers off;
    ssl_session_cache shared:SSL:10m;
    ssl_session_timeout 10m;
    ssl_stapling on;
    ssl_stapling_verify on;
    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    # Security Headers
    add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
    add_header X-Frame-Options "SAMEORIGIN" always;
    add_header X-Content-Type-Options "nosniff" always;
    add_header X-XSS-Protection "1; mode=block" always;

    # Logs
    access_log /var/log/nginx/ferraco-access.log;
    error_log /var/log/nginx/ferraco-error.log;

    # Aumentar tamanho máximo de upload
    client_max_body_size 50M;

    # Gzip compression
    gzip on;
    gzip_vary on;
    gzip_min_length 1024;
    gzip_types text/plain text/css text/xml text/javascript application/json application/javascript application/xml+rss application/rss+xml font/truetype font/opentype application/vnd.ms-fontobject image/svg+xml;

    # Frontend - Servir arquivos estáticos
    location / {
        root /var/www/ferraco/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Cache para assets estáticos
        location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
            expires 1y;
            add_header Cache-Control "public, immutable";
        }
    }

    # Backend API - Proxy para Node.js
    location /api {
        proxy_pass http://localhost:3000/api;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;
    }

    # Uploads - Proxy para Node.js (Express serve arquivos estáticos)
    location /uploads {
        proxy_pass http://localhost:3000/uploads;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;

        # Cache para uploads (imagens)
        expires 1y;
        add_header Cache-Control "public, immutable";
    }

    # Health check
    location /health {
        proxy_pass http://localhost:3000/health;
        proxy_http_version 1.1;
        proxy_set_header Host $host;
        access_log off;
    }

    # WebSocket support para Socket.io
    location /socket.io/ {
        proxy_pass http://localhost:3000/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts para WebSocket
        proxy_connect_timeout 7d;
        proxy_send_timeout 7d;
        proxy_read_timeout 7d;
    }
}
EOF

# 5. Habilitar site (criar symlink se não existir)
echo "5. Habilitando site..."
ln -sf "$NGINX_CONF" "$NGINX_ENABLED"

# 6. Testar configuração do Nginx
echo "6. Testando configuração do Nginx..."
nginx -t

# 7. Recarregar Nginx
echo "7. Recarregando Nginx..."
systemctl reload nginx

# 8. Obter certificado SSL
echo "8. Obtendo certificado SSL..."
echo "Isso pode solicitar algumas confirmações..."

# Primeiro, obter certificado apenas com HTTP (sem SSL ainda configurado)
certbot certonly --nginx \
    -d "$DOMAIN" \
    -d "$WWW_DOMAIN" \
    --email "$EMAIL" \
    --agree-tos \
    --no-eff-email \
    --non-interactive || true

# Se o certificado foi obtido com sucesso, recarregar Nginx novamente
if [ -f "/etc/letsencrypt/live/${DOMAIN}/fullchain.pem" ]; then
    echo "Certificado SSL obtido com sucesso!"
    echo "Recarregando Nginx com SSL..."
    systemctl reload nginx

    # 9. Configurar renovação automática
    echo "9. Configurando renovação automática do certificado..."
    (crontab -l 2>/dev/null; echo "0 0,12 * * * certbot renew --quiet --post-hook 'systemctl reload nginx'") | crontab -

    echo ""
    echo "======================================"
    echo "✅ Configuração concluída com sucesso!"
    echo "======================================"
    echo ""
    echo "Seu site está disponível em:"
    echo "  - https://${DOMAIN}"
    echo "  - https://${WWW_DOMAIN}"
    echo ""
    echo "Certificado SSL configurado e renovação automática ativada."
else
    echo ""
    echo "======================================"
    echo "⚠️  Aviso: Certificado SSL não obtido"
    echo "======================================"
    echo ""
    echo "Certifique-se de que:"
    echo "1. Os DNS apontam corretamente para este servidor"
    echo "2. As portas 80 e 443 estão abertas no firewall"
    echo "3. Execute: certbot --nginx -d ${DOMAIN} -d ${WWW_DOMAIN}"
fi
