#!/bin/bash
# ==========================================
# Ferraco CRM - SSL Setup Script
# Setup Let's Encrypt SSL for painelcheckar.com.br
# ==========================================

set -e

DOMAIN="painelcheckar.com.br"
EMAIL="admin@painelcheckar.com.br"
CONTAINER="ferraco-crm-vps"

echo "========================================="
echo "🔒 Ferraco CRM - SSL Setup"
echo "Domain: $DOMAIN"
echo "========================================="
echo ""

# Check if running as root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Please run as root or with sudo"
  exit 1
fi

# Install certbot if not installed
echo "📦 Checking Certbot installation..."
if ! command -v certbot &> /dev/null; then
    echo "Installing Certbot..."
    apt-get update
    apt-get install -y certbot
else
    echo "✅ Certbot already installed"
fi

# Stop container temporarily
echo ""
echo "⏸️  Stopping container to free port 80..."
docker stop $CONTAINER 2>/dev/null || true

# Obtain SSL certificate
echo ""
echo "🔐 Obtaining SSL certificate from Let's Encrypt..."
certbot certonly \
    --standalone \
    --non-interactive \
    --agree-tos \
    --email "$EMAIL" \
    --domains "$DOMAIN,www.$DOMAIN" \
    --preferred-challenges http \
    || {
        echo "❌ Failed to obtain SSL certificate"
        echo "Please check:"
        echo "  1. DNS is pointing to this server (72.60.10.108)"
        echo "  2. Port 80 is accessible from the internet"
        echo "  3. Domain name is correct: $DOMAIN"
        exit 1
    }

echo ""
echo "✅ SSL certificate obtained successfully!"

# Copy nginx config with SSL
echo ""
echo "📝 Configuring Nginx with SSL..."
docker exec $CONTAINER cp /etc/nginx/nginx-ssl.conf /etc/nginx/nginx.conf 2>/dev/null || true

# Restart container
echo ""
echo "🔄 Restarting container..."
docker start $CONTAINER

# Wait for container to be healthy
echo "⏳ Waiting for application to start..."
sleep 10

# Reload nginx to apply SSL config
echo "🔄 Reloading Nginx configuration..."
docker exec $CONTAINER nginx -s reload 2>/dev/null || {
    echo "⚠️  Could not reload nginx, restarting container..."
    docker restart $CONTAINER
    sleep 15
}

# Test HTTPS
echo ""
echo "🧪 Testing HTTPS connection..."
if curl -s -o /dev/null -w "%{http_code}" "https://$DOMAIN/api/health" | grep -q "200"; then
    echo "✅ HTTPS is working!"
else
    echo "⚠️  HTTPS test failed, but certificate is installed"
    echo "   Container may still be starting..."
fi

# Setup automatic renewal
echo ""
echo "⏰ Setting up automatic certificate renewal..."
if ! crontab -l 2>/dev/null | grep -q "certbot renew"; then
    (crontab -l 2>/dev/null; echo "0 3 * * * certbot renew --quiet && docker exec $CONTAINER nginx -s reload") | crontab -
    echo "✅ Auto-renewal configured (runs daily at 3 AM)"
else
    echo "✅ Auto-renewal already configured"
fi

echo ""
echo "========================================="
echo "✅ SSL Setup Complete!"
echo "========================================="
echo ""
echo "🌐 Your application is now available at:"
echo "   https://$DOMAIN"
echo "   https://www.$DOMAIN"
echo ""
echo "📝 Certificate details:"
certbot certificates -d $DOMAIN
echo ""
echo "🔄 Certificate will auto-renew 30 days before expiration"
echo ""
echo "========================================="
