#!/bin/bash
# Script para atualizar versão do WhatsApp Web na Evolution API
# Execute na VPS: bash atualizar-whatsapp-version.sh

echo "=========================================="
echo "ATUALIZAR VERSÃO WHATSAPP WEB"
echo "=========================================="
echo ""
echo "Versão atual: 2.3000.1028569044"
echo ""

# Parar e remover container antigo
echo "[1/5] Parando container Evolution API..."
docker stop ferraco-evolution
docker rm ferraco-evolution

# Limpar volumes antigos (dados corrompidos)
echo "[2/5] Limpando volumes antigos..."
docker volume rm ferraco-crm_evolution-instances ferraco-crm_evolution-store 2>/dev/null || true

# Atualizar código
echo "[3/5] Atualizando código..."
cd /root/ferraco-crm
git pull

# Recriar container com versão atualizada
echo "[4/5] Recriando container com nova versão WhatsApp Web..."
docker compose -f docker-compose.vps.yml up -d evolution-api

# Aguardar inicialização
echo "[5/5] Aguardando inicialização (30 segundos)..."
sleep 30

# Verificar versão carregada
echo ""
echo "=========================================="
echo "VERIFICAÇÃO"
echo "=========================================="
docker logs ferraco-evolution 2>&1 | grep "Baileys version env" | tail -1

echo ""
echo "✅ Atualização concluída!"
echo ""
echo "PRÓXIMOS PASSOS:"
echo "1. Acesse: https://metalurgicaferraco.com/admin/whatsapp"
echo "2. Vá na aba 'Configurações'"
echo "3. O QR Code deve aparecer em 10-15 segundos"
echo ""
echo "Se não funcionar, verifique:"
echo "  docker logs ferraco-evolution --tail 50"
echo "  docker logs ferraco-crm-vps --tail 50"
echo "=========================================="
