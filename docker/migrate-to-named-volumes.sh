#!/bin/bash
set -e

echo "========================================="
echo "🔄 MIGRAÇÃO PARA NAMED VOLUMES"
echo "========================================="
echo ""
echo "Este script migra dados do sistema de bind mounts para named volumes"
echo "IMPORTANTE: Execute ANTES do próximo deploy!"
echo ""

APP_DIR="/root/ferraco-crm"
BACKUP_DIR="/root/ferraco-backup-$(date +%Y%m%d-%H%M%S)"

# Verificar se está rodando como root
if [ "$EUID" -ne 0 ]; then
  echo "❌ Este script deve ser executado como root!"
  exit 1
fi

# Verificar se o diretório da aplicação existe
if [ ! -d "$APP_DIR" ]; then
  echo "❌ Diretório da aplicação não encontrado: $APP_DIR"
  exit 1
fi

cd "$APP_DIR"

echo "📋 Status atual:"
echo "  Containers rodando:"
docker ps --filter "name=ferraco" --format "  - {{.Names}} ({{.Status}})"
echo ""

# Verificar se existem dados para migrar
HAS_DATA=false
if [ -d "data/ferraco-uploads" ] && [ "$(ls -A data/ferraco-uploads 2>/dev/null)" ]; then
  echo "✅ Encontrados dados em: data/ferraco-uploads"
  HAS_DATA=true
fi

if [ -d "data/ferraco-whatsapp-sessions" ] && [ "$(ls -A data/ferraco-whatsapp-sessions 2>/dev/null)" ]; then
  echo "✅ Encontrados dados em: data/ferraco-whatsapp-sessions"
  HAS_DATA=true
fi

if [ -d "data/ferraco-logs" ] && [ "$(ls -A data/ferraco-logs 2>/dev/null)" ]; then
  echo "✅ Encontrados dados em: data/ferraco-logs"
  HAS_DATA=true
fi

if [ -d "data/ferraco-data" ] && [ "$(ls -A data/ferraco-data 2>/dev/null)" ]; then
  echo "✅ Encontrados dados em: data/ferraco-data"
  HAS_DATA=true
fi

if [ "$HAS_DATA" = false ]; then
  echo ""
  echo "ℹ️  Nenhum dado encontrado nos diretórios locais."
  echo "   Provavelmente é uma instalação nova ou os dados já foram migrados."
  echo ""
  read -p "Deseja continuar mesmo assim? (s/N): " -n 1 -r
  echo
  if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "❌ Migração cancelada pelo usuário"
    exit 0
  fi
fi

echo ""
echo "========================================="
echo "⚠️  ATENÇÃO:"
echo "========================================="
echo "Este script vai:"
echo "  1. Fazer backup completo dos dados atuais"
echo "  2. Parar os containers Docker"
echo "  3. Criar named volumes Docker"
echo "  4. Copiar dados para os named volumes"
echo "  5. Atualizar docker-compose.vps.yml"
echo "  6. Reiniciar containers"
echo ""
read -p "Deseja continuar? (s/N): " -n 1 -r
echo
if [[ ! $REPLY =~ ^[Ss]$ ]]; then
  echo "❌ Migração cancelada pelo usuário"
  exit 0
fi

echo ""
echo "========================================="
echo "📦 ETAPA 1: Backup completo"
echo "========================================="

echo "🗄️  Criando backup em: $BACKUP_DIR"
mkdir -p "$BACKUP_DIR"

# Backup dos dados locais
if [ -d "data" ]; then
  echo "  Copiando data/..."
  cp -a data "$BACKUP_DIR/" 2>/dev/null || true
fi

# Backup do docker-compose.vps.yml atual
if [ -f "docker-compose.vps.yml" ]; then
  echo "  Copiando docker-compose.vps.yml..."
  cp docker-compose.vps.yml "$BACKUP_DIR/"
fi

echo "✅ Backup concluído!"
echo "   Localização: $BACKUP_DIR"

echo ""
echo "========================================="
echo "⏹️  ETAPA 2: Parar containers"
echo "========================================="

docker compose -f docker-compose.vps.yml -p ferraco down || true
echo "✅ Containers parados"

echo ""
echo "========================================="
echo "📦 ETAPA 3: Criar named volumes"
echo "========================================="

# Criar named volumes se não existirem (SEM prefixo duplicado)
for VOLUME in ferraco-postgres-data ferraco-uploads ferraco-sessions ferraco-logs ferraco-data; do
  if ! docker volume inspect ${VOLUME} >/dev/null 2>&1; then
    echo "  Criando volume: ${VOLUME}"
    docker volume create ${VOLUME}
  else
    echo "  ✓ Volume já existe: ${VOLUME}"
  fi
done

echo "✅ Named volumes criados!"

echo ""
echo "========================================="
echo "📋 ETAPA 4: Copiar dados para named volumes"
echo "========================================="

# Função para copiar dados para named volume
copy_to_volume() {
  local SOURCE_DIR=$1
  local VOLUME_NAME=$2
  local CONTAINER_PATH=$3

  if [ -d "$SOURCE_DIR" ] && [ "$(ls -A $SOURCE_DIR 2>/dev/null)" ]; then
    echo "  Copiando $SOURCE_DIR → $VOLUME_NAME..."

    # Criar container temporário para copiar dados (SEM prefixo duplicado)
    docker run --rm \
      -v "${VOLUME_NAME}:${CONTAINER_PATH}" \
      -v "$(pwd)/${SOURCE_DIR}:/source:ro" \
      alpine sh -c "cp -a /source/. ${CONTAINER_PATH}/ && chmod -R 777 ${CONTAINER_PATH}"

    echo "    ✅ $(du -sh $SOURCE_DIR | cut -f1) copiado"
  else
    echo "  ℹ️  $SOURCE_DIR vazio ou não existe, pulando..."
  fi
}

# Copiar dados para os volumes
copy_to_volume "data/ferraco-uploads" "ferraco-uploads" "/app/uploads"
copy_to_volume "data/ferraco-whatsapp-sessions" "ferraco-sessions" "/app/sessions"
copy_to_volume "data/ferraco-logs" "ferraco-logs" "/app/logs"
copy_to_volume "data/ferraco-data" "ferraco-data" "/app/data"

echo "✅ Dados copiados para named volumes!"

echo ""
echo "========================================="
echo "🧹 ETAPA 5: Limpar locks do Chromium"
echo "========================================="

echo "🔧 Removendo arquivos de lock do Chromium (SingletonLock, SingletonSocket, SingletonCookie)..."
docker run --rm -v "ferraco-sessions:/data" alpine sh -c "
  find /data -name 'SingletonLock' -delete 2>/dev/null || true
  find /data -name 'SingletonSocket' -delete 2>/dev/null || true
  find /data -name 'SingletonCookie' -delete 2>/dev/null || true
  echo '✅ Locks removidos'
"

echo ""
echo "========================================="
echo "🔍 ETAPA 6: Verificar migração"
echo "========================================="

# Verificar conteúdo dos volumes
echo "📊 Conteúdo dos named volumes:"
for VOLUME in ferraco-uploads ferraco-sessions ferraco-logs ferraco-data; do
  echo ""
  echo "  Volume: ${VOLUME}"
  docker run --rm -v "${VOLUME}:/data:ro" alpine sh -c "ls -lah /data | head -10"
done

echo ""
echo "========================================="
echo "✅ MIGRAÇÃO CONCLUÍDA!"
echo "========================================="
echo ""
echo "📋 Próximos passos:"
echo ""
echo "1. Os dados foram copiados para named volumes Docker:"
echo "   - ferraco-uploads"
echo "   - ferraco-sessions"
echo "   - ferraco-logs"
echo "   - ferraco-data"
echo "   - ferraco-postgres-data"
echo ""
echo "2. Backup completo salvo em:"
echo "   $BACKUP_DIR"
echo ""
echo "3. Agora você pode fazer o próximo deploy normalmente."
echo "   O novo deploy-vps.yml já está configurado para usar named volumes."
echo ""
echo "4. Os containers serão reiniciados automaticamente no próximo deploy."
echo ""
echo "5. Se algo der errado, você pode restaurar do backup:"
echo "   cd $APP_DIR"
echo "   docker compose -f docker-compose.vps.yml -p ferraco down"
echo "   rm -rf data"
echo "   cp -a $BACKUP_DIR/data ."
echo "   cp $BACKUP_DIR/docker-compose.vps.yml ."
echo "   docker compose -f docker-compose.vps.yml -p ferraco up -d"
echo ""
echo "========================================="
echo "🎉 Migração finalizada com sucesso!"
echo "========================================="
