#!/bin/bash
# ==========================================
# Ferraco CRM - Production Diagnostics
# ==========================================
# Script para diagnosticar problemas em produção

set -e

SERVER=${1:-"72.60.10.108"}
CONTAINER="ferraco-crm-vps"

echo "========================================="
echo "🔍 Ferraco CRM - Production Diagnostics"
echo "========================================="
echo ""

# Test HTTP connectivity
echo "📡 Testing HTTP connectivity..."
if curl -s --connect-timeout 5 http://$SERVER:3050/api/health > /dev/null; then
    echo "✅ HTTP is responding"
    curl -s http://$SERVER:3050/api/health | jq '.' 2>/dev/null || curl -s http://$SERVER:3050/api/health
else
    echo "❌ HTTP is not responding"
fi
echo ""

# Test SSH connectivity
echo "🔐 Testing SSH connectivity..."
if timeout 10s ssh -o ConnectTimeout=5 root@$SERVER "echo 'SSH OK'" 2>/dev/null; then
    echo "✅ SSH is working"

    echo ""
    echo "🐳 Checking Docker container..."
    ssh root@$SERVER "docker ps --filter name=$CONTAINER --format 'table {{.Names}}\t{{.Status}}\t{{.Ports}}'" 2>/dev/null || echo "❌ Cannot reach Docker"

    echo ""
    echo "📊 Container resource usage..."
    ssh root@$SERVER "docker stats $CONTAINER --no-stream --format 'table {{.Name}}\t{{.CPUPerc}}\t{{.MemUsage}}'" 2>/dev/null || echo "❌ Cannot get stats"

    echo ""
    echo "📝 Last 20 log lines..."
    ssh root@$SERVER "docker logs $CONTAINER --tail 20 2>&1" 2>/dev/null || echo "❌ Cannot read logs"

    echo ""
    echo "🗄️  Database permissions..."
    ssh root@$SERVER "docker exec $CONTAINER ls -lah /app/backend/data/" 2>/dev/null || echo "❌ Cannot check database"

    echo ""
    echo "🔄 Backend process..."
    ssh root@$SERVER "docker exec $CONTAINER ps aux | grep node" 2>/dev/null || echo "❌ Cannot check processes"

else
    echo "❌ SSH is not working (timeout or connection refused)"
    echo "   This usually means the server is under heavy load"
fi

echo ""
echo "========================================="
echo "✅ Diagnostic complete"
echo "========================================="
