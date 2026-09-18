#!/bin/bash
# =============================================================================
# T-12 · Rollback do Ferraco CRM (F-66, F-67, F-68)
# =============================================================================
# Antes desta tarefa, voltar a versao anterior era IMPOSSIVEL: a imagem era
# construida na VPS e so existia como `ferraco-crm:latest`. Um deploy ruim
# sobrescrevia o bom sem deixar copia — a unica saida era esperar um novo
# build, que levava ~16 min e podia falhar de novo.
#
# Agora cada commit publica uma imagem no GHCR marcada com o SHA. Voltar e
# baixar a tag anterior.
#
# USO (na VPS, como root):
#   ./rollback.sh                 lista as versoes disponiveis
#   ./rollback.sh <sha>           volta para aquele commit
#
# NAO toca no banco: o rollback troca o CODIGO, nao os dados. Se a versao
# com defeito aplicou uma migration, reverter a imagem NAO reverte o schema —
# leia a secao "MIGRATIONS" no fim deste arquivo antes de prosseguir.
# =============================================================================

set -euo pipefail

IMAGE_NAME="ghcr.io/fernandinhomartins40/ferraco-crm"
APP_DIR="/root/ferraco-crm"
COMPOSE_PROJECT="ferraco"
SHA_FILE="/root/ferraco-secrets/.last-deployed-sha"

if [ ! -f "$APP_DIR/docker-compose.vps.yml" ]; then
  echo "❌ $APP_DIR/docker-compose.vps.yml nao encontrado."
  echo "   Rode este script na VPS, com a aplicacao ja implantada."
  exit 1
fi

# --- Sem argumento: mostrar o que existe ------------------------------------
if [ $# -eq 0 ]; then
  echo "=== Versao em execucao ==="
  if [ -f "$SHA_FILE" ]; then
    echo "  SHA implantado: $(cat "$SHA_FILE")"
  else
    echo "  (desconhecido — $SHA_FILE ausente)"
  fi
  echo ""
  echo "=== Imagens do Ferraco locais ==="
  docker images "$IMAGE_NAME" --format '  {{.Tag}}\t{{.CreatedSince}}\t{{.Size}}' 2>/dev/null \
    | grep -v buildcache || echo "  (nenhuma)"
  echo ""
  echo "Para voltar:  $0 <sha>"
  echo "Tags do GHCR: https://github.com/fernandinhomartins40/ferraco-crm/pkgs/container/ferraco-crm"
  exit 0
fi

TARGET_SHA="$1"
TARGET_IMAGE="$IMAGE_NAME:$TARGET_SHA"

echo "=== ROLLBACK DO FERRACO CRM ==="
echo "Alvo: $TARGET_IMAGE"
echo ""

# --- Baixar ANTES de derrubar o que esta no ar ------------------------------
# Ordem deliberada: se o pull falhar (SHA errado, imagem expirada, GHCR fora),
# a aplicacao atual continua no ar. Derrubar primeiro deixaria o site fora
# durante uma falha que nem chegou a produzir substituto.
echo "📥 Baixando a imagem alvo..."
if ! docker pull "$TARGET_IMAGE"; then
  echo ""
  echo "❌ Nao foi possivel baixar $TARGET_IMAGE"
  echo "   A aplicacao atual NAO foi tocada e segue no ar."
  echo "   Verifique o SHA em: docker images $IMAGE_NAME"
  exit 1
fi

# --- Guardar de onde viemos -------------------------------------------------
PREVIOUS_SHA="$(cat "$SHA_FILE" 2>/dev/null || echo 'desconhecido')"
echo ""
echo "↩️  Voltando de: $PREVIOUS_SHA"
echo "               para: $TARGET_SHA"
echo ""

docker tag "$TARGET_IMAGE" ferraco-crm:latest

cd "$APP_DIR"

if [ ! -f /root/ferraco-secrets/.env ]; then
  echo "❌ /root/ferraco-secrets/.env ausente — o compose abortaria (T-35)."
  exit 1
fi
set -a; . /root/ferraco-secrets/.env; set +a

echo "🔄 Recriando o container..."
docker compose -f docker-compose.vps.yml -p "$COMPOSE_PROJECT" up -d --force-recreate ferraco-crm-vps

echo "$TARGET_SHA" > "$SHA_FILE"

# --- Confirmar que voltou de pe --------------------------------------------
echo ""
echo "⏳ Aguardando o healthcheck (ate 90s)..."
for i in $(seq 1 18); do
  if docker exec ferraco-crm-vps wget -q --spider http://127.0.0.1:3000/health 2>/dev/null; then
    echo "✅ Rollback concluido — aplicacao respondendo em $TARGET_SHA"
    exit 0
  fi
  sleep 5
done

# O /health consulta o banco (T-14), entao falha aqui e sinal real de problema.
echo "⚠️  A aplicacao nao respondeu em 90s."
echo "   Logs:  docker logs --tail 50 ferraco-crm-vps"
echo "   Voltar:  $0 $PREVIOUS_SHA"
exit 1

# =============================================================================
# MIGRATIONS — leia antes de reverter uma versao que mexeu no banco
# =============================================================================
# Este script troca a IMAGEM, nunca o SCHEMA. Se a versao com defeito rodou
# `prisma migrate deploy` e alterou tabelas, voltar o codigo deixa uma
# aplicacao antiga diante de um banco novo.
#
# Migration aditiva (coluna ou tabela nova): costuma ser inofensiva — o codigo
# antigo ignora o que nao conhece.
#
# Migration destrutiva (DROP/RENAME de coluna, mudanca de tipo): o codigo
# antigo quebra. Nesses casos, reverta tambem o schema, com o dump mais
# recente em maos — e so entao rode este script.
# =============================================================================
