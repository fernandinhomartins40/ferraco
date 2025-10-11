import { PrismaClient } from '@prisma/client';
import { hashPassword } from '../src/utils/password';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Clean existing data (optional - comment out if you want to keep existing data)
  console.log('🧹 Cleaning existing data...');
  await prisma.auditLog.deleteMany();
  await prisma.refreshToken.deleteMany();
  await prisma.note.deleteMany();
  await prisma.lead.deleteMany();
  await prisma.tag.deleteMany();
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
        connect: [{ id: hotTag.id }, { id: qualifiedTag.id }],
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
        connect: [{ id: qualifiedTag.id }],
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
        connect: [{ id: coldTag.id }],
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
        connect: [{ id: hotTag.id }, { id: qualifiedTag.id }, { id: newCustomerTag.id }],
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
  console.log('\n🔐 Login credentials:');
  console.log('  Admin:      admin@ferraco.com / Admin@123456');
  console.log('  Manager:    manager@ferraco.com / User@123456');
  console.log('  Vendedor:   vendedor@ferraco.com / User@123456');
  console.log('  Consultor:  consultor@ferraco.com / User@123456');
  console.log('  Suporte:    suporte@ferraco.com / User@123456');
}

main()
  .catch((e) => {
    console.error('❌ Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
