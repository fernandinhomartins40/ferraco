/**
 * Script para gerar ícones PWA em diferentes tamanhos
 * Requer: npm install -D sharp (já instalado no projeto)
 *
 * Uso: node scripts/generate-pwa-icons.js
 */

const fs = require('fs');
const path = require('path');

console.log('📱 Gerando ícones PWA placeholder...');

// Ícone SVG base
const svgIcon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2bb931;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0544ad;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)" rx="100"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="280" font-weight="bold" fill="#ffffff" text-anchor="middle">F</text>
</svg>`;

// Ícone SVG maskable (com padding para safe zone)
const svgIconMaskable = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <defs>
    <linearGradient id="grad" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2bb931;stop-opacity:1" />
      <stop offset="100%" style="stop-color:#0544ad;stop-opacity:1" />
    </linearGradient>
  </defs>
  <rect width="512" height="512" fill="url(#grad)"/>
  <text x="256" y="340" font-family="Arial, sans-serif" font-size="240" font-weight="bold" fill="#ffffff" text-anchor="middle">F</text>
</svg>`;

const publicDir = path.join(__dirname, '../public');

// Criar ícones SVG
fs.writeFileSync(path.join(publicDir, 'pwa-192x192.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-512x512.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-192x192.svg'), svgIconMaskable);
fs.writeFileSync(path.join(publicDir, 'pwa-maskable-512x512.svg'), svgIconMaskable);
fs.writeFileSync(path.join(publicDir, 'apple-touch-icon.svg'), svgIcon);
fs.writeFileSync(path.join(publicDir, 'favicon.svg'), svgIcon);

console.log('✅ Ícones SVG gerados com sucesso!');
console.log('📝 Para gerar PNG, instale sharp: npm install -D sharp');
console.log('💡 Substitua os ícones SVG por versões PNG customizadas quando necessário.');
