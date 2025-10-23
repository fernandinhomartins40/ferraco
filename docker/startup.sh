#!/bin/sh
set -e

echo "========================================="
echo "🚀 Ferraco CRM - Iniciando Aplicação"
echo "========================================="
echo "📦 Ambiente: $NODE_ENV"
echo "🐳 Porta: $PORT"
echo "========================================="

# Criar diretórios necessários com permissões corretas
echo "📁 Criando diretórios necessários..."
mkdir -p /app/uploads /app/data /app/logs /app/sessions
chmod 755 /app/data /app/logs
chmod 777 /app/uploads /app/sessions
chown -R node:node /app/uploads /app/sessions
echo "✅ Diretórios criados com permissões corretas"

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

# Iniciar Backend (código compilado) como usuário node (segurança)
echo "⚙️  Iniciando Backend API..."
cd /app/backend

# Verificar se existe build compilado (dist/)
if [ -d "dist" ] && [ -f "dist/server.js" ]; then
  echo "✅ Usando código compilado (dist/server.js)"
  su node -s /bin/sh -c "node dist/server.js" &
else
  echo "⚠️  Build não encontrado, usando tsx (modo desenvolvimento)"
  su node -s /bin/sh -c "npx tsx src/server.ts" &
fi

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
