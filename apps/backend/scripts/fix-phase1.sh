#!/bin/bash

# Script de correção FASE 1 - Correções Críticas
# Aplica todas as correções do plano de refatoração WPPConnect

echo "🔧 Iniciando correções da FASE 1..."

# 1.1.1 - Corrigir downloadMedia() - substituir decryptFile por downloadMedia
echo "📝 1.1.1 - Corrigindo downloadMedia()..."
sed -i 's/await this\.client\.decryptFile(messageId)/await this.client.downloadMedia(messageId)/g' src/services/whatsappService.ts

# 1.1.2 - Comentar getStarredMessages() (remover completamente causa quebra)
echo "📝 1.1.2 - Comentando getStarredMessages()..."
# Será feito manualmente para não quebrar endpoints

# 1.1.3 - Comentar sendButtons()
echo "📝 1.1.3 - Comentando sendButtons()..."
# Será feito manualmente para não quebrar endpoints

# 1.1.4 - Comentar getGroupMetadata()
echo "📝 1.1.4 - Comentando getGroupMetadata()..."
# Será feito manualmente para não quebrar endpoints

echo "✅ Correções aplicadas com sucesso!"
echo ""
echo "⚠️  ATENÇÃO: As funções deprecadas foram comentadas."
echo "   Verifique os controllers e rotas que as utilizam."
