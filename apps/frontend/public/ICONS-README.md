# Guia de Ícones PWA - Windows

## 📋 Status Atual

✅ **6 arquivos PNG placeholder criados** nos tamanhos corretos
✅ **Manifest configurado** ([vite.config.ts](../vite.config.ts))
⏳ **Aguardando substituição** por ícones com design real

## 📁 Arquivos Criados

Os seguintes arquivos PNG foram criados em `apps/frontend/public/`:

| Arquivo | Dimensões | Propósito | Status |
|---------|-----------|-----------|--------|
| `pwa-96x96.png` | 96x96 | Windows (pequeno) | Placeholder |
| `pwa-144x144.png` | 144x144 | Windows (médio) | Placeholder |
| `pwa-192x192.png` | 192x192 | **Obrigatório** (web/mobile) | Placeholder |
| `pwa-512x512.png` | 512x512 | **Obrigatório** (splash screen) | Placeholder |
| `pwa-maskable-192x192.png` | 192x192 | Android adaptativo | Placeholder |
| `pwa-maskable-512x512.png` | 512x512 | Android adaptativo | Placeholder |

## 🎨 Como Substituir pelos Ícones Reais

### Opção 1: Usando Editor de Imagens (Recomendado)

1. **Abra o arquivo `pwa-icon.svg`** em:
   - Adobe Illustrator
   - Inkscape (gratuito)
   - Photoshop
   - Figma/Sketch

2. **Exporte cada tamanho**:
   - 96x96 pixels → `pwa-96x96.png`
   - 144x144 pixels → `pwa-144x144.png`
   - 192x192 pixels → `pwa-192x192.png`
   - 512x512 pixels → `pwa-512x512.png`

3. **Para ícones maskable** (com padding de 10%):
   - Adicione 10% de espaço em branco ao redor do logo
   - 192x192 pixels → `pwa-maskable-192x192.png`
   - 512x512 pixels → `pwa-maskable-512x512.png`

4. **Substitua os arquivos** na pasta `apps/frontend/public/`

### Opção 2: Ferramentas Online

#### 🔧 Conversão SVG → PNG
- **Convertio**: https://convertio.co/svg-png/
  1. Upload `pwa-icon.svg`
  2. Escolha qualidade máxima
  3. Baixe PNG em alta resolução (512x512)

#### 📐 Redimensionamento
- **iLoveIMG**: https://www.iloveimg.com/resize-image
  1. Upload do PNG 512x512
  2. Redimensione para cada tamanho necessário
  3. Baixe e renomeie

#### 🚀 Gerador Completo (Recomendado)
- **RealFaviconGenerator**: https://realfavicongenerator.net/
  1. Upload `pwa-icon.svg`
  2. Configure opções PWA
  3. Gera todos os tamanhos automaticamente
  4. Baixe o pacote completo

### Opção 3: Linha de Comando (se tiver ImageMagick instalado)

```bash
# Converter SVG para PNG em múltiplos tamanhos
magick pwa-icon.svg -resize 96x96 pwa-96x96.png
magick pwa-icon.svg -resize 144x144 pwa-144x144.png
magick pwa-icon.svg -resize 192x192 pwa-192x192.png
magick pwa-icon.svg -resize 512x512 pwa-512x512.png

# Para maskable (com padding de 10%)
magick pwa-icon.svg -gravity center -extent 110%x110% -resize 192x192 pwa-maskable-192x192.png
magick pwa-icon.svg -gravity center -extent 110%x110% -resize 512x512 pwa-maskable-512x512.png
```

## 📱 Por que Windows Precisa de PNG?

- **Windows 10/11 PWA** não suporta ícones SVG no manifest
- O sistema operacional usa PNG para:
  - Ícone da área de trabalho
  - Menu Iniciar
  - Barra de tarefas
  - Lista de aplicativos instalados
- **SVG funciona** para navegadores modernos, mas não para instalação nativa

## ✅ Checklist de Validação

Após substituir os ícones:

- [ ] Todos os 6 arquivos PNG têm conteúdo real (não placeholder)
- [ ] Ícones maskable têm padding de 10% em todos os lados
- [ ] Tamanho dos arquivos PNG está entre 5-50 KB cada
- [ ] Testado build: `npm run build`
- [ ] Testado instalação PWA no Windows
- [ ] Ícone aparece corretamente na área de trabalho
- [ ] Ícone aparece corretamente no Menu Iniciar

## 🧪 Como Testar

### 1. Build de Produção
```bash
cd apps/frontend
npm run build
npm run preview
```

### 2. Instalar PWA no Windows
1. Abra o app no Chrome/Edge
2. Clique no ícone de instalação na barra de endereço
3. Ou: Menu → Apps → Instalar Ferraco CRM
4. Verifique se o ícone aparece corretamente

### 3. Verificar Manifest
- Abra DevTools (F12)
- Aba **Application** → **Manifest**
- Verifique se todos os ícones PNG aparecem na lista
- Clique para pré-visualizar cada tamanho

## 📚 Referências

- [PWA Icon Guidelines](https://web.dev/add-manifest/#icons)
- [Maskable Icons](https://web.dev/maskable-icon/)
- [Windows PWA Documentation](https://docs.microsoft.com/en-us/microsoft-edge/progressive-web-apps-chromium/)

---

**Última atualização**: 2025-11-24
**Configuração**: [vite.config.ts](../vite.config.ts#L41-L92)
