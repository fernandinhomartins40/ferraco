#!/bin/bash

###############################################################################
# Script de Atualização Automática da Versão WhatsApp Web
#
# Uso:
#   ./update-whatsapp-version.sh
#
# O que faz:
# 1. Detecta versão atual do WhatsApp Web via Baileys
# 2. Atualiza docker-compose.evolution.yml
# 3. Reinicia APENAS o container Evolution API
# 4. Backend e Postgres continuam funcionando
###############################################################################

set -e

echo "🔍 Detectando versão atual do WhatsApp Web..."

# Buscar versão atual via Baileys (dentro do contexto do backend)
CURRENT_VERSION=$(cd apps/backend && node -e "
const { fetchLatestBaileysVersion } = require('@whiskeysockets/baileys');
fetchLatestBaileysVersion()
  .then(({version}) => console.log(version.join(',')))
  .catch(e => { console.error('ERRO:', e.message); process.exit(1); });
")

if [ -z "$CURRENT_VERSION" ]; then
  echo "❌ Erro: Não foi possível detectar a versão atual"
  exit 1
fi

echo "✅ Versão detectada: $CURRENT_VERSION"

# Atualizar docker-compose.evolution.yml
echo "📝 Atualizando docker-compose.evolution.yml..."
sed -i "s/CONFIG_SESSION_PHONE_VERSION=.*/CONFIG_SESSION_PHONE_VERSION=$CURRENT_VERSION/" docker-compose.evolution.yml

echo "✅ Arquivo atualizado"

# Reiniciar Evolution API (apenas ela)
echo "🔄 Reiniciando Evolution API..."
docker-compose -f docker-compose.evolution.yml down
docker-compose -f docker-compose.evolution.yml up -d

echo "⏳ Aguardando 30 segundos para Evolution API estabilizar..."
sleep 30

# Verificar se subiu corretamente
if docker ps | grep -q "ferraco-evolution"; then
  echo "✅ Evolution API reiniciada com sucesso!"
  echo "📊 Versão WhatsApp Web: $CURRENT_VERSION"
  echo ""
  echo "🎯 Próximos passos:"
  echo "   1. Acesse o painel Evolution API"
  echo "   2. Crie/conecte a instância ferraco-crm"
  echo "   3. Escanei o QR Code"
else
  echo "❌ Erro: Container Evolution API não está rodando"
  echo "📋 Verificar logs: docker logs ferraco-evolution"
  exit 1
fi

echo ""
echo "✅ Atualização concluída com sucesso!"
