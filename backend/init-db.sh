#!/bin/bash

# Script de inicialização do banco de dados para o container backend
# Este script é executado dentro do container para garantir que o banco esteja configurado

echo "🔧 Inicializando banco de dados Ferraco CRM..."

# Verificar se o banco já existe
if [ ! -f "/app/data/ferraco.db" ]; then
    echo "📁 Criando diretório de dados..."
    mkdir -p /app/data

    echo "🗄️ Criando banco de dados SQLite..."
    npx prisma db push --accept-data-loss

    echo "🌱 Executando seed do banco de dados..."
    node seed.js

    echo "✅ Banco de dados inicializado com sucesso!"
else
    echo "ℹ️ Banco de dados já existe, verificando migração..."
    npx prisma db push --accept-data-loss
    echo "✅ Verificação de migração concluída!"
fi

echo "🚀 Iniciando aplicação..."
exec node src/app.js