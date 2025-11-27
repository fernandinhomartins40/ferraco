#!/bin/bash
# Script para verificar templates na API

echo "1. Fazendo login..."
LOGIN_RESPONSE=$(curl -s https://metalurgicaferraco.com/api/auth/login \
  -X POST \
  -H "Content-Type: application/json" \
  -d '{"email":"admin@ferraco.com","password":"Admin@123456"}')

echo "$LOGIN_RESPONSE" | head -c 200
echo ""

TOKEN=$(echo "$LOGIN_RESPONSE" | grep -o '"accessToken":"[^"]*' | cut -d'"' -f4)

if [ -z "$TOKEN" ]; then
  echo "ERRO: Token não encontrado"
  exit 1
fi

echo "2. Token obtido: ${TOKEN:0:50}..."
echo ""

echo "3. Buscando templates..."
curl -s "https://metalurgicaferraco.com/api/template-library" \
  -H "Authorization: Bearer $TOKEN" \
  -H "Content-Type: application/json"
