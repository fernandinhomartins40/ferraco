/**
 * Configuração de Intenções (Intents)
 * Define todas as intenções que o chatbot pode reconhecer
 */

import { Intent } from './types';

export const intentsConfig: Intent[] = [
  // ============================================
  // 1. SAUDAÇÕES
  // ============================================
  {
    id: 'greeting',
    name: 'Saudação',
    keywords: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa', 'alo', 'alô', 'e ai', 'e aí'],
    patterns: [/^(oi|olá|ola|hey|opa|alô|alo|bom dia|boa tarde|boa noite)/i],
    priority: 10,
    responses: [
      {
        template: "Olá! 👋 Tudo bem? Sou o assistente virtual da ${companyName}.",
        followUp: "Como posso te ajudar hoje?"
      }
    ]
  },

  // ============================================
  // 2. PERGUNTA SOBRE PRODUTOS (GENÉRICA)
  // ============================================
  {
    id: 'product_inquiry',
    name: 'Pergunta sobre Produtos',
    keywords: [
      'produto', 'produtos', 'vende', 'vendem', 'tem', 'possui',
      'trabalha com', 'trabalham com', 'oferece', 'oferecem',
      'fabrica', 'fabricam', 'faz', 'fazem', 'vendo', 'vendem',
      'catalogo', 'catálogo', 'linha', 'o que voce vende', 'o que você vende'
    ],
    patterns: [
      /o que (?:voc[eê]s?|a empresa) (?:vende|fabrica|oferece|faz)/i,
      /quais (?:produtos|servi[cç]os)/i
    ],
    priority: 9,
    responses: [
      {
        template: "Trabalhamos com ${productCategories}. Qual te interessa mais?"
      }
    ]
  },

  // ============================================
  // 3. PERGUNTA SOBRE PRODUTO ESPECÍFICO
  // ============================================
  {
    id: 'specific_product_inquiry',
    name: 'Pergunta sobre Produto Específico',
    keywords: [], // Será detectado por matching de produtos
    patterns: [],
    priority: 9,
    responses: [
      {
        template: "Temos ${productName} sim! ${description}. Te interessa?"
      }
    ]
  },

  // ============================================
  // 4. PERGUNTA SOBRE PREÇO
  // ============================================
  {
    id: 'price_question',
    name: 'Pergunta sobre Preço',
    keywords: [
      'preço', 'preco', 'quanto custa', 'quanto é', 'quanto sai',
      'valor', 'valores', 'preços', 'precos', 'custo', 'custa',
      'quanto', 'orçamento', 'orcamento', 'cotação', 'cotacao'
    ],
    patterns: [
      /quanto (?:custa|é|sai|fica)/i,
      /qual (?:o |é o )?(?:pre[cç]o|valor)/i
    ],
    priority: 8,
    responses: [
      {
        template: "O ${productName} ${priceInfo}. Posso te enviar um orçamento detalhado no WhatsApp. Qual seu número?",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Perfeito ${userName}! Vou preparar um orçamento completo para ${productName}. Só confirmando, seu WhatsApp é ${phone}?",
        conditions: { hasLeadData: ['name', 'phone'] }
      }
    ]
  },

  // ============================================
  // 5. DISPONIBILIDADE / ESTOQUE
  // ============================================
  {
    id: 'availability',
    name: 'Disponibilidade',
    keywords: [
      'disponível', 'disponivel', 'estoque', 'tem em estoque',
      'disponibilidade', 'pronta entrega', 'entrega imediata'
    ],
    patterns: [
      /(?:tem|possui|há) (?:em )?(?:estoque|dispon[ií]vel)/i
    ],
    priority: 7,
    responses: [
      {
        template: "Sim, temos ${productName} disponível! Posso verificar os detalhes e te mandar no WhatsApp. Qual seu número?"
      }
    ]
  },

  // ============================================
  // 6. ENTREGA / PRAZO
  // ============================================
  {
    id: 'delivery_inquiry',
    name: 'Pergunta sobre Entrega',
    keywords: [
      'entrega', 'entregar', 'entregam', 'prazo', 'prazos',
      'demora', 'quanto tempo', 'quando chega', 'frete',
      'envia', 'enviam', 'manda', 'mandam', 'transporta'
    ],
    patterns: [
      /quanto tempo (?:demora|leva|para entregar)/i,
      /qual (?:o )?prazo/i
    ],
    priority: 7,
    responses: [
      {
        template: "O prazo de entrega varia conforme sua região. Você é de onde?",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Para facilitar, me passa seu WhatsApp que te mando os detalhes de entrega?",
        conditions: { hasLeadData: [] }
      }
    ]
  },

  // ============================================
  // 7. INFORMAÇÕES DA EMPRESA
  // ============================================
  {
    id: 'company_info',
    name: 'Informações da Empresa',
    keywords: [
      'horário', 'horario', 'atendimento', 'funciona', 'abre', 'fecha',
      'endereço', 'endereco', 'localização', 'localizacao',
      'onde fica', 'onde', 'telefone', 'contato', 'falar com',
      'localizado', 'situado', 'fica'
    ],
    patterns: [
      /(?:qual|me (?:fala|diz)|onde (?:fica|é)) (?:o )?(?:endere[cç]o|localiza[cç][aã]o|hor[aá]rio)/i
    ],
    priority: 6,
    responses: [
      {
        template: "${companyInfo}"
      }
    ]
  },

  // ============================================
  // 8. CAPTURA DE NOME
  // ============================================
  {
    id: 'give_name',
    name: 'Cliente Fornece Nome',
    keywords: ['meu nome é', 'meu nome e', 'me chamo', 'sou o', 'sou a', 'nome'],
    patterns: [
      /(?:meu nome [eé]|me chamo|sou (?:o|a))\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)?)\s*(?:aqui|daqui)?$/i
    ],
    priority: 10,
    responses: [
      {
        template: "Prazer, ${userName}! 😊 Para te enviar informações completas, qual seu WhatsApp?"
      }
    ]
  },

  // ============================================
  // 9. CAPTURA DE TELEFONE
  // ============================================
  {
    id: 'give_phone',
    name: 'Cliente Fornece Telefone',
    keywords: ['whatsapp', 'zap', 'telefone', 'celular', 'número', 'numero'],
    patterns: [
      /\(?\d{2}\)?\s*9?\d{4,5}-?\d{4}/
    ],
    priority: 10,
    responses: [
      {
        template: "Perfeito! Salvei aqui: ${phone}. Vou te mandar as informações em breve. O que mais gostaria de saber?",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Ótimo, ${userName}! Salvei seu WhatsApp ${phone}. Já vou preparar o material para você. Algo mais que possa ajudar?",
        conditions: { hasLeadData: ['name'] }
      }
    ]
  },

  // ============================================
  // 10. CAPTURA DE EMAIL
  // ============================================
  {
    id: 'give_email',
    name: 'Cliente Fornece Email',
    keywords: ['email', 'e-mail', 'gmail', 'hotmail', 'outlook'],
    patterns: [
      /[\w.-]+@[\w.-]+\.\w{2,}/
    ],
    priority: 8,
    responses: [
      {
        template: "Anotei seu email: ${email}. Para facilitar o contato, tem WhatsApp?"
      }
    ]
  },

  // ============================================
  // 11. INTERESSE EM ORÇAMENTO
  // ============================================
  {
    id: 'budget_request',
    name: 'Solicita Orçamento',
    keywords: [
      'orçamento', 'orcamento', 'cotação', 'cotacao', 'proposta',
      'quanto sairia', 'quanto ficaria', 'pode me mandar'
    ],
    patterns: [
      /(?:fazer|mandar|enviar|me (?:passa|manda)) (?:um )?or[cç]amento/i
    ],
    priority: 8,
    responses: [
      {
        template: "Claro! Para fazer um orçamento personalizado, preciso do seu WhatsApp. Pode me passar?",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Perfeito ${userName}! Vou preparar um orçamento completo e te mando no ${phone}. Em breve você recebe!",
        conditions: { hasLeadData: ['name', 'phone'] }
      }
    ]
  },

  // ============================================
  // 12. FAQ GENÉRICO
  // ============================================
  {
    id: 'faq_question',
    name: 'Pergunta do FAQ',
    keywords: [], // Será detectado por similaridade no FAQ
    patterns: [],
    priority: 5,
    responses: [
      {
        template: "${faqAnswer}"
      }
    ]
  },

  // ============================================
  // 13. AGRADECIMENTO
  // ============================================
  {
    id: 'thanks',
    name: 'Agradecimento',
    keywords: ['obrigado', 'obrigada', 'valeu', 'vlw', 'obg', 'thanks', 'agradeço', 'agradeco'],
    patterns: [/^(?:muito )?obrigad[oa]/i],
    priority: 8,
    responses: [
      {
        template: "Por nada! 😊 Estou aqui pra ajudar. Precisa de mais alguma coisa?"
      }
    ]
  },

  // ============================================
  // 14. DESPEDIDA
  // ============================================
  {
    id: 'goodbye',
    name: 'Despedida',
    keywords: ['tchau', 'até', 'ate', 'falou', 'flw', 'abraço', 'abraco', 'ate mais', 'até mais', 'ate logo', 'até logo'],
    patterns: [
      /^(?:tchau|até|falou)/i,
      /(?:até|ate) (?:mais|logo|breve)/i
    ],
    priority: 8,
    responses: [
      {
        template: "Até mais! 👋 Qualquer coisa é só chamar.",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Valeu ${userName}! Já salvei seus dados. Logo te mando as informações. Até! 😊",
        conditions: { hasLeadData: ['name'] }
      }
    ]
  },

  // ============================================
  // 15. CONFIRMAÇÃO (SIM)
  // ============================================
  {
    id: 'confirmation_yes',
    name: 'Confirmação Positiva',
    keywords: ['sim', 'yes', 'claro', 'com certeza', 'quero', 'quero sim', 'pode ser', 'beleza', 'ok', 'okay', 'vale'],
    patterns: [/^(?:sim|yes|claro|com certeza|quero|pode ser|beleza|ok|vale)/i],
    priority: 7,
    responses: [
      {
        template: "Ótimo! Me passa seu WhatsApp para eu te enviar mais detalhes?",
        conditions: { hasLeadData: [] }
      }
    ]
  },

  // ============================================
  // 16. NEGAÇÃO (NÃO)
  // ============================================
  {
    id: 'confirmation_no',
    name: 'Negação',
    keywords: ['não', 'nao', 'no', 'nope', 'não quero', 'nao quero'],
    patterns: [/^(?:n[aã]o|nope|n[aã]o quero)/i],
    priority: 7,
    responses: [
      {
        template: "Sem problemas! Tem alguma outra dúvida que eu possa ajudar?"
      }
    ]
  },

  // ============================================
  // 99. FALLBACK (Quando não entende)
  // ============================================
  {
    id: 'fallback',
    name: 'Não Entendido',
    keywords: [],
    patterns: [],
    priority: 0,
    responses: [
      {
        template: "Hmm, não entendi muito bem. Pode reformular? Ou me diga: você quer saber sobre produtos, preços ou fazer um orçamento?",
        conditions: { messageCount: { max: 3 } }
      },
      {
        template: "Não consegui entender. Para facilitar: está procurando informações sobre produtos, preços ou entrega?",
        conditions: { messageCount: { min: 4 } }
      }
    ]
  }
];
