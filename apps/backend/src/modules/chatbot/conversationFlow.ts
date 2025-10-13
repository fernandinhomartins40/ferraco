/**
 * Definição do fluxo conversacional profissional para o chatbot
 *
 * Baseado em best practices de conversação e captação de leads
 */

export interface ConversationStep {
  id: string;
  stage: number; // 1-8
  name: string;
  botMessage: string; // Suporta variáveis: {nome}, {interesse}, {companyName}
  options?: Array<{
    id: string;
    label: string;
    nextStepId: string;
    captureAs?: string; // Campo para capturar (ex: 'segment', 'interest')
  }>;
  captureInput?: {
    type: 'text' | 'email' | 'phone' | 'name';
    field: string; // Campo do lead (ex: 'capturedName', 'capturedEmail')
    validation?: string; // Regex de validação
    nextStepId: string;
  };
  actions?: Array<{
    type: 'increment_score' | 'set_qualified' | 'create_lead' | 'send_notification';
    value?: any;
  }>;
}

/**
 * Fluxo conversacional padrão - 8 etapas profissionais
 */
export const defaultConversationFlow: ConversationStep[] = [
  // ========================================
  // ETAPA 1: Boas-vindas e Contexto
  // ========================================
  {
    id: 'welcome',
    stage: 1,
    name: 'Boas-vindas',
    botMessage: 'Olá! 👋 Tudo bem?\n\nSeja bem-vindo(a) à {companyName}! Aqui a gente é especializado em {companyDescription}.\n\nComo posso te ajudar hoje?',
    options: [
      { id: 'opt1', label: '🛍️ Conhecer os produtos', nextStepId: 'show_products', captureAs: 'initial_choice' },
      { id: 'opt2', label: '💬 Falar com um especialista', nextStepId: 'human_handoff', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Tirar uma dúvida', nextStepId: 'quick_question', captureAs: 'initial_choice' },
    ],
  },

  // ========================================
  // ETAPA 1.5: Mostrar Produtos do Banco
  // ========================================
  {
    id: 'show_products',
    stage: 1,
    name: 'Mostrar Produtos',
    botMessage: 'Ótimo! A gente trabalha com soluções de qualidade pensadas especialmente para o produtor rural. 🐄\n\n{productList}\n\nAlgum desses produtos te interessa mais?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero saber mais', nextStepId: 'capture_name', captureAs: 'interest' },
      { id: 'opt2', label: '💬 Prefiro falar com especialista', nextStepId: 'human_handoff', captureAs: 'interest' },
      { id: 'opt3', label: '📱 Me envia informações no WhatsApp', nextStepId: 'capture_name', captureAs: 'interest' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 2: Apresentação Inteligente
  // ========================================
  {
    id: 'presentation',
    stage: 2,
    name: 'Apresentação',
    botMessage: 'Bacana! 😄\nPra te ajudar melhor, me conta rapidinho: você já conhece nossos produtos ou está conhecendo agora?',
    options: [
      { id: 'opt1', label: '✅ Já conheço', nextStepId: 'capture_name', captureAs: 'familiarity' },
      { id: 'opt2', label: '🆕 Primeira vez aqui', nextStepId: 'show_products', captureAs: 'familiarity' },
      { id: 'opt3', label: '⚖️ Estou comparando opções', nextStepId: 'capture_name', captureAs: 'familiarity' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 3: Captura de Nome
  // ========================================
  {
    id: 'capture_name',
    stage: 3,
    name: 'Captura de Nome',
    botMessage: 'Perfeito! Pra eu te ajudar melhor, qual é o seu nome?',
    captureInput: {
      type: 'name',
      field: 'capturedName',
      nextStepId: 'qualification',
    },
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 4: Qualificação
  // ========================================
  {
    id: 'qualification',
    stage: 4,
    name: 'Qualificação',
    botMessage: 'Que bom te conhecer, {nome}! 😊\n\nPra eu te passar as informações mais relevantes, você tem fazenda ou trabalha com pecuária?',
    options: [
      { id: 'opt1', label: '🐄 Sim, tenho fazenda de gado leiteiro', nextStepId: 'interest_detail', captureAs: 'segment' },
      { id: 'opt2', label: '🏭 Trabalho com equipamentos/revenda', nextStepId: 'interest_detail', captureAs: 'segment' },
      { id: 'opt3', label: '🔍 Estou pesquisando pra alguém', nextStepId: 'interest_detail', captureAs: 'segment' },
    ],
    actions: [{ type: 'increment_score', value: 10 }],
  },

  // ========================================
  // ETAPA 4.5: Detalhamento de Interesse
  // ========================================
  {
    id: 'interest_detail',
    stage: 4,
    name: 'Detalhamento',
    botMessage: 'Entendi! E me conta, você tá procurando por algo específico? Por exemplo:\n• Canzis/comedouros\n• Bebedouros\n• Porteiras\n• Outro equipamento\n\nPode me dizer o que você precisa.',
    captureInput: {
      type: 'text',
      field: 'interest',
      nextStepId: 'product_explanation',
    },
    actions: [{ type: 'increment_score', value: 20 }],
  },

  // ========================================
  // ETAPA 5: Explicação de Produtos
  // ========================================
  {
    id: 'product_explanation',
    stage: 5,
    name: 'Explicação',
    botMessage: 'Perfeito, {nome}! Olha, nossos equipamentos de {interesse} são feitos com:\n\n✅ Tubos galvanizados de alta resistência\n✅ Durabilidade comprovada em campo\n✅ Ergonomia pensada pro conforto do animal\n✅ Instalação facilitada\n\nTemos modelos específicos pra raça Holandesa e Jersey. Quer que eu te passe mais detalhes técnicos ou prefere já falar sobre valores?',
    options: [
      { id: 'opt1', label: '📋 Quero detalhes técnicos', nextStepId: 'capture_contact', captureAs: 'wants_technical' },
      { id: 'opt2', label: '💰 Prefiro falar sobre valores', nextStepId: 'capture_contact', captureAs: 'wants_pricing' },
      { id: 'opt3', label: '📱 Me manda tudo no WhatsApp', nextStepId: 'capture_contact', captureAs: 'wants_whatsapp' },
    ],
    actions: [{ type: 'increment_score', value: 15 }],
  },

  // ========================================
  // ETAPA 6: Captação de Contato
  // ========================================
  {
    id: 'capture_contact',
    stage: 6,
    name: 'Captação de Contato',
    botMessage: 'Show, {nome}! Vou te passar um material completo sobre nossos equipamentos de {interesse}.\n\nMelhor eu mandar no WhatsApp ou prefere que um especialista entre em contato? Me passa seu número: 📱',
    captureInput: {
      type: 'phone',
      field: 'capturedPhone',
      validation: '^\\(?\\d{2}\\)?\\s?\\d{4,5}-?\\d{4}$',
      nextStepId: 'handoff_decision',
    },
    actions: [
      { type: 'increment_score', value: 30 },
      { type: 'set_qualified', value: true },
    ],
  },

  // ========================================
  // ETAPA 7: Encaminhamento
  // ========================================
  {
    id: 'handoff_decision',
    stage: 7,
    name: 'Encaminhamento',
    botMessage: 'Ótimo, {nome}! Vou anotar aqui: {capturedPhone}\n\nAgora me diz, prefere que nosso time entre em contato pra fazer um orçamento personalizado, ou quer só receber o material informativo?',
    options: [
      { id: 'opt1', label: '👤 Quero falar com especialista', nextStepId: 'closing_with_lead', captureAs: 'wants_consultant' },
      { id: 'opt2', label: '📱 Só material por WhatsApp mesmo', nextStepId: 'marketing_consent', captureAs: 'prefers_whatsapp' },
      { id: 'opt3', label: '📧 Prefiro receber por e-mail', nextStepId: 'capture_email', captureAs: 'prefers_email' },
    ],
  },

  // ========================================
  // ETAPA 8: Consentimento de Marketing
  // ========================================
  {
    id: 'capture_email',
    stage: 7,
    name: 'Captura de Email',
    botMessage: 'Sem problema! Me passa seu melhor e-mail que eu te envio o material completo:',
    captureInput: {
      type: 'email',
      field: 'capturedEmail',
      nextStepId: 'marketing_consent',
    },
    actions: [{ type: 'increment_score', value: 20 }],
  },

  {
    id: 'marketing_consent',
    stage: 8,
    name: 'Consentimento',
    botMessage: 'Perfeito, {nome}! Você vai receber o material em breve.\n\nSe você quiser, posso te manter informado sobre lançamentos e promoções de equipamentos pra pecuária leiteira. Autoriza?',
    options: [
      { id: 'opt1', label: '✅ Sim, pode me avisar', nextStepId: 'closing', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não, obrigado', nextStepId: 'closing', captureAs: 'marketing_opt_out' },
    ],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  {
    id: 'closing_with_lead',
    stage: 8,
    name: 'Encerramento com Lead',
    botMessage: 'Combinado, {nome}! Um dos nossos especialistas vai entrar em contato com você em breve no número {capturedPhone}.\n\nEstamos localizados em {companyAddress} e você também pode nos ligar: {companyPhone}\n\nFoi um prazer te atender! 😊',
    options: [],
    actions: [
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  // ========================================
  // Fluxos Paralelos
  // ========================================
  {
    id: 'quick_question',
    stage: 1,
    name: 'Dúvida Rápida',
    botMessage: 'Claro! Estou aqui pra ajudar. 😊\nQual é sua dúvida?',
    captureInput: {
      type: 'text',
      field: 'question',
      nextStepId: 'faq_response',
    },
  },

  {
    id: 'faq_response',
    stage: 1,
    name: 'Resposta FAQ',
    botMessage: 'Deixa eu ver o que posso te ajudar com isso...\n\n[Resposta baseada em FAQs]\n\nIsso respondeu sua dúvida? Quer saber mais sobre nossos produtos?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero saber mais', nextStepId: 'presentation' },
      { id: 'opt2', label: '❓ Tenho outra dúvida', nextStepId: 'quick_question' },
      { id: 'opt3', label: '👋 Obrigado, era só isso', nextStepId: 'closing' },
    ],
  },

  {
    id: 'specific_question',
    stage: 5,
    name: 'Dúvida Específica',
    botMessage: 'Claro, {nome}! Pode perguntar, estou aqui pra ajudar. 😊',
    captureInput: {
      type: 'text',
      field: 'specific_question',
      nextStepId: 'capture_contact',
    },
  },

  {
    id: 'human_handoff',
    stage: 7,
    name: 'Transferência Humana',
    botMessage: 'Perfeito! Vou te conectar com um dos nossos consultores agora.\n\nAntes disso, só preciso do seu WhatsApp para que ele entre em contato. 📱',
    captureInput: {
      type: 'phone',
      field: 'capturedPhone',
      nextStepId: 'closing',
    },
    actions: [
      { type: 'set_qualified', value: true },
      { type: 'create_lead' },
      { type: 'send_notification' },
    ],
  },

  {
    id: 'closing',
    stage: 8,
    name: 'Encerramento',
    botMessage: 'Fechou! Obrigado pelo seu tempo, {nome}! 😊\n\nQualquer dúvida, estou por aqui. É só chamar!\n\n📞 {companyPhone}\n📍 {companyAddress}\n\nAté mais! 👋',
    options: [],
  },
];

/**
 * Substitui variáveis dinâmicas na mensagem
 */
export function replaceVariables(
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
    [key: string]: any;
  }
): string {
  let result = message;

  // Substituir {nome}
  if (data.nome) {
    result = result.replace(/\{nome\}/g, data.nome);
  }

  // Substituir {interesse}
  if (data.interesse) {
    result = result.replace(/\{interesse\}/g, data.interesse);
  }

  // Substituir {companyName}
  if (data.companyName) {
    result = result.replace(/\{companyName\}/g, data.companyName);
  }

  // Substituir {companyDescription}
  if (data.companyDescription) {
    result = result.replace(/\{companyDescription\}/g, data.companyDescription);
  }

  // Substituir {companyAddress}
  if (data.companyAddress) {
    result = result.replace(/\{companyAddress\}/g, data.companyAddress || 'Palmital - PR');
  }

  // Substituir {companyPhone}
  if (data.companyPhone) {
    result = result.replace(/\{companyPhone\}/g, data.companyPhone || '(42) 99134-5227');
  }

  // Substituir {capturedPhone}
  if (data.capturedPhone) {
    result = result.replace(/\{capturedPhone\}/g, data.capturedPhone);
  }

  // Substituir {productList}
  if (data.productList) {
    result = result.replace(/\{productList\}/g, data.productList);
  }

  return result;
}

/**
 * Calcula score de qualificação baseado nas ações
 */
export function calculateQualificationScore(session: any): number {
  let score = 0;

  // Nome fornecido: +15
  if (session.capturedName) score += 15;

  // Telefone fornecido: +30
  if (session.capturedPhone) score += 30;

  // Email fornecido: +20
  if (session.capturedEmail) score += 20;

  // Interesse específico: +20
  if (session.interest) score += 20;

  // Segmento definido: +10
  if (session.segment) score += 10;

  // Estágio avançado (>= 5): +15
  if (session.currentStage >= 5) score += 15;

  return score;
}
