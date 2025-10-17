# 🚨 AÇÃO IMEDIATA: WhatsApp Version Auto-Update

**Status:** CRÍTICO - Requer implementação urgente
**Motivo:** WhatsApp Web atualiza a cada 30 minutos
**Impacto:** Sistema pode ficar inoperante 48x por dia

---

## PLANO DE AÇÃO (Executar AGORA)

### ✅ OPÇÃO 1: Evolution API v2.3.1+ (15 minutos - TENTAR PRIMEIRO)

**Vantagem:** Atualização 100% automática (nativa do Evolution API)

#### Comandos para executar na VPS:

```bash
# 1. Conectar na VPS
ssh root@72.60.10.108

# 2. Ir para diretório da aplicação
cd /root/ferraco-crm

# 3. Fazer backup
cp docker-compose.vps.yml docker-compose.vps.yml.backup-before-v2.3.1
docker run --rm -v ferraco_evolution-instances:/data -v /root/backups:/backup alpine tar czf /backup/evolution-instances-$(date +%Y%m%d-%H%M%S).tar.gz -C /data .

# 4. Editar docker-compose.vps.yml
nano docker-compose.vps.yml

# Encontrar linha:
#   image: atendai/evolution-api:v2.1.1
# Mudar para:
#   image: atendai/evolution-api:v2.3.1

# Encontrar linha:
#   - CONFIG_SESSION_PHONE_VERSION=2.3000.1028569044
# DELETAR essa linha completamente (comentar com # ou remover)

# Salvar: Ctrl+O, Enter, Ctrl+X

# 5. Parar e remover container antigo
docker stop ferraco-evolution
docker rm ferraco-evolution

# 6. Pull nova imagem
docker pull atendai/evolution-api:v2.3.1

# 7. Recriar container com nova versão
docker compose -f docker-compose.vps.yml up -d evolution-api

# 8. Aguardar 30 segundos
sleep 30

# 9. Verificar logs
docker logs ferraco-evolution --tail 50

# Procurar por linhas indicando detecção automática de versão:
# "Baileys version" ou "WhatsApp version"

# 10. Testar no navegador
# Acesse: https://metalurgicaferraco.com/admin/whatsapp
# Vá em "Configurações"
# Clique "Gerar Novo QR Code"
# Deve aparecer em 10-15 segundos
```

#### ✅ Se funcionou:
- **PARAR AQUI** - Problema resolvido permanentemente!
- Evolution API vai atualizar versão automaticamente
- Zero manutenção futura

#### ❌ Se NÃO funcionou (QR Code não aparece):
- Fazer rollback:
```bash
cp docker-compose.vps.yml.backup-before-v2.3.1 docker-compose.vps.yml
docker compose -f docker-compose.vps.yml restart evolution-api
```
- Seguir para OPÇÃO 2

---

### 🔧 OPÇÃO 2: Script Autônomo (30 minutos - SE OPÇÃO 1 FALHAR)

**Vantagem:** Funciona com qualquer versão Evolution API

#### Comandos para executar na VPS:

```bash
# 1. Conectar na VPS
ssh root@72.60.10.108

# 2. Ir para diretório
cd /root/ferraco-crm

# 3. Criar diretórios
mkdir -p scripts logs

# 4. Instalar Chromium (necessário para Puppeteer)
apt-get update
apt-get install -y chromium-browser

# 5. Instalar Puppeteer globalmente
npm install -g puppeteer

# 6. Criar script de atualização
cat > scripts/update-whatsapp-version.js << 'SCRIPT_EOF'
#!/usr/bin/env node
const puppeteer = require('puppeteer');
const fs = require('fs').promises;
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const CONFIG = {
  WHATSAPP_URL: 'https://web.whatsapp.com/',
  DOCKER_COMPOSE_PATH: '/root/ferraco-crm/docker-compose.vps.yml',
  CONTAINER_NAME: 'ferraco-evolution',
  LOG_FILE: '/root/ferraco-crm/logs/whatsapp-version-update.log',
  MAX_RETRIES: 3,
  RETRY_DELAY: 5000,
};

function log(message, level = 'INFO') {
  const timestamp = new Date().toISOString();
  const logMessage = `[${timestamp}] [${level}] ${message}`;
  console.log(logMessage);
  fs.appendFile(CONFIG.LOG_FILE, logMessage + '\n').catch(console.error);
}

async function fetchWhatsAppVersion() {
  let browser;
  try {
    log('Extraindo versão do WhatsApp Web...');
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
      executablePath: '/usr/bin/chromium-browser',
    });

    const page = await browser.newPage();
    await page.goto(CONFIG.WHATSAPP_URL, { waitUntil: 'domcontentloaded', timeout: 30000 });

    await page.waitForFunction(() => window.Debug && window.Debug.VERSION, { timeout: 15000 });

    const version = await page.evaluate(() => window.Debug.VERSION);

    if (!version || typeof version !== 'string') {
      throw new Error('Versão não encontrada');
    }

    log(`✅ Versão extraída: ${version}`);
    return version;

  } catch (error) {
    log(`❌ Erro ao extrair versão: ${error.message}`, 'ERROR');
    throw error;
  } finally {
    if (browser) await browser.close();
  }
}

async function getCurrentVersion() {
  const content = await fs.readFile(CONFIG.DOCKER_COMPOSE_PATH, 'utf8');
  const match = content.match(/CONFIG_SESSION_PHONE_VERSION=([0-9.]+)/);
  if (!match) throw new Error('CONFIG_SESSION_PHONE_VERSION não encontrado');
  return match[1];
}

async function updateDockerCompose(newVersion) {
  const content = await fs.readFile(CONFIG.DOCKER_COMPOSE_PATH, 'utf8');
  await fs.writeFile(`${CONFIG.DOCKER_COMPOSE_PATH}.backup`, content, 'utf8');

  const updatedContent = content.replace(
    /CONFIG_SESSION_PHONE_VERSION=[0-9.]+/,
    `CONFIG_SESSION_PHONE_VERSION=${newVersion}`
  );

  await fs.writeFile(CONFIG.DOCKER_COMPOSE_PATH, updatedContent, 'utf8');
  log(`✅ docker-compose atualizado: ${newVersion}`);
}

async function restartEvolutionContainer() {
  log('Reiniciando container Evolution API...');

  await execPromise(`docker stop ${CONFIG.CONTAINER_NAME}`);
  await execPromise(`docker rm ${CONFIG.CONTAINER_NAME}`);
  await execPromise(`cd /root/ferraco-crm && docker compose -f docker-compose.vps.yml up -d evolution-api`);

  log('✅ Container reiniciado');
  await new Promise(resolve => setTimeout(resolve, 30000));

  const { stdout } = await execPromise(`docker ps --filter name=${CONFIG.CONTAINER_NAME} --format "{{.Status}}"`);
  if (!stdout.includes('Up')) throw new Error('Container não está rodando');

  log(`✅ Container status: ${stdout.trim()}`);
}

async function main() {
  log('========================================');
  log('ATUALIZAÇÃO AUTOMÁTICA WHATSAPP VERSION');
  log('========================================');

  let retries = 0;

  while (retries < CONFIG.MAX_RETRIES) {
    try {
      const latestVersion = await fetchWhatsAppVersion();
      const currentVersion = await getCurrentVersion();

      log(`Versão atual: ${currentVersion}`);
      log(`Versão mais recente: ${latestVersion}`);

      if (latestVersion === currentVersion) {
        log('✅ Versão já está atualizada');
        process.exit(0);
      }

      log(`🔄 Atualizando ${currentVersion} → ${latestVersion}...`);

      await updateDockerCompose(latestVersion);
      await restartEvolutionContainer();

      log('========================================');
      log('✅ ATUALIZAÇÃO CONCLUÍDA COM SUCESSO!');
      log('========================================');
      process.exit(0);

    } catch (error) {
      retries++;
      log(`❌ Tentativa ${retries}/${CONFIG.MAX_RETRIES} falhou: ${error.message}`, 'ERROR');

      if (retries < CONFIG.MAX_RETRIES) {
        log(`⏳ Aguardando ${CONFIG.RETRY_DELAY/1000}s antes de tentar novamente...`);
        await new Promise(resolve => setTimeout(resolve, CONFIG.RETRY_DELAY));
      } else {
        log('❌ FALHA APÓS TODAS AS TENTATIVAS', 'ERROR');
        process.exit(1);
      }
    }
  }
}

main();
SCRIPT_EOF

# 7. Dar permissão de execução
chmod +x scripts/update-whatsapp-version.js

# 8. Testar manualmente
echo "Testando script..."
node scripts/update-whatsapp-version.js

# Se funcionou, verá logs indicando sucesso ou "versão já está atualizada"

# 9. Configurar cron job (executa a cada 15 minutos)
crontab -l > /tmp/crontab.backup 2>/dev/null || true
(crontab -l 2>/dev/null || true; echo "*/15 * * * * /usr/bin/node /root/ferraco-crm/scripts/update-whatsapp-version.js >> /root/ferraco-crm/logs/cron-whatsapp.log 2>&1") | crontab -

# 10. Verificar crontab
crontab -l

# Deve aparecer a linha:
# */15 * * * * /usr/bin/node /root/ferraco-crm/scripts/update-whatsapp-version.js >> /root/ferraco-crm/logs/cron-whatsapp.log 2>&1

# 11. Monitorar logs
echo "Aguardando 15 minutos para primeira execução automática..."
echo "Monitore os logs com:"
echo "  tail -f /root/ferraco-crm/logs/whatsapp-version-update.log"
echo "  tail -f /root/ferraco-crm/logs/cron-whatsapp.log"
```

#### ✅ Validação:
```bash
# Verificar que cron está executando
tail -f /root/ferraco-crm/logs/cron-whatsapp.log

# Verificar logs do script
tail -f /root/ferraco-crm/logs/whatsapp-version-update.log

# Verificar versão no docker-compose
grep CONFIG_SESSION_PHONE_VERSION /root/ferraco-crm/docker-compose.vps.yml
```

---

## 📊 MONITORAMENTO PÓS-IMPLEMENTAÇÃO

### Logs para acompanhar:

```bash
# Evolution API
docker logs ferraco-evolution -f

# Script de atualização
tail -f /root/ferraco-crm/logs/whatsapp-version-update.log

# Cron job
tail -f /root/ferraco-crm/logs/cron-whatsapp.log

# Verificar última atualização
ls -lh /root/ferraco-crm/logs/
```

### Health check diário:

```bash
# Verificar container rodando
docker ps | grep ferraco-evolution

# Verificar cron ativo
crontab -l | grep update-whatsapp-version

# Verificar última execução do cron
ls -lh /root/ferraco-crm/logs/cron-whatsapp.log
```

---

## 🆘 TROUBLESHOOTING

### Problema: QR Code não aparece após OPÇÃO 1

**Solução:** Fazer rollback e usar OPÇÃO 2
```bash
cp docker-compose.vps.yml.backup-before-v2.3.1 docker-compose.vps.yml
docker compose -f docker-compose.vps.yml restart evolution-api
```

### Problema: Script falha ao extrair versão (OPÇÃO 2)

**Possível causa:** Chromium não instalado ou Puppeteer com erro

**Solução:**
```bash
# Reinstalar Chromium
apt-get update
apt-get install --reinstall -y chromium-browser

# Reinstalar Puppeteer
npm uninstall -g puppeteer
npm install -g puppeteer

# Testar novamente
node /root/ferraco-crm/scripts/update-whatsapp-version.js
```

### Problema: Cron não está executando (OPÇÃO 2)

**Verificar:**
```bash
# Ver status do cron
systemctl status cron

# Reiniciar cron se necessário
systemctl restart cron

# Verificar logs do sistema
grep CRON /var/log/syslog | tail -20
```

---

## ✅ SUCESSO!

**Após implementação bem-sucedida:**

1. ✅ WhatsApp se reconecta automaticamente a cada 30 minutos
2. ✅ QR Code é gerado sempre que necessário
3. ✅ Automações funcionam 24/7 sem interrupção
4. ✅ Zero intervenção manual necessária
5. ✅ Sistema resiliente e profissional

**Tempo total de implementação:**
- OPÇÃO 1: ~15 minutos
- OPÇÃO 2: ~30 minutos

**Manutenção futura:**
- OPÇÃO 1: Zero
- OPÇÃO 2: Verificar logs semanalmente

---

**Próximos passos após sucesso:**
1. Documentar em README.md
2. Commit das mudanças no GitHub
3. Monitorar por 48 horas
4. Marcar issue como resolvida

**Autor:** Claude (Anthropic)
**Data:** 2025-10-17
**Prioridade:** 🚨 CRÍTICA
