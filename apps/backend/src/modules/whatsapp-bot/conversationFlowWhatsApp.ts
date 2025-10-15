/**
 * FLUXO CONVERSACIONAL WHATSAPP BOT
 *
 * Bot que dá continuidade à conversa iniciada no chat web.
 * Ativado automaticamente quando lead solicita "Falar com a equipe".
 *
 * Características:
 * ✅ Envia materiais automaticamente (PDFs, imagens, vídeos)
 * ✅ Responde dúvidas usando FAQ
 * ✅ Conversa sobre preços e condições
 * ✅ SEMPRE termina com handoff para atendente humano
 */

export interface WhatsAppBotStep {
  id: string;
  name: string;
  botMessage: string | ((context: any) => string);
  options?: Array<{
    id: string;
    label: string;
    nextStepId: string;
    captureAs?: string;
  }>;
  captureInput?: {
    type: 'text' | 'any';
    nextStepId: string | ((input: string, context: any) => string);
  };
  actions?: Array<{
    type: 'send_media' | 'send_product_materials' | 'handoff_to_human' | 'schedule_followup';
    data?: any;
  }>;
  // Se true, aguarda resposta do usuário. Se false, envia e vai para próximo automaticamente
  awaitResponse?: boolean;
}

export const whatsAppBotFlow: WhatsAppBotStep[] = [
  // ========================================
  // ETAPA 1: MENSAGEM INICIAL (CONTEXTUALIZAÇÃO)
  // ========================================
  {
    id: 'initial_context',
    name: 'Mensagem Inicial',
    botMessage: (context) => {
      const { leadName, interesse, companyName } = context;
      return `Olá, ${leadName}! 👋\n\nAqui é o assistente da ${companyName}!\n\nVi que você estava conversando comigo no site há pouco e demonstrou interesse em ${interesse}.\n\nPosso te enviar mais informações e materiais sobre ${interesse}? 😊`;
    },
    options: [
      { id: 'opt1', label: '✅ Sim, pode enviar!', nextStepId: 'send_materials', captureAs: 'confirmed' },
      { id: 'opt2', label: '📅 Pode, mas só amanhã', nextStepId: 'schedule_tomorrow', captureAs: 'schedule' },
      { id: 'opt3', label: '❌ Não, obrigado', nextStepId: 'polite_close', captureAs: 'declined' },
    ],
    awaitResponse: true,
  },

  // ========================================
  // ETAPA 2A: ENVIO DE MATERIAIS
  // ========================================
  {
    id: 'send_materials',
    name: 'Envio de Materiais',
    botMessage: (context) => {
      const { leadName, interesse } = context;
      return `Perfeito, ${leadName}! Vou te mandar tudo agora. 📱\n\nPreparei um material completo sobre ${interesse} pra você:`;
    },
    actions: [
      { type: 'send_product_materials' }, // Envia PDFs, imagens, vídeos, tabela de preços
    ],
    awaitResponse: false, // Envia e vai pro próximo automaticamente
  },

  {
    id: 'after_materials',
    name: 'Após Envio de Materiais',
    botMessage: (context) => {
      const { leadName, interesse } = context;
      return `Pronto! Enviei todo o material sobre ${interesse}. 📦\n\nDá uma olhada com calma e me conta: o que achou? Ficou alguma dúvida?`;
    },
    options: [
      { id: 'opt1', label: '💬 Tenho uma dúvida', nextStepId: 'handle_question', captureAs: 'has_question' },
      { id: 'opt2', label: '💰 Quero falar sobre preços', nextStepId: 'talk_pricing', captureAs: 'wants_pricing' },
      { id: 'opt3', label: '📍 Onde fica a loja?', nextStepId: 'store_location', captureAs: 'wants_location' },
      { id: 'opt4', label: '✅ Tudo claro, quero comprar', nextStepId: 'handoff_to_sales', captureAs: 'ready_to_buy' },
    ],
    awaitResponse: true,
  },

  // ========================================
  // ETAPA 2B: REAGENDAMENTO
  // ========================================
  {
    id: 'schedule_tomorrow',
    name: 'Reagendar para Amanhã',
    botMessage: (context) => {
      const { leadName } = context;
      return `Tranquilo, ${leadName}! 😊\n\nVou te mandar as informações amanhã então.\n\nQue horas é melhor pra você?`;
    },
    options: [
      { id: 'opt1', label: '🌅 De manhã (8h-12h)', nextStepId: 'confirm_schedule', captureAs: 'morning' },
      { id: 'opt2', label: '🌞 À tarde (13h-17h)', nextStepId: 'confirm_schedule', captureAs: 'afternoon' },
      { id: 'opt3', label: '🌙 À noite (18h-21h)', nextStepId: 'confirm_schedule', captureAs: 'evening' },
    ],
    awaitResponse: true,
  },

  {
    id: 'confirm_schedule',
    name: 'Confirmar Agendamento',
    botMessage: (context) => {
      const { schedulePeriod } = context;
      const periodMap: any = {
        morning: 'de manhã',
        afternoon: 'à tarde',
        evening: 'à noite',
      };
      return `Anotado! Amanhã ${periodMap[schedulePeriod]} eu te mando tudo certinho. 📝\n\nSe precisar antes, é só me chamar aqui! 👋`;
    },
    actions: [
      { type: 'schedule_followup', data: { delay: '1day' } },
    ],
    awaitResponse: false,
  },

  // ========================================
  // ETAPA 2C: RECUSA EDUCADA
  // ========================================
  {
    id: 'polite_close',
    name: 'Encerramento Educado',
    botMessage: (context) => {
      const { leadName, interesse, companyPhone, companyAddress } = context;
      return `Sem problemas, ${leadName}! 😊\n\nSe mudar de ideia e quiser saber mais sobre ${interesse}, é só me chamar aqui no WhatsApp.\n\nFico à disposição! 👋\n\n📞 ${companyPhone}\n📍 ${companyAddress}`;
    },
    awaitResponse: false, // Encerra conversa
  },

  // ========================================
  // ETAPA 3: RESPONDER DÚVIDAS
  // ========================================
  {
    id: 'handle_question',
    name: 'Processar Dúvida',
    botMessage: (context) => {
      const { leadName } = context;
      return `Claro! Pode perguntar, ${leadName}. Estou aqui pra te ajudar! 😊`;
    },
    captureInput: {
      type: 'text',
      nextStepId: 'answer_question', // Será processado pelo service
    },
    awaitResponse: true,
  },

  {
    id: 'answer_question',
    name: 'Responder Dúvida',
    botMessage: (context) => {
      const { faqAnswer, foundAnswer } = context;
      if (foundAnswer) {
        return `${faqAnswer}\n\nIsso esclarece sua dúvida? 🤔`;
      } else {
        return `Essa é uma ótima pergunta! 🤔\n\nMas pra te responder com precisão, vou te conectar com um especialista do time que entende tudo desse produto.\n\nPode ser? 👨‍💼`;
      }
    },
    options: [
      { id: 'opt1', label: '✅ Sim, esclareceu!', nextStepId: 'after_materials', captureAs: 'question_answered' },
      { id: 'opt2', label: '❓ Tenho outra dúvida', nextStepId: 'handle_question', captureAs: 'another_question' },
      { id: 'opt3', label: '👤 Quero falar com alguém', nextStepId: 'handoff_to_sales', captureAs: 'wants_human' },
    ],
    awaitResponse: true,
  },

  // ========================================
  // ETAPA 4: CONVERSA SOBRE PREÇOS
  // ========================================
  {
    id: 'talk_pricing',
    name: 'Falar sobre Preços',
    botMessage: (context) => {
      const { interesse } = context;
      return `Opa! Vamos falar de valores então. 💰\n\nVi aqui que você se interessou por ${interesse}.\n\nA tabela de preços que enviei está clara? Ou quer que eu explique melhor as condições?`;
    },
    options: [
      { id: 'opt1', label: '📋 Tabela está clara', nextStepId: 'pricing_clear', captureAs: 'table_clear' },
      { id: 'opt2', label: '💳 Como funciona o pagamento?', nextStepId: 'payment_options', captureAs: 'wants_payment_info' },
      { id: 'opt3', label: '🎁 Tem desconto?', nextStepId: 'ask_discount', captureAs: 'wants_discount' },
      { id: 'opt4', label: '📊 Preciso de orçamento', nextStepId: 'handoff_to_sales', captureAs: 'needs_quote' },
    ],
    awaitResponse: true,
  },

  {
    id: 'payment_options',
    name: 'Opções de Pagamento',
    botMessage: () => {
      return `Beleza! As formas de pagamento são:\n\n💳 **À vista:** Desconto especial\n💰 **Parcelado:** Até 12x no cartão\n📝 **Boleto:** Desconto adicional\n🏢 **Faturado:** Para empresas\n\nQual opção te interessa mais?`;
    },
    options: [
      { id: 'opt1', label: '💳 À vista', nextStepId: 'handoff_to_sales', captureAs: 'avista' },
      { id: 'opt2', label: '💰 Parcelado', nextStepId: 'handoff_to_sales', captureAs: 'parcelado' },
      { id: 'opt3', label: '👤 Falar com vendedor', nextStepId: 'handoff_to_sales', captureAs: 'wants_human' },
    ],
    awaitResponse: true,
  },

  {
    id: 'ask_discount',
    name: 'Perguntar sobre Desconto',
    botMessage: (context) => {
      const { leadName } = context;
      return `Olha que legal, ${leadName}! 🎉\n\nTemos algumas condições especiais:\n\n✅ Compra à vista: desconto exclusivo\n✅ Compra de múltiplas unidades: desconto progressivo\n✅ Primeira compra: desconto de boas-vindas\n\nE se você decidir hoje, posso falar com o gerente pra ver se consigo mais algum desconto. 😉\n\nQuer que eu consulte?`;
    },
    options: [
      { id: 'opt1', label: '✅ Sim, consulta pra mim!', nextStepId: 'handoff_to_sales', captureAs: 'wants_special_discount' },
      { id: 'opt2', label: '📋 Me passa as condições', nextStepId: 'handoff_to_sales', captureAs: 'wants_conditions' },
    ],
    awaitResponse: true,
  },

  {
    id: 'pricing_clear',
    name: 'Preço Claro',
    botMessage: () => {
      return `Ótimo! Então te passo direto pro time comercial que vai fechar a melhor condição pra você. 🤝\n\nPode ser agora?`;
    },
    options: [
      { id: 'opt1', label: '✅ Pode sim!', nextStepId: 'handoff_to_sales', captureAs: 'ready' },
      { id: 'opt2', label: '⏰ Daqui a pouco', nextStepId: 'schedule_callback', captureAs: 'later' },
    ],
    awaitResponse: true,
  },

  // ========================================
  // ETAPA 5: LOCALIZAÇÃO DA LOJA
  // ========================================
  {
    id: 'store_location',
    name: 'Localização da Loja',
    botMessage: (context) => {
      const { companyAddress, workingHours, companyPhone, companyWebsite } = context;
      return `Claro! Aqui estão nossas informações:\n\n📍 **Endereço:** ${companyAddress}\n\n🕐 **Horário:** ${workingHours}\n\n📞 **Telefone:** ${companyPhone}\n\n🌐 **Site:** ${companyWebsite}\n\nQuer saber mais alguma coisa?`;
    },
    options: [
      { id: 'opt1', label: '📍 Manda a localização', nextStepId: 'send_location', captureAs: 'wants_map' },
      { id: 'opt2', label: '↩️ Voltar pro produto', nextStepId: 'after_materials', captureAs: 'back_to_product' },
      { id: 'opt3', label: '👤 Falar com alguém', nextStepId: 'handoff_to_sales', captureAs: 'wants_human' },
    ],
    awaitResponse: true,
  },

  {
    id: 'send_location',
    name: 'Enviar Localização GPS',
    botMessage: () => {
      return `Pronto! Enviei a localização no mapa. 📍\n\nSe precisar de algo mais, me avisa!`;
    },
    actions: [
      { type: 'send_media', data: { type: 'location' } },
    ],
    options: [
      { id: 'opt1', label: '↩️ Voltar pro produto', nextStepId: 'after_materials', captureAs: 'back' },
      { id: 'opt2', label: '👤 Falar com alguém', nextStepId: 'handoff_to_sales', captureAs: 'wants_human' },
    ],
    awaitResponse: true,
  },

  // ========================================
  // ETAPA 6: AGENDAR RETORNO
  // ========================================
  {
    id: 'schedule_callback',
    name: 'Agendar Retorno',
    botMessage: () => {
      return `Sem problema! Quando seria melhor pra você?`;
    },
    options: [
      { id: 'opt1', label: '⏰ Daqui 1 hora', nextStepId: 'confirm_callback', captureAs: '1hour' },
      { id: 'opt2', label: '📅 Daqui 2 horas', nextStepId: 'confirm_callback', captureAs: '2hours' },
      { id: 'opt3', label: '🌙 Mais tarde hoje', nextStepId: 'confirm_callback', captureAs: 'later_today' },
      { id: 'opt4', label: '📆 Amanhã', nextStepId: 'confirm_callback', captureAs: 'tomorrow' },
    ],
    awaitResponse: true,
  },

  {
    id: 'confirm_callback',
    name: 'Confirmar Agendamento',
    botMessage: (context) => {
      const { callbackTime } = context;
      const timeMap: any = {
        '1hour': 'daqui 1 hora',
        '2hours': 'daqui 2 horas',
        'later_today': 'mais tarde hoje',
        'tomorrow': 'amanhã',
      };
      return `Anotado! Um atendente vai te chamar ${timeMap[callbackTime]}. 📝\n\nEnquanto isso, se quiser dar uma olhada em mais produtos, é só me chamar! 👋`;
    },
    actions: [
      { type: 'schedule_followup' },
    ],
    awaitResponse: false,
  },

  // ========================================
  // ETAPA 7: HANDOFF PARA ATENDENTE HUMANO ⭐
  // ========================================
  {
    id: 'handoff_to_sales',
    name: 'Transferir para Vendedor',
    botMessage: (context) => {
      const { leadName } = context;
      return `Perfeito, ${leadName}! 🤝\n\nVou encaminhar você para o meu time de atendimento, onde um humano dará continuidade à conversa.\n\nTenho certeza que eles vão te ajudar com tudo que você precisa!\n\nSó um momento... 👨‍💼`;
    },
    actions: [
      { type: 'handoff_to_human' },
    ],
    awaitResponse: false, // Encerra bot, humano assume
  },
];

/**
 * Busca um step pelo ID
 */
export function getWhatsAppBotStepById(stepId: string): WhatsAppBotStep | undefined {
  return whatsAppBotFlow.find(step => step.id === stepId);
}

/**
 * Determina o próximo step baseado na resposta do usuário
 */
export function getNextWhatsAppBotStep(
  currentStepId: string,
  userResponse: string,
  context: any
): string | null {
  const currentStep = getWhatsAppBotStepById(currentStepId);
  if (!currentStep) return null;

  // Se tem opções, buscar qual foi escolhida
  if (currentStep.options) {
    const selectedOption = currentStep.options.find(
      opt => opt.label.toLowerCase().includes(userResponse.toLowerCase()) ||
             userResponse.toLowerCase().includes(opt.label.toLowerCase().substring(0, 10))
    );

    if (selectedOption) {
      return selectedOption.nextStepId;
    }
  }

  // Se tem captureInput com nextStepId dinâmico
  if (currentStep.captureInput) {
    if (typeof currentStep.captureInput.nextStepId === 'function') {
      return currentStep.captureInput.nextStepId(userResponse, context);
    }
    return currentStep.captureInput.nextStepId;
  }

  return null;
}
