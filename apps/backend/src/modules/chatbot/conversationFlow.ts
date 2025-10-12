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
    botMessage: 'Olá! 👋 Tudo bem?\nEu sou o assistente virtual da {companyName}. Posso te ajudar a conhecer melhor nossos produtos e encontrar a melhor opção pra você.\n\nVocê quer saber mais sobre os produtos ou falar com um atendente?',
    options: [
      { id: 'opt1', label: '🛍️ Saber mais sobre os produtos', nextStepId: 'presentation', captureAs: 'initial_choice' },
      { id: 'opt2', label: '👤 Falar com um atendente', nextStepId: 'human_handoff', captureAs: 'initial_choice' },
      { id: 'opt3', label: '❓ Apenas tirar uma dúvida rápida', nextStepId: 'quick_question', captureAs: 'initial_choice' },
    ],
  },

  // ========================================
  // ETAPA 2: Apresentação Inteligente
  // ========================================
  {
    id: 'presentation',
    stage: 2,
    name: 'Apresentação',
    botMessage: 'Perfeito! 😄\nAntes de te mostrar as opções, posso entender rapidinho o que você está procurando?\n\nO que mais te interessa no momento?',
    options: [
      { id: 'opt1', label: '💼 Soluções para empresas', nextStepId: 'capture_name', captureAs: 'segment' },
      { id: 'opt2', label: '🏠 Produtos para uso pessoal', nextStepId: 'capture_name', captureAs: 'segment' },
      { id: 'opt3', label: '❓ Ainda estou conhecendo', nextStepId: 'capture_name', captureAs: 'segment' },
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
    botMessage: 'Legal! Pra te ajudar melhor, posso te chamar pelo seu nome? 😄',
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
    botMessage: 'Prazer, {nome}! 👋\nAgora me conta rapidinho — você já conhece nossos produtos ou é sua primeira vez aqui?',
    options: [
      { id: 'opt1', label: '✅ Já conheço um pouco', nextStepId: 'interest_detail', captureAs: 'familiarity' },
      { id: 'opt2', label: '🆕 Primeira vez', nextStepId: 'interest_detail', captureAs: 'familiarity' },
      { id: 'opt3', label: '⚖️ Estou comparando com outra empresa', nextStepId: 'interest_detail', captureAs: 'familiarity' },
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
    botMessage: 'Entendi. 👍\nE o que mais te chamou atenção até agora?\n\n(Essa resposta me ajuda a entender o que pode te interessar mais.)',
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
    botMessage: 'Show! Temos ótimas opções nessa linha. 👇\nNossos produtos foram desenvolvidos para oferecer {interesse} com máxima qualidade e eficiência.\n\nEles se destacam por durabilidade, tecnologia de ponta e suporte especializado.\n\nQuer que eu te mostre exemplos de como nossos clientes estão usando?',
    options: [
      { id: 'opt1', label: '👀 Sim, quero ver exemplos', nextStepId: 'capture_contact', captureAs: 'wants_examples' },
      { id: 'opt2', label: '💰 Quero saber valores', nextStepId: 'capture_contact', captureAs: 'wants_pricing' },
      { id: 'opt3', label: '❓ Quero tirar uma dúvida específica', nextStepId: 'specific_question', captureAs: 'wants_clarification' },
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
    botMessage: 'Que bom, {nome}! 😄\nPosso te enviar as informações completas (ou uma simulação personalizada).\n\nQual o melhor número de WhatsApp pra te mandar os detalhes? 📱',
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
    botMessage: 'Perfeito, {nome}! Assim posso te enviar também novidades e promoções relacionadas ao que você mencionou.\n\nSe quiser, posso te encaminhar pro nosso consultor especializado pra te ajudar pessoalmente.\nQuer que eu faça isso agora?',
    options: [
      { id: 'opt1', label: '👤 Sim, quero falar com o consultor', nextStepId: 'human_handoff', captureAs: 'wants_consultant' },
      { id: 'opt2', label: '📱 Pode mandar por WhatsApp', nextStepId: 'marketing_consent', captureAs: 'prefers_whatsapp' },
      { id: 'opt3', label: '👀 Prefiro só olhar por aqui', nextStepId: 'marketing_consent', captureAs: 'self_service' },
    ],
  },

  // ========================================
  // ETAPA 8: Consentimento de Marketing
  // ========================================
  {
    id: 'marketing_consent',
    stage: 8,
    name: 'Consentimento',
    botMessage: 'Combinado! 😄\nEnquanto nosso time entra em contato, você pode conferir também nossos produtos em nosso site.\n\nAgradeço pelo seu tempo, {nome}! Espero que eu tenha te ajudado.\nPosso te avisar quando lançarmos novidades relacionadas a {interesse}?',
    options: [
      { id: 'opt1', label: '✅ Sim, quero receber novidades', nextStepId: 'closing', captureAs: 'marketing_opt_in' },
      { id: 'opt2', label: '❌ Não, obrigado', nextStepId: 'closing', captureAs: 'marketing_opt_out' },
    ],
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
    botMessage: 'Foi um prazer te ajudar, {nome}! 😊\n\nSe precisar de qualquer coisa, é só chamar. Estou sempre por aqui! 👋',
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
