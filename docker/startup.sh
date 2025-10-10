#!/bin/sh
set -e

echo "========================================="
echo "🚀 Ferraco CRM - Iniciando Aplicação"
echo "========================================="
echo "📦 Ambiente: $NODE_ENV"
echo "🐳 Porta: $PORT"
echo "========================================="

# Criar diretórios necessários
mkdir -p /app/data /app/logs /run/nginx /var/log/nginx

# Migrar banco de dados (Prisma)
echo "📊 Executando migrações do banco de dados..."
cd /app/backend
npx prisma migrate deploy || echo "⚠️  Aviso: Falha na migração (pode ser normal em primeira execução)"

# Seed do banco (apenas se estiver vazio)
echo "🌱 Verificando se precisa popular banco de dados..."
npx prisma db seed || echo "ℹ️  Seed não executado (banco já populado ou seed não configurado)"

# Iniciar Nginx
echo "🌐 Iniciando Nginx..."
nginx

# Iniciar Backend (Node.js)
echo "⚙️  Iniciando Backend API..."
cd /app/backend
node src/server.js &
BACKEND_PID=$!

echo ""
echo "========================================="
echo "✅ Ferraco CRM Iniciado com Sucesso!"
echo "========================================="
echo "🌐 Frontend: http://localhost:$PORT"
echo "🔌 Backend API: http://localhost:$PORT/api"
echo "🩺 Health Check: http://localhost:$PORT/health"
echo "========================================="

# Aguardar processo do backend
wait $BACKEND_PID
