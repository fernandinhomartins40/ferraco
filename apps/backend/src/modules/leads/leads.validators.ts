import { z } from 'zod';
import { LeadPriority } from '@prisma/client';

// ============================================================================
// Helper Validators
// ============================================================================

const phoneRegex = /^\+?[1-9]\d{1,14}$/;

// CPF/CNPJ validation (Brazilian documents)
function validateCPF(cpf: string): boolean {
  cpf = cpf.replace(/[^\d]/g, '');

  if (cpf.length !== 11 || /^(\d)\1+$/.test(cpf)) {
    return false;
  }

  let sum = 0;
  for (let i = 0; i < 9; i++) {
    sum += parseInt(cpf.charAt(i)) * (10 - i);
  }
  let digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(9))) return false;

  sum = 0;
  for (let i = 0; i < 10; i++) {
    sum += parseInt(cpf.charAt(i)) * (11 - i);
  }
  digit = 11 - (sum % 11);
  if (digit >= 10) digit = 0;
  if (digit !== parseInt(cpf.charAt(10))) return false;

  return true;
}

function validateCNPJ(cnpj: string): boolean {
  cnpj = cnpj.replace(/[^\d]/g, '');

  if (cnpj.length !== 14 || /^(\d)\1+$/.test(cnpj)) {
    return false;
  }

  let sum = 0;
  let pos = 5;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cnpj.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  let digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(12))) return false;

  sum = 0;
  pos = 6;
  for (let i = 0; i < 13; i++) {
    sum += parseInt(cnpj.charAt(i)) * pos;
    pos = pos === 2 ? 9 : pos - 1;
  }
  digit = sum % 11 < 2 ? 0 : 11 - (sum % 11);
  if (digit !== parseInt(cnpj.charAt(13))) return false;

  return true;
}

const documentValidator = z.string().refine((doc) => {
  const cleaned = doc.replace(/[^\d]/g, '');
  if (cleaned.length === 11) {
    return validateCPF(cleaned);
  }
  if (cleaned.length === 14) {
    return validateCNPJ(cleaned);
  }
  return false;
}, {
  message: 'CPF ou CNPJ inválido',
});

// ============================================================================
// Lead Schemas
// ============================================================================

export const CreateLeadSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  phone: z.string()
    .regex(phoneRegex, 'Telefone inválido (formato: +5511999999999)')
    .trim(),

  company: z.string()
    .max(100, 'Nome da empresa deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  position: z.string()
    .max(100, 'Cargo deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  source: z.string()
    .max(50, 'Fonte deve ter no máximo 50 caracteres')
    .trim()
    .optional(),

  status: z.string().optional(), // Status dinâmico baseado nas colunas Kanban

  priority: z.nativeEnum(LeadPriority).optional(),

  assignedToId: z.string()
    .cuid('ID de usuário inválido')
    .optional(),

  customFields: z.record(z.unknown()).optional(),

  tags: z.array(z.string().cuid()).optional(),
});

export const UpdateLeadSchema = CreateLeadSchema.partial().extend({
  id: z.string().cuid('ID inválido'),
});

export const LeadFiltersSchema = z.object({
  search: z.string().trim().optional(),

  status: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  priority: z.union([
    z.nativeEnum(LeadPriority),
    z.array(z.nativeEnum(LeadPriority)),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  source: z.union([
    z.string(),
    z.array(z.string()),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  assignedToId: z.string().cuid().optional(),

  tags: z.union([
    z.string().cuid(),
    z.array(z.string().cuid()),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  dateFrom: z.string().datetime().optional().transform((val) => {
    return val ? new Date(val) : undefined;
  }),

  dateTo: z.string().datetime().optional().transform((val) => {
    return val ? new Date(val) : undefined;
  }),

  hasEmail: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true'),
  ]).optional(),

  hasPhone: z.union([
    z.boolean(),
    z.string().transform((val) => val === 'true'),
  ]).optional(),

  page: z.union([
    z.number().int().positive(),
    z.string().transform((val) => parseInt(val, 10)),
  ]).default(1),

  limit: z.union([
    z.number().int().positive().max(100),
    z.string().transform((val) => Math.min(parseInt(val, 10), 100)),
  ]).default(20),

  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'leadScore']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const MergeLeadsSchema = z.object({
  primaryLeadId: z.string().cuid('ID do lead principal inválido'),

  duplicateLeadIds: z.array(z.string().cuid())
    .min(1, 'Ao menos um lead duplicado deve ser fornecido')
    .max(10, 'Máximo de 10 leads podem ser mesclados por vez'),

  fieldsToKeep: z.object({
    name: z.enum(['primary', 'duplicate']).optional(),
    email: z.enum(['primary', 'duplicate']).optional(),
    phone: z.enum(['primary', 'duplicate']).optional(),
    company: z.enum(['primary', 'duplicate']).optional(),
    position: z.enum(['primary', 'duplicate']).optional(),
  }),
});

export const BulkUpdateLeadsSchema = z.object({
  leadIds: z.array(z.string().cuid())
    .min(1, 'Ao menos um lead deve ser selecionado')
    .max(100, 'Máximo de 100 leads podem ser atualizados por vez'),

  updates: CreateLeadSchema.partial().refine(
    (data) => Object.keys(data).length > 0,
    { message: 'Ao menos um campo deve ser atualizado' }
  ),
});

export const LeadIdParamSchema = z.object({
  id: z.string().cuid('ID do lead inválido'),
});

export const DuplicateSearchSchema = z.object({
  phone: z.string().optional(),
  email: z.string().email().optional(),
}).refine(
  (data) => data.phone || data.email,
  { message: 'Telefone ou email deve ser fornecido' }
);

// ============================================================================
// Type Inference
// ============================================================================

export type CreateLeadInput = z.infer<typeof CreateLeadSchema>;
export type UpdateLeadInput = z.infer<typeof UpdateLeadSchema>;
export type LeadFiltersInput = z.infer<typeof LeadFiltersSchema>;
export type MergeLeadsInput = z.infer<typeof MergeLeadsSchema>;
export type BulkUpdateLeadsInput = z.infer<typeof BulkUpdateLeadsSchema>;
export type DuplicateSearchInput = z.infer<typeof DuplicateSearchSchema>;
