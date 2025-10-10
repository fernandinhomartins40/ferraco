import { z } from 'zod';
import { LeadPriority } from '@prisma/client';

// ============================================================================
// Partial Lead Schemas
// ============================================================================

export const CreatePartialLeadSchema = z.object({
  sessionId: z.string()
    .min(10, 'Session ID deve ter no mínimo 10 caracteres')
    .max(255, 'Session ID deve ter no máximo 255 caracteres'),

  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido (formato: +5511999999999)')
    .trim()
    .optional()
    .or(z.literal('')),

  source: z.string()
    .min(1, 'Fonte é obrigatória')
    .max(100, 'Fonte deve ter no máximo 100 caracteres')
    .trim(),

  url: z.string()
    .url('URL inválida')
    .max(500, 'URL deve ter no máximo 500 caracteres'),

  userAgent: z.string()
    .min(1, 'User Agent é obrigatório')
    .max(500, 'User Agent deve ter no máximo 500 caracteres'),

  ipAddress: z.string()
    .ip({ version: 'v4' })
    .optional()
    .or(z.literal('')),
});

export const UpdatePartialLeadSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter no mínimo 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional(),

  phone: z.string()
    .regex(/^\+?[1-9]\d{1,14}$/, 'Telefone inválido (formato: +5511999999999)')
    .trim()
    .optional(),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Ao menos um campo deve ser atualizado' }
);

export const ConvertToLeadSchema = z.object({
  assignedToId: z.string()
    .cuid('ID de usuário inválido')
    .optional(),

  priority: z.nativeEnum(LeadPriority).optional(),

  tags: z.array(z.string().cuid()).optional(),
});

export const PartialLeadIdParamSchema = z.object({
  id: z.string().cuid('ID inválido'),
});

export const SessionIdParamSchema = z.object({
  sessionId: z.string().min(10, 'Session ID inválido'),
});

export const CleanupQuerySchema = z.object({
  olderThan: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
  ]).default(30), // days
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreatePartialLeadInput = z.infer<typeof CreatePartialLeadSchema>;
export type UpdatePartialLeadInput = z.infer<typeof UpdatePartialLeadSchema>;
export type ConvertToLeadInput = z.infer<typeof ConvertToLeadSchema>;
export type CleanupQueryInput = z.infer<typeof CleanupQuerySchema>;
