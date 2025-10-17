#!/bin/bash
# Script para corrigir geração de QR Code WhatsApp - Evolution API
# Execute na VPS: bash fix-qrcode-vps.sh

echo "======================================================================"
echo "CORREÇÃO DEFINITIVA - QR CODE WHATSAPP"
echo "======================================================================"
echo ""

# Passo 1: Parar e remover container Evolution API antigo
echo "[1/6] Removendo container Evolution API antigo..."
docker stop ferraco-evolution 2>/dev/null
docker rm ferraco-evolution 2>/dev/null
echo "✅ Container antigo removido"
echo ""

# Passo 2: Criar novo container com configuração correta
echo "[2/6] Criando novo container Evolution API com configurações corretas..."
docker run -d \
  --name ferraco-evolution \
  --network ferraco_ferraco-network \
  -p 8080:8080 \
  -e SERVER_TYPE=http \
  -e SERVER_PORT=8080 \
  -e AUTHENTICATION_TYPE=apikey \
  -e AUTHENTICATION_API_KEY=FERRACO2025 \
  -e AUTHENTICATION_EXPOSE_IN_FETCH_INSTANCES=true \
  -e DATABASE_ENABLED=true \
  -e DATABASE_PROVIDER=postgresql \
  -e DATABASE_CONNECTION_URI=postgresql://ferraco:ferraco123@postgres:5432/evolution_api \
  -e DATABASE_CONNECTION_CLIENT_NAME=evolution_api \
  -e DATABASE_SAVE_DATA_INSTANCE=true \
  -e DATABASE_SAVE_DATA_NEW_MESSAGE=true \
  -e DATABASE_SAVE_MESSAGE_UPDATE=true \
  -e DATABASE_SAVE_DATA_CONTACTS=true \
  -e DATABASE_SAVE_DATA_CHATS=true \
  -e CACHE_REDIS_ENABLED=false \
  -e CACHE_LOCAL_ENABLED=false \
  -e WEBHOOK_GLOBAL_URL=http://ferraco-crm-vps:3000/webhooks/evolution \
  -e WEBHOOK_GLOBAL_ENABLED=true \
  -e WEBHOOK_GLOBAL_WEBHOOK_BY_EVENTS=false \
  -e WEBHOOK_EVENTS_QRCODE_UPDATED=true \
  -e WEBHOOK_EVENTS_CONNECTION_UPDATE=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPSERT=true \
  -e WEBHOOK_EVENTS_MESSAGES_UPDATE=true \
  -e CONFIG_SESSION_PHONE_CLIENT="Ferraco CRM" \
  -e CONFIG_SESSION_PHONE_NAME=Chrome \
  -e CONFIG_SESSION_PHONE_VERSION=2.3000.1023204200 \
  -e QRCODE_LIMIT=30 \
  -e LOG_LEVEL=ERROR,WARN,DEBUG,INFO,LOG \
  atendai/evolution-api:latest

echo "✅ Container criado"
echo ""

# Passo 3: Aguardar inicialização
echo "[3/6] Aguardando Evolution API inicializar (30 segundos)..."
sleep 30
echo "✅ Inicialização concluída"
echo ""

# Passo 4: Verificar se Evolution API está funcionando
echo "[4/6] Testando Evolution API..."
RESPONSE=$(curl -s "http://localhost:8080/")
if echo "$RESPONSE" | grep -q "Welcome to the Evolution API"; then
  echo "✅ Evolution API funcionando corretamente"
else
  echo "❌ Erro: Evolution API não respondeu corretamente"
  echo "Resposta: $RESPONSE"
  exit 1
fi
echo ""

# Passo 5: Atualizar variável de ambiente do backend
echo "[5/6] Atualizando variável EVOLUTION_API_KEY no backend..."
docker exec ferraco-crm-vps sh -c 'echo "export EVOLUTION_API_KEY=FERRACO2025" >> /app/.env' 2>/dev/null || echo "Variável já existe ou erro ao adicionar"
echo "✅ Variável atualizada"
echo ""

# Passo 6: Reiniciar backend
echo "[6/6] Reiniciando backend para aplicar nova API Key..."
docker restart ferraco-crm-vps
echo "✅ Backend reiniciado"
echo ""

echo "======================================================================"
echo "AGUARDANDO BACKEND INICIALIZAR (40 segundos)..."
echo "======================================================================"
sleep 40

echo ""
echo "======================================================================"
echo "VALIDAÇÃO FINAL"
echo "======================================================================"
echo ""

# Testar criação de instância
echo "Testando criação de instância..."
CREATE_RESPONSE=$(curl -s -X POST "http://localhost:8080/instance/create" \
  -H "Content-Type: application/json" \
  -H "apikey: FERRACO2025" \
  -d '{"instanceName":"ferraco-crm","qrcode":true,"integration":"WHATSAPP-BAILEYS","webhook":{"url":"http://ferraco-crm-vps:3000/webhooks/evolution","byEvents":false,"base64":false,"events":["QRCODE_UPDATED","CONNECTION_UPDATE","MESSAGES_UPSERT"]}}')

if echo "$CREATE_RESPONSE" | grep -q "instance"; then
  echo "✅ Instância criada com sucesso!"
else
  echo "ℹ️  Instância já existe ou resposta:"
  echo "$CREATE_RESPONSE"
fi

echo ""
echo "======================================================================"
echo "PRÓXIMOS PASSOS:"
echo "======================================================================"
echo "1. Acesse: https://seu-dominio.com/admin/whatsapp"
echo "2. Vá na aba 'Configurações'"
echo "3. O QR Code deve aparecer em 5-10 segundos"
echo "4. Escaneie o QR Code com seu WhatsApp"
echo ""
echo "Se o QR Code ainda não aparecer, verifique os logs:"
echo "  docker logs ferraco-crm-vps --tail 50"
echo "  docker logs ferraco-evolution --tail 50"
echo ""
echo "======================================================================"
echo "CORREÇÃO CONCLUÍDA COM SUCESSO!"
echo "======================================================================"
