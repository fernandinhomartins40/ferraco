/**
 * Script para migrar HeroConfig antigo para novo formato com slides
 * Execute: npx tsx src/scripts/migrate-hero-config.ts
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function migrateHeroConfig() {
  console.log('🔄 Iniciando migração do HeroConfig...');

  const landingPages = await prisma.landingPageConfig.findMany();

  for (const page of landingPages) {
    // Parse do JSON do hero
    const heroConfig = JSON.parse(page.hero);

    // Verificar se já tem o novo formato (slides)
    if (heroConfig && !heroConfig.slides) {
      console.log(`📝 Migrando landing page: ${page.id}`);

      const oldHero = heroConfig;

      // Criar slide único com os dados antigos
      const newHero = {
        enabled: oldHero.enabled !== false,
        slides: [
          {
            id: 'slide-1',
            title: oldHero.title || {
              text: 'Equipamentos para Pecuária Leiteira',
              style: {
                fontSize: '3rem',
                fontWeight: '700',
                textColor: '#ffffff',
              },
            },
            subtitle: oldHero.subtitle || {
              text: 'Há mais de 25 anos fornecendo soluções de alta qualidade',
              style: {
                fontSize: '1.5rem',
                fontWeight: '500',
                textColor: '#ffffff',
              },
            },
            description: oldHero.description || {
              text: 'Especialistas em equipamentos para pecuária leiteira',
              style: {
                fontSize: '1.125rem',
                textColor: '#ffffff',
              },
            },
            buttons: oldHero.buttons || {
              primary: {
                text: 'Conhecer Produtos',
                href: '#produtos',
                variant: 'primary',
              },
              secondary: {
                text: 'Solicitar Orçamento',
                href: '#contato',
                variant: 'outline',
              },
              alignment: 'center',
            },
            background: oldHero.background || {
              type: 'gradient',
              gradient: {
                from: '#667eea',
                to: '#764ba2',
                direction: 'to right',
              },
              overlay: {
                enabled: true,
                color: '#000000',
                opacity: 40,
              },
            },
          },
        ],
        autoPlay: true,
        autoPlayInterval: 5,
        showNavigation: true,
        showIndicators: true,
        layout: oldHero.layout || 'centered',
        height: oldHero.height || '70vh',
        animation: oldHero.animation || {
          type: 'fade',
          duration: 500,
          delay: 0,
        },
        style: oldHero.style || {},
      };

      // Atualizar hero no banco
      await prisma.landingPageConfig.update({
        where: { id: page.id },
        data: { hero: JSON.stringify(newHero) },
      });

      console.log(`✅ Landing page ${page.id} migrada com sucesso`);
    } else if (heroConfig && heroConfig.slides) {
      console.log(`⏭️  Landing page ${page.id} já está no novo formato`);
    } else {
      console.log(`⚠️  Landing page ${page.id} não tem seção hero ou hero está vazio`);
    }
  }

  console.log('✅ Migração concluída!');
}

migrateHeroConfig()
  .catch((error) => {
    console.error('❌ Erro na migração:', error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
