/**
 * Configuração de Intenções V2 - Fluxo Conversacional Natural
 * Baseado em fluxo humano e menos robotizado
 */

import { Intent } from './types';

export const intentsConfigV2: Intent[] = [
  // ============================================
  // ETAPA 1: BOAS-VINDAS E CONTEXTO
  // ============================================
  {
    id: 'greeting',
    name: 'Saudação Inicial',
    keywords: ['oi', 'ola', 'olá', 'bom dia', 'boa tarde', 'boa noite', 'hey', 'opa', 'alo', 'alô', 'e ai', 'e aí', 'opa'],
    patterns: [/^(oi|olá|ola|hey|opa|alô|alo|bom dia|boa tarde|boa noite|e\s*a[íi])/i],
    priority: 10,
    responses: [
      {
        template: "Olá! 👋 Tudo bem?\nEu sou o assistente virtual da ${companyName}. Posso te ajudar a conhecer melhor nossos produtos e encontrar a melhor opção pra você.\n\nVocê quer:\n1️⃣ Saber mais sobre os produtos\n2️⃣ Falar com um atendente\n3️⃣ Apenas tirar uma dúvida rápida"
      }
    ]
  },

  // ============================================
  // ETAPA 2: ESCOLHA DO USUÁRIO (PRODUTOS)
  // ============================================
  {
    id: 'want_know_products',
    name: 'Quer Conhecer Produtos',
    keywords: ['produtos', 'produto', 'saber mais', 'conhecer', 'ver produtos', 'opção 1', 'opcao 1', '1'],
    patterns: [/^1$/, /saber mais/i, /conhecer.*produto/i],
    priority: 9,
    responses: [
      {
        template: "Perfeito! 😄\nAntes de te mostrar as opções, posso entender rapidinho o que você está procurando?\n\nO que mais te interessa no momento?\n\n💼 Soluções para empresas\n🏠 Produtos para uso pessoal\n❓ Ainda estou conhecendo"
      }
    ]
  },

  {
    id: 'want_attendant',
    name: 'Quer Falar com Atendente',
    keywords: ['atendente', 'humano', 'pessoa', 'alguém', 'alguem', 'opção 2', 'opcao 2', '2'],
    patterns: [/^2$/, /falar com (atendente|algu[ée]m|pessoa)/i],
    priority: 9,
    responses: [
      {
        template: "Claro! 😊\nVou te conectar com nosso time.\n\nPra agilizar, me passa seu nome e WhatsApp?"
      }
    ]
  },

  {
    id: 'quick_question',
    name: 'Dúvida Rápida',
    keywords: ['dúvida', 'duvida', 'pergunta', 'opção 3', 'opcao 3', '3'],
    patterns: [/^3$/, /d[uú]vida r[áa]pida/i],
    priority: 9,
    responses: [
      {
        template: "Claro! Pode perguntar. 😊\nEstou aqui pra te ajudar!"
      }
    ]
  },

  // ============================================
  // ETAPA 3: IDENTIFICAÇÃO SUAVE (NOME)
  // ============================================
  {
    id: 'ask_name',
    name: 'Pedir Nome Naturalmente',
    keywords: [],
    patterns: [],
    priority: 7,
    responses: [
      {
        template: "Legal! Pra te ajudar melhor, posso te chamar pelo seu nome? 😄"
      }
    ]
  },

  {
    id: 'give_name',
    name: 'Usuário Fornece Nome',
    keywords: ['meu nome é', 'me chamo', 'sou o', 'sou a', 'pode me chamar de'],
    patterns: [
      /(?:meu nome [ée]|me chamo|sou (?:o|a)|pode me chamar de)\s+([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)/i,
      /^([A-ZÀ-Ú][a-zà-ú]+(?:\s+[A-ZÀ-Ú][a-zà-ú]+)*)$/
    ],
    priority: 10,
    responses: [
      {
        template: "Prazer, ${userName}! 👋\nAgora me conta rapidinho — você já conhece nossos produtos ou é sua primeira vez aqui?\n\n1️⃣ Já conheço um pouco\n2️⃣ Primeira vez\n3️⃣ Estou comparando com outra empresa"
      }
    ]
  },

  // ============================================
  // ETAPA 4: QUALIFICAÇÃO NATURAL (INTERESSE)
  // ============================================
  {
    id: 'first_time',
    name: 'Primeira Vez',
    keywords: ['primeira vez', 'primeira', 'nunca', 'não conhec', 'nao conhec', '2'],
    patterns: [/primeira vez/i, /nunca/i, /n[aã]o conh/i, /^2$/],
    priority: 8,
    responses: [
      {
        template: "Ótima escolha! 😊\nE o que mais te chamou atenção até agora?\n\n(Essa resposta me ajuda a entender o que pode te interessar mais.)"
      }
    ]
  },

  {
    id: 'already_know',
    name: 'Já Conhece',
    keywords: ['já conhec', 'ja conhec', 'conheço', 'conheco', 'sim', 'já vi', 'ja vi', '1'],
    patterns: [/j[aá] conh/i, /conh.*um pouco/i, /^1$/],
    priority: 8,
    responses: [
      {
        template: "Show! 👍\nEntão você já sabe da qualidade dos nossos produtos. O que te traz aqui hoje?"
      }
    ]
  },

  {
    id: 'comparing',
    name: 'Comparando',
    keywords: ['compar', 'outra empresa', 'concorr', 'pesquisando', '3'],
    patterns: [/compar/i, /outra empresa/i, /pesquisando/i, /^3$/],
    priority: 8,
    responses: [
      {
        template: "Entendo perfeitamente! 👌\nÉ sempre bom comparar. Me conta: o que é mais importante pra você na escolha? Qualidade, preço, prazo de entrega?"
      }
    ]
  },

  // ============================================
  // ETAPA 5: EXPLICAÇÃO SOBRE PRODUTOS
  // ============================================
  {
    id: 'show_benefits',
    name: 'Mostrar Benefícios',
    keywords: ['benefícios', 'beneficios', 'vantagens', 'diferenciais', 'por que', 'porque'],
    patterns: [/benef[íi]cios/i, /vantagens/i, /diferenciais/i, /por\s*que/i],
    priority: 8,
    responses: [
      {
        template: "Ótimo! Nossos produtos foram desenvolvidos pra ${mainBenefit}.\n\nEles se destacam por:\n✅ ${differential1}\n✅ ${differential2}\n✅ ${differential3}\n\nQuer que eu te mostre exemplos de como nossos clientes estão usando?"
      }
    ]
  },

  {
    id: 'want_examples',
    name: 'Quer Ver Exemplos',
    keywords: ['sim', 'quero', 'exemplos', 'casos', 'clientes', 'mostrar'],
    patterns: [/sim|quero|pode|mostre/i],
    priority: 7,
    responses: [
      {
        template: "Que bom! 😄\nTemos vários casos de sucesso. ${examples}\n\nQuer que eu te envie mais informações completas ou prefere saber valores primeiro?"
      }
    ]
  },

  // ============================================
  // PRODUTOS ESPECÍFICOS (MENOS ROBÓTICO)
  // ============================================
  {
    id: 'product_inquiry',
    name: 'Pergunta sobre Produto',
    keywords: [
      'produto', 'produtos', 'vende', 'tem', 'oferece', 'fabrica',
      'trabalha com', 'catalogo', 'catálogo', 'linha'
    ],
    patterns: [
      /o que (?:voc[eê]s?|a empresa) (?:vende|fabrica|oferece|tem)/i,
      /quais produtos/i
    ],
    priority: 8,
    responses: [
      {
        template: "Legal saber disso! 😊\nTrabalhamos com ${productCategories}.\n\nAlguma dessas linhas te interessa mais ou quer que eu explique sobre todas?"
      }
    ]
  },

  {
    id: 'specific_product_inquiry',
    name: 'Produto Específico',
    keywords: [],
    patterns: [],
    priority: 8,
    responses: [
      {
        template: "Ah, ${productName}! Ótima escolha. 👏\n\n${description}\n\nÉ um dos nossos produtos mais procurados. Te interessa saber mais sobre ele?"
      }
    ]
  },

  // ============================================
  // PREÇO (COM VALIDAÇÃO E PERSONALIZAÇÃO)
  // ============================================
  {
    id: 'price_question',
    name: 'Pergunta sobre Preço',
    keywords: ['preço', 'preco', 'quanto custa', 'valor', 'quanto é', 'orçamento', 'orcamento'],
    patterns: [
      /quanto (?:custa|é|sai|fica)/i,
      /qual.*(?:pre[cç]o|valor)/i
    ],
    priority: 8,
    responses: [
      {
        template: "Perfeito! 😄\nO ${productName} ${priceInfo}.\n\nPosso te enviar uma simulação personalizada. Qual o melhor número de WhatsApp pra te mandar os detalhes? 📱",
        conditions: { hasLeadData: [] }
      },
      {
        template: "Show, ${userName}! 👍\nVou preparar um orçamento personalizado de ${productName} e te mandar no WhatsApp ${phone}.\n\nEnquanto isso, tem mais alguma dúvida?",
        conditions: { hasLeadData: ['name', 'phone'] }
      }
    ]
  },

  // ============================================
  // CAPTURA DE TELEFONE (NATURAL)
  // ============================================
  {
    id: 'give_phone',
    name: 'Fornece Telefone',
    keywords: [],
    patterns: [/\(?\d{2}\)?\s*9?\d{4,5}[-\s]?\d{4}/],
    priority: 10,
    responses: [
      {
        template: "Perfeito, ${userName}! 📱\nSalvei aqui: ${phone}.\n\nAssim posso te enviar também novidades e promoções relacionadas ao que você mencionou.\n\nSe quiser, posso te encaminhar pro nosso consultor especializado pra te ajudar pessoalmente. Quer que eu faça isso agora?",
        conditions: { hasLeadData: ['name'] }
      },
      {
        template: "Ótimo! Salvei: ${phone}. 📱\n\nAh, só pra eu personalizar melhor as informações, qual seu nome?"
      }
    ]
  },

  // ============================================
  // ENCAMINHAMENTO PARA CONSULTOR
  // ============================================
  {
    id: 'want_consultant',
    name: 'Quer Consultor',
    keywords: ['sim', 'quero', 'consultor', 'especialista', 'atendente'],
    patterns: [/sim|quero|pode|encaminh/i],
    priority: 7,
    responses: [
      {
        template: "Combinado! 😄\nNosso consultor vai entrar em contato pelo WhatsApp ${phone} nas próximas horas.\n\nEnquanto isso, você pode conferir mais sobre ${interesse} aqui: ${link}\n\nPosso te avisar quando lançarmos novidades relacionadas a ${interesse}?"
      }
    ]
  },

  {
    id: 'prefer_whatsapp_only',
    name: 'Prefere Apenas WhatsApp',
    keywords: ['whatsapp', 'só whatsapp', 'apenas whatsapp', 'manda'],
    patterns: [/(?:s[óo]|apenas|somente).*whatsapp/i, /manda.*whatsapp/i],
    priority: 7,
    responses: [
      {
        template: "Perfeito! 👍\nVou te mandar todas as informações no ${phone}.\n\nAgradeço pelo seu tempo, ${userName}! Espero que eu tenha te ajudado. 😊\n\nQualquer dúvida, é só chamar aqui de novo!"
      }
    ]
  },

  // ============================================
  // FAQ (RESPOSTAS RÁPIDAS E HUMANIZADAS)
  // ============================================
  {
    id: 'faq_question',
    name: 'Pergunta FAQ',
    keywords: [],
    patterns: [],
    priority: 6,
    responses: [
      {
        template: "${faqAnswer}\n\nIsso responde sua dúvida? 😊"
      }
    ]
  },

  // ============================================
  // ENTREGA/PRAZO (HUMANIZADO)
  // ============================================
  {
    id: 'delivery_inquiry',
    name: 'Pergunta sobre Entrega',
    keywords: ['entrega', 'prazo', 'demora', 'quanto tempo', 'quando chega', 'frete'],
    patterns: [/prazo|entrega|demora|quando chega/i],
    priority: 7,
    responses: [
      {
        template: "Boa pergunta! 🚚\nO prazo varia conforme a região. Você é de qual cidade?"
      },
      {
        template: "Legal saber disso! Para ${city}, geralmente entregamos em ${deliveryTime}.\n\nTem mais alguma dúvida?",
        conditions: { hasLeadData: ['location'] }
      }
    ]
  },

  // ============================================
  // INFORMAÇÕES DA EMPRESA (TOM AMIGÁVEL)
  // ============================================
  {
    id: 'company_info',
    name: 'Informações da Empresa',
    keywords: ['horário', 'horario', 'endereço', 'endereco', 'localização', 'localizacao', 'onde fica', 'telefone', 'contato'],
    patterns: [/hor[áa]rio|endere[çc]o|localiza[çc][ãa]o|onde fica|telefone/i],
    priority: 7,
    responses: [
      {
        template: "${companyInfo}\n\nPrecisa de mais alguma informação? 😊"
      }
    ]
  },

  // ============================================
  // CONFIRMAÇÕES POSITIVAS (VALIDAÇÃO)
  // ============================================
  {
    id: 'confirmation_yes',
    name: 'Sim/Confirmação',
    keywords: ['sim', 'claro', 'pode', 'quero', 'sim', 'yes', 'ok', 'beleza', 'blz'],
    patterns: [/^(sim|claro|pode|quero|yes|ok|beleza|blz)$/i],
    priority: 6,
    responses: [
      {
        template: "Ótima escolha! 👏"
      }
    ]
  },

  {
    id: 'confirmation_no',
    name: 'Não/Negação',
    keywords: ['não', 'nao', 'não quero', 'nao quero', 'depois', 'agora não', 'agora nao'],
    patterns: [/^(n[ãa]o|depois|agora n[ãa]o)$/i],
    priority: 6,
    responses: [
      {
        template: "Sem problemas! 😊\nSe precisar de algo, estou aqui."
      }
    ]
  },

  // ============================================
  // DESPEDIDA (CALOROSA)
  // ============================================
  {
    id: 'goodbye',
    name: 'Despedida',
    keywords: ['tchau', 'valeu', 'obrigado', 'obrigada', 'até logo', 'até mais', 'falou', 'flw', 'abraço'],
    patterns: [/tchau|valeu|obrigad|at[ée] (logo|mais)|falou|flw|abra[çc]o/i],
    priority: 8,
    responses: [
      {
        template: "Por nada! Qualquer coisa é só chamar. 👋\nFoi um prazer te ajudar, ${userName}!",
        conditions: { hasLeadData: ['name'] }
      },
      {
        template: "Valeu! 😊 Até mais! 👋"
      }
    ]
  },

  // ============================================
  // FALLBACK (AMIGÁVEL E ORIENTADOR)
  // ============================================
  {
    id: 'fallback',
    name: 'Não Entendido',
    keywords: [],
    patterns: [],
    priority: 0,
    responses: [
      {
        template: "Hmm, não consegui pegar bem. 😅\nPode reformular ou me dizer:\n\n• Quer saber sobre produtos?\n• Quer tirar uma dúvida?\n• Quer falar com um atendente?"
      },
      {
        template: "Ops! Acho que não entendi direito. 🤔\nVocê quer saber sobre preços, produtos ou entrega?"
      }
    ]
  }
];
