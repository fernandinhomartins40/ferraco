/**
 * Script para gerar ícones PWA PNG a partir do SVG base
 * Requer: node-canvas ou conversão manual
 *
 * Para Windows PWA, precisamos de PNG nos tamanhos:
 * - 192x192 (obrigatório)
 * - 512x512 (obrigatório)
 * - 144x144 (recomendado para Windows)
 * - 96x96 (recomendado para Windows)
 *
 * Uso: node scripts/generate-pwa-icons.cjs
 */

const fs = require('fs');
const path = require('path');
const { exec } = require('child_process');
const util = require('util');
const execPromise = util.promisify(exec);

const publicDir = path.join(__dirname, '../public');
const sourceSvg = path.join(publicDir, 'pwa-icon.svg');

// Tamanhos necessários para Windows PWA
const sizes = [
  { size: 96, name: 'pwa-96x96.png', purpose: 'any' },
  { size: 144, name: 'pwa-144x144.png', purpose: 'any' },
  { size: 192, name: 'pwa-192x192.png', purpose: 'any' },
  { size: 512, name: 'pwa-512x512.png', purpose: 'any' },
  { size: 192, name: 'pwa-maskable-192x192.png', purpose: 'maskable', maskable: true },
  { size: 512, name: 'pwa-maskable-512x512.png', purpose: 'maskable', maskable: true }
];

async function checkTools() {
  const tools = {
    inkscape: false,
    magick: false,
    convert: false,
    rsvg: false
  };

  try {
    await execPromise('inkscape --version');
    tools.inkscape = true;
  } catch (e) {}

  try {
    await execPromise('magick --version');
    tools.magick = true;
  } catch (e) {}

  try {
    await execPromise('convert --version');
    tools.convert = true;
  } catch (e) {}

  try {
    await execPromise('rsvg-convert --version');
    tools.rsvg = true;
  } catch (e) {}

  return tools;
}

async function convertWithInkscape(svgPath, pngPath, size) {
  const cmd = `inkscape "${svgPath}" --export-filename="${pngPath}" --export-width=${size} --export-height=${size}`;
  await execPromise(cmd);
}

async function convertWithMagick(svgPath, pngPath, size) {
  const cmd = `magick "${svgPath}" -resize ${size}x${size} "${pngPath}"`;
  await execPromise(cmd);
}

async function convertWithRsvg(svgPath, pngPath, size) {
  const cmd = `rsvg-convert -w ${size} -h ${size} "${svgPath}" -o "${pngPath}"`;
  await execPromise(cmd);
}

async function generatePNGs() {
  console.log('📱 Iniciando geração de ícones PWA PNG para Windows...\n');

  // Verificar se SVG fonte existe
  if (!fs.existsSync(sourceSvg)) {
    console.error('❌ Erro: pwa-icon.svg não encontrado em', publicDir);
    console.log('💡 Execute este script após ter o arquivo pwa-icon.svg');
    process.exit(1);
  }

  // Verificar ferramentas disponíveis
  console.log('🔍 Verificando ferramentas de conversão disponíveis...');
  const tools = await checkTools();

  let converter = null;
  let converterName = '';

  if (tools.inkscape) {
    converter = convertWithInkscape;
    converterName = 'Inkscape';
  } else if (tools.magick) {
    converter = convertWithMagick;
    converterName = 'ImageMagick (magick)';
  } else if (tools.rsvg) {
    converter = convertWithRsvg;
    converterName = 'rsvg-convert';
  } else {
    console.error('\n❌ Nenhuma ferramenta de conversão SVG→PNG encontrada!');
    console.log('\n📦 Instale uma das seguintes ferramentas:\n');
    console.log('  • Inkscape: https://inkscape.org/release/');
    console.log('  • ImageMagick: https://imagemagick.org/script/download.php');
    console.log('  • librsvg: npm install -g librsvg\n');
    console.log('💡 Alternativa: Use um serviço online como CloudConvert ou convertio.co');
    console.log('   e salve os arquivos PNG manualmente na pasta public/\n');
    console.log('📋 Tamanhos necessários:');
    sizes.forEach(s => console.log(`   - ${s.name} (${s.size}x${s.size})`));
    process.exit(1);
  }

  console.log(`✅ Usando ${converterName}\n`);

  // Gerar cada tamanho
  let successCount = 0;
  let errorCount = 0;

  for (const { size, name, maskable } of sizes) {
    try {
      const outputPath = path.join(publicDir, name);

      // Para maskable, usar o SVG maskable se existir
      const inputSvg = maskable && fs.existsSync(path.join(publicDir, 'pwa-maskable-512x512.svg'))
        ? path.join(publicDir, 'pwa-maskable-512x512.svg')
        : sourceSvg;

      console.log(`   Gerando ${name} (${size}x${size})...`);
      await converter(inputSvg, outputPath, size);

      if (fs.existsSync(outputPath)) {
        const stats = fs.statSync(outputPath);
        console.log(`   ✅ ${name} criado (${(stats.size / 1024).toFixed(1)} KB)`);
        successCount++;
      } else {
        console.log(`   ⚠️  ${name} não foi criado`);
        errorCount++;
      }
    } catch (error) {
      console.error(`   ❌ Erro ao gerar ${name}:`, error.message);
      errorCount++;
    }
  }

  console.log('\n' + '='.repeat(60));
  console.log(`✅ Processo concluído: ${successCount} sucesso, ${errorCount} erros`);

  if (successCount > 0) {
    console.log('\n📝 Próximos passos:');
    console.log('   1. Verifique os ícones PNG em apps/frontend/public/');
    console.log('   2. O vite.config.ts já está configurado para usar os PNGs');
    console.log('   3. Execute "npm run build" para gerar a build de produção');
    console.log('   4. Teste a instalação do PWA no Windows\n');
  }
}

generatePNGs().catch(error => {
  console.error('\n❌ Erro fatal:', error);
  process.exit(1);
});
