/**
 * FLUXO CONVERSACIONAL V2 - COMPLETO E NATURAL
 * Baseado em best practices de captação de leads + explicação de produtos
 * Integrado com banco de dados (produtos, FAQs, empresa)
 */

export interface ConversationStep {
  id: string;
  stage: number;
  name: string;
  botMessage: string;
  options?: Array<{
    id: string;
    label: string;
    nextStepId: string;
    captureAs?: string;
  }>;
  captureInput?: {
    type: 'text' | 'email' | 'phone' | 'name';
    field: string;
    validation?: string;
    nextStepId: string;
  };
  actions?: Array<{
    type: 'increment_score' | 'set_qualified' | 'create_lead' | 'send_notification';
    value?: any;
  }>;
}

/**
 * FLUXO CONVERSACIONAL V2 - ESTRUTURA COMPLETA
 */
export const conversationFlowV2: ConversationStep[] = [
  // ========================================
  // ETAPA 1: BOAS-VINDAS + CAPTURA DE NOME
  // ========================================
  {
    id: 'welcome',
    stage: 1,
    name: 'Boas-vindas',
    botMessage: 'Olá! 👋 Tudo bem?\n\nSou o assistente virtual da {companyName}. Posso te ajudar a conhecer melhor nossos produtos e encontrar a melhor opção pra você.\n\nMas antes, posso saber seu nome pra te chamar direitinho? 😊',
    captureInput: {
      type: 'name',
      field: 'capturedName',
      nextStepId: 'initial_choice',
    },
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 2: ESCOLHA INICIAL
  // ========================================
  {
    id: 'initial_choice',
    stage: 2,
    name: 'Escolha Inicial',
    botMessage: 'Prazer, {nome}! 😄\n\nVocê gostaria de:',
    options: [
      { id: 'opt1', label: '🛍️ Saber mais sobre os produtos', nextStepId: 'show_products', captureAs: 'initial_choice' },
      { id: 'opt2', label: '💬 Falar com um atendente', nextStepId: 'capture_contact_direct', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Tirar uma dúvida rápida', nextStepId: 'faq_question', captureAs: 'initial_choice' },
    ],
    actions: [{ type: 'increment_score', value: 5 }],
  },

  // ========================================
  // ETAPA 3: APRESENTAÇÃO DE PRODUTOS
  // ========================================
  {
    id: 'show_products',
    stage: 3,
    name: 'Lista de Produtos',
    botMessage: 'Perfeito, {nome}! 😄\n\nAqui estão nossos principais produtos:\n\n{productList}\n\nQual desses você quer conhecer melhor?\n\nOu se preferir:',
    options: [
      { id: 'prod1', label: '📦 Produto 1', nextStepId: 'product_interest', captureAs: 'selected_product' },
      { id: 'prod2', label: '📦 Produto 2', nextStepId: 'product_interest', captureAs: 'selected_product' },
      { id: 'prod3', label: '📦 Produto 3', nextStepId: 'product_interest', captureAs: 'selected_product' },
      { id: 'opt_attendant', label: '💼 Falar com atendente', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt_faq', label: '❓ Tirar uma dúvida', nextStepId: 'faq_question', captureAs: 'has_question' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 4: INTERESSE E QUALIFICAÇÃO
  // ========================================
  {
    id: 'product_interest',
    stage: 4,
    name: 'Qualificação de Interesse',
    botMessage: 'Legal! Você escolheu nosso produto de {interesse}. 😄\n\nPosso te perguntar rapidinho — você já conhece esse produto ou é sua primeira vez vendo?',
    options: [
      { id: 'opt1', label: '✅ Já conheço um pouco', nextStepId: 'interest_detail', captureAs: 'familiarity' },
      { id: 'opt2', label: '🆕 Primeira vez', nextStepId: 'interest_detail', captureAs: 'familiarity' },
      { id: 'opt3', label: '⚖️ Estou comparando com outra empresa', nextStepId: 'interest_detail', captureAs: 'familiarity' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 4.5: DETALHAMENTO DE INTERESSE
  // ========================================
  {
    id: 'interest_detail',
    stage: 4,
    name: 'Detalhamento',
    botMessage: 'Entendi! 👍\n\nE o que mais te chamou atenção até agora?\n(Essa resposta me ajuda a entender o que pode te interessar mais.)',
    captureInput: {
      type: 'text',
      field: 'interest',
      nextStepId: 'product_presentation_choice',
    },
    actions: [{ type: 'increment_score', value: 20 }],
  },

  // ========================================
  // ETAPA 5: ESCOLHA DO TIPO DE APRESENTAÇÃO
  // ========================================
  {
    id: 'product_presentation_choice',
    stage: 5,
    name: 'Tipo de Apresentação',
    botMessage: 'Show! Temos ótimas opções nessa linha.\n\nQuer que eu te mostre os benefícios, os modelos e planos, ou ambos?',
    options: [
      { id: 'opt1', label: '✨ Benefícios', nextStepId: 'product_details', captureAs: 'wants_benefits' },
      { id: 'opt2', label: '📋 Modelos / Planos', nextStepId: 'product_details', captureAs: 'wants_models' },
      { id: 'opt3', label: '🎯 Ambos', nextStepId: 'product_details', captureAs: 'wants_both' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 6: APRESENTAÇÃO DETALHADA
  // ========================================
  {
    id: 'product_details',
    stage: 6,
    name: 'Detalhes do Produto',
    botMessage: 'Perfeito, {nome}! 😄\n\nAqui estão os detalhes:\n\n{productDetails}\n\n✨ Principais benefícios:\n{productBenefits}\n\nAlém desse, temos outras opções que talvez te interessem:\n{relatedProducts}\n\nO que você gostaria de fazer agora?',
    options: [
      { id: 'opt1', label: '👀 Ver exemplos reais', nextStepId: 'show_examples', captureAs: 'wants_examples' },
      { id: 'opt2', label: '💰 Saber valores', nextStepId: 'capture_contact', captureAs: 'wants_pricing' },
      { id: 'opt3', label: '❓ Tirar uma dúvida', nextStepId: 'product_question', captureAs: 'has_question' },
      { id: 'opt4', label: '🔄 Conhecer outro produto', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 6.5: EXEMPLOS REAIS
  // ========================================
  {
    id: 'show_examples',
    stage: 6,
    name: 'Exemplos Reais',
    botMessage: 'Ótimo! Olha só alguns exemplos de como nossos clientes estão usando:\n\n{examples}\n\nQuer que eu te envie uma simulação personalizada com valores e condições especiais?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero simulação', nextStepId: 'capture_contact', captureAs: 'wants_simulation' },
      { id: 'opt2', label: '💰 Quero só os valores', nextStepId: 'capture_contact', captureAs: 'wants_pricing' },
      { id: 'opt3', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
    actions: [{ type: 'increment_score', value: 20 }],
  },

  // ========================================
  // ETAPA 6.6: DÚVIDA SOBRE PRODUTO
  // ========================================
  {
    id: 'product_question',
    stage: 6,
    name: 'Dúvida Específica',
    botMessage: 'Claro, {nome}! Pode perguntar, estou aqui pra te ajudar. 😊',
    captureInput: {
      type: 'text',
      field: 'specific_question',
      nextStepId: 'after_question',
    },
  },

  {
    id: 'after_question',
    stage: 6,
    name: 'Após Responder Dúvida',
    botMessage: 'Espero ter esclarecido! 😊\n\nQuer aproveitar e eu te mando mais informações completas no WhatsApp ou prefere falar com um especialista agora?',
    options: [
      { id: 'opt1', label: '📱 Manda no WhatsApp', nextStepId: 'capture_contact', captureAs: 'prefers_whatsapp' },
      { id: 'opt2', label: '💬 Falar com especialista', nextStepId: 'capture_contact_direct', captureAs: 'wants_specialist' },
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
    botMessage: 'Que ótimo, {nome}! 😄\n\nPosso te enviar as informações completas e uma simulação personalizada.\n\nQual o melhor número de WhatsApp pra eu te mandar os detalhes? 📱',
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
    botMessage: 'Perfeito, {nome}! Vou te conectar com um de nossos especialistas.\n\nQual o melhor número de WhatsApp pra ele entrar em contato? 📱',
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
    botMessage: 'Perfeito! Assim consigo te enviar novidades e promoções relacionadas ao que você mencionou.\n\nQuer que eu te encaminhe agora pra um consultor especializado pra conversar com você?',
    options: [
      { id: 'opt1', label: '👤 Sim, quero falar com consultor', nextStepId: 'handoff_confirmation', captureAs: 'wants_consultant' },
      { id: 'opt2', label: '📱 Pode mandar por WhatsApp', nextStepId: 'marketing_consent', captureAs: 'prefers_whatsapp' },
      { id: 'opt3', label: '👀 Prefiro só olhar por aqui', nextStepId: 'continue_browsing', captureAs: 'self_service' },
    ],
  },

  // ========================================
  // ETAPA 9: CONFIRMAÇÃO DE HANDOFF
  // ========================================
  {
    id: 'handoff_confirmation',
    stage: 9,
    name: 'Confirmação de Transferência',
    botMessage: 'Perfeito, {nome}! 😄\n\nNosso time vai entrar em contato com você no {capturedPhone} o quanto antes.\n\nEnquanto isso, você pode conferir mais detalhes aqui:\n📍 {companyAddress}\n📞 {companyPhone}\n\nPosso te avisar quando lançarmos novidades sobre {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Sim, pode me avisar', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_in' },
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
    botMessage: 'Fechou! Vou te mandar tudo certinho no WhatsApp.\n\nPosso te avisar quando lançarmos novidades sobre {interesse}?',
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
    botMessage: 'Tranquilo, {nome}! Pode explorar à vontade. 😊\n\nSe quiser continuar explorando, posso te mostrar mais produtos.',
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
    botMessage: 'Claro, {nome}! Me conta sua dúvida. 😄',
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
    botMessage: '{faqAnswer}\n\nIsso respondeu sua dúvida? Quer aproveitar e ver nossos produtos ou prefere falar com um atendente agora?',
    options: [
      { id: 'opt1', label: '🛍️ Ver produtos', nextStepId: 'show_products', captureAs: 'explore_products' },
      { id: 'opt2', label: '💬 Falar com atendente', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt3', label: '❓ Tenho outra dúvida', nextStepId: 'faq_question', captureAs: 'another_question' },
      { id: 'opt4', label: '👋 Só isso mesmo', nextStepId: 'closing_simple', captureAs: 'end_chat' },
    ],
  },

  // ========================================
  // ETAPA 13: ENCERRAMENTOS
  // ========================================
  {
    id: 'closing_with_lead',
    stage: 10,
    name: 'Encerramento com Lead',
    botMessage: 'Obrigado, {nome}! 🙌\n\nSe quiser continuar explorando, posso te mostrar mais produtos.\n\nFoi um prazer te atender! 😊',
    options: [
      { id: 'opt1', label: '🔄 Ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Encerrar conversa', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing',
    stage: 10,
    name: 'Encerramento Padrão',
    botMessage: 'Fechou, {nome}! Obrigado pelo seu tempo! 😊\n\nQualquer dúvida, estou por aqui. É só chamar!\n\n📞 {companyPhone}\n📍 {companyAddress}\n\nSe quiser explorar mais:',
    options: [
      { id: 'opt1', label: '🔄 Ver produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Até mais', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing_simple',
    stage: 10,
    name: 'Encerramento Simples',
    botMessage: 'Obrigado, {nome}! 😊\n\nQualquer coisa é só chamar. Até mais! 👋',
    options: [],
  },

  {
    id: 'closing_final',
    stage: 10,
    name: 'Encerramento Final',
    botMessage: 'Foi um prazer te atender, {nome}! 😊\n\nAté a próxima! 👋\n\n📞 {companyPhone}\n📍 {companyAddress}',
    options: [],
  },
];

/**
 * Substitui variáveis dinâmicas na mensagem
 */
export function replaceVariablesV2(
  message: string,
  data: {
    nome?: string;
    interesse?: string;
    companyName?: string;
    companyDescription?: string;
    companyAddress?: string;
    companyPhone?: string;
    capturedPhone?: string;
    productList?: string;
    productDetails?: string;
    productBenefits?: string;
    relatedProducts?: string;
    examples?: string;
    faqAnswer?: string;
    [key: string]: any;
  }
): string {
  let result = message;

  Object.keys(data).forEach(key => {
    if (data[key] !== undefined && data[key] !== null) {
      const regex = new RegExp(`\\{${key}\\}`, 'g');
      result = result.replace(regex, String(data[key]));
    }
  });

  return result;
}

/**
 * Calcula score de qualificação
 */
export function calculateQualificationScoreV2(session: any): number {
  let score = 0;

  if (session.capturedName) score += 15;
  if (session.capturedPhone) score += 30;
  if (session.capturedEmail) score += 20;
  if (session.interest) score += 20;
  if (session.segment) score += 10;
  if (session.currentStage >= 6) score += 15;

  return score;
}
