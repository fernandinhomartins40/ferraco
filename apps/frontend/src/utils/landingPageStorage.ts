/**
 * Sistema de Armazenamento para Configuração da Landing Page
 *
 * Gerencia persistência no LocalStorage com validação e versionamento
 */

import { LandingPageConfig } from '@/types/landingPage';

const STORAGE_KEY = 'ferraco_landing_page_config';
const STORAGE_VERSION = '1.0.0';

// ============================================================================
// CONFIGURAÇÃO PADRÃO COMPLETA
// ============================================================================

export const getDefaultConfig = (): LandingPageConfig => ({
  version: STORAGE_VERSION,
  lastModified: new Date().toISOString(),

  // META
  meta: {
    title: 'Ferraco - Equipamentos para Pecuária Leiteira',
    description:
      'Há mais de 30 anos fornecendo equipamentos de alta qualidade para pecuária leiteira. Bebedouros, bezerreiros, canzis, contenção e mais.',
    keywords: [
      'equipamentos pecuária',
      'pecuária leiteira',
      'bebedouro gado',
      'bezerreiro',
      'canzil',
      'contenção animal',
      'free stall',
      'ferraco',
    ],
    author: 'Ferraco Equipamentos',
    ogImage: '/assets/logo-ferraco.webp',
    favicon: '/favicon.ico',
  },

  // THEME
  theme: {
    colors: {
      primary: '#0ea5e9',
      primaryDark: '#0284c7',
      primaryLight: '#38bdf8',
      secondary: '#10b981',
      accent: '#f59e0b',
      background: '#ffffff',
      surface: '#f8fafc',
      text: {
        primary: '#1e293b',
        secondary: '#64748b',
        disabled: '#cbd5e1',
        inverse: '#ffffff',
      },
      success: '#10b981',
      warning: '#f59e0b',
      error: '#ef4444',
      info: '#3b82f6',
    },
    typography: {
      fontFamily: {
        primary: "'Inter', sans-serif",
        secondary: "'Poppins', sans-serif",
        monospace: "'JetBrains Mono', monospace",
      },
      fontSize: {
        xs: '0.75rem',
        sm: '0.875rem',
        base: '1rem',
        lg: '1.125rem',
        xl: '1.25rem',
        '2xl': '1.5rem',
        '3xl': '1.875rem',
        '4xl': '2.25rem',
        '5xl': '3rem',
      },
      fontWeight: {
        light: 300,
        normal: 400,
        medium: 500,
        semibold: 600,
        bold: 700,
        extrabold: 800,
      },
      lineHeight: {
        tight: 1.25,
        normal: 1.5,
        relaxed: 1.75,
      },
      letterSpacing: {
        tight: '-0.025em',
        normal: '0',
        wide: '0.025em',
      },
    },
    spacing: {
      xs: '0.5rem',
      sm: '1rem',
      md: '1.5rem',
      lg: '2rem',
      xl: '3rem',
      '2xl': '4rem',
      '3xl': '6rem',
    },
    borders: {
      radius: {
        none: '0',
        sm: '0.25rem',
        md: '0.5rem',
        lg: '0.75rem',
        xl: '1rem',
        full: '9999px',
      },
      width: {
        thin: '1px',
        normal: '2px',
        thick: '4px',
      },
    },
    shadows: {
      sm: '0 1px 2px 0 rgb(0 0 0 / 0.05)',
      md: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      lg: '0 10px 15px -3px rgb(0 0 0 / 0.1)',
      xl: '0 20px 25px -5px rgb(0 0 0 / 0.1)',
      '2xl': '0 25px 50px -12px rgb(0 0 0 / 0.25)',
      inner: 'inset 0 2px 4px 0 rgb(0 0 0 / 0.05)',
      none: 'none',
    },
    darkMode: {
      enabled: false,
    },
  },

  // HEADER
  header: {
    enabled: true,
    logo: {
      type: 'image',
      image: {
        url: '/assets/logo-ferraco.webp',
        alt: 'Ferraco Logo',
        width: 120,
        height: 60,
        objectFit: 'contain',
      },
      width: 120,
      height: 60,
    },
    menu: {
      items: [
        { id: '1', label: 'Início', href: '#hero' },
        { id: '2', label: 'Sobre', href: '#about' },
        { id: '3', label: 'Produtos', href: '#products' },
        { id: '4', label: 'Experiência', href: '#experience' },
        { id: '5', label: 'Contato', href: '#contact' },
      ],
      alignment: 'right',
      style: {
        textColor: '#1e293b',
        fontSize: '1rem',
        fontWeight: '500',
        hover: {
          textColor: '#0ea5e9',
        },
      },
    },
    cta: {
      enabled: true,
      text: 'Solicitar Orçamento',
      href: '#contact',
      icon: 'MessageCircle',
      style: {
        backgroundColor: '#0ea5e9',
        textColor: '#ffffff',
        borderRadius: '0.5rem',
        padding: '0.75rem 1.5rem',
        hover: {
          backgroundColor: '#0284c7',
          textColor: '#ffffff',
        },
      },
    },
    sticky: true,
    transparent: false,
    style: {
      backgroundColor: '#ffffff',
      boxShadow: '0 1px 3px 0 rgb(0 0 0 / 0.1)',
    },
    mobileBreakpoint: 768,
  },

  // HERO
  hero: {
    enabled: true,
    title: {
      text: 'Equipamentos de Qualidade para',
      highlight: 'Pecuária Leiteira',
      style: {
        fontSize: '3rem',
        fontWeight: '700',
        textColor: '#1e293b',
      },
    },
    subtitle: {
      text: 'Há mais de 30 anos no mercado',
      style: {
        fontSize: '1.5rem',
        fontWeight: '500',
        textColor: '#0ea5e9',
      },
    },
    description: {
      text: 'Soluções completas em bebedouros, bezerreiros, canzis, contenção, free stall e muito mais. Qualidade e durabilidade garantidas.',
      style: {
        fontSize: '1.125rem',
        textColor: '#64748b',
      },
    },
    buttons: {
      primary: {
        text: 'Ver Produtos',
        href: '#products',
        variant: 'primary',
        icon: 'ArrowRight',
        iconPosition: 'right',
      },
      secondary: {
        text: 'Fale Conosco',
        href: '#contact',
        variant: 'outline',
        icon: 'Phone',
        iconPosition: 'left',
      },
      alignment: 'left',
    },
    background: {
      type: 'gradient',
      gradient: {
        from: '#f0f9ff',
        to: '#e0f2fe',
        direction: 'to bottom right',
      },
    },
    layout: 'centered',
    height: 'screen',
    animation: {
      enabled: true,
      type: 'fade',
      duration: 800,
      delay: 0,
    },
    style: {
      padding: '6rem 1rem',
    },
  },

  // ABOUT
  about: {
    enabled: true,
    title: {
      text: 'Sobre a Ferraco',
      style: {
        fontSize: '2.25rem',
        fontWeight: '700',
        textColor: '#1e293b',
      },
    },
    subtitle: {
      text: 'Tradição e Inovação',
      style: {
        fontSize: '1.25rem',
        fontWeight: '500',
        textColor: '#0ea5e9',
      },
    },
    description: {
      text: 'Com mais de três décadas de experiência, a Ferraco se consolidou como referência em equipamentos para pecuária leiteira. Nossa missão é fornecer produtos de alta qualidade que aumentem a produtividade e o bem-estar animal.',
      style: {
        fontSize: '1.125rem',
        textColor: '#64748b',
      },
    },
    features: [
      {
        id: '1',
        icon: 'Award',
        title: 'Qualidade Garantida',
        description: 'Produtos fabricados com os melhores materiais e tecnologia de ponta.',
      },
      {
        id: '2',
        icon: 'Users',
        title: 'Atendimento Personalizado',
        description: 'Equipe especializada pronta para atender suas necessidades.',
      },
      {
        id: '3',
        icon: 'Truck',
        title: 'Entrega Rápida',
        description: 'Logística eficiente para todo o Brasil.',
      },
      {
        id: '4',
        icon: 'Shield',
        title: 'Garantia Estendida',
        description: 'Produtos com garantia e suporte técnico especializado.',
      },
    ],
    stats: [
      { id: '1', value: '30+', label: 'Anos de Mercado', icon: 'Calendar' },
      { id: '2', value: '5000+', label: 'Clientes Satisfeitos', icon: 'Users' },
      { id: '3', value: '15+', label: 'Linhas de Produtos', icon: 'Package' },
      { id: '4', value: '98%', label: 'Satisfação', icon: 'ThumbsUp' },
    ],
    layout: 'full',
    animation: {
      enabled: true,
      type: 'slide',
      duration: 600,
      delay: 100,
    },
    style: {
      backgroundColor: '#ffffff',
      padding: '6rem 1rem',
    },
  },

  // PRODUCTS
  products: {
    enabled: true,
    title: {
      text: 'Nossos Produtos',
      style: {
        fontSize: '2.25rem',
        fontWeight: '700',
        textColor: '#1e293b',
      },
    },
    subtitle: {
      text: 'Soluções Completas para Sua Propriedade',
      style: {
        fontSize: '1.25rem',
        textColor: '#64748b',
      },
    },
    products: [
      {
        id: '1',
        name: 'Bebedouro',
        description:
          'Bebedouros automáticos de alta durabilidade, garantindo água fresca e limpa para o rebanho.',
        shortDescription: 'Água fresca para seu rebanho',
        image: {
          url: '/assets/bebedouro-product.jpg',
          alt: 'Bebedouro para gado',
          objectFit: 'cover',
        },
        benefits: [
          { id: '1', text: 'Material anti-corrosivo', icon: 'Check' },
          { id: '2', text: 'Fácil instalação', icon: 'Check' },
          { id: '3', text: 'Baixa manutenção', icon: 'Check' },
        ],
        cta: {
          text: 'Saiba Mais',
          href: '#contact',
        },
        badge: {
          text: 'Mais Vendido',
          variant: 'popular',
        },
      },
      {
        id: '2',
        name: 'Bezerreiro',
        description:
          'Estruturas modulares para acomodação de bezerros, facilitando manejo e garantindo conforto.',
        shortDescription: 'Conforto para os bezerros',
        image: {
          url: '/assets/bezerreiro-product.jpg',
          alt: 'Bezerreiro modular',
          objectFit: 'cover',
        },
        benefits: [
          { id: '1', text: 'Sistema modular', icon: 'Check' },
          { id: '2', text: 'Ventilação adequada', icon: 'Check' },
          { id: '3', text: 'Fácil higienização', icon: 'Check' },
        ],
        cta: {
          text: 'Saiba Mais',
          href: '#contact',
        },
      },
      {
        id: '3',
        name: 'Canzil',
        description:
          'Canzis robustos e ajustáveis para contenção segura durante ordenha e manejo.',
        shortDescription: 'Contenção segura',
        image: {
          url: '/assets/canzil-product.jpg',
          alt: 'Canzil para contenção',
          objectFit: 'cover',
        },
        benefits: [
          { id: '1', text: 'Ajuste rápido', icon: 'Check' },
          { id: '2', text: 'Alta resistência', icon: 'Check' },
          { id: '3', text: 'Segurança animal', icon: 'Check' },
        ],
        cta: {
          text: 'Saiba Mais',
          href: '#contact',
        },
      },
      {
        id: '4',
        name: 'Contenção',
        description:
          'Sistemas completos de contenção para facilitar procedimentos veterinários e manejo.',
        shortDescription: 'Manejo facilitado',
        image: {
          url: '/assets/contencao-product.jpg',
          alt: 'Sistema de contenção',
          objectFit: 'cover',
        },
        benefits: [
          { id: '1', text: 'Operação simples', icon: 'Check' },
          { id: '2', text: 'Múltiplas posições', icon: 'Check' },
          { id: '3', text: 'Durabilidade comprovada', icon: 'Check' },
        ],
        cta: {
          text: 'Saiba Mais',
          href: '#contact',
        },
      },
      {
        id: '5',
        name: 'Free Stall',
        description:
          'Estruturas para descanso do rebanho, aumentando conforto e produtividade.',
        shortDescription: 'Conforto e produtividade',
        image: {
          url: '/assets/freestall-product.jpg',
          alt: 'Free Stall',
          objectFit: 'cover',
        },
        benefits: [
          { id: '1', text: 'Dimensões ergonômicas', icon: 'Check' },
          { id: '2', text: 'Aumento de produção', icon: 'Check' },
          { id: '3', text: 'Melhor saúde animal', icon: 'Check' },
        ],
        cta: {
          text: 'Saiba Mais',
          href: '#contact',
        },
        badge: {
          text: 'Lançamento',
          variant: 'new',
        },
      },
    ],
    layout: 'grid',
    columns: {
      mobile: 1,
      tablet: 2,
      desktop: 3,
    },
    cardStyle: {
      variant: 'elevated',
      style: {
        borderRadius: '0.75rem',
        boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
      },
    },
    animation: {
      enabled: true,
      type: 'fade',
      duration: 500,
      delay: 50,
    },
    style: {
      backgroundColor: '#f8fafc',
      padding: '6rem 1rem',
    },
  },

  // EXPERIENCE
  experience: {
    enabled: true,
    title: {
      text: 'Nossa Experiência',
      style: {
        fontSize: '2.25rem',
        fontWeight: '700',
        textColor: '#ffffff',
      },
    },
    subtitle: {
      text: 'Décadas de Excelência',
      style: {
        fontSize: '1.25rem',
        textColor: '#e0f2fe',
      },
    },
    description: {
      text: 'Ao longo de nossa trajetória, desenvolvemos expertise incomparável em equipamentos para pecuária leiteira, sempre priorizando qualidade e inovação.',
      style: {
        fontSize: '1.125rem',
        textColor: '#f0f9ff',
      },
    },
    highlights: [
      { id: '1', value: '1990', label: 'Fundação', icon: 'Flag' },
      { id: '2', value: '5000+', label: 'Projetos Entregues', icon: 'Package' },
      { id: '3', value: '50+', label: 'Colaboradores', icon: 'Users' },
      { id: '4', value: '100%', label: 'Satisfação', icon: 'Award' },
    ],
    background: {
      type: 'gradient',
      gradient: {
        from: '#0ea5e9',
        to: '#0284c7',
        direction: 'to bottom right',
      },
    },
    layout: 'highlights',
    animation: {
      enabled: true,
      type: 'zoom',
      duration: 700,
      delay: 100,
    },
    style: {
      padding: '6rem 1rem',
    },
  },

  // CONTACT
  contact: {
    enabled: true,
    title: {
      text: 'Entre em Contato',
      style: {
        fontSize: '2.25rem',
        fontWeight: '700',
        textColor: '#1e293b',
      },
    },
    subtitle: {
      text: 'Estamos Prontos Para Atendê-lo',
      style: {
        fontSize: '1.25rem',
        textColor: '#64748b',
      },
    },
    methods: [
      {
        id: '1',
        type: 'phone',
        icon: 'Phone',
        label: 'Telefone',
        value: '(11) 9999-9999',
        href: 'tel:+5511999999999',
      },
      {
        id: '2',
        type: 'email',
        icon: 'Mail',
        label: 'E-mail',
        value: 'contato@ferraco.com.br',
        href: 'mailto:contato@ferraco.com.br',
      },
      {
        id: '3',
        type: 'whatsapp',
        icon: 'MessageCircle',
        label: 'WhatsApp',
        value: '(11) 99999-9999',
        href: 'https://wa.me/5511999999999',
      },
      {
        id: '4',
        type: 'address',
        icon: 'MapPin',
        label: 'Endereço',
        value: 'São Paulo, SP - Brasil',
      },
    ],
    form: {
      enabled: true,
      fields: [
        {
          id: '1',
          name: 'name',
          label: 'Nome',
          type: 'text',
          placeholder: 'Seu nome completo',
          required: true,
          validation: { minLength: 3 },
        },
        {
          id: '2',
          name: 'email',
          label: 'E-mail',
          type: 'email',
          placeholder: 'seu@email.com',
          required: true,
        },
        {
          id: '3',
          name: 'phone',
          label: 'Telefone',
          type: 'tel',
          placeholder: '(11) 99999-9999',
          required: false,
        },
        {
          id: '4',
          name: 'message',
          label: 'Mensagem',
          type: 'textarea',
          placeholder: 'Como podemos ajudá-lo?',
          required: true,
          validation: { minLength: 10 },
        },
      ],
      submitButton: {
        text: 'Enviar Mensagem',
        style: {
          backgroundColor: '#0ea5e9',
          textColor: '#ffffff',
          borderRadius: '0.5rem',
          padding: '0.75rem 2rem',
        },
      },
      successMessage: 'Mensagem enviada com sucesso! Entraremos em contato em breve.',
      errorMessage: 'Erro ao enviar mensagem. Tente novamente.',
    },
    layout: 'split',
    animation: {
      enabled: true,
      type: 'slide',
      duration: 600,
      delay: 0,
    },
    style: {
      backgroundColor: '#ffffff',
      padding: '6rem 1rem',
    },
  },

  // FOOTER
  footer: {
    enabled: true,
    logo: {
      type: 'image',
      image: {
        url: '/assets/logo-ferraco.webp',
        alt: 'Ferraco Logo',
        width: 100,
        height: 50,
        objectFit: 'contain',
      },
    },
    tagline: 'Equipamentos de qualidade para pecuária leiteira',
    sections: [
      {
        id: '1',
        title: 'Produtos',
        links: [
          { id: '1', text: 'Bebedouros', href: '#products' },
          { id: '2', text: 'Bezerreiros', href: '#products' },
          { id: '3', text: 'Canzis', href: '#products' },
          { id: '4', text: 'Contenção', href: '#products' },
          { id: '5', text: 'Free Stall', href: '#products' },
        ],
      },
      {
        id: '2',
        title: 'Empresa',
        links: [
          { id: '1', text: 'Sobre Nós', href: '#about' },
          { id: '2', text: 'Nossa História', href: '#experience' },
          { id: '3', text: 'Contato', href: '#contact' },
        ],
      },
      {
        id: '3',
        title: 'Suporte',
        links: [
          { id: '1', text: 'Central de Ajuda', href: '#' },
          { id: '2', text: 'Garantia', href: '#' },
          { id: '3', text: 'Instalação', href: '#' },
        ],
      },
    ],
    social: {
      enabled: true,
      title: 'Redes Sociais',
      links: [
        {
          id: '1',
          platform: 'facebook',
          icon: 'Facebook',
          href: 'https://facebook.com',
          label: 'Facebook',
        },
        {
          id: '2',
          platform: 'instagram',
          icon: 'Instagram',
          href: 'https://instagram.com',
          label: 'Instagram',
        },
        {
          id: '3',
          platform: 'linkedin',
          icon: 'Linkedin',
          href: 'https://linkedin.com',
          label: 'LinkedIn',
        },
      ],
    },
    newsletter: {
      enabled: true,
      title: 'Newsletter',
      description: 'Receba novidades e promoções',
      placeholder: 'Seu e-mail',
      buttonText: 'Inscrever',
    },
    bottom: {
      copyright: '© 2024 Ferraco Equipamentos. Todos os direitos reservados.',
      links: [
        { id: '1', text: 'Política de Privacidade', href: '#' },
        { id: '2', text: 'Termos de Uso', href: '#' },
      ],
    },
    layout: 'columns',
    style: {
      backgroundColor: '#1e293b',
      textColor: '#ffffff',
      padding: '4rem 1rem 2rem',
    },
  },
});

// ============================================================================
// FUNÇÕES DE ARMAZENAMENTO
// ============================================================================

/**
 * Carrega configuração do LocalStorage
 */
export const loadConfig = (): LandingPageConfig => {
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (!stored) {
      return getDefaultConfig();
    }

    const parsed = JSON.parse(stored) as LandingPageConfig;

    // Validação de versão
    if (parsed.version !== STORAGE_VERSION) {
      console.warn(
        `Versão da configuração diferente (${parsed.version} vs ${STORAGE_VERSION}). Aplicando migração...`
      );
      return migrateConfig(parsed);
    }

    return parsed;
  } catch (error) {
    console.error('Erro ao carregar configuração:', error);
    return getDefaultConfig();
  }
};

/**
 * Salva configuração no LocalStorage
 */
export const saveConfig = (config: LandingPageConfig): boolean => {
  try {
    const toSave = {
      ...config,
      lastModified: new Date().toISOString(),
      version: STORAGE_VERSION,
    };

    localStorage.setItem(STORAGE_KEY, JSON.stringify(toSave));
    return true;
  } catch (error) {
    console.error('Erro ao salvar configuração:', error);
    return false;
  }
};

/**
 * Restaura configuração padrão
 */
export const resetConfig = (): LandingPageConfig => {
  const defaultConfig = getDefaultConfig();
  saveConfig(defaultConfig);
  return defaultConfig;
};

/**
 * Exporta configuração como JSON
 */
export const exportConfig = (config: LandingPageConfig): string => {
  return JSON.stringify(config, null, 2);
};

/**
 * Importa configuração de JSON
 */
export const importConfig = (jsonString: string): LandingPageConfig | null => {
  try {
    const parsed = JSON.parse(jsonString) as LandingPageConfig;

    // Validação básica
    if (!parsed.meta || !parsed.theme || !parsed.header) {
      throw new Error('Configuração inválida');
    }

    return parsed;
  } catch (error) {
    console.error('Erro ao importar configuração:', error);
    return null;
  }
};

/**
 * Migra configuração de versões antigas
 */
const migrateConfig = (oldConfig: LandingPageConfig): LandingPageConfig => {
  // Por enquanto, retorna config padrão com dados preservados quando possível
  const defaultConfig = getDefaultConfig();

  return {
    ...defaultConfig,
    ...oldConfig,
    version: STORAGE_VERSION,
    lastModified: new Date().toISOString(),
  };
};

/**
 * Valida se uma configuração está completa
 */
export const validateConfig = (config: LandingPageConfig): boolean => {
  try {
    return !!(
      config.meta &&
      config.theme &&
      config.header &&
      config.hero &&
      config.about &&
      config.products &&
      config.experience &&
      config.contact &&
      config.footer
    );
  } catch {
    return false;
  }
};

/**
 * Obtém seção específica da configuração
 */
export const getSection = <K extends keyof LandingPageConfig>(
  config: LandingPageConfig,
  section: K
): LandingPageConfig[K] => {
  return config[section];
};

/**
 * Atualiza seção específica da configuração
 */
export const updateSection = <K extends keyof LandingPageConfig>(
  config: LandingPageConfig,
  section: K,
  data: Partial<LandingPageConfig[K]>
): LandingPageConfig => {
  const currentSection = config[section];

  // Type guard to ensure we can safely spread
  const mergedSection =
    typeof currentSection === 'object' && currentSection !== null && !Array.isArray(currentSection)
      ? { ...currentSection, ...data }
      : data;

  return {
    ...config,
    [section]: mergedSection,
    lastModified: new Date().toISOString(),
  } as LandingPageConfig;
};
