/**
 * Script de Teste: Geração de QR Code WPPConnect
 *
 * Testa se o QR Code é gerado corretamente após os fixes:
 * - Timeout zerado (qrTimeout: 0, deviceSyncTimeout: 0)
 * - Versão atualizada do WPPConnect
 * - Dependências Docker completas
 *
 * USO:
 * node apps/backend/test-qr-generation.js
 */

const wppconnect = require('@wppconnect-team/wppconnect');
const path = require('path');
const fs = require('fs');

// Criar diretório de sessões de teste
const testSessionsPath = path.join(__dirname, 'test-sessions');
if (!fs.existsSync(testSessionsPath)) {
  fs.mkdirSync(testSessionsPath, { recursive: true });
}

console.log('🧪 ========================================');
console.log('🧪 TESTE: Geração de QR Code WPPConnect');
console.log('🧪 ========================================\n');

let qrAttempts = 0;
let startTime = Date.now();

wppconnect.create(
  'test-session',
  // QR Code Callback
  (base64Qr, asciiQR, attempt, urlCode) => {
    qrAttempts++;
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log(`\n📱 ========================================`);
    console.log(`📱 QR CODE GERADO! (Tentativa ${attempt})`);
    console.log(`📱 ========================================`);
    console.log(`⏱️  Tempo decorrido: ${elapsed}s`);
    console.log(`📏 Tamanho: ${Math.round(base64Qr.length / 1024)}KB`);
    console.log(`✅ Formato válido: ${base64Qr.startsWith('data:image/') ? 'SIM' : 'NÃO'}`);

    if (urlCode) {
      console.log(`🔗 URL Code: ${urlCode.substring(0, 50)}...`);
    }

    console.log(`\n✅ TESTE PASSOU! QR Code gerado com sucesso.`);
    console.log(`\n💡 ESCANEIE O QR CODE NO SEU CELULAR:`);
    console.log(asciiQR);

    console.log(`\n⏳ Aguardando escaneamento...`);
  },
  // Status Callback
  (statusSession, session) => {
    const elapsed = ((Date.now() - startTime) / 1000).toFixed(2);
    console.log(`[${elapsed}s] 📊 Status: ${statusSession}`);

    if (statusSession === 'qrReadSuccess') {
      console.log(`\n✅ ========================================`);
      console.log(`✅ QR CODE ESCANEADO COM SUCESSO!`);
      console.log(`✅ ========================================`);
      console.log(`⏱️  Tempo total: ${elapsed}s`);
      console.log(`📱 Tentativas de QR: ${qrAttempts}`);

      setTimeout(() => {
        console.log(`\n🧹 Limpando sessão de teste...`);
        process.exit(0);
      }, 5000);
    }

    if (statusSession === 'inChat' || statusSession === 'isLogged') {
      console.log(`\n✅ ========================================`);
      console.log(`✅ CONECTADO COM SUCESSO!`);
      console.log(`✅ ========================================`);
      console.log(`⏱️  Tempo total: ${elapsed}s`);
      console.log(`📱 Tentativas de QR: ${qrAttempts}`);

      setTimeout(() => {
        console.log(`\n🧹 Limpando sessão de teste...`);
        process.exit(0);
      }, 5000);
    }
  },
  undefined, // onLoadingScreen
  undefined, // catchLinkCode
  {
    // ✅ CONFIGURAÇÃO DE TESTE (mesma do production)
    headless: 'new',
    devtools: false,
    debug: true, // ✅ Habilitar debug para ver logs detalhados
    disableWelcome: true,
    updatesLog: true,

    // ✅ CRITICAL FIX: Timeouts zerados
    autoClose: 0,
    qrTimeout: 0,
    deviceSyncTimeout: 0,

    // Persistência
    folderNameToken: testSessionsPath,
    mkdirFolderToken: '',

    // QR Code
    logQR: true, // ✅ Exibir QR no console para debug

    // Puppeteer
    puppeteerOptions: {
      headless: 'new',
      timeout: 60000,
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
        '--disable-gpu',
        '--disable-software-rasterizer',
        '--disable-accelerated-2d-canvas',
        '--no-first-run',
        '--no-zygote',
        '--disable-extensions',
        '--disable-background-networking',
        '--disable-background-timer-throttling',
        '--disable-backgrounding-occluded-windows',
        '--disable-renderer-backgrounding',
        '--disable-features=TranslateUI',
        '--disable-ipc-flooding-protection',
        '--window-size=1920,1080',
      ],
    },
  }
).then(client => {
  console.log(`\n✅ Cliente WPPConnect criado com sucesso!`);
  console.log(`📦 Versão WPPConnect: ${require('@wppconnect-team/wppconnect/package.json').version}`);
}).catch(error => {
  console.error(`\n❌ ========================================`);
  console.error(`❌ ERRO AO CRIAR CLIENTE WPPCONNECT`);
  console.error(`❌ ========================================`);
  console.error(error);
  process.exit(1);
});

// Timeout de segurança (5 minutos)
setTimeout(() => {
  console.log(`\n⏱️  Timeout de 5 minutos atingido. Encerrando teste.`);
  console.log(`📊 Resultado: ${qrAttempts > 0 ? '✅ QR Code gerado' : '❌ QR Code NÃO gerado'}`);
  process.exit(qrAttempts > 0 ? 0 : 1);
}, 5 * 60 * 1000);

console.log(`\n⏳ Aguardando geração de QR Code...`);
console.log(`⏱️  Timeout configurado: Ilimitado (qrTimeout: 0)`);
console.log(`📦 Sessão: test-session`);
console.log(`📁 Diretório: ${testSessionsPath}\n`);
