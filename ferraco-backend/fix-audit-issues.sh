#!/bin/bash

# Script para corrigir problemas identificados na auditoria da API
# Data: 2025-10-09

echo "🔧 Iniciando correções da auditoria..."
echo ""

# 1. Substituir PrismaClient duplicado
echo "📦 Corrigindo instâncias duplicadas do Prisma..."
find src/modules src/services -type f -name "*.ts" -exec sed -i "s/import { PrismaClient } from '@prisma\/client';$/import prisma from '..\/..\/config\/database'; \/\/ Fixed: Singleton/g" {} \;
find src/modules -type f -name "*.ts" -exec sed -i "s/const prisma = new PrismaClient();$/\/\/ Removed duplicate Prisma instance - using singleton/g" {} \;
find src/services -type f -name "*.ts" -exec sed -i "s/const prisma = new PrismaClient();$/\/\/ Removed duplicate Prisma instance - using singleton/g" {} \;

# 2. Substituir console.log por logger
echo "📝 Substituindo console.log por logger..."
find src/modules src/services -type f -name "*.ts" -exec sed -i "s/console\.log(/logger.info(/g" {} \;
find src/modules src/services -type f -name "*.ts" -exec sed -i "s/console\.error(/logger.error(/g" {} \;
find src/modules src/services -type f -name "*.ts" -exec sed -i "s/console\.warn(/logger.warn(/g" {} \;

echo ""
echo "✅ Correções automáticas concluídas!"
echo "⚠️  Revise os arquivos manualmente para garantir que os imports do logger foram adicionados."
