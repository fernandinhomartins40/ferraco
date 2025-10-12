/**
 * Sistema de Tipos para Customização da Landing Page
 *
 * Este arquivo contém todas as interfaces TypeScript para o sistema
 * de customização dinâmica da landing page do Ferraco CRM.
 */

// ============================================================================
// TIPOS AUXILIARES
// ============================================================================

export interface StyleConfig {
  backgroundColor?: string;
  textColor?: string;
  fontSize?: string;
  fontWeight?: string;
  padding?: string;
  margin?: string;
  borderRadius?: string;
  border?: string;
  boxShadow?: string;
}

export interface HoverableStyleConfig extends StyleConfig {
  hover?: {
    backgroundColor?: string;
    textColor?: string;
    border?: string;
    boxShadow?: string;
    transform?: string;
  };
}

export interface ResponsiveConfig<T> {
  mobile?: T;
  tablet?: T;
  desktop?: T;
}

export interface AnimationConfig {
  enabled: boolean;
  type?: 'fade' | 'slide' | 'bounce' | 'zoom' | 'none';
  duration?: number;
  delay?: number;
  easing?: string;
}

export interface ImageConfig {
  url: string;
  alt: string;
  width?: number;
  height?: number;
  objectFit?: 'cover' | 'contain' | 'fill' | 'none' | 'scale-down';
}

// ============================================================================
// 1. META CONFIG
// ============================================================================

export interface MetaConfig {
  title: string;
  description: string;
  keywords: string[];
  author: string;
  ogImage?: string;
  favicon?: string;
}

// ============================================================================
// 2. THEME CONFIG
// ============================================================================

export interface ThemeColors {
  primary: string;
  primaryDark: string;
  primaryLight: string;
  secondary: string;
  accent: string;
  background: string;
  surface: string;
  text: {
    primary: string;
    secondary: string;
    disabled: string;
    inverse: string;
  };
  success: string;
  warning: string;
  error: string;
  info: string;
}

export interface ThemeTypography {
  fontFamily: {
    primary: string;
    secondary: string;
    monospace: string;
  };
  fontSize: {
    xs: string;
    sm: string;
    base: string;
    lg: string;
    xl: string;
    '2xl': string;
    '3xl': string;
    '4xl': string;
    '5xl': string;
  };
  fontWeight: {
    light: number;
    normal: number;
    medium: number;
    semibold: number;
    bold: number;
    extrabold: number;
  };
  lineHeight: {
    tight: number;
    normal: number;
    relaxed: number;
  };
  letterSpacing: {
    tight: string;
    normal: string;
    wide: string;
  };
}

export interface ThemeSpacing {
  xs: string;
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  '3xl': string;
}

export interface ThemeBorders {
  radius: {
    none: string;
    sm: string;
    md: string;
    lg: string;
    xl: string;
    full: string;
  };
  width: {
    thin: string;
    normal: string;
    thick: string;
  };
}

export interface ThemeShadows {
  sm: string;
  md: string;
  lg: string;
  xl: string;
  '2xl': string;
  inner: string;
  none: string;
}

export interface ThemeConfig {
  colors: ThemeColors;
  typography: ThemeTypography;
  spacing: ThemeSpacing;
  borders: ThemeBorders;
  shadows: ThemeShadows;
  darkMode: {
    enabled: boolean;
    colors?: Partial<ThemeColors>;
  };
}

// ============================================================================
// 3. HEADER CONFIG
// ============================================================================

export interface HeaderLogo {
  type: 'image' | 'text';
  image?: ImageConfig;
  text?: string;
  width?: number;
  height?: number;
}

export interface HeaderMenuItem {
  id: string;
  label: string;
  href: string;
  icon?: string;
  submenu?: HeaderMenuItem[];
  external?: boolean;
  highlight?: boolean;
}

export interface HeaderCTA {
  enabled: boolean;
  text: string;
  href: string;
  style: HoverableStyleConfig;
  icon?: string;
}

export interface HeaderConfig {
  enabled: boolean;
  logo: HeaderLogo;
  menu: {
    items: HeaderMenuItem[];
    alignment: 'left' | 'center' | 'right';
    style: HoverableStyleConfig;
  };
  cta: HeaderCTA;
  sticky: boolean;
  transparent: boolean;
  style: StyleConfig;
  mobileBreakpoint: number;
}

// ============================================================================
// 4. HERO CONFIG
// ============================================================================

export interface HeroButton {
  text: string;
  href: string;
  variant: 'primary' | 'secondary' | 'outline' | 'ghost';
  icon?: string;
  iconPosition?: 'left' | 'right';
  style?: StyleConfig;
}

export interface HeroConfig {
  enabled: boolean;
  title: {
    text: string;
    highlight?: string;
    style: StyleConfig;
  };
  subtitle: {
    text: string;
    style: StyleConfig;
  };
  description: {
    text: string;
    style: StyleConfig;
  };
  buttons: {
    primary?: HeroButton;
    secondary?: HeroButton;
    alignment: 'left' | 'center' | 'right';
  };
  background: {
    type: 'color' | 'gradient' | 'image' | 'video';
    color?: string;
    gradient?: {
      from: string;
      to: string;
      direction: string;
    };
    image?: ImageConfig;
    video?: {
      url: string;
      poster?: string;
    };
    overlay?: {
      enabled: boolean;
      color: string;
      opacity: number;
    };
  };
  layout: 'centered' | 'split' | 'fullscreen';
  height: 'auto' | 'screen' | string;
  animation: AnimationConfig;
  style: StyleConfig;
}

// ============================================================================
// 5. ABOUT CONFIG
// ============================================================================

export interface AboutFeature {
  id: string;
  icon: string;
  title: string;
  description: string;
  style?: StyleConfig;
}

export interface AboutStats {
  id: string;
  value: string;
  label: string;
  icon?: string;
  style?: StyleConfig;
}

export interface AboutConfig {
  enabled: boolean;
  title: {
    text: string;
    style: StyleConfig;
  };
  subtitle?: {
    text: string;
    style: StyleConfig;
  };
  description: {
    text: string;
    style: StyleConfig;
  };
  features: AboutFeature[];
  stats?: AboutStats[];
  image?: ImageConfig;
  layout: 'text-only' | 'text-image' | 'text-features' | 'full';
  imagePosition?: 'left' | 'right';
  animation: AnimationConfig;
  style: StyleConfig;
}

// ============================================================================
// 6. PRODUCTS CONFIG
// ============================================================================

export interface ProductBenefit {
  id: string;
  text: string;
  icon?: string;
}

export interface ProductItem {
  id: string;
  name: string;
  description: string;
  shortDescription?: string;
  image: ImageConfig;
  benefits: ProductBenefit[];
  cta?: {
    text: string;
    href: string;
  };
  badge?: {
    text: string;
    variant: 'new' | 'popular' | 'sale' | 'custom';
    color?: string;
  };
  style?: StyleConfig;
}

export interface ProductsConfig {
  enabled: boolean;
  title: {
    text: string;
    style: StyleConfig;
  };
  subtitle?: {
    text: string;
    style: StyleConfig;
  };
  products: ProductItem[];
  layout: 'grid' | 'carousel' | 'masonry' | 'list';
  columns: ResponsiveConfig<number>;
  cardStyle: {
    variant: 'default' | 'bordered' | 'elevated' | 'flat';
    style: StyleConfig;
  };
  animation: AnimationConfig;
  style: StyleConfig;
}

// ============================================================================
// 7. EXPERIENCE CONFIG
// ============================================================================

export interface ExperienceHighlight {
  id: string;
  value: string;
  label: string;
  icon?: string;
  style?: StyleConfig;
}

export interface ExperienceTimeline {
  id: string;
  year: string;
  title: string;
  description: string;
}

export interface ExperienceConfig {
  enabled: boolean;
  title: {
    text: string;
    style: StyleConfig;
  };
  subtitle?: {
    text: string;
    style: StyleConfig;
  };
  description: {
    text: string;
    style: StyleConfig;
  };
  highlights: ExperienceHighlight[];
  timeline?: ExperienceTimeline[];
  background: {
    type: 'color' | 'gradient' | 'image';
    color?: string;
    gradient?: {
      from: string;
      to: string;
      direction: string;
    };
    image?: ImageConfig;
  };
  layout: 'simple' | 'highlights' | 'timeline' | 'full';
  animation: AnimationConfig;
  style: StyleConfig;
}

// ============================================================================
// 8. CONTACT CONFIG
// ============================================================================

export interface ContactMethod {
  id: string;
  type: 'phone' | 'email' | 'whatsapp' | 'address' | 'custom';
  icon: string;
  label: string;
  value: string;
  href?: string;
  style?: StyleConfig;
}

export interface ContactFormField {
  id: string;
  name: string;
  label: string;
  type: 'text' | 'email' | 'tel' | 'textarea' | 'select' | 'checkbox';
  placeholder?: string;
  required: boolean;
  validation?: {
    pattern?: string;
    minLength?: number;
    maxLength?: number;
    min?: number;
    max?: number;
  };
  options?: { value: string; label: string }[];
}

export interface ContactForm {
  enabled: boolean;
  fields: ContactFormField[];
  submitButton: {
    text: string;
    style: StyleConfig;
  };
  successMessage: string;
  errorMessage: string;
  endpoint?: string;
}

export interface ContactConfig {
  enabled: boolean;
  title: {
    text: string;
    style: StyleConfig;
  };
  subtitle?: {
    text: string;
    style: StyleConfig;
  };
  methods: ContactMethod[];
  form: ContactForm;
  layout: 'methods-only' | 'form-only' | 'split' | 'tabbed';
  map?: {
    enabled: boolean;
    latitude: number;
    longitude: number;
    zoom: number;
  };
  animation: AnimationConfig;
  style: StyleConfig;
}

// ============================================================================
// 9. MARQUEE CONFIG
// ============================================================================

export interface MarqueeItem {
  id: string;
  icon: string;
  text: string;
}

export interface MarqueeConfig {
  enabled: boolean;
  items: MarqueeItem[];
  speed: number; // velocidade da animação em segundos
  backgroundColor?: string;
  textColor?: string;
  iconColor?: string;
  style: StyleConfig;
}

// ============================================================================
// 10. FOOTER CONFIG
// ============================================================================

export interface FooterLink {
  id: string;
  text: string;
  href: string;
  external?: boolean;
}

export interface FooterSection {
  id: string;
  title: string;
  links: FooterLink[];
}

export interface SocialLink {
  id: string;
  platform: 'facebook' | 'instagram' | 'linkedin' | 'twitter' | 'youtube' | 'custom';
  icon: string;
  href: string;
  label: string;
}

export interface FooterConfig {
  enabled: boolean;
  logo?: HeaderLogo;
  tagline?: string;
  sections: FooterSection[];
  social: {
    enabled: boolean;
    title?: string;
    links: SocialLink[];
  };
  newsletter?: {
    enabled: boolean;
    title: string;
    description?: string;
    placeholder: string;
    buttonText: string;
  };
  bottom: {
    copyright: string;
    links?: FooterLink[];
  };
  layout: 'simple' | 'columns' | 'mega';
  style: StyleConfig;
}

// ============================================================================
// CONFIGURAÇÃO PRINCIPAL
// ============================================================================

export interface LandingPageConfig {
  version: string;
  lastModified: string;
  meta: MetaConfig;
  theme: ThemeConfig;
  header: HeaderConfig;
  hero: HeroConfig;
  marquee: MarqueeConfig;
  about: AboutConfig;
  products: ProductsConfig;
  experience: ExperienceConfig;
  contact: ContactConfig;
  footer: FooterConfig;
}

// ============================================================================
// TIPOS PARA O EDITOR
// ============================================================================

export type SectionKey = 'meta' | 'theme' | 'header' | 'hero' | 'marquee' | 'about' | 'products' | 'experience' | 'contact' | 'footer';

export interface EditorTab {
  id: SectionKey;
  label: string;
  icon: string;
  description?: string;
}

export interface EditorState {
  config: LandingPageConfig;
  currentSection: SectionKey;
  isDirty: boolean;
  isSaving: boolean;
  previewMode: 'desktop' | 'tablet' | 'mobile';
  showPreview: boolean;
}

export interface EditorAction {
  type: 'UPDATE_SECTION' | 'RESET_CONFIG' | 'LOAD_CONFIG' | 'SET_SECTION' | 'SET_PREVIEW_MODE' | 'TOGGLE_PREVIEW';
  payload?: any;
}
