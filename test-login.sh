#!/bin/bash

# Script para testar login e verificar resposta dos tokens

echo "🔍 Testando login na API em produção..."
echo ""

# Fazer login (substitua com um email/senha válido)
RESPONSE=$(curl -s -X POST https://metalurgicaferraco.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "admin@ferraco.com",
    "password": "admin123"
  }')

echo "📋 Resposta completa do login:"
echo "$RESPONSE" | jq '.'

echo ""
echo "🔑 Access Token:"
echo "$RESPONSE" | jq -r '.data.accessToken // "❌ NÃO ENCONTRADO"'

echo ""
echo "🔄 Refresh Token:"
echo "$RESPONSE" | jq -r '.data.refreshToken // "❌ NÃO ENCONTRADO"'

echo ""
echo "👤 User:"
echo "$RESPONSE" | jq -r '.data.user.email // "❌ NÃO ENCONTRADO"'
