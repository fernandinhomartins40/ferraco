import axios, { AxiosInstance } from 'axios';
import { logger } from '@/lib/logger';

const API_URL = '/api/public/leads';

/**
 * Client público para criar leads da landing page
 * Não requer autenticação
 */
const createPublicApiClient = (): AxiosInstance => {
  return axios.create({
    timeout: 10000,
    headers: {
      'Content-Type': 'application/json',
    },
  });
};

const apiClient = createPublicApiClient();

// ============================================
// Types
// ============================================

export interface PublicLeadData {
  name: string;
  phone: string;
  email?: string;
  source?: string;
  interest?: string; // Produto de interesse
}

export interface PublicLeadResponse {
  id: string;
  message: string;
  whatsappUrl?: string; // URL para redirecionar para WhatsApp (modo whatsapp_only)
}

// ============================================
// Public Lead Service
// ============================================

export const publicLeadService = {
  /**
   * Criar novo lead através do formulário público da landing page
   * @param data - Dados do lead (nome e telefone obrigatórios)
   * @returns Promise com resposta do servidor
   */
  async create(data: PublicLeadData): Promise<PublicLeadResponse> {
    try {
      logger.info('📤 Enviando lead público', {
        name: data.name,
        phone: data.phone,
        source: data.source
      });

      const response = await apiClient.post(API_URL, {
        name: data.name,
        phone: data.phone,
        email: data.email || '',
        source: data.source || 'landing-page',
        interest: data.interest, // Produto de interesse
      });

      logger.info('✅ Lead público criado com sucesso', {
        leadId: response.data.data.id,
        hasWhatsappUrl: !!response.data.data.whatsappUrl
      });

      return {
        id: response.data.data.id,
        message: response.data.data.message || 'Lead criado com sucesso',
        whatsappUrl: response.data.data.whatsappUrl, // URL para redirecionar (modo whatsapp_only)
      };
    } catch (error: any) {
      // Log de erro detalhado
      if (error.response) {
        logger.error('❌ Erro ao criar lead público (resposta do servidor)', {
          status: error.response.status,
          data: error.response.data,
        });

        // Extrair mensagem de erro amigável
        const errorMessage =
          error.response.data?.message ||
          error.response.data?.error ||
          'Erro ao enviar seus dados. Tente novamente.';

        throw new Error(errorMessage);
      } else if (error.request) {
        logger.error('❌ Erro ao criar lead público (sem resposta)', { error });
        throw new Error('Não foi possível conectar ao servidor. Verifique sua conexão.');
      } else {
        logger.error('❌ Erro ao criar lead público (configuração)', { error });
        throw new Error('Erro ao enviar seus dados. Tente novamente.');
      }
    }
  },

  /**
   * Validar dados do lead antes de enviar
   * @param data - Dados do lead
   * @returns Array de erros de validação (vazio se válido)
   */
  validate(data: PublicLeadData): string[] {
    const errors: string[] = [];

    // Validar nome
    if (!data.name || data.name.trim().length < 2) {
      errors.push('Nome deve ter no mínimo 2 caracteres');
    }
    if (data.name && data.name.length > 100) {
      errors.push('Nome deve ter no máximo 100 caracteres');
    }

    // Validar telefone
    if (!data.phone || data.phone.trim().length < 8) {
      errors.push('Telefone deve ter no mínimo 8 caracteres');
    }
    if (data.phone && data.phone.length > 20) {
      errors.push('Telefone deve ter no máximo 20 caracteres');
    }

    // Validar email (se fornecido)
    if (data.email) {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(data.email)) {
        errors.push('Email inválido');
      }
    }

    return errors;
  },
};
