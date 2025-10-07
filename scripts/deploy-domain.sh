#!/bin/bash
# ==========================================
# Ferraco CRM - Deploy Script with Domain
# Deploy to VPS with painelcheckar.com.br
# ==========================================

set -e

SERVER="root@72.60.10.108"
PROJECT_DIR="/root/ferraco-crm"
DOMAIN="painelcheckar.com.br"

echo "========================================="
echo "🚀 Ferraco CRM - Deploy com Domínio"
echo "Domain: $DOMAIN"
echo "========================================="
echo ""

# Check if SSH connection works
echo "🔌 Testing SSH connection..."
if ! ssh -o ConnectTimeout=5 $SERVER "echo 'SSH OK'" 2>/dev/null; then
    echo "❌ Cannot connect to server via SSH"
    exit 1
fi
echo "✅ SSH connection OK"
echo ""

# Deploy application
echo "📦 Deploying application..."
ssh $SERVER << 'ENDSSH'
set -e

cd /root/ferraco-crm

echo "📥 Pulling latest changes..."
git pull origin main

echo "🛑 Stopping current container..."
docker-compose -f docker-compose.vps.yml down || true

echo "🏗️  Building new image..."
BUILD_TIMESTAMP=$(date +%s) docker-compose -f docker-compose.domain.yml build --no-cache

echo "🚀 Starting container with domain configuration..."
docker-compose -f docker-compose.domain.yml up -d

echo "⏳ Waiting for container to be healthy..."
sleep 15

# Check if container is running
if docker ps | grep -q ferraco-crm-vps; then
    echo "✅ Container is running"
else
    echo "❌ Container failed to start"
    docker logs ferraco-crm-vps --tail 50
    exit 1
fi

ENDSSH

echo ""
echo "========================================="
echo "✅ Deployment Complete!"
echo "========================================="
echo ""
echo "📝 Next steps:"
echo "   1. SSH into server: ssh $SERVER"
echo "   2. Run SSL setup: cd /root/ferraco-crm && bash scripts/setup-ssl.sh"
echo "   3. Access: https://$DOMAIN"
echo ""
echo "========================================="
