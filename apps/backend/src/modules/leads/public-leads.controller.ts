import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { createdResponse, badRequestResponse } from '../../utils/response';
import { prisma } from '../../config/database';
import { leadRecurrenceService } from '../../services/leadRecurrence.service';
import { whatsappAutomationService } from '../../services/whatsappAutomation.service';
import { isValidWhatsAppNumber } from '../../utils/whatsappValidation';
import { whatsappDirectNotificationService, type LandingPageLeadSettings } from '../../services/whatsappDirectNotification.service';

// ============================================================================
// Public Lead Schema (simplified for landing page)
// ============================================================================

const phoneRegex = /^[\d\s\-\(\)\+]+$/; // Mais flexível para input do usuário

export const PublicCreateLeadSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  phone: z.string()
    .regex(phoneRegex, 'Telefone inválido')
    .min(8, 'Telefone deve ter no mínimo 8 caracteres')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  source: z.string()
    .max(50, 'Fonte deve ter no máximo 50 caracteres')
    .trim()
    .default('landing-page'),

  // ✅ NOVO: Validação de interesse (pode ser string ou array de strings)
  interest: z.union([
    z.string().max(200, 'Interesse deve ter no máximo 200 caracteres'),
    z.array(z.string().max(100, 'Cada interesse deve ter no máximo 100 caracteres'))
      .max(10, 'Máximo de 10 interesses permitidos')
  ]).optional(),
});

export type PublicCreateLeadInput = z.infer<typeof PublicCreateLeadSchema>;

// ============================================================================
// PublicLeadsController
// ============================================================================

export class PublicLeadsController {
  constructor(private service: LeadsService) {}

  /**
   * Buscar configuração de captação de leads da landing page
   */
  private async getLeadHandlingConfig(): Promise<LandingPageLeadSettings> {
    try {
      const config = await prisma.systemConfig.findUnique({
        where: { key: 'landing_page_lead_handling' },
      });

      if (!config) {
        // Retornar configuração padrão se não existir
        logger.info('⚙️  Configuração de landing page não encontrada, usando padrão (create_lead)');
        return {
          mode: 'create_lead',
          whatsappNumber: '',
          messageTemplate: '',
          createLeadAnyway: true,
        };
      }

      const parsedConfig = JSON.parse(config.value) as LandingPageLeadSettings;
      logger.info('⚙️  Configuração de landing page carregada', {
        mode: parsedConfig.mode,
        hasWhatsAppNumber: !!parsedConfig.whatsappNumber,
      });

      return parsedConfig;
    } catch (error) {
      logger.error('❌ Erro ao buscar configuração de landing page', { error });
      // Retornar padrão em caso de erro
      return {
        mode: 'create_lead',
        whatsappNumber: '',
        messageTemplate: '',
        createLeadAnyway: true,
      };
    }
  }

  /**
   * POST /api/public/leads
   * Create a new lead from public form (no authentication required)
   */
  create = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      // Validate input
      const validatedData = PublicCreateLeadSchema.parse(req.body);

      logger.info('Public lead submission received', {
        name: validatedData.name,
        phone: validatedData.phone,
        source: validatedData.source,
      });

      // Format phone number (remove spaces, dashes, parentheses)
      const formattedPhone = validatedData.phone.replace(/[\s\-\(\)]/g, '');

      // Ensure phone has country code (add +55 if not present for Brazilian numbers)
      let phoneWithCountryCode = formattedPhone;
      if (!formattedPhone.startsWith('+')) {
        phoneWithCountryCode = `+55${formattedPhone}`;
      }

      // ============================================================================
      // 🆕 BUSCAR CONFIGURAÇÃO DO SISTEMA
      // ============================================================================
      const config = await this.getLeadHandlingConfig();

      // ============================================================================
      // 🆕 MODO WHATSAPP_ONLY: Redirecionar cliente para WhatsApp via URL (wa.me)
      // ============================================================================
      if (config.mode === 'whatsapp_only') {
        logger.info('📲 Modo WhatsApp Only ativado - gerando URL de redirecionamento');

        // Formatar mensagem com dados do lead
        const interestStr = req.body.interest
          ? (Array.isArray(req.body.interest) ? req.body.interest.join(', ') : req.body.interest)
          : 'Não especificado';

        const message = config.messageTemplate
          ?.replace(/\{\{name\}\}/g, validatedData.name)
          .replace(/\{\{phone\}\}/g, phoneWithCountryCode)
          .replace(/\{\{email\}\}/g, validatedData.email || 'Não informado')
          .replace(/\{\{interest\}\}/g, interestStr)
          .replace(/\{\{source\}\}/g, validatedData.source)
          .replace(/\{\{timestamp\}\}/g, new Date().toLocaleString('pt-BR'))
          || `Olá! Me chamo ${validatedData.name} e tenho interesse em ${interestStr}. Telefone: ${phoneWithCountryCode}`;

        // Gerar URL do WhatsApp (wa.me) - número da empresa
        const whatsappNumber = config.whatsappNumber?.replace(/\D/g, '') || '';
        const encodedMessage = encodeURIComponent(message);
        const whatsappUrl = `https://wa.me/${whatsappNumber}?text=${encodedMessage}`;

        logger.info('🔗 URL do WhatsApp gerada', {
          whatsappNumber: config.whatsappNumber,
          url: whatsappUrl.substring(0, 100) + '...'
        });

        // Opcional: criar lead silenciosamente para histórico
        let leadId: string | null = null;
        if (config.createLeadAnyway) {
          try {
            logger.info('💾 Criando lead silenciosamente para histórico');
            const recurrence = await leadRecurrenceService.handleLeadCapture({
              phone: phoneWithCountryCode,
              name: validatedData.name,
              email: validatedData.email,
              source: validatedData.source,
              interest: req.body.interest,
              metadata: {
                userAgent: req.headers['user-agent'],
                referer: req.headers['referer'],
                mode: 'whatsapp_only',
                whatsappUrl,
              },
              userAgent: req.headers['user-agent'],
              ipAddress: req.ip,
            });
            leadId = recurrence.lead.id;
            logger.info('✅ Lead criado silenciosamente', { leadId });
          } catch (error) {
            logger.error('❌ Erro ao criar lead silencioso', { error });
          }
        }

        // Retornar resposta com URL do WhatsApp para redirecionamento
        createdResponse(res, {
          id: leadId || 'whatsapp_only',
          whatsappUrl,
          message: 'Você será redirecionado para o WhatsApp para enviar sua mensagem.',
        }, 'URL do WhatsApp gerada com sucesso');

        return;
      }

      // ============================================================================
      // MODO CREATE_LEAD (PADRÃO): Criar lead + automação
      // ============================================================================
      logger.info('💾 Modo Create Lead ativado - criando lead no CRM');

      // ============================================================================
      // 🔄 DETECÇÃO DE RECORRÊNCIA - Novo sistema
      // ============================================================================
      const recurrence = await leadRecurrenceService.handleLeadCapture({
        phone: phoneWithCountryCode,
        name: validatedData.name,
        email: validatedData.email,
        source: validatedData.source,
        interest: req.body.interest, // Opcional: produtos de interesse
        metadata: {
          userAgent: req.headers['user-agent'],
          referer: req.headers['referer'],
        },
        userAgent: req.headers['user-agent'],
        ipAddress: req.ip,
      });

      const { lead, isRecurrent, captureNumber, daysSinceLastCapture } = recurrence;

      // ============================================================================
      // 🤖 AUTOMAÇÃO WHATSAPP - Criar com template de recorrência
      // ============================================================================
      if (isRecurrent) {
        logger.info(
          `🔄 Lead recorrente: ${lead.name} - Captura #${captureNumber} ` +
          `(${daysSinceLastCapture} dias desde última captura)`
        );

        // Importar dinamicamente para evitar circular dependency
        import('../../services/whatsappAutomation.service').then(async (module) => {
          const { whatsappAutomationService } = module;

          try {
            // Criar automação com suporte a recorrência
            await whatsappAutomationService.createRecurrenceAutomation(
              lead.id,
              recurrence
            );
          } catch (error) {
            logger.error('❌ Erro ao criar automação de recorrência:', error);
          }
        });
      } else {
        logger.info(`✨ Novo lead criado: ${lead.name}`);

        // ✅ CORREÇÃO CRÍTICA: Verificar se telefone é WhatsApp válido antes de criar automação
        if (isValidWhatsAppNumber(lead.phone)) {
          logger.info(`📱 Telefone validado como WhatsApp - criando automação`);
          // O serviço detecta automaticamente o tipo de template baseado no source e metadata
          // Suporta: produtos, modal_orcamento, human_contact_request, generic_inquiry
          whatsappAutomationService.createAutomationFromLead(lead.id)
            .catch(err => logger.error('❌ Erro ao criar automação padrão:', err));
        } else {
          logger.warn(
            `⚠️  Lead ${lead.id} (${lead.name}) possui telefone inválido para WhatsApp: ${lead.phone}\n` +
            `   Automação WhatsApp não será criada. Lead receberá acompanhamento manual.`
          );
        }
      }

      // Return minimal data (don't expose internal IDs or sensitive info)
      createdResponse(res, {
        id: lead.id,
        message: isRecurrent
          ? 'Que bom te ver de volta! 🎉 Nossa equipe entrará em contato em breve com condições especiais.'
          : 'Seus dados foram recebidos com sucesso! Nossa equipe entrará em contato em breve.',
      }, isRecurrent ? 'Lead recorrente registrado' : 'Lead criado com sucesso');

    } catch (error) {
      if (error instanceof z.ZodError) {
        logger.warn('Public lead validation failed', { errors: error.errors });
        badRequestResponse(res, 'Dados inválidos', error.errors.map(e => ({
          field: e.path.join('.'),
          message: e.message,
          code: e.code,
        })));
        return;
      }

      // Log error but return generic message to user
      logger.error('Error creating public lead', { error });
      next(error);
    }
  };

  /**
   * GET /api/public/leads/whatsapp-config
   * Buscar número de WhatsApp para a landing page (público - sem auth)
   */
  getWhatsAppConfig = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const config = await this.getLeadHandlingConfig();

      res.json({
        success: true,
        data: {
          whatsappNumber: config.whatsappNumber || '',
        }
      });
    } catch (error) {
      logger.error('Error fetching WhatsApp config', { error });
      next(error);
    }
  };
}
