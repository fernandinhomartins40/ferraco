/**
 * Script para criar arquivos PNG placeholder nos tamanhos corretos
 * O usuário pode depois editar/substituir esses arquivos com o design real
 *
 * Uso: node scripts/create-placeholder-pngs.cjs
 */

const fs = require('fs');
const path = require('path');

const publicDir = path.join(__dirname, '../public');

// PNG de 1x1 pixel transparente (menor PNG válido possível)
// Este é um PNG válido que pode ser redimensionado em editores de imagem
const minimalPNG = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, // IHDR chunk length
  0x49, 0x48, 0x44, 0x52, // IHDR
  0x00, 0x00, 0x00, 0x01, // width: 1
  0x00, 0x00, 0x00, 0x01, // height: 1
  0x08, 0x06, 0x00, 0x00, 0x00, // bit depth, color type, etc
  0x1F, 0x15, 0xC4, 0x89, // CRC
  0x00, 0x00, 0x00, 0x0A, // IDAT chunk length
  0x49, 0x44, 0x41, 0x54, // IDAT
  0x78, 0x9C, 0x63, 0x00, 0x01, 0x00, 0x00, 0x05, 0x00, 0x01, // compressed data
  0x0D, 0x0A, 0x2D, 0xB4, // CRC
  0x00, 0x00, 0x00, 0x00, // IEND chunk length
  0x49, 0x45, 0x4E, 0x44, // IEND
  0xAE, 0x42, 0x60, 0x82  // CRC
]);

// Tamanhos necessários para Windows PWA
const sizes = [
  { name: 'pwa-96x96.png', size: 96 },
  { name: 'pwa-144x144.png', size: 144 },
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'pwa-maskable-192x192.png', size: 192 },
  { name: 'pwa-maskable-512x512.png', size: 512 }
];

console.log('📱 Criando arquivos PNG placeholder...\n');

let created = 0;

for (const { name, size } of sizes) {
  const outputPath = path.join(publicDir, name);

  try {
    // Criar o arquivo PNG mínimo
    fs.writeFileSync(outputPath, minimalPNG);
    console.log(`✅ Criado: ${name} (${size}x${size})`);
    created++;
  } catch (error) {
    console.error(`❌ Erro ao criar ${name}:`, error.message);
  }
}

console.log('\n' + '='.repeat(60));
console.log(`✅ ${created} arquivos PNG criados com sucesso!\n`);

console.log('📝 Próximos passos:\n');
console.log('1. Abra o arquivo pwa-icon.svg em um editor (Photoshop, GIMP, Inkscape, etc.)');
console.log('2. Exporte/Salve como PNG nos seguintes tamanhos:');
console.log('   • pwa-96x96.png (96x96 pixels)');
console.log('   • pwa-144x144.png (144x144 pixels)');
console.log('   • pwa-192x192.png (192x192 pixels)');
console.log('   • pwa-512x512.png (512x512 pixels)');
console.log('   • pwa-maskable-192x192.png (192x192 pixels - com padding)');
console.log('   • pwa-maskable-512x512.png (512x512 pixels - com padding)');
console.log('\n3. Substitua os arquivos em apps/frontend/public/');
console.log('4. Execute "npm run build" e teste o PWA no Windows\n');

console.log('💡 Dica: Para ícones maskable, adicione 10% de padding em todos os lados');
console.log('   para garantir que o ícone não seja cortado em dispositivos Android\n');

console.log('🔧 Ferramentas online recomendadas:');
console.log('   • https://convertio.co/svg-png/ (conversão SVG→PNG)');
console.log('   • https://www.iloveimg.com/resize-image (redimensionar)');
console.log('   • https://realfavicongenerator.net/ (gerar todos os tamanhos)\n');
