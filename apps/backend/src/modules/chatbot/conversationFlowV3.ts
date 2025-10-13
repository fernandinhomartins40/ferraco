/**
 * FLUXO CONVERSACIONAL V3 - OTIMIZADO COM DADOS REAIS
 * Melhorias baseadas na auditoria completa:
 * ✅ Opções dinâmicas de produtos
 * ✅ Detalhes reais dos produtos
 * ✅ Qualificação inteligente (scoring v3)
 * ✅ Perguntas de qualificação estratégicas
 * ✅ FAQ com busca por similaridade
 */

import { ConversationStep } from './conversationFlowV2';

export const conversationFlowV3: ConversationStep[] = [
  // ========================================
  // ETAPA 1: BOAS-VINDAS + CAPTURA DE NOME
  // ========================================
  {
    id: 'welcome',
    stage: 1,
    name: 'Boas-vindas',
    botMessage: 'Olá! 👋\n\nSou o assistente virtual da {companyName}.\n\nEspecialistas em equipamentos para pecuária leiteira há mais de 25 anos! 🐄\n\nPosso saber seu nome para te atender melhor?',
    captureInput: {
      type: 'name',
      field: 'capturedName',
      nextStepId: 'context_check',
    },
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 1.5: VERIFICAR CONTEXTO
  // ========================================
  {
    id: 'context_check',
    stage: 1,
    name: 'Contexto',
    botMessage: 'Que bom te conhecer, {nome}! 😄\n\nVocê trabalha com pecuária leiteira ou está pesquisando para alguém?',
    options: [
      { id: 'opt1', label: '🐄 Sou produtor rural', nextStepId: 'qualification_producer', captureAs: 'user_type' },
      { id: 'opt2', label: '👔 Trabalho no setor', nextStepId: 'qualification_professional', captureAs: 'user_type' },
      { id: 'opt3', label: '🔍 Pesquisando para terceiros', nextStepId: 'qualification_proxy', captureAs: 'user_type' },
      { id: 'opt4', label: '💬 Prefiro não dizer', nextStepId: 'initial_choice', captureAs: 'user_type' },
    ],
    actions: [{ type: 'increment_score', value: 5 }],
  },

  // ========================================
  // ETAPA 2: QUALIFICAÇÃO ESTRATÉGICA
  // ========================================
  {
    id: 'qualification_producer',
    stage: 2,
    name: 'Qualificação Produtor',
    botMessage: 'Perfeito, {nome}! 👨‍🌾\n\nPosso saber o tamanho do seu rebanho? Isso me ajuda a te recomendar os produtos mais adequados.',
    options: [
      { id: 'opt1', label: '🐄 Até 50 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt2', label: '🐄 51-200 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt3', label: '🐄 201-500 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt4', label: '🐄 Mais de 500 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
    ],
    actions: [{ type: 'increment_score', value: 15 }], // B2B vale mais
  },

  {
    id: 'qualification_professional',
    stage: 2,
    name: 'Qualificação Profissional',
    botMessage: 'Legal, {nome}! 👔\n\nVocê é consultor, veterinário, engenheiro ou trabalha em qual área?',
    options: [
      { id: 'opt1', label: '🩺 Veterinário/Zootecnista', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt2', label: '🏗️ Engenheiro/Arquiteto Rural', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt3', label: '💼 Consultor/Assessor', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt4', label: '🏪 Revenda/Distribuição', nextStepId: 'initial_choice', captureAs: 'profession' },
    ],
    actions: [{ type: 'increment_score', value: 20 }], // Influenciadores valem muito
  },

  {
    id: 'qualification_proxy',
    stage: 2,
    name: 'Qualificação Terceiros',
    botMessage: 'Entendi, {nome}! 🔍\n\nVocê está ajudando um familiar, amigo ou cliente?',
    options: [
      { id: 'opt1', label: '👨‍👩‍👧 Familiar', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt2', label: '👥 Amigo/Conhecido', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt3', label: '💼 Cliente/Parceiro', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 3: ESCOLHA INICIAL
  // ========================================
  {
    id: 'initial_choice',
    stage: 3,
    name: 'Escolha Inicial',
    botMessage: 'Ótimo, {nome}! Agora me conta, como posso te ajudar hoje?',
    options: [
      { id: 'opt1', label: '🛍️ Conhecer produtos', nextStepId: 'show_products', captureAs: 'initial_choice' },
      { id: 'opt2', label: '💰 Solicitar orçamento', nextStepId: 'budget_question', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Tirar uma dúvida', nextStepId: 'faq_question', captureAs: 'initial_choice' },
      { id: 'opt4', label: '💬 Falar com atendente', nextStepId: 'capture_contact_direct', captureAs: 'initial_choice' },
    ],
    actions: [{ type: 'increment_score', value: 5 }],
  },

  // ========================================
  // ETAPA 3.5: PERGUNTA SOBRE ORÇAMENTO
  // ========================================
  {
    id: 'budget_question',
    stage: 3,
    name: 'Questão de Orçamento',
    botMessage: 'Perfeito, {nome}! Vou te ajudar com o orçamento. 💰\n\nVocê já sabe qual produto precisa ou quer que eu te mostre as opções primeiro?',
    options: [
      { id: 'opt1', label: '✅ Já sei qual produto', nextStepId: 'show_products', captureAs: 'knows_product' },
      { id: 'opt2', label: '🤔 Quero ver as opções', nextStepId: 'show_products', captureAs: 'exploring' },
      { id: 'opt3', label: '💬 Prefiro falar direto', nextStepId: 'capture_contact_direct', captureAs: 'wants_direct' },
    ],
    actions: [{ type: 'increment_score', value: 20 }], // Quer orçamento = quente
  },

  // ========================================
  // ETAPA 4: APRESENTAÇÃO DE PRODUTOS (Dinâmica)
  // ========================================
  {
    id: 'show_products',
    stage: 4,
    name: 'Lista de Produtos',
    botMessage: 'Ótimo, {nome}! 😄\n\nEsses são nossos principais produtos:\n\n{productList}\n\n👇 Qual você quer conhecer melhor?',
    options: [
      // OPÇÕES DINÂMICAS serão inseridas aqui pelo service
      // Formato: { id: 'prod_X', label: '📦 Nome Real', nextStepId: 'product_details', captureAs: 'selected_product' }
      { id: 'opt_attendant', label: '💬 Falar com especialista', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt_faq', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'has_question' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 5: DETALHES DO PRODUTO (Dados Reais)
  // ========================================
  {
    id: 'product_details',
    stage: 5,
    name: 'Detalhes do Produto',
    botMessage: 'Excelente escolha, {nome}! 🎯\n\n{productDetails}\n\n✨ **Principais benefícios:**\n{productBenefits}\n\n💡 **Você também pode gostar:**\n{relatedProducts}\n\nO que você gostaria de fazer agora?',
    options: [
      { id: 'opt1', label: '💰 Consultar valores', nextStepId: 'pricing_urgency', captureAs: 'wants_pricing' },
      { id: 'opt2', label: '📱 Receber no WhatsApp', nextStepId: 'capture_contact', captureAs: 'wants_whatsapp' },
      { id: 'opt3', label: '❓ Fazer uma pergunta', nextStepId: 'product_question', captureAs: 'has_question' },
      { id: 'opt4', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 5.5: URGÊNCIA DE PREÇO
  // ========================================
  {
    id: 'pricing_urgency',
    stage: 5,
    name: 'Urgência de Preço',
    botMessage: 'Entendi, {nome}! 💰\n\nPara quando você precisa? Isso me ajuda a te passar valores e prazos mais precisos.',
    options: [
      { id: 'opt1', label: '🔥 Urgente (até 15 dias)', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt2', label: '📅 1-2 meses', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt3', label: '📆 3+ meses (planejando)', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt4', label: '🤔 Ainda não defini', nextStepId: 'capture_contact', captureAs: 'urgency' },
    ],
    actions: [{ type: 'increment_score', value: 25 }], // Urgência = lead quente
  },

  // ========================================
  // ETAPA 6: PERGUNTA SOBRE PRODUTO
  // ========================================
  {
    id: 'product_question',
    stage: 5,
    name: 'Dúvida Específica',
    botMessage: 'Claro, {nome}! Pode perguntar, estou aqui pra te ajudar. 😊\n\nQual sua dúvida sobre o {interesse}?',
    captureInput: {
      type: 'text',
      field: 'specific_question',
      nextStepId: 'after_question',
    },
    actions: [{ type: 'increment_score', value: 10 }],
  },

  {
    id: 'after_question',
    stage: 5,
    name: 'Após Responder Dúvida',
    botMessage: 'Espero ter ajudado! 😊\n\nO ideal é que um especialista te passe mais detalhes técnicos. Quer que eu te conecte agora?',
    options: [
      { id: 'opt1', label: '👤 Sim, quero falar agora', nextStepId: 'capture_contact_direct', captureAs: 'wants_specialist' },
      { id: 'opt2', label: '📱 Me manda no WhatsApp', nextStepId: 'capture_contact', captureAs: 'prefers_whatsapp' },
      { id: 'opt3', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
  },

  // ========================================
  // ETAPA 7: CAPTAÇÃO ESTRATÉGICA
  // ========================================
  {
    id: 'capture_contact',
    stage: 7,
    name: 'Captação de Contato',
    botMessage: 'Perfeito, {nome}! 😄\n\nVou te enviar todas as informações de {interesse} no WhatsApp, junto com:\n• Especificações técnicas completas\n• Valores e condições\n• Fotos e vídeos de instalação\n• Casos de sucesso\n\nQual seu melhor número de WhatsApp? 📱',
    captureInput: {
      type: 'phone',
      field: 'capturedPhone',
      validation: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
      nextStepId: 'contact_choice',
    },
    actions: [
      { type: 'increment_score', value: 30 },
      { type: 'set_qualified', value: true },
    ],
  },

  {
    id: 'capture_contact_direct',
    stage: 7,
    name: 'Captação Direta para Atendente',
    botMessage: 'Ótimo, {nome}! 👨‍💼\n\nVou te conectar com um especialista da nossa equipe que vai tirar todas as suas dúvidas.\n\nQual o melhor número para ele entrar em contato? 📱',
    captureInput: {
      type: 'phone',
      field: 'capturedPhone',
      validation: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
      nextStepId: 'handoff_confirmation',
    },
    actions: [
      { type: 'increment_score', value: 40 },
      { type: 'set_qualified', value: true },
    ],
  },

  // ========================================
  // ETAPA 8: ESCOLHA DE ENCAMINHAMENTO
  // ========================================
  {
    id: 'contact_choice',
    stage: 8,
    name: 'Escolha de Encaminhamento',
    botMessage: 'Anotado: {capturedPhone} ✅\n\nVocê prefere que um especialista entre em contato hoje mesmo ou prefere receber primeiro o material e depois decidir?',
    options: [
      { id: 'opt1', label: '📞 Quero falar hoje', nextStepId: 'handoff_confirmation', captureAs: 'wants_call_today' },
      { id: 'opt2', label: '📱 Só o material por enquanto', nextStepId: 'marketing_consent', captureAs: 'prefers_whatsapp_only' },
      { id: 'opt3', label: '👀 Deixa eu ver primeiro', nextStepId: 'continue_browsing', captureAs: 'self_service' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 9: CONFIRMAÇÃO DE HANDOFF
  // ========================================
  {
    id: 'handoff_confirmation',
    stage: 9,
    name: 'Confirmação de Transferência',
    botMessage: 'Fechado, {nome}! 🤝\n\nNosso time vai entrar em contato no {capturedPhone} ainda hoje.\n\nEnquanto isso, você pode ver mais no nosso site:\n🌐 {companyWebsite}\n📍 {companyAddress}\n📞 {companyPhone}\n\n⏰ **Horário de atendimento:**\n{workingHours}\n\nPosso te avisar sobre novidades e promoções de {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Sim, pode avisar', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não, obrigado', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // ETAPA 10: CONSENTIMENTO DE MARKETING
  // ========================================
  {
    id: 'marketing_consent',
    stage: 9,
    name: 'Consentimento Marketing',
    botMessage: 'Beleza! Vou te mandar tudo certinho no {capturedPhone}. 📱\n\nPosso te avisar quando tivermos promoções de {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero receber', nextStepId: 'closing', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não, obrigado', nextStepId: 'closing', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // ETAPA 11: CONTINUAR NAVEGANDO
  // ========================================
  {
    id: 'continue_browsing',
    stage: 8,
    name: 'Continuar Navegando',
    botMessage: 'Sem problema, {nome}! 😊\n\nFique à vontade para explorar. Se precisar de algo, é só chamar!\n\nQuer continuar vendo produtos ou tem alguma dúvida?',
    options: [
      { id: 'opt1', label: '🔄 Ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'has_question' },
      { id: 'opt3', label: '👋 Encerrar conversa', nextStepId: 'closing_simple', captureAs: 'end_chat' },
    ],
    actions: [
      { type: 'create_lead' },
    ],
  },

  // ========================================
  // ETAPA 12: FAQ INTELIGENTE
  // ========================================
  {
    id: 'faq_question',
    stage: 3,
    name: 'Pergunta FAQ',
    botMessage: 'Claro, {nome}! Me conta sua dúvida que vou te ajudar. 😄',
    captureInput: {
      type: 'text',
      field: 'faq_question',
      nextStepId: 'faq_response',
    },
  },

  {
    id: 'faq_response',
    stage: 3,
    name: 'Resposta FAQ',
    botMessage: '{faqAnswer}\n\n---\n\nIsso respondeu sua dúvida, {nome}? 🤔',
    options: [
      { id: 'opt1', label: '✅ Sim, obrigado!', nextStepId: 'post_faq_action', captureAs: 'faq_helpful' },
      { id: 'opt2', label: '❌ Não, quero mais detalhes', nextStepId: 'capture_contact_direct', captureAs: 'faq_not_helpful' },
      { id: 'opt3', label: '❓ Tenho outra dúvida', nextStepId: 'faq_question', captureAs: 'another_question' },
    ],
  },

  {
    id: 'post_faq_action',
    stage: 3,
    name: 'Pós-FAQ',
    botMessage: 'Que bom que ajudei! 😊\n\nQuer aproveitar e ver nossos produtos ou prefere encerrar por aqui?',
    options: [
      { id: 'opt1', label: '🛍️ Ver produtos', nextStepId: 'show_products', captureAs: 'explore_products' },
      { id: 'opt2', label: '💬 Falar com atendente', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt3', label: '👋 Encerrar conversa', nextStepId: 'closing_simple', captureAs: 'end_chat' },
    ],
  },

  // ========================================
  // ETAPA 13: ENCERRAMENTOS
  // ========================================
  {
    id: 'closing_with_lead',
    stage: 10,
    name: 'Encerramento com Lead',
    botMessage: 'Obrigado, {nome}! 🙌\n\nNosso time vai entrar em contato em breve.\n\nSe quiser explorar mais produtos enquanto isso, é só me chamar!',
    options: [
      { id: 'opt1', label: '🔄 Ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Até logo!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing',
    stage: 10,
    name: 'Encerramento Padrão',
    botMessage: 'Fechou, {nome}! Muito obrigado pelo seu tempo! 🙏\n\nVou te mandar as informações no WhatsApp.\n\nQualquer dúvida, é só chamar!\n\n📞 {companyPhone}\n📍 {companyAddress}\n\nSe quiser continuar explorando:',
    options: [
      { id: 'opt1', label: '🔄 Ver produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Até mais!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing_simple',
    stage: 10,
    name: 'Encerramento Simples',
    botMessage: 'Obrigado, {nome}! 😊\n\nFoi um prazer te atender. Qualquer coisa é só chamar! 👋\n\n📞 {companyPhone}\n🌐 {companyWebsite}',
    options: [],
  },

  {
    id: 'closing_final',
    stage: 10,
    name: 'Encerramento Final',
    botMessage: 'Foi um prazer te atender, {nome}! 😊\n\nAté a próxima! 👋\n\n---\n📞 {companyPhone}\n📍 {companyAddress}\n🌐 {companyWebsite}\n⏰ {workingHours}',
    options: [],
  },
];

/**
 * Calcula score de qualificação V3 - MELHORADO
 * Considera comportamento, não apenas dados capturados
 */
export function calculateQualificationScoreV3(session: any, messageCount: number = 0): number {
  let score = 0;

  // ========================================
  // 1. DADOS BÁSICOS (50 pontos máximo)
  // ========================================
  if (session.capturedName) score += 10;
  if (session.capturedPhone) score += 25; // Telefone vale muito
  if (session.capturedEmail) score += 15;

  // ========================================
  // 2. ENGAJAMENTO (30 pontos máximo)
  // ========================================
  // Número de mensagens
  if (messageCount >= 5) score += 10;
  if (messageCount >= 10) score += 5;
  if (messageCount >= 15) score += 5;

  // Tempo de conversa (se disponível)
  if (session.startedAt) {
    const now = session.endedAt || new Date();
    const timeSpent = (now.getTime() - new Date(session.startedAt).getTime()) / 1000; // segundos
    if (timeSpent > 120) score += 10; // Mais de 2 minutos
  }

  // ========================================
  // 3. INTERESSE E INTENÇÃO (40 pontos máximo)
  // ========================================
  if (session.interest) score += 10;
  if (session.segment) score += 5;

  // Profundidade no funil (estágio alcançado)
  if (session.currentStage >= 4) score += 5; // Viu produtos
  if (session.currentStage >= 5) score += 5; // Viu detalhes
  if (session.currentStage >= 7) score += 10; // Chegou na captação

  // ========================================
  // 4. QUALIFICADORES ESPECIAIS (bonus até 30 pontos)
  // ========================================
  const responses = JSON.parse(session.userResponses || '{}');

  // Sinais de alta intenção
  if (responses.wants_pricing) score += 15; // Perguntou preço = lead quente
  if (responses.wants_simulation) score += 20; // Quer simulação = muito quente
  if (responses.initial_choice === '💰 Solicitar orçamento') score += 15;

  // Qualificação de contexto
  if (responses.user_type === '🐄 Sou produtor rural') score += 10; // B2C direto
  if (responses.user_type === '👔 Trabalho no setor') score += 15; // B2B influenciador
  if (responses.profession === '💼 Consultor/Assessor') score += 10; // Multiplicador

  // Tamanho do negócio (rebanho)
  if (responses.herd_size?.includes('201-500')) score += 10;
  if (responses.herd_size?.includes('Mais de 500')) score += 15;

  // Urgência
  if (responses.urgency === '🔥 Urgente (até 15 dias)') score += 20; // Muito quente
  if (responses.urgency === '📅 1-2 meses') score += 10;

  // Familiaridade com produto
  if (responses.familiarity === '⚖️ Estou comparando com outra empresa') score += 15; // Está decidindo

  // Marketing opt-in
  if (session.marketingOptIn) score += 5;

  // Não deixar passar de 100
  return Math.min(score, 100);
}

/**
 * Busca FAQ por similaridade simples (fuzzy match)
 */
export function findBestFAQ(userQuestion: string, faqs: any[]): any | null {
  if (!faqs || faqs.length === 0) return null;

  const normalizedQuestion = userQuestion.toLowerCase().trim();

  // Buscar por palavras-chave
  const scores = faqs.map(faq => {
    const normalizedFAQ = faq.question.toLowerCase();
    let score = 0;

    // Match exato
    if (normalizedFAQ.includes(normalizedQuestion)) {
      score += 100;
    }

    // Match de palavras individuais
    const userWords = normalizedQuestion.split(/\s+/).filter(w => w.length > 3);
    const faqWords = normalizedFAQ.split(/\s+/);

    userWords.forEach(word => {
      if (faqWords.some(fw => fw.includes(word) || word.includes(fw))) {
        score += 20;
      }
    });

    return { faq, score };
  });

  const best = scores.sort((a, b) => b.score - a.score)[0];

  // Threshold mínimo de 40 pontos
  return best.score >= 40 ? best.faq : null;
}

/**
 * Recomenda produtos relacionados
 */
export function recommendRelatedProducts(
  selectedProductName: string,
  allProducts: any[],
  limit: number = 2
): any[] {
  if (!allProducts || allProducts.length <= 1) return [];

  // Filtrar produto atual
  const otherProducts = allProducts.filter(p => p.name !== selectedProductName);

  // Por enquanto, retornar os próximos 2 (pode melhorar com lógica de tags/categorias)
  return otherProducts.slice(0, limit);
}
