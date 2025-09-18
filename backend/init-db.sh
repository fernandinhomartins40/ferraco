#!/bin/bash

# Script de inicialização do banco de dados para o container backend
# Este script é executado dentro do container para garantir que o banco esteja configurado

echo "🔧 Inicializando banco de dados Ferraco CRM..."

# Garantir que diretório de dados existe
echo "📁 Criando diretório de dados..."
mkdir -p /app/data

# Sempre aplicar schema do banco
echo "🗄️ Aplicando schema do banco de dados..."
npx prisma db push --accept-data-loss

# Sempre executar seed para garantir usuários padrão
echo "🌱 Executando seed do banco de dados..."
node seed.js

echo "✅ Banco de dados inicializado com sucesso!"

echo "🚀 Iniciando aplicação..."
exec node src/app.js