/**
 * Hook customizado para gerenciar configuração da Landing Page
 *
 * Fornece estado, ações e persistência automática
 */

import { useState, useEffect, useCallback, useReducer } from 'react';
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
} from '@/utils/landingPageStorage';
import { useToast } from '@/hooks/use-toast';
import { apiClient } from '@/lib/apiClient';

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
// HOOK PRINCIPAL
// ============================================================================

export const useLandingPageConfig = () => {
  const { toast } = useToast();
  const [isSaving, setIsSaving] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Estado inicial
  const initialState: EditorState = {
    config: loadConfig(),
    currentSection: 'hero',
    isDirty: false,
    isSaving: false,
    previewMode: 'desktop',
    showPreview: true,
  };

  const [state, dispatch] = useReducer(editorReducer, initialState);

  // ============================================================================
  // CARREGA CONFIGURAÇÃO AO MONTAR
  // ============================================================================

  useEffect(() => {
    const loadInitialConfig = () => {
      try {
        const config = loadConfig();
        dispatch({ type: 'LOAD_CONFIG', payload: config });
      } catch (error) {
        console.error('Erro ao carregar configuração:', error);
        toast({
          title: 'Erro ao carregar',
          description: 'Não foi possível carregar a configuração. Usando valores padrão.',
          variant: 'destructive',
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadInitialConfig();
  }, [toast]);

  // ============================================================================
  // AUTO-SAVE (DEBOUNCED)
  // ============================================================================

  useEffect(() => {
    if (!state.isDirty) return;

    const timer = setTimeout(() => {
      handleSave();
    }, 2000); // Auto-save após 2 segundos de inatividade

    return () => clearTimeout(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [state.config, state.isDirty]);

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
   * Salva configuração no Backend E LocalStorage
   */
  const handleSave = useCallback(async () => {
    setIsSaving(true);

    try {
      // 1. Salvar no backend primeiro
      await apiClient.put('/landing-page/config', {
        header: state.config.header,
        hero: state.config.hero,
        marquee: state.config.marquee,
        about: state.config.about,
        products: state.config.products,
        experience: state.config.experience,
        contact: state.config.contact,
        footer: state.config.footer,
      });

      // 2. Depois salvar no localStorage
      const success = saveConfig(state.config);

      if (success) {
        toast({
          title: 'Salvo com sucesso',
          description: 'As alterações foram salvas.',
        });

        // Atualiza estado para não estar mais "sujo"
        dispatch({
          type: 'LOAD_CONFIG',
          payload: state.config,
        });
      } else {
        throw new Error('Falha ao salvar no localStorage');
      }
    } catch (error: any) {
      console.error('Erro ao salvar:', error);
      toast({
        title: 'Erro ao salvar',
        description: error.response?.data?.message || 'Não foi possível salvar as alterações.',
        variant: 'destructive',
      });
    } finally {
      setIsSaving(false);
    }
  }, [state.config, toast]);

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
