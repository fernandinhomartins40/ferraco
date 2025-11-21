#!/usr/bin/env bash
#
# Script de Rebuild Docker - Ferraco CRM
#
# Reconstrói a imagem Docker com as melhorias de QR Code:
# - WPPConnect 1.37.6 (latest)
# - Timeouts zerados (qrTimeout: 0, deviceSyncTimeout: 0)
# - Dependências completas do Chromium
# - Variáveis de ambiente otimizadas
#
# USO:
# bash rebuild-docker.sh
#

set -e

echo "🐳 ========================================"
echo "🐳 REBUILD DOCKER - FERRACO CRM"
echo "🐳 ========================================"
echo ""

# Verificar se Docker está rodando
if ! docker info > /dev/null 2>&1; then
    echo "❌ Docker não está rodando. Inicie o Docker Desktop primeiro."
    exit 1
fi

echo "✅ Docker está rodando"
echo ""

# Parar containers se estiverem rodando
echo "🛑 Parando containers antigos..."
docker compose -f docker-compose.vps.yml down 2>/dev/null || true
echo ""

# Remover imagem antiga (forçar rebuild completo)
echo "🧹 Removendo imagem antiga..."
docker rmi ferraco-crm:latest 2>/dev/null || true
echo ""

# Rebuild com --no-cache para garantir que todas as mudanças sejam aplicadas
echo "🔨 Reconstruindo imagem Docker (pode levar 5-10 minutos)..."
echo ""

BUILD_TIMESTAMP=$(date +%s)
docker compose -f docker-compose.vps.yml build \
    --no-cache \
    --build-arg BUILD_TIMESTAMP=$BUILD_TIMESTAMP \
    --progress=plain

echo ""
echo "✅ ========================================"
echo "✅ REBUILD CONCLUÍDO COM SUCESSO!"
echo "✅ ========================================"
echo ""
echo "📦 Imagem: ferraco-crm:latest"
echo "🏗️  Build Timestamp: $BUILD_TIMESTAMP"
echo ""
echo "Para iniciar os containers:"
echo "  docker compose -f docker-compose.vps.yml up -d"
echo ""
echo "Para ver logs:"
echo "  docker compose -f docker-compose.vps.yml logs -f ferraco-crm-vps"
echo ""
