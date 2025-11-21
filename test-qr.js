const wppconnect = require('@wppconnect-team/wppconnect');

console.log('🚀 Testando geração de QR Code...');

wppconnect.create(
  'test-session',
  (base64Qr) => {
    console.log('📱 QR Code recebido!');
    console.log('📏 Tamanho:', Math.round(base64Qr.length / 1024), 'KB');
    console.log('🔍 Formato:', base64Qr.substring(0, 50) + '...');
    process.exit(0);
  },
  (statusSession) => {
    console.log('📊 Status:', statusSession);
  },
  {
    headless: true,
    logQR: true, // Log QR no console para teste
    folderNameToken: './test-sessions',
    puppeteerOptions: {
      args: [
        '--no-sandbox',
        '--disable-setuid-sandbox',
        '--disable-dev-shm-usage',
      ],
    },
  }
).then(() => {
  console.log('✅ Cliente criado');
}).catch((error) => {
  console.error('❌ Erro:', error);
  process.exit(1);
});
