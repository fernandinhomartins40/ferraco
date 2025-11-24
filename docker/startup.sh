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

# Limpar locks do Chromium (corrige problema de QR code após migração)
echo "🧹 Limpando locks do Chromium..."
find /app/sessions -name 'SingletonLock' -delete 2>/dev/null || true
find /app/sessions -name 'SingletonSocket' -delete 2>/dev/null || true
find /app/sessions -name 'SingletonCookie' -delete 2>/dev/null || true
echo "✅ Locks do Chromium removidos"

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
  # Extrai host, porta, user, password e database do DATABASE_URL
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

  # Verifica se já existe algum usuário antes de fazer seed
  USER_COUNT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -c "SELECT COUNT(*) FROM users;" 2>/dev/null | tr -d ' ' || echo "0")
  echo "ℹ️  Usuários encontrados no banco: $USER_COUNT"

  if [ "$USER_COUNT" = "0" ] || [ -z "$USER_COUNT" ]; then
    echo "📝 Banco vazio - executando seed..."
    if npx prisma db seed 2>&1; then
      echo "✅ Seed executado com sucesso!"
      echo ""
      echo "========================================="
      echo "🔑 CREDENCIAIS DE ACESSO CRIADAS:"
      echo "========================================="
      echo "👨‍💼 Admin:      admin@ferraco.com / Admin@123456"
      echo "👨‍💼 Manager:    manager@ferraco.com / User@123456"
      echo "👨‍💼 Vendedor:   vendedor@ferraco.com / User@123456"
      echo "👨‍💼 Consultor:  consultor@ferraco.com / User@123456"
      echo "👨‍💼 Suporte:    suporte@ferraco.com / User@123456"
      echo "========================================="
      echo ""
    else
      echo "❌ ERRO: Falha ao executar seed!"
      echo "⚠️  O sistema pode não ter usuários criados!"
      exit 1
    fi
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
