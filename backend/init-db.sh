#!/bin/bash

# Script de inicialização do banco de dados para o container backend
# Sistema Unificado - Garante que apenas o sistema de banco de dados seja usado

echo "🔧 Inicializando Ferraco CRM Backend - Sistema Unificado..."

# Garantir que diretório de dados existe
echo "📁 Criando diretório de dados..."
mkdir -p /app/data

# Aplicar schema do banco
echo "🗄️ Aplicando schema do banco de dados..."
npx prisma db push --accept-data-loss

# Executar inicialização do sistema unificado
echo "🌱 Executando inicialização do sistema unificado..."
node scripts/init-production.js

echo "✅ Sistema unificado inicializado com sucesso!"

echo "🚀 Iniciando aplicação com sistema unificado..."
exec node src/app.js