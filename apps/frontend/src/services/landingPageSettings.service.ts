/**
 * Landing Page Settings Service
 *
 * Serviço para gerenciar as configurações de captação de leads
 * da landing page via API
 */

import { apiClient } from '@/lib/api-client';
import { logger } from '@/lib/logger';

// ============================================================================
// Types
// ============================================================================

export interface LandingPageSettings {
  mode: 'create_lead' | 'whatsapp_only';
  whatsappNumber?: string;
  messageTemplate?: string;
  createLeadAnyway?: boolean;
}

export interface LandingPageSettingsResponse {
  success: boolean;
  data: LandingPageSettings;
  message?: string;
}

export interface TestWhatsAppResponse {
  success: boolean;
  data: {
    success: boolean;
    message: string;
  };
  message?: string;
}

// ============================================================================
// Landing Page Settings Service
// ============================================================================

export const landingPageSettingsService = {
  /**
   * Buscar configuração atual
   */
  async get(): Promise<LandingPageSettings> {
    try {
      logger.info('📖 Buscando configurações da landing page');

      const response = await apiClient.get<LandingPageSettingsResponse>(
        '/admin/landing-page-settings'
      );

      logger.info('✅ Configurações carregadas', {
        mode: response.data.data.mode,
      });

      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Erro ao buscar configurações', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Erro ao buscar configurações'
      );
    }
  },

  /**
   * Atualizar configuração
   */
  async update(settings: LandingPageSettings): Promise<LandingPageSettings> {
    try {
      logger.info('💾 Atualizando configurações da landing page', {
        mode: settings.mode,
      });

      const response = await apiClient.put<LandingPageSettingsResponse>(
        '/admin/landing-page-settings',
        settings
      );

      logger.info('✅ Configurações atualizadas com sucesso');

      return response.data.data;
    } catch (error: any) {
      logger.error('❌ Erro ao atualizar configurações', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message || 'Erro ao atualizar configurações'
      );
    }
  },

  /**
   * Testar conexão WhatsApp (enviar mensagem de teste)
   */
  async test(settings: LandingPageSettings): Promise<boolean> {
    try {
      logger.info('🧪 Testando conexão WhatsApp');

      const response = await apiClient.post<TestWhatsAppResponse>(
        '/admin/landing-page-settings/test',
        settings
      );

      const success = response.data.data.success;

      if (success) {
        logger.info('✅ Teste de WhatsApp bem-sucedido');
      } else {
        logger.warn('⚠️ Teste de WhatsApp falhou');
      }

      return success;
    } catch (error: any) {
      logger.error('❌ Erro ao testar conexão WhatsApp', {
        error: error.message,
      });
      throw new Error(
        error.response?.data?.message ||
          'Erro ao testar conexão WhatsApp. Verifique se o número é válido e se o WhatsApp está conectado.'
      );
    }
  },

  /**
   * Validar configurações antes de salvar
   */
  validate(settings: LandingPageSettings): string[] {
    const errors: string[] = [];

    // Validar modo
    if (!settings.mode) {
      errors.push('Modo de captação é obrigatório');
    } else if (!['create_lead', 'whatsapp_only'].includes(settings.mode)) {
      errors.push('Modo de captação inválido');
    }

    // Validações específicas para whatsapp_only
    if (settings.mode === 'whatsapp_only') {
      if (!settings.whatsappNumber || settings.whatsappNumber.trim() === '') {
        errors.push('Número de WhatsApp é obrigatório para modo WhatsApp Only');
      }

      if (!settings.messageTemplate || settings.messageTemplate.trim() === '') {
        errors.push('Template de mensagem é obrigatório para modo WhatsApp Only');
      } else {
        // Validar que o template contém variáveis essenciais
        const requiredVars = ['{{name}}', '{{phone}}'];
        const missingVars = requiredVars.filter(
          (v) => !settings.messageTemplate!.includes(v)
        );

        if (missingVars.length > 0) {
          errors.push(
            `Template deve conter as variáveis: ${missingVars.join(', ')}`
          );
        }
      }
    }

    return errors;
  },

  /**
   * Template padrão para mensagens
   */
  getDefaultTemplate(): string {
    return `🎯 *Novo Lead Capturado!*

👤 *Nome:* {{name}}
📱 *Telefone:* {{phone}}
📧 *Email:* {{email}}
🎨 *Produto de Interesse:* {{interest}}
🔗 *Origem:* {{source}}

📅 Capturado em: {{timestamp}}`;
  },
};
