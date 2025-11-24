/**
 * Script para corrigir os hrefs do menu do header no banco de produção
 *
 * Problema: Banco de produção tem hrefs em inglês (#hero, #about, etc)
 * Solução: Atualizar para português (#inicio, #sobre, etc) para corresponder aos IDs das sections
 *
 * Uso: npx tsx src/scripts/fix-menu-hrefs.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

// Mapeamento de hrefs antigos (inglês) para novos (português)
const HREF_MAPPING = {
  '#hero': '#inicio',
  '#about': '#sobre',
  '#products': '#produtos',
  '#contact': '#contato',
  '#experience': '#experiencia',
};

async function fixMenuHrefs() {
  console.log('🔧 Iniciando correção dos hrefs do menu...\n');

  try {
    // Buscar configuração atual
    const config = await prisma.landingPageConfig.findFirst({
      orderBy: { updatedAt: 'desc' },
    });

    if (!config) {
      console.log('❌ Nenhuma configuração encontrada no banco de dados.');
      return;
    }

    console.log('📋 Configuração encontrada:', config.id);

    // Parse do header
    const header = JSON.parse(config.header as string);

    console.log('\n📝 Menu items ANTES da correção:');
    console.log(JSON.stringify(header.menu.items, null, 2));

    // Verificar se precisa correção
    let needsUpdate = false;
    const updatedItems = header.menu.items.map((item: any) => {
      const oldHref = item.href;
      const newHref = HREF_MAPPING[oldHref as keyof typeof HREF_MAPPING] || oldHref;

      if (oldHref !== newHref) {
        console.log(`\n🔄 Corrigindo: "${item.label}" de ${oldHref} para ${newHref}`);
        needsUpdate = true;
      }

      return {
        ...item,
        href: newHref,
      };
    });

    if (!needsUpdate) {
      console.log('\n✅ Todos os hrefs já estão corretos! Nenhuma atualização necessária.');
      return;
    }

    // Atualizar menu items
    header.menu.items = updatedItems;

    console.log('\n📝 Menu items DEPOIS da correção:');
    console.log(JSON.stringify(header.menu.items, null, 2));

    // Salvar no banco
    await prisma.landingPageConfig.update({
      where: { id: config.id },
      data: {
        header: JSON.stringify(header),
        updatedAt: new Date(),
      },
    });

    console.log('\n✅ Hrefs corrigidos com sucesso no banco de dados!');
    console.log('\n🎯 Próximos passos:');
    console.log('1. Faça hard refresh na página (Ctrl + Shift + R)');
    console.log('2. Clique nos itens do menu');
    console.log('3. Agora deve funcionar corretamente!');

  } catch (error) {
    console.error('\n❌ Erro ao corrigir hrefs:', error);
    throw error;
  } finally {
    await prisma.$disconnect();
  }
}

// Executar script
fixMenuHrefs()
  .then(() => {
    console.log('\n✅ Script finalizado com sucesso!');
    process.exit(0);
  })
  .catch((error) => {
    console.error('\n❌ Script falhou:', error);
    process.exit(1);
  });
