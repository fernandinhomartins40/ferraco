import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * Seed inicial de templates de mensagens de recorrência
 * Templates profissionais para diferentes cenários de retorno do lead
 */
export async function seedRecurrenceTemplates() {
  console.log('🌱 Seeding recurrence message templates...');

  const templates = [
    // ============================================================================
    // SEGUNDA CAPTURA - MESMO INTERESSE
    // ============================================================================
    {
      name: '2ª Captura - Mesmo Interesse (Incentivo)',
      description: 'Lead voltou a demonstrar interesse no mesmo produto',
      trigger: 'second_capture_same_interest',
      minCaptures: 2,
      maxCaptures: 2,
      daysSinceLastCapture: null,
      conditions: JSON.stringify({ sameInterest: true }),
      priority: 10,
      content: `Olá {{lead.name}}! 👋

Vi que você voltou a demonstrar interesse em {{currentInterest}}!

Como já conversamos antes sobre este produto, quero te oferecer **condições ESPECIAIS** hoje:

🎁 **15% de desconto** para fechamento imediato
📦 **Frete grátis** acima de R$ 500
⚡ **Entrega prioritária** (7-10 dias úteis)
💰 **Parcelamento** em até 12x sem juros

Essas condições são exclusivas porque você é um cliente que já demonstrou interesse em nossos produtos!

Posso te enviar uma proposta personalizada agora? 📊`,
      isActive: true,
    },

    // ============================================================================
    // SEGUNDA CAPTURA - NOVO INTERESSE (CROSS-SELL)
    // ============================================================================
    {
      name: '2ª Captura - Novo Interesse (Cross-Sell)',
      description: 'Lead voltou com interesse em produto diferente',
      trigger: 'second_capture_new_interest',
      minCaptures: 2,
      maxCaptures: 2,
      daysSinceLastCapture: null,
      conditions: JSON.stringify({ sameInterest: false }),
      priority: 9,
      content: `Oi {{lead.name}}! 😊

Que legal te ver de novo por aqui!

Vi que agora você está interessado em **{{currentInterest}}**.

Como você já conhece a qualidade dos nossos produtos (lembra de {{previousInterests}}?), imagino que esteja expandindo a operação! 🚀

Tenho uma proposta interessante para você:

📦 **COMBO ESPECIAL**
   • {{previousInterests}}
   • {{currentInterest}}

💰 **Vantagens:**
   • Desconto progressivo no combo
   • Frete único para todos os itens
   • Condições facilitadas de pagamento
   • Suporte técnico premium

Quer que eu monte uma proposta personalizada considerando todo o seu interesse?`,
      isActive: true,
    },

    // ============================================================================
    // TERCEIRA CAPTURA - ALTA PRIORIDADE
    // ============================================================================
    {
      name: '3ª Captura - Alta Prioridade (Especialista)',
      description: 'Lead voltou pela 3ª vez - conectar com especialista',
      trigger: 'third_capture_high_value',
      minCaptures: 3,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: JSON.stringify({}),
      priority: 15,
      content: `{{lead.name}}, vi que você voltou pela **{{captureNumber}}ª vez**! 🤩

Isso mostra seu interesse genuíno em nossos produtos, especialmente em **{{currentInterest}}**.

Por reconhecer sua dedicação em buscar a melhor solução, quero te conectar **DIRETAMENTE** com nosso especialista técnico, o **Sr. Fernando Martins**.

🎯 **O que o Fernando pode fazer por você:**
   ✅ Análise técnica personalizada da sua operação
   ✅ Recomendação dos produtos ideais para seu caso
   ✅ Melhor preço do mercado (garantido!)
   ✅ Suporte pós-venda VIP
   ✅ Visita técnica gratuita (se necessário)

📞 **Posso agendar uma conversa hoje ainda?**

Horários disponíveis:
• Manhã (9h-12h)
• Tarde (14h-17h)

Responda com o melhor horário para você!`,
      isActive: true,
    },

    // ============================================================================
    // RECAPTURA APÓS LONGO TEMPO (30+ DIAS)
    // ============================================================================
    {
      name: 'Recaptura após 30+ dias (Reengajamento)',
      description: 'Lead voltou após mais de 30 dias sem contato',
      trigger: 'long_time_return',
      minCaptures: 2,
      maxCaptures: null,
      daysSinceLastCapture: 30,
      conditions: JSON.stringify({}),
      priority: 8,
      content: `Olá {{lead.name}}! 😊

Faz tempo que não conversamos! Vi que você voltou a demonstrar interesse em **{{currentInterest}}**.

**{{daysSinceLastCapture}} dias** se passaram desde nossa última conversa, e tenho ótimas novidades para você! 🎉

🆕 **Novidades desde então:**
   • Novos modelos disponíveis
   • Preços mais competitivos
   • Novas formas de pagamento
   • Programa de fidelidade (acumule descontos!)

**E tem mais:** como você já é conhecido nosso sistema, vou te garantir:
🎁 Desconto de boas-vindas de volta: **10% OFF**
📦 Frete grátis na primeira compra

Posso te atualizar sobre as novidades e montar uma proposta? 💼`,
      isActive: true,
    },

    // ============================================================================
    // LEAD RECORRENTE GENÉRICO (FALLBACK)
    // ============================================================================
    {
      name: 'Lead Recorrente - Mensagem Genérica',
      description: 'Mensagem padrão para qualquer lead recorrente',
      trigger: 'generic_recurrence',
      minCaptures: 2,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: JSON.stringify({}),
      priority: 1,
      content: `Olá {{lead.name}}! 👋

Que bom te ver de volta! Esta é sua **{{captureNumber}}ª visita** demonstrando interesse em nossos produtos.

Isso significa muito para nós! 💚

Vi que você está interessado em **{{currentInterest}}**.

Como você já conhece nosso trabalho, vou ser direto:

🎯 **Proposta Especial para Você:**
   • Condições VIP de pagamento
   • Atendimento prioritário
   • Desconto especial para clientes recorrentes
   • Garantia estendida

Nossa equipe está pronta para te atender com todo carinho e atenção que você merece.

Posso te passar para nosso especialista agora? 📞`,
      isActive: true,
    },

    // ============================================================================
    // ALTA QUALIFICAÇÃO (SCORE >= 60)
    // ============================================================================
    {
      name: 'Lead Recorrente - Alta Qualificação',
      description: 'Lead recorrente com score alto - prioridade máxima',
      trigger: 'high_score_recurrence',
      minCaptures: 2,
      maxCaptures: null,
      daysSinceLastCapture: null,
      conditions: JSON.stringify({ minScore: 60 }),
      priority: 12,
      content: `{{lead.name}}, muito obrigado por voltar! 🌟

Seu perfil foi identificado como **ALTA PRIORIDADE** em nosso sistema (você demonstrou grande interesse em nossos produtos).

Esta é sua **{{captureNumber}}ª captura**, o que nos mostra que você está realmente buscando a melhor solução.

🏆 **Tratamento VIP para você:**
   • Atendimento imediato (sem fila!)
   • Proposta personalizada em até 2 horas
   • Desconto especial de até 20%
   • Condições exclusivas de pagamento
   • Garantia estendida
   • Suporte técnico dedicado

📱 **Vou te conectar AGORA com nosso especialista sênior!**

Aguarde que já estou transferindo... ⏱️`,
      isActive: true,
    },
  ];

  let created = 0;
  let skipped = 0;

  for (const template of templates) {
    const existing = await prisma.recurrenceMessageTemplate.findFirst({
      where: { name: template.name },
    });

    if (existing) {
      console.log(`  ⏭️  Template "${template.name}" já existe, pulando...`);
      skipped++;
      continue;
    }

    await prisma.recurrenceMessageTemplate.create({
      data: template,
    });

    console.log(`  ✅ Template "${template.name}" criado`);
    created++;
  }

  console.log(`\n📊 Resultado: ${created} criados, ${skipped} pulados`);
  console.log('✅ Recurrence templates seeded successfully!\n');
}

// Executar seed se chamado diretamente
if (require.main === module) {
  seedRecurrenceTemplates()
    .catch((error) => {
      console.error('❌ Error seeding recurrence templates:', error);
      process.exit(1);
    })
    .finally(async () => {
      await prisma.$disconnect();
    });
}
