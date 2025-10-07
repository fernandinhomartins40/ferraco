// Seed Script - Prisma Phase 3
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Iniciando seed do banco de dados...\n');

  // 1. Criar Usuário de Teste
  console.log('👤 Criando usuários...');
  const admin = await prisma.user.upsert({
    where: { email: 'admin@ferraco.com' },
    update: {},
    create: {
      email: 'admin@ferraco.com',
      username: 'admin',
      password: '$2a$10$P9lRAKvUr/7l7B8AATqz9Or87v0rGOubf.9OGUSj3uXtD9RDf1vkO', // senha: admin123
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
    },
  });

  const user = await prisma.user.upsert({
    where: { email: 'vendedor@ferraco.com' },
    update: {},
    create: {
      email: 'vendedor@ferraco.com',
      username: 'vendedor',
      password: '$2a$10$P9lRAKvUr/7l7B8AATqz9Or87v0rGOubf.9OGUSj3uXtD9RDf1vkO', // senha: admin123
      name: 'Vendedor Silva',
      role: 'SALES',
      isActive: true,
    },
  });

  console.log(`✅ Criados: ${admin.name}, ${user.name}`);

  // 2. Criar User Preferences
  console.log('\n⚙️ Criando preferências de usuário...');
  const adminPrefs = await prisma.userPreferences.create({
    data: {
      userId: admin.id,
      theme: 'DARK',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        create: {
          emailNewLeads: true,
          emailLeadUpdates: true,
          pushEnabled: true,
          inAppEnabled: true,
        },
      },
    },
  });
  console.log(`✅ Preferências criadas para ${admin.name}`);

  // 3. Criar Tags
  console.log('\n🏷️ Criando tags...');
  const tagUrgente = await prisma.tag.create({
    data: {
      name: 'Urgente',
      color: '#ff0000',
      description: 'Lead requer atenção imediata',
      isSystem: true,
    },
  });

  const tagVIP = await prisma.tag.create({
    data: {
      name: 'VIP',
      color: '#ffd700',
      description: 'Cliente de alto valor',
      isSystem: false,
    },
  });

  console.log(`✅ Tags criadas: ${tagUrgente.name}, ${tagVIP.name}`);

  // 4. Criar Leads
  console.log('\n📊 Criando leads...');
  const lead1 = await prisma.lead.create({
    data: {
      name: 'João Silva',
      phone: '+5511999999999',
      email: 'joao@example.com',
      status: 'NOVO',
      priority: 'HIGH',
      source: 'website',
      leadScore: 85,
      assignedToId: user.id,
      createdById: admin.id,
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Maria Santos',
      phone: '+5511888888888',
      email: 'maria@example.com',
      status: 'EM_ANDAMENTO',
      priority: 'MEDIUM',
      source: 'facebook',
      leadScore: 72,
      assignedToId: user.id,
    },
  });

  console.log(`✅ Leads criados: ${lead1.name}, ${lead2.name}`);

  // 5. Criar AI Analysis para Lead 1
  console.log('\n🧠 Criando AI Analysis...');
  const aiAnalysis = await prisma.aIAnalysis.create({
    data: {
      leadId: lead1.id,
      sentimentScore: 0.8,
      sentiment: 'POSITIVE',
      keyTopics: JSON.stringify(['produto', 'preço', 'entrega']),
      urgencyLevel: 'HIGH',
      confidenceScore: 85,
      recommendations: {
        create: [
          {
            type: 'CALL',
            priority: 'HIGH',
            title: 'Ligar para o lead',
            description: 'Cliente demonstrou interesse imediato',
            suggestedAction: 'Fazer contato telefônico nas próximas 2 horas',
            expectedImpact: 'Alta probabilidade de conversão',
            confidence: 90,
          },
          {
            type: 'WHATSAPP',
            priority: 'MEDIUM',
            title: 'Enviar proposta via WhatsApp',
            description: 'Cliente prefere comunicação rápida',
            suggestedAction: 'Enviar catálogo de produtos',
            expectedImpact: 'Aumento de engajamento',
            confidence: 75,
          },
        ],
      },
    },
  });
  console.log(`✅ AI Analysis criada com ${aiAnalysis.recommendations ? 2 : 0} recomendações`);

  // 6. Criar Conversion Prediction
  console.log('\n📈 Criando Conversion Prediction...');
  const conversionPrediction = await prisma.conversionPrediction.create({
    data: {
      leadId: lead1.id,
      probability: 78,
      confidence: 85,
      estimatedTimeToConversion: 5,
      suggestedActions: JSON.stringify([
        'Enviar proposta personalizada',
        'Agendar demonstração',
        'Oferecer desconto especial',
      ]),
      factors: {
        create: [
          {
            factor: 'Interesse demonstrado',
            impact: 'POSITIVE',
            weight: 0.8,
            description: 'Cliente fez múltiplas perguntas sobre o produto',
          },
          {
            factor: 'Tempo de resposta',
            impact: 'POSITIVE',
            weight: 0.6,
            description: 'Cliente responde rapidamente às mensagens',
          },
        ],
      },
    },
  });
  console.log(`✅ Conversion Prediction criada (${conversionPrediction.probability}% probabilidade)`);

  // 7. Criar Lead Scoring
  console.log('\n🎯 Criando Lead Scoring...');
  const leadScoring = await prisma.leadScoring.create({
    data: {
      leadId: lead1.id,
      score: 85,
      factors: {
        create: [
          {
            factor: 'Empresa de grande porte',
            value: JSON.stringify({ size: 'large' }),
            points: 25,
            weight: 0.3,
            description: 'Empresa com mais de 500 funcionários',
          },
          {
            factor: 'Orçamento disponível',
            value: JSON.stringify({ budget: 'high' }),
            points: 30,
            weight: 0.4,
            description: 'Budget aprovado para o projeto',
          },
          {
            factor: 'Decisor identificado',
            value: JSON.stringify({ decision_maker: true }),
            points: 30,
            weight: 0.3,
            description: 'Em contato com o decisor principal',
          },
        ],
      },
      history: {
        create: [
          {
            score: 85,
            change: 0,
            reason: 'Score inicial calculado',
          },
        ],
      },
    },
  });
  console.log(`✅ Lead Scoring criado (score: ${leadScoring.score})`);

  // 8. Criar Chatbot Config
  console.log('\n🤖 Criando Chatbot Config...');
  const chatbot = await prisma.chatbotConfig.create({
    data: {
      isEnabled: true,
      welcomeMessage: 'Olá! Como posso ajudar você hoje?',
      fallbackMessage: 'Desculpe, não entendi. Pode reformular a pergunta?',
      handoffTriggers: JSON.stringify(['falar com atendente', 'humano', 'pessoa']),
      qualificationQuestions: {
        create: [
          {
            question: 'Qual é o seu nome?',
            type: 'TEXT',
            isRequired: true,
            order: 1,
          },
          {
            question: 'Qual é o seu email?',
            type: 'EMAIL',
            isRequired: true,
            order: 2,
          },
          {
            question: 'Qual produto você tem interesse?',
            type: 'MULTIPLE_CHOICE',
            options: JSON.stringify(['Produto A', 'Produto B', 'Produto C']),
            isRequired: true,
            order: 3,
          },
        ],
      },
      businessHours: {
        create: {
          timezone: 'America/Sao_Paulo',
          monday: JSON.stringify({ isOpen: true, start: '09:00', end: '18:00' }),
          tuesday: JSON.stringify({ isOpen: true, start: '09:00', end: '18:00' }),
          wednesday: JSON.stringify({ isOpen: true, start: '09:00', end: '18:00' }),
          thursday: JSON.stringify({ isOpen: true, start: '09:00', end: '18:00' }),
          friday: JSON.stringify({ isOpen: true, start: '09:00', end: '18:00' }),
          saturday: JSON.stringify({ isOpen: false, start: '', end: '' }),
          sunday: JSON.stringify({ isOpen: false, start: '', end: '' }),
        },
      },
    },
  });
  console.log(`✅ Chatbot Config criado`);

  // 9. Criar Digital Signature
  console.log('\n🔐 Criando Digital Signature...');
  const signature = await prisma.digitalSignature.create({
    data: {
      userId: user.id,
      leadId: lead1.id,
      documentType: 'PROPOSAL',
      signatureData: 'base64EncodedSignatureDataHere',
      ipAddress: '192.168.1.100',
      isValid: true,
    },
  });
  console.log(`✅ Digital Signature criada`);

  // 10. Criar Message Template
  console.log('\n📧 Criando Message Templates...');
  const template = await prisma.messageTemplate.create({
    data: {
      name: 'Boas-vindas',
      type: 'WHATSAPP',
      content: 'Olá {{nome}}, bem-vindo à Ferraco! Como podemos ajudar?',
      category: 'WELCOME',
      variables: JSON.stringify(['nome']),
      isActive: true,
    },
  });
  console.log(`✅ Template criado: ${template.name}`);

  // 11. Criar Pipeline
  console.log('\n🔄 Criando Pipeline...');
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Pipeline de Vendas Padrão',
      description: 'Processo padrão de vendas',
      businessType: 'B2B',
      isDefault: true,
      stages: {
        create: [
          {
            name: 'Prospecção',
            description: 'Identificação de leads',
            color: '#3b82f6',
            order: 1,
            expectedDuration: 3,
            conversionRate: 40.0,
            isClosedWon: false,
            isClosedLost: false,
          },
          {
            name: 'Qualificação',
            description: 'Validação do interesse',
            color: '#8b5cf6',
            order: 2,
            expectedDuration: 5,
            conversionRate: 60.0,
            isClosedWon: false,
            isClosedLost: false,
          },
          {
            name: 'Proposta',
            description: 'Envio de proposta comercial',
            color: '#f59e0b',
            order: 3,
            expectedDuration: 7,
            conversionRate: 75.0,
            isClosedWon: false,
            isClosedLost: false,
          },
          {
            name: 'Negociação',
            description: 'Ajustes finais',
            color: '#10b981',
            order: 4,
            expectedDuration: 3,
            conversionRate: 85.0,
            isClosedWon: false,
            isClosedLost: false,
          },
          {
            name: 'Fechado - Ganho',
            description: 'Venda concluída',
            color: '#22c55e',
            order: 5,
            expectedDuration: 1,
            conversionRate: 100.0,
            isClosedWon: true,
            isClosedLost: false,
          },
        ],
      },
    },
  });
  console.log(`✅ Pipeline criado com ${pipeline.stages ? 5 : 0} estágios`);

  console.log('\n✅ Seed concluído com sucesso!\n');
  console.log('📊 Resumo:');
  console.log(`   - ${await prisma.user.count()} usuários`);
  console.log(`   - ${await prisma.lead.count()} leads`);
  console.log(`   - ${await prisma.tag.count()} tags`);
  console.log(`   - ${await prisma.aIAnalysis.count()} AI analyses`);
  console.log(`   - ${await prisma.conversionPrediction.count()} conversion predictions`);
  console.log(`   - ${await prisma.leadScoring.count()} lead scorings`);
  console.log(`   - ${await prisma.chatbotConfig.count()} chatbot configs`);
  console.log(`   - ${await prisma.digitalSignature.count()} digital signatures`);
  console.log(`   - ${await prisma.messageTemplate.count()} message templates`);
  console.log(`   - ${await prisma.pipeline.count()} pipelines`);
  console.log('');
}

main()
  .catch((e) => {
    console.error('❌ Erro no seed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
