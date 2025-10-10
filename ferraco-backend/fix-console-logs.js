#!/usr/bin/env node
/**
 * Script para substituir console.log por logger em todos os arquivos TypeScript
 * Execução: node fix-console-logs.js
 */

const fs = require('fs');
const path = require('path');

// Arquivos a serem corrigidos
const files = [
  'src/modules/chatbot/configController.ts',
  'src/modules/chatbot/productsController.ts',
  'src/modules/chatbot/chatbotController.ts',
  'src/services/fusechatService.ts',
  'src/services/aiService.ts',
  'src/utils/autoSyncFuseChat.ts'
];

let totalReplacements = 0;

files.forEach(filePath => {
  const fullPath = path.join(__dirname, filePath);

  if (!fs.existsSync(fullPath)) {
    console.log(`⚠️  Arquivo não encontrado: ${filePath}`);
    return;
  }

  let content = fs.readFileSync(fullPath, 'utf8');
  let replacements = 0;

  // Substituições
  const before = content;

  content = content.replace(/console\.log\(/g, 'logger.info(');
  content = content.replace(/console\.error\(/g, 'logger.error(');
  content = content.replace(/console\.warn\(/g, 'logger.warn(');
  content = content.replace(/console\.debug\(/g, 'logger.debug(');

  replacements = (before.match(/console\.(log|error|warn|debug)\(/g) || []).length;

  if (replacements > 0) {
    fs.writeFileSync(fullPath, content, 'utf8');
    console.log(`✅ ${filePath}: ${replacements} substituições`);
    totalReplacements += replacements;
  } else {
    console.log(`✓  ${filePath}: Nenhuma substituição necessária`);
  }
});

console.log(`\n🎉 Total: ${totalReplacements} console.* substituídos por logger.*`);
console.log('\n⚠️  IMPORTANTE: Verifique se todos os arquivos importam logger:');
console.log("   import { logger } from '../../utils/logger';");
