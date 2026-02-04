/**
 * Landing Page Settings Controller
 *
 * Controlador para gerenciar as configurações de captação de leads
 * da landing page (modo create_lead vs whatsapp_only)
 */

import { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { successResponse, badRequestResponse } from '../../utils/response';
import { prisma } from '../../config/database';
import { whatsappDirectNotificationService, type LandingPageLeadSettings } from '../../services/whatsappDirectNotification.service';

// ============================================================================
// Validation Schema
// ============================================================================

const LandingPageSettingsSchema = z.object({
  mode: z.enum(['create_lead', 'whatsapp_only'], {
    errorMap: () => ({ message: 'Modo deve ser "create_lead" ou "whatsapp_only"' }),
  }),
  whatsappNumber: z.string()
    .optional()
    .refine(
      (val) => !val || /^[\d\s\-\(\)\+]+$/.test(val),
      { message: 'Número de WhatsApp inválido' }
    ),
  messageTemplate: z.string()
    .optional(),
  createLeadAnyway: z.boolean()
    .optional()
    .default(true),
});

export type LandingPageSettingsInput = z.infer<typeof LandingPageSettingsSchema>;

// ============================================================================
// LandingPageSettingsController
// ============================================================================

export class LandingPageSettingsController {
  /**
   * GET /api/admin/landing-page-settings
   * Buscar configuração atual
   */
  get = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('📖 Buscando configurações da landing page');

      const config = await prisma.systemConfig.findUnique({
        where: { key: 'landing_page_lead_handling' },
      });

      if (!config) {
        // Retornar configuração padrão
        const defaultConfig: LandingPageLeadSettings = {
          mode: 'create_lead',
          whatsappNumber: '',
          messageTemplate: '🎯 *Novo Lead Capturado!*\n\n👤 *Nome:* {{name}}\n📱 *Telefone:* {{phone}}\n📧 *Email:* {{email}}\n🎨 *Produto de Interesse:* {{interest}}\n🔗 *Origem:* {{source}}\n\n📅 Capturado em: {{timestamp}}',
          createLeadAnyway: true,
        };

        logger.info('⚙️  Configuração não encontrada, retornando padrão');
        successResponse(res, defaultConfig, 'Configuração padrão');
        return;
      }

      const parsedConfig = JSON.parse(config.value) as LandingPageLeadSettings;

      logger.info('✅ Configuração carregada', {
        mode: parsedConfig.mode,
        hasWhatsAppNumber: !!parsedConfig.whatsappNumber,
      });

      successResponse(res, parsedConfig, 'Configuração carregada com sucesso');
    } catch (error: any) {
      logger.error('❌ Erro ao buscar configurações', { error: error.message });
      next(error);
    }
  };

  /**
   * PUT /api/admin/landing-page-settings
   * Atualizar configuração
   */
  update = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('💾 Atualizando configurações da landing page', {
        mode: req.body.mode,
      });

      // Validar entrada
      const validatedData = LandingPageSettingsSchema.parse(req.body);

      // Validações adicionais
      if (validatedData.mode === 'whatsapp_only') {
        if (!validatedData.whatsappNumber || !validatedData.messageTemplate) {
          badRequestResponse(res, 'Modo WhatsApp Only requer número e template de mensagem', [
            {
              field: 'whatsappNumber',
              message: 'Obrigatório para modo WhatsApp Only',
              code: 'required',
            },
            {
              field: 'messageTemplate',
              message: 'Obrigatório para modo WhatsApp Only',
              code: 'required',
            },
          ]);
          return;
        }
      }

      // Salvar configuração
      const configValue = JSON.stringify(validatedData);

      const updatedConfig = await prisma.systemConfig.upsert({
        where: { key: 'landing_page_lead_handling' },
        update: {
          value: configValue,
          updatedAt: new Date(),
        },
        create: {
          id: 'clp_config_001',
          key: 'landing_page_lead_handling',
          value: configValue,
          isPublic: false,
        },
      });

      logger.info('✅ Configuração salva com sucesso', {
        mode: validatedData.mode,
        configId: updatedConfig.id,
      });

      const parsedConfig = JSON.parse(updatedConfig.value) as LandingPageLeadSettings;

      successResponse(res, parsedConfig, 'Configuração atualizada com sucesso');
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('❌ Validação falhou', { errors: error.errors });
        badRequestResponse(res, 'Dados inválidos', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      logger.error('❌ Erro ao atualizar configurações', { error: error.message });
      next(error);
    }
  };

  /**
   * POST /api/admin/landing-page-settings/test
   * Testar conexão WhatsApp
   */
  test = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      logger.info('🧪 Testando conexão WhatsApp');

      // Validar entrada
      const validatedData = LandingPageSettingsSchema.parse(req.body);

      if (!validatedData.whatsappNumber) {
        badRequestResponse(res, 'Número de WhatsApp é obrigatório para teste', [
          {
            field: 'whatsappNumber',
            message: 'Obrigatório para teste',
            code: 'required',
          },
        ]);
        return;
      }

      // Testar envio (garantir que mode existe para o tipo correto)
      const config: LandingPageLeadSettings = {
        mode: validatedData.mode || 'whatsapp_only',
        whatsappNumber: validatedData.whatsappNumber,
        messageTemplate: validatedData.messageTemplate,
        createLeadAnyway: validatedData.createLeadAnyway,
      };
      const testResult = await whatsappDirectNotificationService.testWhatsAppConnection(config);

      if (testResult) {
        logger.info('✅ Teste de WhatsApp bem-sucedido');
        successResponse(res, {
          success: true,
          message: 'Mensagem de teste enviada com sucesso!',
        }, 'Teste realizado com sucesso');
      } else {
        logger.warn('⚠️  Teste de WhatsApp falhou');
        badRequestResponse(res, 'Falha ao enviar mensagem de teste. Verifique se o número é válido e se o WhatsApp está conectado.', [
          {
            field: 'whatsappNumber',
            message: 'Não foi possível enviar mensagem para este número',
            code: 'send_failed',
          },
        ]);
      }
    } catch (error: any) {
      if (error instanceof z.ZodError) {
        logger.warn('❌ Validação falhou', { errors: error.errors });
        badRequestResponse(res, 'Dados inválidos', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      logger.error('❌ Erro ao testar conexão WhatsApp', { error: error.message });
      next(error);
    }
  };
}
