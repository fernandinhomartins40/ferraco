import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

/**
 * T-01 — Guarda contra seed destrutivo.
 *
 * Este seed apaga 14 tabelas antes de popular. Rodar contra um banco com dados
 * reais causa perda total. A guarda aborta nesse caso, a menos que o operador
 * declare a intenção com ALLOW_DESTRUCTIVE_SEED=true.
 *
 * Em produção a variável sozinha não basta: exige também CONFIRM_DESTRUCTIVE_SEED
 * com o nome do banco, para que a confirmação não seja transferível entre ambientes.
 */
async function assertSafeToSeed() {
  const [userCount, leadCount, teamCount] = await Promise.all([
    prisma.user.count(),
    prisma.lead.count(),
    prisma.team.count(),
  ]);

  const total = userCount + leadCount + teamCount;

  if (total === 0) {
    console.log('✅ Banco vazio — seed pode prosseguir com segurança.');
    return;
  }

  const allowed = process.env.ALLOW_DESTRUCTIVE_SEED === 'true';

  console.error('');
  console.error('=========================================');
  console.error('⛔ SEED ABORTADO — BANCO JÁ CONTÉM DADOS');
  console.error('=========================================');
  console.error(`   users: ${userCount} · leads: ${leadCount} · teams: ${teamCount}`);
  console.error('   Este seed executa deleteMany() em 14 tabelas.');
  console.error('   Prosseguir apagaria esses registros de forma irrecuperável.');

  if (!allowed) {
    console.error('');
    console.error('   Para rodar mesmo assim (ambiente descartável):');
    console.error('     ALLOW_DESTRUCTIVE_SEED=true npx prisma db seed');
    console.error('=========================================');
    process.exit(1);
  }

  if (process.env.NODE_ENV === 'production') {
    const dbName = new URL(process.env.DATABASE_URL ?? '').pathname.replace(/^\//, '');
    if (!dbName || process.env.CONFIRM_DESTRUCTIVE_SEED !== dbName) {
      console.error('');
      console.error('   NODE_ENV=production: ALLOW_DESTRUCTIVE_SEED não é suficiente.');
      console.error(`   Exige também CONFIRM_DESTRUCTIVE_SEED=${dbName || '<nome-do-banco>'}`);
      console.error('=========================================');
      process.exit(1);
    }
  }

  console.error('');
  console.error('   ⚠️  ALLOW_DESTRUCTIVE_SEED=true — prosseguindo sob responsabilidade do operador.');
  console.error('=========================================');
}

async function main() {
  console.log('🌱 Starting database seed...');

  await assertSafeToSeed();

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');

  // Limpar em ordem respeitando foreign keys
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.note.deleteMany();
  await prisma.messageTemplate.deleteMany();
  await prisma.automation.deleteMany();
  await prisma.opportunity.deleteMany();
  await prisma.pipelineStage.deleteMany();
  await prisma.pipeline.deleteMany();
  await prisma.leadTag.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.tag.deleteMany();
  await prisma.teamMember.deleteMany();
  await prisma.user.deleteMany();
  await prisma.team.deleteMany();

  // Create Teams
  console.log('👥 Creating teams...');
  const salesTeam = await prisma.team.create({
    data: {
      name: 'Vendas',
      description: 'Equipe de vendas',
      isActive: true,
    },
  });

  const supportTeam = await prisma.team.create({
    data: {
      name: 'Suporte',
      description: 'Equipe de suporte ao cliente',
      isActive: true,
    },
  });

  // Create Users
  console.log('👤 Creating users...');
  const adminPassword = await hashPassword('Admin@123456');
  const userPassword = await hashPassword('User@123456');

  const adminUser = await prisma.user.create({
    data: {
      username: 'admin',
      email: 'admin@ferraco.com',
      password: adminPassword,
      name: 'Administrador',
      role: 'ADMIN',
      isActive: true,
      teamMemberships: {
        create: {
          teamId: salesTeam.id,
          isLead: true,
        },
      },
    },
  });

  const managerUser = await prisma.user.create({
    data: {
      username: 'manager',
      email: 'manager@ferraco.com',
      password: userPassword,
      name: 'Gerente de Vendas',
      role: 'MANAGER',
      isActive: true,
      teamMemberships: {
        create: {
          teamId: salesTeam.id,
          isLead: true,
        },
      },
    },
  });

  const salesUser = await prisma.user.create({
    data: {
      username: 'vendedor',
      email: 'vendedor@ferraco.com',
      password: userPassword,
      name: 'João Vendedor',
      role: 'SALES',
      isActive: true,
      teamMemberships: {
        create: {
          teamId: salesTeam.id,
          isLead: false,
        },
      },
    },
  });

  const consultantUser = await prisma.user.create({
    data: {
      username: 'consultor',
      email: 'consultor@ferraco.com',
      password: userPassword,
      name: 'Maria Consultora',
      role: 'CONSULTANT',
      isActive: true,
      teamMemberships: {
        create: {
          teamId: salesTeam.id,
          isLead: false,
        },
      },
    },
  });

  const supportUser = await prisma.user.create({
    data: {
      username: 'suporte',
      email: 'suporte@ferraco.com',
      password: userPassword,
      name: 'Pedro Suporte',
      role: 'SUPPORT',
      isActive: true,
      teamMemberships: {
        create: {
          teamId: supportTeam.id,
          isLead: false,
        },
      },
    },
  });

  // Create Tags
  console.log('🏷️  Creating tags...');
  const hotTag = await prisma.tag.create({
    data: {
      name: 'hot',
      color: '#FF0000',
      description: 'Lead quente - alta prioridade',
      isSystem: true,
    },
  });

  const coldTag = await prisma.tag.create({
    data: {
      name: 'cold',
      color: '#0000FF',
      description: 'Lead frio',
      isSystem: true,
    },
  });

  const qualifiedTag = await prisma.tag.create({
    data: {
      name: 'qualified',
      color: '#00FF00',
      description: 'Lead qualificado',
      isSystem: true,
    },
  });

  const newCustomerTag = await prisma.tag.create({
    data: {
      name: 'novo-cliente',
      color: '#FFA500',
      description: 'Novo cliente',
      isSystem: false,
    },
  });

  // Create Leads
  console.log('📊 Creating leads...');
  const lead1 = await prisma.lead.create({
    data: {
      name: 'Carlos Silva',
      email: 'carlos.silva@empresa.com',
      phone: '+5511987654321',
      company: 'Fazenda Silva',
      position: 'Proprietário',
      source: 'Website',
      status: 'NOVO',
      priority: 'HIGH',
      leadScore: 85,
      assignedToId: salesUser.id,
      createdById: adminUser.id,
      tags: {
        create: [
          { tagId: hotTag.id },
          { tagId: qualifiedTag.id },
        ],
      },
    },
  });

  const lead2 = await prisma.lead.create({
    data: {
      name: 'Ana Santos',
      email: 'ana@fazendabrasil.com.br',
      phone: '+5511976543210',
      company: 'Fazenda Brasil',
      position: 'Gerente',
      source: 'Indicação',
      status: 'EM_ANDAMENTO',
      priority: 'MEDIUM',
      leadScore: 70,
      assignedToId: salesUser.id,
      createdById: salesUser.id,
      tags: {
        create: [
          { tagId: qualifiedTag.id },
        ],
      },
    },
  });

  const lead3 = await prisma.lead.create({
    data: {
      name: 'Roberto Costa',
      email: 'roberto@agropecuaria.com',
      phone: '+5511965432109',
      company: 'Agropecuária Costa',
      source: 'Facebook Ads',
      status: 'NOVO',
      priority: 'LOW',
      leadScore: 45,
      assignedToId: consultantUser.id,
      createdById: consultantUser.id,
      tags: {
        create: [
          { tagId: coldTag.id },
        ],
      },
    },
  });

  const lead4 = await prisma.lead.create({
    data: {
      name: 'Patricia Oliveira',
      email: 'patricia@ruraltech.com',
      phone: '+5511954321098',
      company: 'Rural Tech',
      position: 'Diretora',
      source: 'LinkedIn',
      status: 'QUALIFICADO',
      priority: 'HIGH',
      leadScore: 90,
      assignedToId: salesUser.id,
      createdById: managerUser.id,
      tags: {
        create: [
          { tagId: hotTag.id },
          { tagId: qualifiedTag.id },
          { tagId: newCustomerTag.id },
        ],
      },
    },
  });

  const lead5 = await prisma.lead.create({
    data: {
      name: 'Fernando Almeida',
      phone: '+5511943210987',
      company: 'Fazenda Almeida',
      source: 'WhatsApp',
      status: 'NOVO',
      priority: 'MEDIUM',
      leadScore: 60,
      assignedToId: consultantUser.id,
      createdById: consultantUser.id,
    },
  });

  // Create Notes
  console.log('📝 Creating notes...');
  await prisma.note.create({
    data: {
      leadId: lead1.id,
      content: 'Cliente interessado em sistema de bebedouros. Solicitou orçamento.',
      category: 'Comercial',
      important: true,
      createdById: salesUser.id,
    },
  });

  await prisma.note.create({
    data: {
      leadId: lead1.id,
      content: 'Follow-up realizado. Cliente confirmou interesse.',
      category: 'Follow-up',
      important: false,
      createdById: salesUser.id,
    },
  });

  await prisma.note.create({
    data: {
      leadId: lead2.id,
      content: 'Primeira reunião agendada para próxima semana.',
      category: 'Reunião',
      important: true,
      createdById: salesUser.id,
    },
  });

  await prisma.note.create({
    data: {
      leadId: lead4.id,
      content: 'Cliente VIP - dar prioridade máxima. Budget aprovado.',
      category: 'VIP',
      important: true,
      createdById: managerUser.id,
    },
  });

  // Create Pipeline
  console.log('🔄 Creating pipeline...');
  const pipeline = await prisma.pipeline.create({
    data: {
      name: 'Pipeline de Vendas Principal',
      description: 'Pipeline padrão para vendas de equipamentos',
      businessType: 'EQUIPAMENTOS',
      isDefault: true,
      createdById: adminUser.id,
      stages: {
        create: [
          {
            name: 'Prospecção',
            order: 0,
            color: '#3B82F6',
            expectedDuration: 7,
          },
          {
            name: 'Qualificação',
            order: 1,
            color: '#8B5CF6',
            expectedDuration: 5,
          },
          {
            name: 'Proposta',
            order: 2,
            color: '#F59E0B',
            expectedDuration: 10,
          },
          {
            name: 'Negociação',
            order: 3,
            color: '#10B981',
            expectedDuration: 14,
          },
          {
            name: 'Fechamento',
            order: 4,
            color: '#059669',
            expectedDuration: 7,
          },
        ],
      },
    },
    include: {
      stages: true,
    },
  });

  // Create Opportunities
  console.log('💰 Creating opportunities...');
  await prisma.opportunity.create({
    data: {
      leadId: lead1.id,
      pipelineId: pipeline.id,
      stageId: pipeline.stages[2].id, // Proposta
      value: 45000,
      probability: 75,
      expectedCloseDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 dias
      status: 'OPEN',
      assignedToId: salesUser.id,
      createdById: salesUser.id,
    },
  });

  await prisma.opportunity.create({
    data: {
      leadId: lead4.id,
      pipelineId: pipeline.id,
      stageId: pipeline.stages[3].id, // Negociação
      value: 120000,
      probability: 90,
      expectedCloseDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000), // 15 dias
      status: 'OPEN',
      assignedToId: salesUser.id,
      createdById: managerUser.id,
    },
  });

  // Create Message Templates
  console.log('💬 Creating message templates...');
  await prisma.messageTemplate.create({
    data: {
      name: 'Boas-vindas WhatsApp',
      type: 'WHATSAPP',
      category: 'WELCOME',
      content: 'Olá {{nome}}! Obrigado pelo interesse na Ferraco. Como podemos ajudar?',
      variables: '["nome"]',
      isActive: true,
    },
  });

  await prisma.messageTemplate.create({
    data: {
      name: 'Email de Proposta',
      type: 'EMAIL',
      category: 'FOLLOW_UP',
      content: 'Prezado(a) {{nome}},\n\nSegue em anexo nossa proposta comercial.\n\nAtenciosamente,\nEquipe Ferraco',
      variables: '["nome"]',
      isActive: true,
    },
  });

  // Create Automation
  console.log('🤖 Creating automations...');
  await prisma.automation.create({
    data: {
      name: 'Tag Automática - Lead Hot',
      description: 'Adiciona tag "hot" para leads com score > 80',
      triggerType: 'LEAD_CREATED',
      conditions: JSON.stringify([
        {
          field: 'leadScore',
          operator: 'greater_than',
          value: 80,
        },
      ]),
      actions: JSON.stringify([
        {
          type: 'ADD_TAG',
          config: {
            tagId: hotTag.id,
          },
        },
      ]),
      isActive: true,
      createdById: adminUser.id,
    },
  });

  // ============================================================================
  // ✅ NOVO: Templates de Mensagens Genéricas (WhatsApp Automation)
  // ============================================================================
  console.log('\n📨 Creating generic message templates...');

  const modalOrcamentoTemplate = await prisma.recurrenceMessageTemplate.create({
    data: {
      name: 'Boas-vindas Modal Orçamento',
      description: 'Mensagem automática para leads capturados via modal de orçamento',
      trigger: 'modal_orcamento',
      minCaptures: 1,
      content: `Olá {{lead.name}}! 👋

Recebemos sua solicitação de orçamento através do nosso site.

Nossa equipe comercial da {{company.name}} entrará em contato com você em até *2 horas úteis* pelo WhatsApp ou telefone.

Enquanto isso, fique à vontade para:
📞 Ligar para {{company.phone}}
📧 Enviar email para {{company.email}}
🌐 Acessar nosso site: {{company.website}}

Obrigado pelo interesse!
Equipe {{company.name}}`,
      priority: 10,
      isActive: true,
      conditions: JSON.stringify({}),
    },
  });

  const humanContactTemplate = await prisma.recurrenceMessageTemplate.create({
    data: {
      name: 'Solicitação de Atendimento Humano',
      description: 'Mensagem para leads que solicitam falar com um atendente',
      trigger: 'human_contact_request',
      minCaptures: 1,
      content: `Olá {{lead.name}}! 👋

Entendemos que você gostaria de falar com um de nossos consultores.

Um especialista da {{company.name}} entrará em contato em breve para atendê-lo pessoalmente.

*Horário de atendimento:* {{company.workingHours}}

Obrigado pela confiança!
Equipe {{company.name}}`,
      priority: 10,
      isActive: true,
      conditions: JSON.stringify({}),
    },
  });

  const genericInquiryTemplate = await prisma.recurrenceMessageTemplate.create({
    data: {
      name: 'Contato Genérico',
      description: 'Mensagem para leads sem interesse específico em produtos',
      trigger: 'generic_inquiry',
      minCaptures: 1,
      content: `Olá {{lead.name}}! 👋

Obrigado por entrar em contato com a {{company.name}}.

Nossa equipe entrará em contato em breve para entender melhor como podemos ajudá-lo.

📞 {{company.phone}}
📧 {{company.email}}

Até breve!`,
      priority: 5,
      isActive: true,
      conditions: JSON.stringify({}),
    },
  });

  console.log('✅ Database seed completed successfully!');
  console.log('\n📊 Created:');
  console.log('  - 2 Teams');
  console.log('  - 5 Users (admin, manager, vendedor, consultor, suporte)');
  console.log('  - 4 Tags (hot, cold, qualified, novo-cliente)');
  console.log('  - 5 Leads');
  console.log('  - 4 Notes');
  console.log('  - 1 Pipeline with 5 Stages');
  console.log('  - 2 Opportunities');
  console.log('  - 2 Communication Templates');
  console.log('  - 1 Automation');
  console.log('  - 3 Generic Message Templates (modal_orcamento, human_contact_request, generic_inquiry)');

  // Create default Landing Page Config
  console.log('\n🎨 Creating default landing page config...');
  await prisma.landingPageConfig.create({
    data: {
      header: JSON.stringify({ logo: { type: 'image', image: { url: '/assets/logo-ferraco.webp', alt: 'Ferraco Equipamentos', objectFit: 'contain' } }, menu: { items: [{ label: 'Início', href: '#inicio' }, { label: 'Sobre', href: '#sobre' }, { label: 'Produtos', href: '#produtos' }, { label: 'Experiência', href: '#experiencia' }, { label: 'Contato', href: '#contato' }] }, cta: { text: 'Solicitar Orçamento', variant: 'secondary' } }),
      hero: JSON.stringify({ title: 'Equipamentos de Qualidade para o Agronegócio', subtitle: 'Soluções completas em equipamentos para pecuária leiteira', cta: { text: 'Solicitar Orçamento', variant: 'default' }, backgroundImage: { url: '/assets/hero-background.webp', alt: 'Ferraco', objectFit: 'cover' } }),
      marquee: JSON.stringify({ enabled: true, items: [{ id: '1', text: '🏆 Mais de 30 anos de experiência', icon: 'Award' }, { id: '2', text: '✨ Qualidade garantida', icon: 'Star' }, { id: '3', text: '🚚 Entrega rápida', icon: 'Truck' }, { id: '4', text: '💯 Satisfação do cliente', icon: 'ThumbsUp' }], speed: 30, backgroundColor: '#f3f4f6', textColor: '#1f2937', iconColor: '#0ea5e9' }),
      about: JSON.stringify({ title: 'Sobre a Ferraco', content: 'Há mais de 30 anos no mercado oferecendo as melhores soluções.', image: { url: '/assets/about-image.webp', alt: 'Sobre', objectFit: 'cover' } }),
      products: JSON.stringify({ title: 'Nossos Produtos', subtitle: 'Equipamentos de alta qualidade', items: [] }),
      experience: JSON.stringify({ title: 'Nossa Experiência', stats: [{ value: '30+', label: 'Anos' }, { value: '5000+', label: 'Clientes' }, { value: '100%', label: 'Qualidade' }] }),
      contact: JSON.stringify({ title: 'Contato', subtitle: 'Estamos prontos para atender', phone: '(11) 99999-9999', email: 'contato@ferraco.com', address: 'São Paulo, SP' }),
      footer: JSON.stringify({ companyName: 'Ferraco Equipamentos', description: 'Soluções completas para pecuária', socialLinks: [] })
    }
  });

  // ============================================================================
  // 📝 TEMPLATES DE AUTOMAÇÃO WHATSAPP
  // ============================================================================
  console.log('\n📝 Creating WhatsApp automation templates...');

  await prisma.recurrenceMessageTemplate.upsert({
    where: { id: 'tpl_modal_orcamento_001' },
    update: {},
    create: {
      id: 'tpl_modal_orcamento_001',
      name: 'Confirmação de Orçamento - Modal',
      description: 'Mensagem automática enviada quando lead solicita orçamento via modal',
      trigger: 'modal_orcamento',
      minCaptures: 1,
      maxCaptures: 1,
      daysSinceLastCapture: null,
      conditions: '{}',
      content: `Olá {{lead.name}}! 👋

Recebemos sua solicitação de orçamento através do nosso site.

Nossa equipe comercial da {{company.name}} entrará em contato com você em até *2 horas úteis* pelo WhatsApp ou telefone.

Enquanto isso, fique à vontade para:
📞 Ligar para {{company.phone}}
📧 Enviar email para {{company.email}}
🌐 Acessar nosso site: {{company.website}}

Obrigado pelo interesse!
Equipe {{company.name}}`,
      mediaUrls: null,
      mediaType: null,
      priority: 10,
      isActive: true,
      usageCount: 0
    }
  });

  await prisma.recurrenceMessageTemplate.upsert({
    where: { id: 'tpl_human_contact_001' },
    update: {},
    create: {
      id: 'tpl_human_contact_001',
      name: 'Solicitação de Atendimento Humano',
      description: 'Mensagem enviada quando lead solicita falar com consultor',
      trigger: 'human_contact_request',
      minCaptures: 1,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: '{}',
      content: `Olá {{lead.name}}! 👋

Entendemos que você gostaria de falar com um de nossos consultores.

Um especialista da {{company.name}} entrará em contato em breve para atendê-lo pessoalmente.

*Horário de atendimento:* {{company.workingHours}}

Obrigado pela confiança!
Equipe {{company.name}}`,
      mediaUrls: null,
      mediaType: null,
      priority: 8,
      isActive: true,
      usageCount: 0
    }
  });

  await prisma.recurrenceMessageTemplate.upsert({
    where: { id: 'tpl_generic_inquiry_001' },
    update: {},
    create: {
      id: 'tpl_generic_inquiry_001',
      name: 'Contato Genérico - Landing Page',
      description: 'Mensagem padrão para leads sem interesse específico',
      trigger: 'generic_inquiry',
      minCaptures: 1,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: '{}',
      content: `Olá {{lead.name}}! 👋

Obrigado por entrar em contato com a {{company.name}}.

Nossa equipe entrará em contato em breve para entender melhor como podemos ajudá-lo.

📞 {{company.phone}}
📧 {{company.email}}

Até breve!`,
      mediaUrls: null,
      mediaType: null,
      priority: 5,
      isActive: true,
      usageCount: 0
    }
  });

  await prisma.recurrenceMessageTemplate.upsert({
    where: { id: 'tpl_chat_no_product_001' },
    update: {},
    create: {
      id: 'tpl_chat_no_product_001',
      name: 'Chat sem Interesse em Produtos',
      description: 'Mensagem para leads do chat que não selecionaram produtos',
      trigger: 'chat_no_interest',
      minCaptures: 1,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: '{}',
      content: `Olá {{lead.name}}! 👋

Vi que você iniciou uma conversa conosco pelo chat, mas não conseguimos finalizar.

Gostaria de conhecer nossos produtos?

*Principais soluções da {{company.name}}:*
🐄 Bebedouros para gado
🏗️ Freestalls
🌾 Equipamentos para fazendas

Um consultor da nossa equipe pode te ajudar a escolher a melhor solução para sua propriedade.

📞 {{company.phone}}

Estou à disposição!
Equipe {{company.name}}`,
      mediaUrls: null,
      mediaType: null,
      priority: 6,
      isActive: true,
      usageCount: 0
    }
  });

  await prisma.recurrenceMessageTemplate.upsert({
    where: { id: 'tpl_product_interest_001' },
    update: {},
    create: {
      id: 'tpl_product_interest_001',
      name: 'Interesse em Produto - Landing Page',
      description: 'Mensagem automática quando lead demonstra interesse em produto específico',
      trigger: 'modal-produto',
      minCaptures: 1,
      maxCaptures: 1,
      daysSinceLastCapture: null,
      conditions: '{}',
      content: `Olá {{lead.name}}! 👋

Obrigado pelo interesse em nosso produto **{{interest}}**! 🎯

Vi que você solicitou orçamento para:
📦 {{interest}}

Nossa equipe está preparando uma proposta personalizada para você.

Posso te ajudar com:
✅ Especificações técnicas do {{interest}}
✅ Orçamento sem compromisso
✅ Prazo de entrega
✅ Formas de pagamento

Qual informação te interessa mais?

📞 {{company.phone}}
📧 {{company.email}}

Aguardo seu retorno!
Equipe {{company.name}}`,
      mediaUrls: null,
      mediaType: null,
      priority: 12, // Alta prioridade - mais específico que orçamento genérico
      isActive: true,
      usageCount: 0
    }
  });

  console.log('✅ 5 automation templates created/updated');

  console.log('\n🔐 Login credentials:');
  console.log('  Admin:      admin@ferraco.com / Admin@123456');
  console.log('  Manager:    manager@ferraco.com / User@123456');
  console.log('  Vendedor:   vendedor@ferraco.com / User@123456');
  console.log('  Consultor:  consultor@ferraco.com / User@123456');
  console.log('  Suporte:    suporte@ferraco.com / User@123456');

  // ============================================================================
  // 📚 Template Library - Biblioteca Centralizada de Templates
  // ============================================================================
  console.log('📚 Creating template library...');

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Boas-vindas Inicial',
      description: 'Mensagem de boas-vindas para novos leads',
      category: 'GENERIC',
      content: 'Olá {{lead.name}}! 👋\n\nSeja bem-vindo(a) à Metalúrgica Ferraco!\n\nSomos especialistas em equipamentos agropecuários de alta qualidade.\n\nComo podemos ajudá-lo(a) hoje?',
      priority: 100,
      isActive: true,
      isSystem: true,
      isFavorite: true,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Apresentação da Empresa',
      description: 'Template para apresentar a empresa',
      category: 'GENERIC',
      content: 'A *{{company.name}}* é líder em soluções agropecuárias há mais de 30 anos.\n\n✅ Produtos de alta qualidade\n✅ Entrega em todo o Brasil\n✅ Garantia e suporte especializado\n\nConheça nossos principais produtos:\n- Bebedouros\n- Comedouros\n- Sistemas de contenção\n- Free stall',
      priority: 90,
      isActive: true,
      isSystem: true,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Solicitação de Orçamento',
      description: 'Template para leads que solicitam orçamento',
      category: 'AUTOMATION',
      content: 'Olá {{lead.name}}!\n\nObrigado pelo interesse em nossos produtos! 📋\n\nPara elaborar um orçamento personalizado, preciso de algumas informações:\n\n1️⃣ Qual produto você tem interesse?\n2️⃣ Quantidade desejada\n3️⃣ Cidade/Estado para cálculo do frete\n\nAguardo seu retorno!',
      priority: 95,
      isActive: true,
      isSystem: false,
      triggerType: 'modal_orcamento',
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Atendimento Humano Solicitado',
      description: 'Template quando o cliente solicita falar com atendente',
      category: 'AUTOMATION',
      content: '{{lead.name}}, entendo! 👨‍💼\n\nVou transferir você para um de nossos consultores especializados.\n\nEm breve alguém da nossa equipe entrará em contato.\n\nObrigado pela preferência!',
      priority: 98,
      isActive: true,
      isSystem: false,
      triggerType: 'human_contact_request',
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Follow-up 1 Captura',
      description: 'Primeira mensagem de recorrência após captura',
      category: 'RECURRENCE',
      content: 'Oi {{lead.name}}! 😊\n\nNotei que você demonstrou interesse em nossos produtos.\n\nGostaria de saber mais sobre:\n\n🐄 Bebedouros para gado\n🌾 Comedouros automáticos\n🔒 Sistemas de contenção\n\nQual te interessa mais?',
      priority: 80,
      isActive: true,
      isSystem: false,
      minCaptures: 1,
      maxCaptures: 1,
      daysSinceCapture: 1,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Follow-up 2-3 Capturas',
      description: 'Mensagem para leads com 2-3 capturas',
      category: 'RECURRENCE',
      content: 'Olá {{lead.name}}!\n\nVejo que você já nos visitou algumas vezes. 🌟\n\n*Oferta Especial:*\nPeça um orçamento hoje e ganhe *10% de desconto* em sua primeira compra!\n\nQuer aproveitar?',
      priority: 75,
      isActive: true,
      isSystem: false,
      minCaptures: 2,
      maxCaptures: 3,
      daysSinceCapture: 3,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Follow-up 4+ Capturas',
      description: 'Mensagem para leads engajados (4+ capturas)',
      category: 'RECURRENCE',
      content: 'Oi {{lead.name}}! 🎯\n\nPercebo que você é um lead super engajado com a Ferraco!\n\nQue tal agendar uma *consulta gratuita* com nosso especialista?\n\nPodemos encontrar a solução perfeita para sua necessidade.\n\nInteresse?',
      priority: 85,
      isActive: true,
      isSystem: false,
      minCaptures: 4,
      daysSinceCapture: 5,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Reativação Lead Frio',
      description: 'Mensagem para reativar leads inativos',
      category: 'RECURRENCE',
      content: '{{lead.name}}, sentimos sua falta! 💙\n\nHá um tempo você demonstrou interesse em nossos produtos.\n\n*Novidades:*\n✨ Novos modelos de bebedouros\n✨ Linha premium de comedouros\n✨ Condições especiais de pagamento\n\nVamos conversar?',
      priority: 60,
      isActive: true,
      isSystem: false,
      daysSinceCapture: 15,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Agradecimento Pós-Contato',
      description: 'Template de agradecimento após interação',
      category: 'GENERIC',
      content: 'Obrigado pelo contato, {{lead.name}}! 🙏\n\nFoi um prazer atendê-lo(a).\n\nEstamos sempre à disposição para ajudar.\n\nAté breve!\n\n*{{company.name}}*\n📞 WhatsApp: {{company.phone}}',
      priority: 70,
      isActive: true,
      isSystem: false,
    },
  });

  await prisma.messageTemplateLibrary.create({
    data: {
      name: 'Informações de Entrega',
      description: 'Template com informações sobre entrega',
      category: 'GENERIC',
      content: 'Informações sobre Entrega - {{company.name}}\n\n📦 *Frete:*\nRealizamos entregas para todo o Brasil via transportadora\n\n⏱️ *Prazo:*\n- Sul/Sudeste: 5-7 dias úteis\n- Norte/Nordeste: 10-15 dias úteis\n\n💰 *Pagamento:*\nAceitamos PIX, cartão e boleto\n\nPrecisa de um orçamento, {{lead.name}}?',
      priority: 65,
      isActive: true,
      isSystem: false,
    },
  });

  console.log('✅ 10 templates criados na biblioteca');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
