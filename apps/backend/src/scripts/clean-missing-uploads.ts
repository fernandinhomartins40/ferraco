/**
 * Script para limpar URLs de uploads que não existem mais
 * Remove referências a imagens que foram deletadas do filesystem
 */

import { PrismaClient } from '@prisma/client';
import * as fs from 'fs';
import * as path from 'path';

const prisma = new PrismaClient();

const uploadsDir = process.env.NODE_ENV === 'production'
  ? '/app/uploads'
  : path.join(__dirname, '../../uploads');

async function cleanMissingUploads() {
  console.log('🧹 Iniciando limpeza de uploads ausentes...');
  console.log(`📁 Diretório de uploads: ${uploadsDir}`);

  try {
    // Buscar config da landing page
    const config = await prisma.landingPageConfig.findFirst();

    if (!config) {
      console.log('⚠️  Nenhuma configuração de landing page encontrada');
      return;
    }

    console.log(`✅ Configuração encontrada: ${config.id}`);

    let modified = false;

    // Parse de cada seção
    const header = JSON.parse(config.header);
    const hero = JSON.parse(config.hero);
    const about = JSON.parse(config.about);

    // Verificar e limpar logo do header
    if (header.logo && header.logo.startsWith('/uploads/')) {
      const filename = header.logo.replace('/uploads/', '');
      const filepath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`❌ Arquivo não existe: ${header.logo}`);
        console.log(`   Removendo referência do header.logo`);
        header.logo = '';
        modified = true;
      } else {
        console.log(`✅ Arquivo existe: ${header.logo}`);
      }
    }

    // Verificar e limpar backgroundImage do hero
    if (hero.backgroundImage && hero.backgroundImage.startsWith('/uploads/')) {
      const filename = hero.backgroundImage.replace('/uploads/', '');
      const filepath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`❌ Arquivo não existe: ${hero.backgroundImage}`);
        console.log(`   Removendo referência do hero.backgroundImage`);
        hero.backgroundImage = '';
        modified = true;
      } else {
        console.log(`✅ Arquivo existe: ${hero.backgroundImage}`);
      }
    }

    // Verificar e limpar image do about
    if (about.image && about.image.startsWith('/uploads/')) {
      const filename = about.image.replace('/uploads/', '');
      const filepath = path.join(uploadsDir, filename);

      if (!fs.existsSync(filepath)) {
        console.log(`❌ Arquivo não existe: ${about.image}`);
        console.log(`   Removendo referência do about.image`);
        about.image = '';
        modified = true;
      } else {
        console.log(`✅ Arquivo existe: ${about.image}`);
      }
    }

    // Atualizar banco se houve modificações
    if (modified) {
      await prisma.landingPageConfig.update({
        where: { id: config.id },
        data: {
          header: JSON.stringify(header),
          hero: JSON.stringify(hero),
          about: JSON.stringify(about),
        },
      });
      console.log('✅ Configuração atualizada no banco de dados');
    } else {
      console.log('✅ Nenhuma modificação necessária');
    }

  } catch (error) {
    console.error('❌ Erro ao limpar uploads:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar
cleanMissingUploads()
  .then(() => {
    console.log('✅ Limpeza concluída com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro na limpeza:', error);
    process.exit(1);
  });
