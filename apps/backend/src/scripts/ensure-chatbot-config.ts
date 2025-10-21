/**
 * Script para garantir que a configuração do chatbot sempre exista
 * Executado no startup da aplicação
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export async function ensureDefaultChatbotConfig() {
  try {
    console.log('🔍 Verificando configuração do chatbot...');

    // Verificar se já existe configuração
    const existingConfig = await prisma.chatbotConfig.findFirst();

    if (existingConfig) {
      console.log('✅ Configuração do chatbot já existe');
      return;
    }

    // Criar configuração padrão se não existir
    console.log('📝 Criando configuração padrão do chatbot...');

    await prisma.chatbotConfig.create({
      data: {
        botName: 'Assistente Virtual',
        welcomeMessage: 'Olá! Tudo bem? 😊\n\nSou o assistente virtual da Ferraco Metalúrgica. É um prazer ter você por aqui!\n\nAntes de falarmos sobre nossos produtos, como posso te chamar?',
        tone: 'friendly',
        captureLeads: true,
        requireEmail: false,
        requirePhone: true,
        autoResponse: true,

        // Dados da empresa
        companyName: 'Ferraco Metalúrgica',
        companyDescription: 'Soluções em metalurgia para o agronegócio',
        companyAddress: '',
        companyPhone: '',
        companyEmail: '',
        companyWebsite: '',
        workingHours: 'Segunda a Sexta, 8h às 18h',

        // Dados vazios (serão preenchidos pelo admin)
        products: JSON.stringify([]),
        faqs: JSON.stringify([]),
        shareLinks: JSON.stringify([]),
        conversationFlow: JSON.stringify([]),
      },
    });

    console.log('✅ Configuração padrão do chatbot criada com sucesso');

  } catch (error: any) {
    // Se o erro for de chave duplicada (config já existe), ignorar
    if (error.code === 'P2002') {
      console.log('✅ Configuração do chatbot já existe (detectado por constraint)');
      return;
    }

    console.error('❌ Erro ao criar configuração padrão:', error.message);
    // Não lançar erro para não impedir o startup da aplicação
  } finally {
    await prisma.$disconnect();
  }
}

// Executar se for chamado diretamente
if (require.main === module) {
  ensureDefaultChatbotConfig()
    .then(() => process.exit(0))
    .catch((error) => {
      console.error(error);
      process.exit(1);
    });
}
