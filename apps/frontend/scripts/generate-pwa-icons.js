/**
 * Script para gerar ícones PWA a partir do SVG
 * Gera: pwa-192x192.png, pwa-512x512.png, apple-touch-icon.png
 *
 * Uso: node scripts/generate-pwa-icons.js
 */

import sharp from 'sharp';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const publicDir = join(__dirname, '../public');
const svgPath = join(publicDir, 'pwa-icon.svg');

// Ler o SVG
const svgBuffer = readFileSync(svgPath);

// Tamanhos a gerar
const sizes = [
  { name: 'pwa-192x192.png', size: 192 },
  { name: 'pwa-512x512.png', size: 512 },
  { name: 'apple-touch-icon.png', size: 180 }, // iOS requer 180x180
];

console.log('🎨 Gerando ícones PWA...\n');

// Gerar cada ícone
Promise.all(
  sizes.map(async ({ name, size }) => {
    const outputPath = join(publicDir, name);

    try {
      await sharp(svgBuffer)
        .resize(size, size, {
          fit: 'contain',
          background: { r: 255, g: 255, b: 255, alpha: 0 } // Fundo transparente
        })
        .png()
        .toFile(outputPath);

      console.log(`✅ ${name} (${size}x${size})`);
    } catch (error) {
      console.error(`❌ Erro ao gerar ${name}:`, error.message);
    }
  })
).then(() => {
  console.log('\n🎉 Ícones PWA gerados com sucesso!');
  console.log('\n📍 Localização: apps/frontend/public/');
  console.log('   - pwa-192x192.png');
  console.log('   - pwa-512x512.png');
  console.log('   - apple-touch-icon.png');
}).catch((error) => {
  console.error('\n❌ Erro geral:', error);
  process.exit(1);
});
