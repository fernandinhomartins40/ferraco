/**
 * Script para criar lead a partir de uma sessão de chatbot existente
 * Uso: npx tsx scripts/create-lead-from-session.ts <sessionId>
 */

import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function createLeadFromSession(sessionId: string) {
  console.log(`\n🔍 Buscando sessão: ${sessionId}\n`);

  const session = await prisma.chatbotSession.findUnique({
    where: { sessionId },
  });

  if (!session) {
    console.error(`❌ Sessão não encontrada: ${sessionId}`);
    process.exit(1);
  }

  console.log(`✅ Sessão encontrada:`);
  console.log(`   - ID: ${session.id}`);
  console.log(`   - Nome: ${session.capturedName || 'N/A'}`);
  console.log(`   - Telefone: ${session.capturedPhone || 'N/A'}`);
  console.log(`   - Email: ${session.capturedEmail || 'N/A'}`);
  console.log(`   - Step atual: ${session.currentStepId}`);
  console.log(`   - Lead ID: ${session.leadId || 'NÃO CRIADO'}`);
  console.log(`   - Qualificado: ${session.isQualified ? 'Sim' : 'Não'}`);
  console.log(`   - Score: ${session.qualificationScore}\n`);

  // Verificar se já existe lead
  if (session.leadId) {
    console.log(`⚠️  Lead já existe: ${session.leadId}`);
    const lead = await prisma.lead.findUnique({
      where: { id: session.leadId },
    });
    if (lead) {
      console.log(`   - Nome: ${lead.name}`);
      console.log(`   - Status: ${lead.status}`);
      console.log(`   - Prioridade: ${lead.priority}\n`);
    }
    return;
  }

  // Validar dados mínimos
  if (!session.capturedName || !session.capturedPhone) {
    console.error(`❌ Sessão não possui dados mínimos (nome e telefone)`);
    process.exit(1);
  }

  // Buscar usuário admin
  const systemUser = await prisma.user.findFirst({
    where: { role: 'ADMIN' },
  });

  if (!systemUser) {
    console.error(`❌ Nenhum usuário ADMIN encontrado no sistema`);
    process.exit(1);
  }

  console.log(`👤 Usuário criador: ${systemUser.name} (${systemUser.email})\n`);

  // Parse user responses
  const userResponses = JSON.parse(session.userResponses || '{}');
  const conversationData = JSON.parse(session.conversationData || '{}');

  // Determinar se é handoff humano
  const isHumanHandoff = session.currentStepId === 'human_handoff';

  // Determinar status e prioridade
  let status = 'NOVO';
  let priority: 'HIGH' | 'MEDIUM' | 'LOW' = 'MEDIUM';

  if (isHumanHandoff) {
    status = 'ATENDIMENTO_HUMANO';
    priority = 'HIGH';
  } else {
    if (session.qualificationScore >= 60) priority = 'HIGH';
    else if (session.qualificationScore >= 40) priority = 'MEDIUM';
    else priority = 'LOW';
  }

  console.log(`📊 Criando lead com:`);
  console.log(`   - Nome: ${session.capturedName}`);
  console.log(`   - Telefone: ${session.capturedPhone}`);
  console.log(`   - Email: ${session.capturedEmail || 'N/A'}`);
  console.log(`   - Status: ${status}`);
  console.log(`   - Prioridade: ${priority}`);
  console.log(`   - Score: ${session.qualificationScore}`);
  console.log(`   - Handoff humano: ${isHumanHandoff ? 'Sim' : 'Não'}\n`);

  // Criar lead
  const lead = await prisma.lead.create({
    data: {
      name: session.capturedName,
      phone: session.capturedPhone,
      email: session.capturedEmail,
      source: conversationData.source || 'Chatbot',
      status: status,
      priority: priority,
      leadScore: session.qualificationScore,
      metadata: JSON.stringify({
        sessionId: session.sessionId,
        interest: session.interest,
        segment: session.segment,
        marketingOptIn: session.marketingOptIn,
        userResponses: session.userResponses,
        requiresHumanAttendance: isHumanHandoff,
        handoffStage: isHumanHandoff ? session.currentStepId : '',
        handoffReason: isHumanHandoff ? 'usuario_pediu_equipe' : '',
        capturedAt: new Date().toISOString(),
        conversationStage: session.currentStage,
      }),
      createdById: systemUser.id,
    },
  });

  console.log(`✅ Lead criado com sucesso!`);
  console.log(`   - ID: ${lead.id}`);
  console.log(`   - Nome: ${lead.name}`);
  console.log(`   - Status: ${lead.status}`);
  console.log(`   - Prioridade: ${lead.priority}\n`);

  // Atualizar sessão
  await prisma.chatbotSession.update({
    where: { id: session.id },
    data: {
      leadId: lead.id,
      isQualified: true,
    },
  });

  console.log(`✅ Sessão atualizada com leadId\n`);
}

const sessionId = process.argv[2];

if (!sessionId) {
  console.error('❌ Uso: npx tsx scripts/create-lead-from-session.ts <sessionId>');
  process.exit(1);
}

createLeadFromSession(sessionId)
  .then(() => {
    console.log('✅ Processo concluído!\n');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Erro:', error);
    process.exit(1);
  })
  .finally(() => {
    prisma.$disconnect();
  });
