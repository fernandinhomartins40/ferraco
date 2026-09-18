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
mkdir -p /app/data /app/logs
# T-09 (F-56): o backend roda como `node` e passou a escrever em /app/logs
# (antes gravava em ./logs relativo ao CWD, fora do volume). Sem este chown,
# o diretório ficaria de root com 755 e o winston falharia ao abrir os arquivos.
chown -R node:node /app/data /app/logs
chmod 750 /app/data /app/logs

# VOLUMES DOCKER (montados automaticamente pelo Docker)
# Apenas garantir permissões se já existirem
echo "🔍 Verificando volumes Docker..."
# T-06 (F-61): era `chmod 777` — permissão de escrita para qualquer processo
# do container. O backend roda como `node`, então 750 (dono node, grupo node)
# é suficiente: o dono escreve, o grupo lê, e mais ninguém acessa.
if [ -d "/app/uploads" ]; then
  echo "  ✅ /app/uploads detectado (volume Docker)"
  chown -R node:node /app/uploads
  chmod 750 /app/uploads
else
  echo "  ⚠️  /app/uploads NÃO encontrado - criando diretório temporário"
  mkdir -p /app/uploads
  chown -R node:node /app/uploads
  chmod 750 /app/uploads
fi

# T-06 (F-61): sessions guarda as credenciais da sessão de WhatsApp — quem lê
# esse diretório assume a conta. 750 em vez de 777.
if [ -d "/app/sessions" ]; then
  echo "  ✅ /app/sessions detectado (volume Docker)"
  chown -R node:node /app/sessions
  chmod 750 /app/sessions
else
  echo "  ⚠️  /app/sessions NÃO encontrado - criando diretório temporário"
  mkdir -p /app/sessions
  chown -R node:node /app/sessions
  chmod 750 /app/sessions
fi
echo "✅ Diretórios e volumes configurados"

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

  # Extrai host, porta, user, password e database do DATABASE_URL.
  # T-14: movido para ANTES das migrations — a verificação de integridade de
  # `_prisma_migrations` precisa dessas variáveis, e antes elas só eram
  # definidas mais adiante, no bloco do seed.
  DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/\([^:]*\):.*/\1/p')
  DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
  DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
  DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
  DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')

  # Executar migrations pendentes (SEGURO - não perde dados)
  echo "📊 Aplicando migrations pendentes..."
  # T-14 (F-75): o fallback `db push` foi REMOVIDO.
  #
  # Antes, uma migration falha caía em `db push --skip-generate` e o boot
  # continuava — o deploy era reportado como sucesso com o schema divergente
  # do histórico de migrations. Foi exatamente isso que mascarou F-100
  # (migration inserindo em colunas inexistentes) por tempo indeterminado.
  #
  # Agora migration falha ABORTA o boot. Um deploy quebrado deve falhar, não
  # passar silenciosamente.
  if ! npx prisma migrate deploy 2>&1; then
    echo ""
    echo "========================================="
    echo "❌ ERRO: falha ao aplicar migrations"
    echo "========================================="
    echo "   O boot foi abortado de propósito."
    echo "   Um schema divergente causa falhas difíceis de diagnosticar."
    echo "   Verifique '_prisma_migrations' e resolva antes de novo deploy."
    echo "========================================="
    exit 1
  fi

  # T-14: verificar que nenhuma migration ficou incompleta ou revertida.
  # `migrate deploy` pode retornar 0 e ainda assim haver registro problemático.
  if command -v psql >/dev/null 2>&1; then
    # A consulta conta migrations SEM NENHUMA aplicação bem-sucedida.
    #
    # A versão anterior contava qualquer linha com `rolled_back_at`, o que
    # produzia falso positivo: o Prisma NÃO apaga a tentativa falha ao
    # reaplicar uma migration — ele grava uma linha nova. Uma migration que
    # falhou, foi marcada como revertida e depois aplicou com sucesso deixa
    # DUAS linhas, e a antiga fazia o boot abortar com o schema correto.
    #
    # Isso aconteceu de verdade ao restaurar o dump de 07/09, que trazia o
    # histórico da falha da F-100. Agrupar por nome e exigir que exista ao
    # menos um `finished_at` distingue "nunca aplicou" de "aplicou depois".
    MIGR_RUIM=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A \
      -c "SELECT COUNT(*) FROM (
            SELECT migration_name
            FROM _prisma_migrations
            GROUP BY migration_name
            HAVING COUNT(*) FILTER (WHERE finished_at IS NOT NULL
                                      AND rolled_back_at IS NULL) = 0
          ) AS sem_aplicacao_valida;" 2>/dev/null | tr -d ' ')
    case "$MIGR_RUIM" in
      ''|*[!0-9]*)
        echo "⚠️  Não foi possível verificar _prisma_migrations — seguindo."
        ;;
      0)
        echo "✅ Migrations íntegras (nenhuma incompleta ou revertida)"
        ;;
      *)
        echo "❌ ERRO: $MIGR_RUIM migration(s) incompleta(s) ou revertida(s)."
        echo "⚠️  Abortando: o schema não corresponde ao histórico."
        exit 1
        ;;
    esac
  fi

  # Seed do banco (apenas se estiver vazio)
  echo "🌱 Verificando se precisa popular banco de dados..."

  # T-01: verificação de banco vazio antes do seed.
  # O fallback anterior era `|| echo "0"` — falha ABERTA: qualquer erro do psql
  # (indisponível, rede, credencial) virava "banco vazio" e disparava um seed
  # destrutivo. Agora a dúvida faz PULAR o seed, nunca executá-lo. O boot segue
  # normalmente: pular o seed é seguro tanto com banco vazio quanto populado.
  SEED_SAFE="no"
  USER_COUNT=""

  if ! command -v psql >/dev/null 2>&1; then
    echo "⚠️  psql indisponível — impossível confirmar se o banco está vazio."
    echo "ℹ️  Seed será PULADO (comportamento seguro)."
  elif ! PSQL_OUT=$(PGPASSWORD="$DB_PASS" psql -h "$DB_HOST" -p "$DB_PORT" -U "$DB_USER" -d "$DB_NAME" -t -A -c "SELECT COUNT(*) FROM users;" 2>&1); then
    # Tabela ausente é estado legítimo de banco recém-criado.
    if echo "$PSQL_OUT" | grep -qi 'relation .* does not exist'; then
      echo "ℹ️  Tabela 'users' ainda não existe — banco novo."
      SEED_SAFE="yes"
      USER_COUNT="0"
    else
      echo "⚠️  Falha ao consultar o banco: $PSQL_OUT"
      echo "ℹ️  Seed será PULADO (comportamento seguro)."
    fi
  else
    USER_COUNT=$(echo "$PSQL_OUT" | tr -d ' ')
    case "$USER_COUNT" in
      ''|*[!0-9]*)
        echo "⚠️  Contagem inconclusiva ('$USER_COUNT') — seed será PULADO."
        ;;
      *)
        echo "ℹ️  Usuários encontrados no banco: $USER_COUNT"
        SEED_SAFE="yes"
        ;;
    esac
  fi

  if [ "$SEED_SAFE" = "yes" ] && [ "$USER_COUNT" = "0" ]; then
    echo "📝 Banco vazio - executando seed..."
    if npx prisma db seed 2>&1; then
      # T-01: credenciais NÃO são mais impressas no log do container.
      # Ficavam legíveis para qualquer um com `docker logs` e persistiam no
      # json-file. Os usuários e senhas padrão estão em prisma/seed.ts.
      echo "✅ Seed executado com sucesso!"
      echo "🔑 Usuários padrão criados — consulte prisma/seed.ts."
      echo "⚠️  Troque as senhas padrão no primeiro acesso."
    else
      echo "❌ ERRO: Falha ao executar seed!"
      echo "⚠️  O sistema pode não ter usuários criados!"
      exit 1
    fi
  elif [ "$SEED_SAFE" = "yes" ]; then
    echo "✅ Banco já populado ($USER_COUNT usuários) - pulando seed"
  else
    echo "⏭️  Seed pulado — estado do banco não pôde ser confirmado."
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
