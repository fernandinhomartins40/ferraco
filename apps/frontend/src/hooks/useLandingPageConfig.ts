/**
 * Hook customizado para gerenciar configuração da Landing Page
 *
 * Fornece estado, ações e persistência automática
 *
 * MELHORIAS (2025):
 * - Backend como fonte da verdade (PostgreSQL > LocalStorage > Defaults)
 * - Auto-save inteligente (5 minutos, não na inicialização)
 * - Carregamento do backend na inicialização
 * - Logging detalhado para debugging
 */

import { useState, useEffect, useCallback, useReducer, useRef } from 'react';
import {
  LandingPageConfig,
  SectionKey,
  EditorState,
  EditorAction,
} from '@/types/landingPage';
import {
  loadConfig,
  saveConfig,
  resetConfig,
  exportConfig,
  importConfig,
  updateSection,
  getDefaultConfig,
} from '@/utils/landingPageStorage';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

// ============================================================================
// CONSTANTES
// ============================================================================

const AUTO_SAVE_DELAY = 5 * 60 * 1000; // 5 minutos em milissegundos
const ENABLE_AUTO_SAVE = true; // Flag para ativar/desativar auto-save

// ============================================================================
// REDUCER PARA ESTADO DO EDITOR
// ============================================================================

const editorReducer = (state: EditorState, action: EditorAction): EditorState => {
  switch (action.type) {
    case 'UPDATE_SECTION':
      return {
        ...state,
        config: updateSection(state.config, action.payload.section, action.payload.data),
        isDirty: true,
      };

    case 'LOAD_CONFIG':
      return {
        ...state,
        config: action.payload,
        isDirty: false,
      };

    case 'RESET_CONFIG':
      return {
        ...state,
        config: action.payload,
        isDirty: false,
      };

    case 'SET_SECTION':
      return {
        ...state,
        currentSection: action.payload,
      };

    case 'SET_PREVIEW_MODE':
      return {
        ...state,
        previewMode: action.payload,
      };

    case 'TOGGLE_PREVIEW':
      return {
        ...state,
        showPreview: !state.showPreview,
      };

    default:
      return state;
  }
};

// ============================================================================
// HELPER: Logging detalhado
// ============================================================================

const logConfigChange = (action: string, details?: any) => {
  const timestamp = new Date().toISOString();
  console.log(`[LandingPageConfig] ${timestamp} - ${action}`, details || '');
};

// ============================================================================
// HOOK PRINCIPAL
// ============================================================================

export const useLandingPageConfig = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Flag para prevenir auto-save na inicialização
  const hasLoadedInitially = useRef(false);

  // Referência ao último timestamp de alteração (para auto-save inteligente)
  const lastChangeTimestamp = useRef<number>(Date.now());

  // Estado inicial (será substituído pelo carregamento do backend)
  const initialState: EditorState = {
    config: getDefaultConfig(), // Usar defaults até carregar do backend
    currentSection: 'hero',
    isDirty: false,
    isSaving: false,
    previewMode: 'desktop',
    showPreview: true,
  };

  const [state, dispatch] = useReducer(editorReducer, initialState);

  // ============================================================================
  // FASE 2: CARREGA CONFIGURAÇÃO DO BACKEND (PRIORIDADE: BACKEND > LOCALSTORAGE > DEFAULTS)
  // ============================================================================

  useEffect(() => {
    const loadInitialConfig = async () => {
      logConfigChange('Iniciando carregamento da configuração...');

      try {
        // PASSO 1: Tentar buscar do backend (fonte da verdade)
        logConfigChange('Buscando configuração do backend...');

        try {
          const backendResponse = await apiClient.get('/landing-page/config');

          if (backendResponse.data.success && backendResponse.data.data) {
            const defaults = getDefaultConfig();
            const data = backendResponse.data.data;

            // Merge profundo com defaults para garantir que arrays sempre existam
            const backendConfig: LandingPageConfig = {
              version: '1.0.0',
              lastModified: data.updatedAt,
              meta: defaults.meta,
              theme: defaults.theme,
              header: {
                ...defaults.header,
                ...data.header,
                menu: {
                  ...defaults.header.menu,
                  ...data.header?.menu,
                  items: data.header?.menu?.items || defaults.header.menu.items,
                },
              },
              hero: {
                ...defaults.hero,
                ...data.hero,
                slides: data.hero?.slides || defaults.hero.slides || [],
              },
              marquee: {
                ...defaults.marquee,
                ...data.marquee,
                items: data.marquee?.items || defaults.marquee.items || [],
              },
              about: {
                ...defaults.about,
                ...data.about,
                features: data.about?.features || defaults.about.features || [],
                stats: data.about?.stats || defaults.about.stats || [],
              },
              products: {
                ...defaults.products,
                ...data.products,
                products: data.products?.products || defaults.products.products || [],
              },
              experience: {
                ...defaults.experience,
                ...data.experience,
                highlights: data.experience?.highlights || defaults.experience.highlights || [],
              },
              contact: {
                ...defaults.contact,
                ...data.contact,
                methods: data.contact?.methods || defaults.contact.methods || [],
              },
              footer: {
                ...defaults.footer,
                ...data.footer,
                sections: data.footer?.sections || defaults.footer.sections || [],
                social: data.footer?.social ? {
                  ...defaults.footer.social,
                  ...data.footer.social,
                  links: data.footer.social.links || defaults.footer.social.links || [],
                } : defaults.footer.social,
              },
            };

            logConfigChange('✅ Configuração carregada do BACKEND', {
              hasImages: {
                headerLogo: !!backendConfig.header.logo?.image?.url,
                heroSlides: backendConfig.hero.slides?.length || 0,
              },
            });

            // Salvar no localStorage como cache
            saveConfig(backendConfig);

            dispatch({ type: 'LOAD_CONFIG', payload: backendConfig });
            hasLoadedInitially.current = true;
            setIsLoading(false);
            return;
          }
        } catch (backendError: any) {
          // Se backend falhar (404, 500, etc), tentar localStorage
          if (backendError.response?.status === 404) {
            logConfigChange('⚠️ Nenhuma configuração encontrada no backend (404), tentando localStorage...');
          } else {
            logConfigChange('⚠️ Erro ao buscar do backend, tentando localStorage...', {
              error: backendError.message,
              status: backendError.response?.status,
            });
          }
        }

        // PASSO 2: Tentar carregar do LocalStorage
        logConfigChange('Buscando configuração do localStorage...');
        const localStorageConfig = loadConfig();

        // Verificar se localStorage tem dados válidos (não apenas defaults)
        const hasValidLocalStorage =
          localStorageConfig.lastModified !== getDefaultConfig().lastModified;

        if (hasValidLocalStorage) {
          logConfigChange('✅ Configuração carregada do LOCALSTORAGE', {
            lastModified: localStorageConfig.lastModified,
          });

          // IMPORTANTE: Salvar no backend para sincronizar
          try {
            await apiClient.put('/landing-page/config', {
              header: localStorageConfig.header,
              hero: localStorageConfig.hero,
              marquee: localStorageConfig.marquee,
              about: localStorageConfig.about,
              products: localStorageConfig.products,
              experience: localStorageConfig.experience,
              contact: localStorageConfig.contact,
              footer: localStorageConfig.footer,
            });
            logConfigChange('✅ Configuração do localStorage sincronizada com backend');
          } catch (syncError) {
            logConfigChange('⚠️ Erro ao sincronizar localStorage com backend', syncError);
          }

          dispatch({ type: 'LOAD_CONFIG', payload: localStorageConfig });
          hasLoadedInitially.current = true;
          setIsLoading(false);
          return;
        }

        // PASSO 3: Usar configuração padrão (defaults)
        logConfigChange('⚠️ Usando configuração PADRÃO (defaults)');
        const defaultConfig = getDefaultConfig();

        // Salvar defaults no backend
        try {
          await apiClient.put('/landing-page/config', {
            header: defaultConfig.header,
            hero: defaultConfig.hero,
            marquee: defaultConfig.marquee,
            about: defaultConfig.about,
            products: defaultConfig.products,
            experience: defaultConfig.experience,
            contact: defaultConfig.contact,
            footer: defaultConfig.footer,
          });
          logConfigChange('✅ Defaults salvos no backend');
        } catch (saveError) {
          logConfigChange('⚠️ Erro ao salvar defaults no backend', saveError);
        }

        dispatch({ type: 'LOAD_CONFIG', payload: defaultConfig });
        hasLoadedInitially.current = true;

      } catch (error) {
        console.error('❌ Erro crítico ao carregar configuração:', error);
        logConfigChange('❌ ERRO CRÍTICO', error);

        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar a configuração. Usando valores padrão.',
          variant: 'destructive',
        });

        // Fallback final: usar defaults
        dispatch({ type: 'LOAD_CONFIG', payload: getDefaultConfig() });
        hasLoadedInitially.current = true;
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialConfig();
  }, [toast]);

  // ============================================================================
  // FASE 1 & 3: AUTO-SAVE INTELIGENTE (5 MINUTOS, NÃO NA INICIALIZAÇÃO)
  // ============================================================================

  useEffect(() => {
    // NÃO fazer auto-save se:
    // 1. Ainda não carregou inicialmente
    // 2. Não está "sujo" (sem alterações)
    // 3. Auto-save está desabilitado
    if (!hasLoadedInitially.current || !state.isDirty || !ENABLE_AUTO_SAVE) {
      return;
    }

    logConfigChange('⏱️ Auto-save agendado para daqui a 5 minutos...');

    const timer = setTimeout(() => {
      logConfigChange('🔄 Disparando auto-save...');

      toast({
        title: '💾 Salvando automaticamente...',
        description: 'Suas alterações estão sendo salvas.',
      });

      handleSave(true); // true = é auto-save
    }, AUTO_SAVE_DELAY);

    return () => {
      clearTimeout(timer);
    };
    // IMPORTANTE: Apenas isDirty nas dependências (não state.config)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.isDirty]);

  // ============================================================================
  // AÇÕES
  // ============================================================================

  /**
   * Atualiza uma seção específica
   */
  const updateSectionData = useCallback(
    <K extends keyof LandingPageConfig>(section: K, data: Partial<LandingPageConfig[K]>) => {
      dispatch({
        type: 'UPDATE_SECTION',
        payload: { section, data },
      });
    },
    []
  );

  /**
   * FASE 3 & 5: Salva configuração no Backend E LocalStorage com logging detalhado
   */
  const handleSave = useCallback(async (isAutoSave = false) => {
    const saveTimestamp = Date.now();
    const saveType = isAutoSave ? 'AUTO-SAVE' : 'MANUAL SAVE';

    logConfigChange(`🔄 ${saveType} INICIADO`, {
      timestamp: new Date(saveTimestamp).toISOString(),
      isDirty: state.isDirty,
      sections: {
        header: !!state.config.header,
        hero: !!state.config.hero,
        marquee: !!state.config.marquee,
        about: !!state.config.about,
        products: !!state.config.products,
        experience: !!state.config.experience,
        contact: !!state.config.contact,
        footer: !!state.config.footer,
      },
      images: {
        headerLogo: state.config.header?.logo?.image?.url || 'none',
        heroSlides: state.config.hero?.slides?.length || 0,
        productsCount: state.config.products?.products?.length || 0,
      },
    });

    setIsSaving(true);

    try {
      // PASSO 1: Salvar no backend PRIMEIRO (fonte da verdade)
      logConfigChange(`📡 Enviando para backend...`);

      const backendResponse = await apiClient.put('/landing-page/config', {
        header: state.config.header,
        hero: state.config.hero,
        marquee: state.config.marquee,
        about: state.config.about,
        products: state.config.products,
        experience: state.config.experience,
        contact: state.config.contact,
        footer: state.config.footer,
      });

      logConfigChange(`✅ Backend salvou com sucesso`, {
        responseTime: `${Date.now() - saveTimestamp}ms`,
        updatedAt: backendResponse.data.data?.updatedAt,
      });

      // PASSO 2: Salvar no localStorage COMO CACHE
      logConfigChange(`💾 Salvando no localStorage (cache)...`);
      const localStorageSuccess = saveConfig(state.config);

      if (!localStorageSuccess) {
        logConfigChange(`⚠️ Aviso: Falha ao salvar no localStorage, mas backend foi salvo com sucesso`);
      } else {
        logConfigChange(`✅ LocalStorage atualizado`);
      }

      // PASSO 3: Salvar no histórico (para restauração futura)
      try {
        await apiClient.post('/landing-page/config/history', {
          config: {
            header: state.config.header,
            hero: state.config.hero,
            marquee: state.config.marquee,
            about: state.config.about,
            products: state.config.products,
            experience: state.config.experience,
            contact: state.config.contact,
            footer: state.config.footer,
          },
          changeType: isAutoSave ? 'auto_save' : 'manual_save',
        });
        logConfigChange(`📜 Histórico salvo`);
      } catch (historyError) {
        // Não falhar o save por causa do histórico
        logConfigChange(`⚠️ Aviso: Falha ao salvar histórico`, historyError);
      }

      // Feedback visual para o usuário
      toast({
        title: isAutoSave ? '💾 Salvo automaticamente' : '✅ Salvo com sucesso',
        description: isAutoSave
          ? 'Suas alterações foram salvas automaticamente.'
          : 'Todas as alterações foram salvas.',
      });

      // Atualizar estado para não estar mais "sujo"
      dispatch({
        type: 'LOAD_CONFIG',
        payload: state.config,
      });

      logConfigChange(`✅ ${saveType} COMPLETO`, {
        totalTime: `${Date.now() - saveTimestamp}ms`,
      });

    } catch (error: any) {
      logConfigChange(`❌ ERRO ao salvar`, {
        error: error.message,
        status: error.response?.status,
        data: error.response?.data,
      });

      console.error('❌ Erro ao salvar:', error);

      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.message || 'Não foi possível salvar as alterações. Tente novamente.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [state.config, state.isDirty, toast]);

  /**
   * Restaura configuração padrão
   */
  const handleReset = useCallback(() => {
    try {
      const defaultConfig = resetConfig();
      dispatch({ type: 'RESET_CONFIG', payload: defaultConfig });

      toast({
        title: 'Configuração restaurada',
        description: 'Todas as configurações foram restauradas para os valores padrão.',
      });
    } catch (error) {
      console.error('Erro ao restaurar:', error);
      toast({
        title: 'Erro ao restaurar',
        description: 'Não foi possível restaurar a configuração padrão.',
        variant: 'destructive',
      });
    }
  }, [toast]);

  /**
   * Exporta configuração como arquivo JSON
   */
  const handleExport = useCallback(() => {
    try {
      const jsonString = exportConfig(state.config);
      const blob = new Blob([jsonString], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = `ferraco-landing-config-${new Date().toISOString().split('T')[0]}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      toast({
        title: 'Exportado com sucesso',
        description: 'A configuração foi exportada como arquivo JSON.',
      });
    } catch (error) {
      console.error('Erro ao exportar:', error);
      toast({
        title: 'Erro ao exportar',
        description: 'Não foi possível exportar a configuração.',
        variant: 'destructive',
      });
    }
  }, [state.config, toast]);

  /**
   * Importa configuração de arquivo JSON
   */
  const handleImport = useCallback(
    (file: File) => {
      const reader = new FileReader();

      reader.onload = async (e) => {
        try {
          const content = e.target?.result as string;
          const imported = importConfig(content);

          if (!imported) {
            throw new Error('Configuração inválida');
          }

          // Salvar no backend
          await apiClient.put('/landing-page/config', {
            header: imported.header,
            hero: imported.hero,
            marquee: imported.marquee,
            about: imported.about,
            products: imported.products,
            experience: imported.experience,
            contact: imported.contact,
            footer: imported.footer,
          });

          // Salvar no localStorage
          dispatch({ type: 'LOAD_CONFIG', payload: imported });
          saveConfig(imported);

          toast({
            title: 'Importado com sucesso',
            description: 'A configuração foi importada e aplicada.',
          });
        } catch (error: any) {
          console.error('Erro ao importar:', error);
          toast({
            title: 'Erro ao importar',
            description: error.response?.data?.message || 'O arquivo fornecido não é uma configuração válida.',
            variant: 'destructive',
          });
        }
      };

      reader.onerror = () => {
        toast({
          title: 'Erro ao ler arquivo',
          description: 'Não foi possível ler o arquivo selecionado.',
          variant: 'destructive',
        });
      };

      reader.readAsText(file);
    },
    [toast]
  );

  /**
   * Muda a seção atual
   */
  const setCurrentSection = useCallback((section: SectionKey) => {
    dispatch({ type: 'SET_SECTION', payload: section });
  }, []);

  /**
   * Muda o modo de preview
   */
  const setPreviewMode = useCallback((mode: 'desktop' | 'tablet' | 'mobile') => {
    dispatch({ type: 'SET_PREVIEW_MODE', payload: mode });
  }, []);

  /**
   * Alterna exibição do preview
   */
  const togglePreview = useCallback(() => {
    dispatch({ type: 'TOGGLE_PREVIEW' });
  }, []);

  /**
   * Obtém seção específica
   */
  const getSection = useCallback(
    <K extends keyof LandingPageConfig>(section: K): LandingPageConfig[K] => {
      return state.config[section];
    },
    [state.config]
  );

  // ============================================================================
  // ATALHOS DE TECLADO
  // ============================================================================

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ctrl+S ou Cmd+S para salvar
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSave();
      }

      // Ctrl+E ou Cmd+E para exportar
      if ((e.ctrlKey || e.metaKey) && e.key === 'e') {
        e.preventDefault();
        handleExport();
      }

      // Ctrl+R ou Cmd+R para restaurar (com confirmação)
      if ((e.ctrlKey || e.metaKey) && e.key === 'r' && e.shiftKey) {
        e.preventDefault();
        if (confirm('Deseja realmente restaurar as configurações padrão?')) {
          handleReset();
        }
      }

      // Ctrl+P ou Cmd+P para alternar preview
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault();
        togglePreview();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSave, handleExport, handleReset, togglePreview]);

  // ============================================================================
  // ALERTA DE ALTERAÇÕES NÃO SALVAS
  // ============================================================================

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (state.isDirty) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [state.isDirty]);

  // ============================================================================
  // RETORNO DO HOOK
  // ============================================================================

  return {
    // Estado
    config: state.config,
    currentSection: state.currentSection,
    isDirty: state.isDirty,
    isSaving,
    isLoading,
    previewMode: state.previewMode,
    showPreview: state.showPreview,

    // Ações
    updateSection: updateSectionData,
    save: handleSave,
    reset: handleReset,
    export: handleExport,
    import: handleImport,
    setCurrentSection,
    setPreviewMode,
    togglePreview,
    getSection,
  };
};

export default useLandingPageConfig;
