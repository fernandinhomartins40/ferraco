import { Request, Response, NextFunction } from 'express';
import { LeadsService } from './leads.service';
import { z } from 'zod';
import { logger } from '../../utils/logger';
import { createdResponse, badRequestResponse } from '../../utils/response';
import { prisma } from '../../config/database';

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

      // Check if lead already exists
      try {
        const duplicates = await this.service.findDuplicates({
          phone: phoneWithCountryCode,
        });

        if (duplicates.length > 0) {
          logger.info('Duplicate lead detected from public form', {
            phone: phoneWithCountryCode,
            existingLeadId: duplicates[0].lead.id,
          });

          // Return success but don't create duplicate
          // This prevents exposing whether a phone number exists in the system
          createdResponse(res, {
            id: duplicates[0].lead.id,
            message: 'Seus dados foram recebidos com sucesso!'
          }, 'Lead recebido com sucesso');
          return;
        }
      } catch (error) {
        logger.error('Error checking for duplicates', { error });
        // Continue with creation even if duplicate check fails
      }

      // Get system user for public leads (first admin user)
      const systemUser = await prisma.user.findFirst({
        where: { role: 'ADMIN' },
        orderBy: { createdAt: 'asc' },
      });

      if (!systemUser) {
        logger.error('No system user found for public lead creation');
        badRequestResponse(res, 'Sistema temporariamente indisponível. Tente novamente mais tarde.');
        return;
      }

      // Create lead
      const lead = await this.service.create(
        {
          name: validatedData.name,
          phone: phoneWithCountryCode,
          email: validatedData.email || undefined,
          source: validatedData.source,
          status: 'NOVO',
          priority: 'MEDIUM',
        },
        systemUser.id
      );

      logger.info('Public lead created successfully', {
        leadId: lead.id,
        name: lead.name,
        source: lead.source,
      });

      // Return minimal data (don't expose internal IDs or sensitive info)
      createdResponse(res, {
        id: lead.id,
        message: 'Seus dados foram recebidos com sucesso! Nossa equipe entrará em contato em breve.',
      }, 'Lead criado com sucesso');

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
