#!/bin/sh
set -e

echo "========================================="
echo "🚀 Ferraco CRM - Iniciando Aplicação"
echo "========================================="
echo "📦 Ambiente: $NODE_ENV"
echo "🐳 Porta: $PORT"
echo "========================================="

# Criar diretórios necessários
mkdir -p /app/data /app/logs

# Migrar banco de dados (Prisma) - pular se DATABASE_URL não estiver configurado
if [ -n "$DATABASE_URL" ]; then
  echo "📊 Criando/Atualizando estrutura do banco de dados..."
  cd /app/backend

  # Usar prisma db push em vez de migrate deploy (cria tabelas sem migration files)
  npx prisma db push --accept-data-loss 2>&1 || echo "⚠️  Aviso: Falha ao criar tabelas"

  # Seed do banco (apenas se estiver vazio)
  echo "🌱 Verificando se precisa popular banco de dados..."
  npx prisma db seed 2>&1 || echo "ℹ️  Seed não executado (banco já populado ou seed não configurado)"
else
  echo "⚠️  DATABASE_URL não configurado - pulando migrações"
fi

# Iniciar Nginx (como root - necessário)
echo "🌐 Iniciando Nginx..."
nginx

# Iniciar Backend (TypeScript via tsx) como usuário node (segurança)
echo "⚙️  Iniciando Backend API..."
cd /app/backend
su node -s /bin/sh -c "npx tsx src/server.ts" &
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
