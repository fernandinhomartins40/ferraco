# Como Gerar Ícones PWA

## Opção 1: Usar ferramenta online (RECOMENDADO)

1. Acesse: https://realfavicongenerator.net/
2. Faça upload do arquivo `public/pwa-icon.svg`
3. Configure:
   - iOS: Sim
   - Android: Sim
   - Tamanhos: 192x192 e 512x512
4. Baixe o pacote gerado
5. Copie os arquivos para `apps/frontend/public/`:
   - `pwa-192x192.png`
   - `pwa-512x512.png`
   - `apple-touch-icon.png`

## Opção 2: Usar ImageMagick (linha de comando)

```bash
# Instalar ImageMagick (se não tiver)
# Windows: choco install imagemagick
# Mac: brew install imagemagick
# Linux: apt-get install imagemagick

cd apps/frontend/public

# Gerar ícones
magick convert pwa-icon.svg -resize 192x192 pwa-192x192.png
magick convert pwa-icon.svg -resize 512x512 pwa-512x512.png
magick convert pwa-icon.svg -resize 180x180 apple-touch-icon.png
```

## Opção 3: Usar PWA Asset Generator

```bash
npm install -g pwa-asset-generator

cd apps/frontend/public
pwa-asset-generator pwa-icon.svg . --icon-only --favicon --manifest manifest.json
```

## Verificação

Após gerar, verifique se os arquivos existem:
- `public/pwa-192x192.png`
- `public/pwa-512x512.png`
- `public/apple-touch-icon.png`
