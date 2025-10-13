#!/bin/sh
set -e

echo "========================================="
echo "🚀 Ferraco CRM - Iniciando Aplicação"
echo "========================================="
echo "📦 Ambiente: $NODE_ENV"
echo "🐳 Porta: $PORT"
echo "========================================="

# Criar diretório de uploads se não existir
echo "📁 Criando diretório de uploads..."
mkdir -p /app/uploads
chmod 755 /app/uploads
echo "✅ Diretório de uploads criado"

# Criar diretórios necessários
mkdir -p /app/data /app/logs

# Migrar banco de dados (Prisma) - pular se DATABASE_URL não estiver configurado
if [ -n "$DATABASE_URL" ]; then
  echo "📊 Criando/Atualizando estrutura do banco de dados..."
  cd /app/backend

  # Executar migrations pendentes (SEGURO - não perde dados)
  echo "📊 Aplicando migrations pendentes..."
  npx prisma migrate deploy 2>&1 || {
    echo "⚠️  Aviso: Erro ao aplicar migrations"
    echo "ℹ️  Se o banco está vazio, executando db push..."
    npx prisma db push --skip-generate 2>&1 || echo "⚠️  Aviso: Falha ao criar tabelas"
  }

  # Seed do banco (apenas se estiver vazio)
  echo "🌱 Verificando se precisa popular banco de dados..."
  # Verifica se já existe algum usuário antes de fazer seed
  USER_COUNT=$(echo "SELECT COUNT(*) as count FROM users;" | npx prisma db execute --stdin 2>/dev/null | grep -oE '[0-9]+' | tail -1 || echo "0")
  if [ "$USER_COUNT" = "0" ]; then
    echo "📝 Banco vazio - executando seed..."
    npx prisma db seed 2>&1 || echo "⚠️  Aviso: Falha no seed"
  else
    echo "✅ Banco já populado ($USER_COUNT usuários) - pulando seed"
  fi
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
