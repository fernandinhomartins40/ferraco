import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { createdResponse, badRequestResponse } from '../../utils/response';
import { prisma } from '../../config/database';
import { leadRecurrenceService } from '../../services/leadRecurrence.service';
import { whatsappAutomationService } from '../../services/whatsappAutomation.service';

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

        // ✅ CORREÇÃO CRÍTICA: SEMPRE criar automação, independente de interesse
        // O serviço detecta automaticamente o tipo de template baseado no source e metadata
        // Suporta: produtos, modal_orcamento, human_contact_request, generic_inquiry
        whatsappAutomationService.createAutomationFromLead(lead.id)
          .catch(err => logger.error('❌ Erro ao criar automação padrão:', err));
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
}
