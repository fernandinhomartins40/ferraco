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
    botMessage: 'Olá! Tudo bem? 😊\n\nSou o assistente virtual da {companyName}. É um prazer ter você por aqui!\n\nAntes de falarmos sobre nossos produtos, como posso te chamar?',
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
    botMessage: 'Prazer em te conhecer, {nome}! 😊\n\nAntes de falar mais sobre a {companyName}, queria saber um pouquinho sobre você e sua atividade.\n\nVocê trabalha com pecuária leiteira?',
    options: [
      { id: 'opt1', label: '🐄 Sim, sou produtor rural', nextStepId: 'qualification_producer', captureAs: 'user_type' },
      { id: 'opt2', label: '👔 Trabalho no setor agro', nextStepId: 'qualification_professional', captureAs: 'user_type' },
      { id: 'opt3', label: '🔍 Estou pesquisando pra alguém', nextStepId: 'qualification_proxy', captureAs: 'user_type' },
      { id: 'opt4', label: '💬 Só quero conhecer os produtos', nextStepId: 'initial_choice', captureAs: 'user_type' },
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
    botMessage: 'Que legal, {nome}! Adoro conversar com quem está direto na lida. 👨‍🌾\n\nSó pra eu entender melhor sua necessidade... qual o tamanho do seu rebanho hoje?',
    options: [
      { id: 'opt1', label: '🐄 Até 50 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt2', label: '🐄 De 51 a 200 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt3', label: '🐄 De 201 a 500 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
      { id: 'opt4', label: '🐄 Mais de 500 cabeças', nextStepId: 'initial_choice', captureAs: 'herd_size' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  {
    id: 'qualification_professional',
    stage: 2,
    name: 'Qualificação Profissional',
    botMessage: 'Entendi, {nome}! Que bacana. 👔\n\nMe conta, você atua em qual área especificamente?',
    options: [
      { id: 'opt1', label: '🩺 Veterinário/Zootecnista', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt2', label: '🏗️ Engenheiro/Arquiteto Rural', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt3', label: '💼 Consultor/Assessor Técnico', nextStepId: 'initial_choice', captureAs: 'profession' },
      { id: 'opt4', label: '🏪 Trabalho com revenda', nextStepId: 'initial_choice', captureAs: 'profession' },
    ],
    actions: [{ type: 'increment_score', value: 20 }],
  },

  {
    id: 'qualification_proxy',
    stage: 2,
    name: 'Qualificação Terceiros',
    botMessage: 'Ah, que legal você estar ajudando! 😊\n\nÉ pra um familiar, amigo ou cliente?',
    options: [
      { id: 'opt1', label: '👨‍👩‍👧 É pra família', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt2', label: '👥 Pra um amigo', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
      { id: 'opt3', label: '💼 Pra um cliente', nextStepId: 'initial_choice', captureAs: 'proxy_relation' },
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
    botMessage: 'Beleza, {nome}! Agora me diz, o que te traz aqui hoje? Como posso te ajudar?',
    options: [
      { id: 'opt1', label: '🛍️ Quero conhecer os produtos', nextStepId: 'show_products', captureAs: 'initial_choice' },
      { id: 'opt2', label: '💰 Preciso de um orçamento', nextStepId: 'budget_question', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'initial_choice' },
      { id: 'opt4', label: '💬 Prefiro falar direto com alguém', nextStepId: 'capture_contact_direct', captureAs: 'initial_choice' },
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
    botMessage: 'Opa, bacana! Vou te ajudar com isso. 💰\n\nVocê já sabe qual produto precisa ou quer que eu te mostre as opções primeiro?',
    options: [
      { id: 'opt1', label: '✅ Já sei o que quero', nextStepId: 'show_products', captureAs: 'knows_product' },
      { id: 'opt2', label: '🤔 Me mostra as opções', nextStepId: 'show_products', captureAs: 'exploring' },
      { id: 'opt3', label: '💬 Prefiro conversar direto', nextStepId: 'capture_contact_direct', captureAs: 'wants_direct' },
    ],
    actions: [{ type: 'increment_score', value: 20 }],
  },

  // ========================================
  // ETAPA 4: APRESENTAÇÃO DE PRODUTOS (Dinâmica)
  // ========================================
  {
    id: 'show_products',
    stage: 4,
    name: 'Lista de Produtos',
    botMessage: 'Olha só, {nome}! Esses são os nossos principais produtos:\n\n{productList}\n\nQuer que eu te mostre mais sobre qual deles?',
    options: [
      // OPÇÕES DINÂMICAS serão inseridas aqui pelo service
      // Formato: { id: 'prod_X', label: '📦 Nome Real', nextStepId: 'product_details', captureAs: 'selected_product' }
      { id: 'opt_attendant', label: '💬 Prefiro falar com alguém', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt_faq', label: '❓ Tenho uma dúvida antes', nextStepId: 'faq_question', captureAs: 'has_question' },
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
    botMessage: 'Show de bola, {nome}! Esse é um produto excelente. 😊\n\nEntão, o {interesse} é um produto {productDetails}\n\nE os benefícios são:\n{productBenefits}\n\n💡 Ah, e se você se interessar, também temos:\n{relatedProducts}\n\nQue tal agora?',
    options: [
      { id: 'opt1', label: '💰 Quero saber os valores', nextStepId: 'pricing_urgency', captureAs: 'wants_pricing' },
      { id: 'opt2', label: '📱 Me manda mais info no WhatsApp', nextStepId: 'capture_contact', captureAs: 'wants_whatsapp' },
      { id: 'opt3', label: '❓ Tenho uma pergunta', nextStepId: 'product_question', captureAs: 'has_question' },
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
    botMessage: 'Tranquilo! Vou te passar as informações de preço. 💰\n\nSó me diz uma coisa: é pra quando?',
    options: [
      { id: 'opt1', label: '🔥 Preciso urgente (15 dias)', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt2', label: '📅 Pra 1 ou 2 meses', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt3', label: '📆 Mais de 3 meses (planejando)', nextStepId: 'capture_contact', captureAs: 'urgency' },
      { id: 'opt4', label: '🤔 Ainda não tenho prazo', nextStepId: 'capture_contact', captureAs: 'urgency' },
    ],
    actions: [{ type: 'increment_score', value: 25 }],
  },

  // ========================================
  // ETAPA 6: PERGUNTA SOBRE PRODUTO
  // ========================================
  {
    id: 'product_question',
    stage: 5,
    name: 'Dúvida Específica',
    botMessage: 'Claro, {nome}! Fica à vontade pra perguntar. 😊\n\nQual sua dúvida sobre {interesse}?',
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
    botMessage: 'Espero ter te ajudado! 😊\n\nMas olha, pra questões mais técnicas, o ideal é falar com um dos nossos especialistas. Eles vão conseguir te explicar direitinho todos os detalhes.\n\nQuer que eu te conecte com alguém do time?',
    options: [
      { id: 'opt1', label: '👤 Sim, quero falar com alguém', nextStepId: 'capture_contact_direct', captureAs: 'wants_specialist' },
      { id: 'opt2', label: '📱 Pode mandar no WhatsApp', nextStepId: 'capture_contact', captureAs: 'prefers_whatsapp' },
      { id: 'opt3', label: '🔄 Deixa eu ver outros produtos antes', nextStepId: 'show_products', captureAs: 'explore_more' },
    ],
  },

  // ========================================
  // ETAPA 7: CAPTAÇÃO ESTRATÉGICA
  // ========================================
  {
    id: 'capture_contact',
    stage: 7,
    name: 'Captação de Contato',
    botMessage: 'Perfeito, {nome}! 😊\n\nEntão, que tal eu te mandar um material completo sobre {interesse} no WhatsApp?\n\nVou incluir:\n• Especificações técnicas\n• Tabela de preços\n• Fotos e vídeos de instalação\n• Casos de clientes que já usam\n\nQual o melhor número pra eu te enviar? 📱',
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
    botMessage: 'Tranquilo, {nome}! Vou te passar pra alguém do nosso time que manja muito do assunto. 👨‍💼\n\nEle vai conseguir tirar todas as suas dúvidas direitinho.\n\nQual o melhor número pra gente te ligar? 📱',
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
    botMessage: 'Opa, anotei aqui: {capturedPhone} ✅\n\nMe diz uma coisa: você prefere que alguém do time te ligue hoje mesmo, ou quer só receber o material primeiro pra dar uma olhada com calma?',
    options: [
      { id: 'opt1', label: '📞 Pode me ligar hoje', nextStepId: 'handoff_confirmation', captureAs: 'wants_call_today' },
      { id: 'opt2', label: '📱 Só o material primeiro', nextStepId: 'marketing_consent', captureAs: 'prefers_whatsapp_only' },
      { id: 'opt3', label: '👀 Deixa eu dar uma olhada antes', nextStepId: 'continue_browsing', captureAs: 'self_service' },
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
    botMessage: 'Fechou, {nome}! 🤝\n\nAlguém da nossa equipe vai te ligar no {capturedPhone} ainda hoje.\n\nEnquanto isso, se quiser, dá uma olhada no nosso site:\n🌐 {companyWebsite}\n📍 {companyAddress}\n📞 {companyPhone}\n\n⏰ Nosso horário: {workingHours}\n\nAh, e posso te avisar quando rolar promoção de {interesse}?',
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
  // ETAPA 10: CONSENTIMENTO DE MARKETING
  // ========================================
  {
    id: 'marketing_consent',
    stage: 9,
    name: 'Consentimento Marketing',
    botMessage: 'Show! Vou mandar tudo direitinho no {capturedPhone}. 📱\n\nAh, e se pintar alguma promoção legal de {interesse}, posso te avisar?',
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
  // ETAPA 11: CONTINUAR NAVEGANDO
  // ========================================
  {
    id: 'continue_browsing',
    stage: 8,
    name: 'Continuar Navegando',
    botMessage: 'Tranquilo, {nome}! Sem pressão. 😊\n\nFica à vontade pra explorar por aqui. Se precisar de qualquer coisa, é só me chamar!\n\nQuer dar uma olhada em mais produtos ou tem alguma dúvida que eu possa responder?',
    options: [
      { id: 'opt1', label: '🔄 Quero ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '❓ Tenho uma dúvida', nextStepId: 'faq_question', captureAs: 'has_question' },
      { id: 'opt3', label: '👋 Vou ficando por aqui', nextStepId: 'closing_simple', captureAs: 'end_chat' },
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
    botMessage: 'Claro, {nome}! Pode mandar sua dúvida que eu vou te ajudar. 😄\n\nFica à vontade pra perguntar qualquer coisa!',
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
    botMessage: '{faqAnswer}\n\n---\n\nConsegui te ajudar, {nome}? Ficou claro? 😊',
    options: [
      { id: 'opt1', label: '✅ Sim, obrigado!', nextStepId: 'post_faq_action', captureAs: 'faq_helpful' },
      { id: 'opt2', label: '❌ Quero mais detalhes', nextStepId: 'capture_contact_direct', captureAs: 'faq_not_helpful' },
      { id: 'opt3', label: '❓ Tenho outra dúvida', nextStepId: 'faq_question', captureAs: 'another_question' },
    ],
  },

  {
    id: 'post_faq_action',
    stage: 3,
    name: 'Pós-FAQ',
    botMessage: 'Fico feliz em ter ajudado! 😊\n\nE aí, quer aproveitar pra dar uma olhada nos nossos produtos ou prefere deixar pra depois?',
    options: [
      { id: 'opt1', label: '🛍️ Quero ver os produtos', nextStepId: 'show_products', captureAs: 'explore_products' },
      { id: 'opt2', label: '💬 Prefiro falar com alguém', nextStepId: 'capture_contact_direct', captureAs: 'wants_attendant' },
      { id: 'opt3', label: '👋 Vou ficando por aqui', nextStepId: 'closing_simple', captureAs: 'end_chat' },
    ],
  },

  // ========================================
  // ETAPA 13: ENCERRAMENTOS
  // ========================================
  {
    id: 'closing_with_lead',
    stage: 10,
    name: 'Encerramento com Lead',
    botMessage: 'Valeu demais, {nome}! 🙌\n\nO pessoal aqui do time vai entrar em contato com você em breve, tá?\n\nSe quiser dar mais uma olhada nos produtos enquanto isso, fique à vontade!',
    options: [
      { id: 'opt1', label: '🔄 Quero ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Tá bom, até logo!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing',
    stage: 10,
    name: 'Encerramento Padrão',
    botMessage: 'Fechou então, {nome}! Valeu demais pelo seu tempo! 🙏\n\nVou mandar tudo certinho pro seu WhatsApp, pode deixar!\n\nQualquer coisa que precisar, é só dar um toque:\n\n📞 {companyPhone}\n📍 {companyAddress}\n\nSe quiser continuar vendo nossos produtos:',
    options: [
      { id: 'opt1', label: '🔄 Ver mais produtos', nextStepId: 'show_products', captureAs: 'explore_more' },
      { id: 'opt2', label: '👋 Já é o suficiente!', nextStepId: 'closing_final', captureAs: 'end_chat' },
    ],
  },

  {
    id: 'closing_simple',
    stage: 10,
    name: 'Encerramento Simples',
    botMessage: 'Valeu, {nome}! 😊\n\nFoi um prazer conversar com você! Qualquer coisa que precisar, é só aparecer por aqui de novo! 👋\n\n📞 {companyPhone}\n🌐 {companyWebsite}',
    options: [],
  },

  {
    id: 'closing_final',
    stage: 10,
    name: 'Encerramento Final',
    botMessage: 'Foi ótimo te atender, {nome}! 😊\n\nQualquer coisa que precisar, você já sabe onde me encontrar!\n\nAté a próxima! 👋\n\n---\n📞 {companyPhone}\n📍 {companyAddress}\n🌐 {companyWebsite}\n⏰ {workingHours}',
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
