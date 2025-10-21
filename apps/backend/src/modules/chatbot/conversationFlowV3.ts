/**
 * FLUXO CONVERSACIONAL V3 - ATUALIZADO CONFORME DOCUMENTO
 * Principais mudanças:
 * ✅ Captura de WhatsApp antecipada (logo após nome)
 * ✅ Opção "Falar com a equipe" em todas as etapas após captura inicial
 * ✅ Handoff para atendimento humano (status ATENDIMENTO_HUMANO)
 * ✅ Qualificação por ramo de atividade (não mais por tamanho de rebanho)
 * ✅ Sistema de scoring ajustado
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
    botMessage: 'Olá! Tudo bem? 😊\n\nSou o assistente virtual da {companyName}. É um prazer ter você por aqui!\n\nAntes de falarmos sobre nossos produtos, como posso te chamar?',
    captureInput: {
      type: 'name',
      field: 'capturedName',
      nextStepId: 'capture_whatsapp',
    },
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 2: CAPTURA DE WHATSAPP (ANTECIPADA)
  // ========================================
  {
    id: 'capture_whatsapp',
    stage: 2,
    name: 'Captura WhatsApp',
    botMessage: 'Prazer em te conhecer, {nome}! 😊\n\nPara que eu possa deixar anotado aqui, qual o melhor número de WhatsApp para entrarmos em contato?',
    captureInput: {
      type: 'phone',
      field: 'capturedPhone',
      validation: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
      nextStepId: 'context_check',
    },
    actions: [{ type: 'increment_score', value: 30 }], // Pontuação alta pois é essencial
  },

  // ========================================
  // ETAPA 3: VERIFICAÇÃO DE CONTEXTO
  // ========================================
  {
    id: 'context_check',
    stage: 3,
    name: 'Verificação de Contexto',
    botMessage: 'Perfeito! Anotei aqui: {capturedPhone} ✅\n\nAgora me conta, {nome}, você trabalha com pecuária?',
    options: [
      { id: 'opt1', label: '🐄 Sim, sou produtor rural', nextStepId: 'qualification_producer', captureAs: 'user_type' },
      { id: 'opt2', label: '👔 Trabalho no setor agro', nextStepId: 'qualification_professional', captureAs: 'user_type' },
      { id: 'opt3', label: '🔍 Estou pesquisando pra alguém', nextStepId: 'qualification_proxy', captureAs: 'user_type' },
      { id: 'opt4', label: '💬 Só quero conhecer os produtos', nextStepId: 'initial_choice', captureAs: 'user_type' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 3.1: QUALIFICAÇÃO PRODUTOR (ATUALIZADO)
  // ========================================
  {
    id: 'qualification_producer',
    stage: 3,
    name: 'Qualificação Produtor',
    botMessage: 'Que legal, {nome}! Adoro conversar com quem está direto na lida. 👨‍🌾\n\nMe conta, qual o seu ramo de atividade?',
    options: [
      { id: 'opt1', label: '🥛 Pecuária leiteira', nextStepId: 'initial_choice', captureAs: 'activity' },
      { id: 'opt2', label: '🥩 Pecuária de corte', nextStepId: 'initial_choice', captureAs: 'activity' },
      { id: 'opt3', label: '🌾 Agricultura', nextStepId: 'initial_choice', captureAs: 'activity' },
      { id: 'opt4', label: '🔄 Outros', nextStepId: 'initial_choice', captureAs: 'activity' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 3.2: QUALIFICAÇÃO PROFISSIONAL
  // ========================================
  {
    id: 'qualification_professional',
    stage: 3,
    name: 'Qualificação Profissional',
    botMessage: 'Entendi, {nome}! Que bacana. 👔\n\nVocê atua em qual área especificamente?',
    options: [
      { id: 'opt1', label: '🩺 Veterinário/Zootecnista', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt2', label: '🏗️ Engenheiro/Arquiteto Rural', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt3', label: '💼 Consultor/Assessor Técnico', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt4', label: '🏪 Trabalho com revenda', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 3.3: QUALIFICAÇÃO TERCEIROS
  // ========================================
  {
    id: 'qualification_proxy',
    stage: 3,
    name: 'Qualificação Terceiros',
    botMessage: 'Ah, que legal você estar ajudando! 😊\n\nÉ pra um familiar, amigo ou cliente?',
    options: [
      { id: 'opt1', label: '👨‍👩‍👧 É pra família', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt2', label: '👥 Pra um amigo', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt3', label: '💼 Pra um cliente', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 4: ESCOLHA INICIAL
  // ========================================
  {
    id: 'initial_choice',
    stage: 4,
    name: 'Escolha Inicial',
    botMessage: 'Beleza, {nome}! Agora me diz, o que te traz aqui hoje? Como posso te ajudar?',
    options: [
      { id: 'opt1', label: '🛍️ Quero conhecer os produtos', nextStepId: 'show_products', captureAs: 'initial_choice' },
      { id: 'opt2', label: '💰 Preciso de um orçamento', nextStepId: 'budget_question', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'initial_choice' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 5 }],
  },

  // ========================================
  // ETAPA 4.1: PERGUNTA SOBRE ORÇAMENTO
  // ========================================
  {
    id: 'budget_question',
    stage: 4,
    name: 'Questão de Orçamento',
    botMessage: 'Opa, bacana! Vou te ajudar com isso. 💰\n\nVocê já sabe qual produto precisa ou quer que eu te mostre as opções primeiro?',
    options: [
      { id: 'opt1', label: '✅ Já sei o que quero', nextStepId: 'show_products', captureAs: 'knows_product' },
      { id: 'opt2', label: '🤔 Me mostra as opções', nextStepId: 'show_products', captureAs: 'exploring' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 20 }],
  },

  // ========================================
  // ETAPA 5: APRESENTAÇÃO DE PRODUTOS (Dinâmica)
  // ========================================
  {
    id: 'show_products',
    stage: 5,
    name: 'Lista de Produtos',
    botMessage: 'Olha só, {nome}! Esses são os nossos principais produtos:\n\n{productList}\n\nQuer que eu te mostre mais sobre qual deles?',
    options: [
      // OPÇÕES DINÂMICAS serão inseridas aqui pelo service
      // Formato: { id: 'prod_X', label: '📦 Nome Real', nextStepId: 'product_details', captureAs: 'selected_product' }
      { id: 'opt_faq', label: '❓ Tenho uma dúvida antes', nextStepId: 'faq_question', captureAs: 'has_question' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 5.5: INTERESSE NO PRODUTO (NOVO - Intermediário Inteligente)
  // ========================================
  {
    id: 'product_interest',
    stage: 5,
    name: 'Interesse no Produto',
    botMessage: 'Ótima escolha, {nome}! 😊\n\nVou solicitar à nossa equipe que entre em contato com você para enviar mais informações sobre:\n\n{selectedProductsList}\n\nEles vão te mandar todos os detalhes, especificações técnicas e valores diretamente no WhatsApp {capturedPhone}. 📱\n\nQuer adicionar mais algum produto de interesse?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '💬 Não, pode prosseguir', nextStepId: 'product_interest_confirm', captureAs: 'single_product' },
      { id: 'opt_human', label: '👤 Falar com a equipe agora', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 5.6: CONFIRMAÇÃO DE INTERESSE (NOVO)
  // ========================================
  {
    id: 'product_interest_confirm',
    stage: 5,
    name: 'Confirmação de Interesse',
    botMessage: 'Perfeito! Nossa equipe vai entrar em contato em breve com todas as informações sobre os produtos que você selecionou. 🤝\n\nPosso te avisar quando houver promoções?',
    options: [
      { id: 'opt1', label: '✅ Pode avisar sim', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não precisa, obrigado', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // ETAPA 6: DETALHES DO PRODUTO (Dados Reais)
  // ========================================
  {
    id: 'product_details',
    stage: 6,
    name: 'Detalhes do Produto',
    botMessage: 'Show de bola, {nome}! Esse é um produto excelente. 😊\n\n{productDetails}\n\n✨ Principais benefícios:\n{productBenefits}\n\n💡 Ah, e se você se interessar, também temos:\n{relatedProducts}\n\nQue tal agora?',
    options: [
      { id: 'opt1', label: '💰 Quero saber os valores', nextStepId: 'pricing_urgency', captureAs: 'wants_pricing' },
      { id: 'opt2', label: '📱 Me manda mais info no WhatsApp', nextStepId: 'confirm_material_send', captureAs: 'wants_material' },
      { id: 'opt3', label: '❓ Tenho uma pergunta', nextStepId: 'product_question', captureAs: 'has_question' },
      { id: 'opt4', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 6.1: URGÊNCIA DE PREÇO
  // ========================================
  {
    id: 'pricing_urgency',
    stage: 6,
    name: 'Urgência de Preço',
    botMessage: 'Tranquilo! Vou te passar as informações de preço. 💰\n\nSó me diz uma coisa: é pra quando?',
    options: [
      { id: 'opt1', label: '🔥 Preciso urgente (15 dias)', nextStepId: 'handoff_confirmation', captureAs: 'urgency' },
      { id: 'opt2', label: '📅 Pra 1 ou 2 meses', nextStepId: 'handoff_confirmation', captureAs: 'urgency' },
      { id: 'opt3', label: '📆 Mais de 3 meses (planejando)', nextStepId: 'handoff_confirmation', captureAs: 'urgency' },
      { id: 'opt4', label: '🤔 Ainda não tenho prazo', nextStepId: 'handoff_confirmation', captureAs: 'urgency' },
    ],
    actions: [{ type: 'increment_score', value: 25 }],
  },

  // ========================================
  // ETAPA 6.2: CONFIRMAÇÃO DE ENVIO (Material WhatsApp)
  // ========================================
  {
    id: 'confirm_material_send',
    stage: 6,
    name: 'Confirmação de Envio',
    botMessage: 'Perfeito, {nome}! Vou enviar todo o material sobre {interesse} no número {capturedPhone}. 📱',
    options: [
      { id: 'opt1', label: '✅ Obrigado, aguardo!', nextStepId: 'marketing_consent', captureAs: 'confirmed_material' },
      { id: 'opt2', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 6.3: PERGUNTA SOBRE PRODUTO
  // ========================================
  {
    id: 'product_question',
    stage: 6,
    name: 'Dúvida Específica',
    botMessage: 'Claro, {nome}! Fica à vontade pra perguntar. 😊\n\nQual sua dúvida sobre {interesse}?',
    captureInput: {
      type: 'text',
      field: 'specific_question',
      nextStepId: 'after_product_question',
    },
    actions: [{ type: 'increment_score', value: 10 }],
  },

  {
    id: 'after_product_question',
    stage: 6,
    name: 'Após Responder Dúvida',
    botMessage: 'Espero ter te ajudado! 😊\n\nMas olha, pra questões mais técnicas, o ideal é falar com um dos nossos especialistas. Eles vão conseguir te explicar direitinho todos os detalhes.',
    options: [
      { id: 'opt1', label: '✅ Respondeu minha dúvida', nextStepId: 'product_next_action', captureAs: 'question_answered' },
      { id: 'opt2', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
      { id: 'opt3', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
  },

  {
    id: 'product_next_action',
    stage: 6,
    name: 'Próxima Ação após Dúvida',
    botMessage: 'Que bom! E agora, o que você gostaria de fazer?',
    options: [
      { id: 'opt1', label: '💰 Quero saber os valores', nextStepId: 'pricing_urgency', captureAs: 'wants_pricing' },
      { id: 'opt2', label: '📱 Me manda mais info', nextStepId: 'confirm_material_send', captureAs: 'wants_material' },
      { id: 'opt3', label: '🔄 Ver outros produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
  },

  // ========================================
  // ETAPA 7: CONFIRMAÇÃO DE HANDOFF
  // ========================================
  {
    id: 'handoff_confirmation',
    stage: 7,
    name: 'Confirmação de Transferência',
    botMessage: 'Perfeito, {nome}! Nosso time vai entrar em contato com você no número {capturedPhone} em breve. 🤝\n\nPosso te avisar quando houver promoções sobre {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Pode avisar sim', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não precisa, obrigado', nextStepId: 'closing_with_lead', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // ETAPA 8: CONSENTIMENTO DE MARKETING
  // ========================================
  {
    id: 'marketing_consent',
    stage: 8,
    name: 'Consentimento Marketing',
    botMessage: 'Show! Vou mandar tudo direitinho no {capturedPhone}. 📱\n\nPosso te avisar quando houver novidades sobre {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Pode sim!', nextStepId: 'closing', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não precisa, valeu', nextStepId: 'closing', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // ETAPA 9: CONTINUAR NAVEGANDO
  // ========================================
  {
    id: 'continue_browsing',
    stage: 9,
    name: 'Continuar Navegando',
    botMessage: 'Tranquilo, {nome}! Sem pressão. 😊\n\nQuer continuar explorando nossos produtos?',
    options: [
      { id: 'opt1', label: '🔄 Quero ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'has_question' },
      { id: 'opt3', label: '👋 Vou ficando por aqui', nextStepId: 'closing_simple', captureAs: 'end_chat' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
    actions: [
      { type: 'create_lead' },
    ],
  },

  // ========================================
  // ETAPA 10: FAQ INTELIGENTE
  // ========================================
  {
    id: 'faq_question',
    stage: 10,
    name: 'Pergunta FAQ',
    botMessage: 'Claro, {nome}! Pode mandar sua dúvida que eu vou te ajudar. 😄\n\nFica à vontade pra perguntar qualquer coisa!',
    captureInput: {
      type: 'text',
      field: 'faq_question',
      nextStepId: 'faq_response',
    },
  },

  {
    id: 'faq_response',
    stage: 10,
    name: 'Resposta FAQ',
    botMessage: '{faqAnswer}\n\n---\n\nConsegui te ajudar, {nome}? Ficou claro? 😊',
    options: [
      { id: 'opt1', label: '✅ Sim, obrigado!', nextStepId: 'post_faq_action', captureAs: 'faq_helpful' },
      { id: 'opt2', label: '❓ Tenho outra dúvida', nextStepId: 'faq_question', captureAs: 'another_question' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
  },

  {
    id: 'post_faq_action',
    stage: 10,
    name: 'Pós-FAQ',
    botMessage: 'Fico feliz em ter ajudado! 😊\n\nQuer ver os produtos ou prefere deixar pra depois?',
    options: [
      { id: 'opt1', label: '🛍️ Quero ver os produtos', nextStepId: 'show_products', captureAs: 'explore_products' },
      { id: 'opt2', label: '👋 Vou ficando por aqui', nextStepId: 'closing_simple', captureAs: 'end_chat' },
      { id: 'opt_human', label: '👤 Falar com a equipe', nextStepId: 'human_handoff', captureAs: 'wants_human' },
    ],
  },

  // ========================================
  // ETAPA 11: HANDOFF HUMANO (NOVO) ⭐
  // ========================================
  {
    id: 'human_handoff',
    stage: 11,
    name: 'Handoff Humano',
    botMessage: 'Perfeito, {nome}! Vou te conectar com nossa equipe de atendimento. 👨‍💼\n\nVocê será atendido por um especialista em breve via WhatsApp no número {capturedPhone}.\n\nPronto! Nossa equipe vai te chamar no WhatsApp em instantes.\n\nFique de olho nas mensagens! 📱',
    options: [], // Sem opções - encerra conversa
    actions: [
      { type: 'create_lead' }, // Cria lead com status ATENDIMENTO_HUMANO
      { type: 'send_notification' }, // Notifica equipe
    ],
  },

  // ========================================
  // ETAPA 12: ENCERRAMENTOS
  // ========================================
  {
    id: 'closing_with_lead',
    stage: 12,
    name: 'Encerramento com Lead',
    botMessage: 'Valeu demais, {nome}! 🙌\n\nO pessoal aqui do time vai entrar em contato com você em breve, tá?\n\nSe quiser dar mais uma olhada nos produtos enquanto isso, fique à vontade!',
    options: [
      { id: 'opt1', label: '🔄 Quero ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Tá bom, até logo!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing',
    stage: 12,
    name: 'Encerramento Padrão',
    botMessage: 'Fechou então, {nome}! Valeu demais pelo seu tempo! 🙏\n\nVou mandar tudo certinho pro seu WhatsApp, pode deixar!\n\nQualquer coisa que precisar, é só dar um toque:\n\n📞 {companyPhone}\n📍 {companyAddress}',
    options: [
      { id: 'opt1', label: '🔄 Ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Já é o suficiente!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing_simple',
    stage: 12,
    name: 'Encerramento Simples',
    botMessage: 'Valeu, {nome}! 😊\n\nFoi um prazer conversar com você! Qualquer coisa que precisar, é só aparecer por aqui de novo! 👋\n\n📞 {companyPhone}\n🌐 {companyWebsite}',
    options: [],
  },

  {
    id: 'closing_final',
    stage: 12,
    name: 'Encerramento Final',
    botMessage: 'Foi ótimo te atender, {nome}! 😊\n\nQualquer coisa que precisar, você já sabe onde me encontrar!\n\nAté a próxima! 👋\n\n---\n📞 {companyPhone}\n📍 {companyAddress}\n🌐 {companyWebsite}\n⏰ {workingHours}',
    options: [],
  },
];

/**
 * Calcula score de qualificação V3 - ATUALIZADO CONFORME DOCUMENTO
 */
export function calculateQualificationScoreV3(session: any, messageCount: number = 0): number {
  let score = 0;

  // ========================================
  // 1. DADOS BÁSICOS (50 pontos máximo)
  // ========================================
  if (session.capturedName) score += 10;
  if (session.capturedPhone) score += 30; // ⭐ Aumentado de 25 para 30 (captura antecipada)
  if (session.capturedEmail) score += 10; // Reduzido de 15 para 10

  // ========================================
  // 2. ENGAJAMENTO (30 pontos máximo)
  // ========================================
  if (messageCount >= 5) score += 10;
  if (messageCount >= 10) score += 5;
  if (messageCount >= 15) score += 5;

  if (session.startedAt) {
    const now = session.endedAt || new Date();
    const timeSpent = (now.getTime() - new Date(session.startedAt).getTime()) / 1000;
    if (timeSpent > 120) score += 10; // Mais de 2 minutos
  }

  // ========================================
  // 3. INTERESSE E INTENÇÃO (40 pontos máximo)
  // ========================================
  if (session.interest) score += 10;

  const responses = JSON.parse(session.userResponses || '{}');

  // Passou por qualificação
  if (responses.user_type) score += 10;

  // Profundidade no funil (estágio alcançado)
  if (session.currentStage >= 5) score += 5; // Viu produtos
  if (session.currentStage >= 6) score += 10; // Viu detalhes
  if (session.currentStage >= 11) score += 5; // Chegou no handoff

  // ========================================
  // 4. QUALIFICADORES ESPECIAIS (até 30 pontos extras)
  // ========================================

  // Sinais de alta intenção
  if (responses.wants_pricing) score += 15; // Perguntou preço
  if (responses.wants_material) score += 10; // Pediu material
  if (responses.initial_choice === '💰 Preciso de um orçamento') score += 15;

  // Qualificação de contexto - Produtor rural
  if (responses.user_type === '🐄 Sim, sou produtor rural') score += 10;

  // Ramo de atividade
  if (responses.activity === '🥛 Pecuária leiteira') score += 10;
  if (responses.activity === '🥩 Pecuária de corte') score += 8;
  if (responses.activity === '🌾 Agricultura') score += 5;

  // Qualificação de contexto - Profissional
  if (responses.user_type === '👔 Trabalho no setor agro') score += 15;
  if (responses.profession?.includes('Veterinário') || responses.profession?.includes('Consultor')) score += 15;

  // Urgência
  if (responses.urgency === '🔥 Preciso urgente (15 dias)') score += 20; // ⭐ Muito quente
  if (responses.urgency === '📅 Pra 1 ou 2 meses') score += 12;
  if (responses.urgency === '📆 Mais de 3 meses (planejando)') score += 5;
  if (responses.urgency === '🤔 Ainda não tenho prazo') score += 2;

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

  const otherProducts = allProducts.filter(p => p.name !== selectedProductName);
  return otherProducts.slice(0, limit);
}
