import { z } from 'zod';
import { UserRole } from '@prisma/client';

// ============================================================================
// Helper Validators
// ============================================================================

const usernameRegex = /^[a-zA-Z0-9_-]{3,30}$/;
const passwordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;

// ============================================================================
// User Schemas
// ============================================================================

export const CreateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(usernameRegex, 'Username deve conter apenas letras, números, _ e -')
    .trim()
    .toLowerCase(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim(),

  password: z.string()
    .min(8, 'Senha deve ter no mínimo 8 caracteres')
    .regex(
      passwordRegex,
      'Senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'
    ),

  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  role: z.nativeEnum(UserRole).optional().default(UserRole.CONSULTANT),

  avatar: z.string()
    .url('Avatar deve ser uma URL válida')
    .optional()
    .or(z.literal('')),
});

export const UpdateUserSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter no mínimo 3 caracteres')
    .max(30, 'Username deve ter no máximo 30 caracteres')
    .regex(usernameRegex, 'Username deve conter apenas letras, números, _ e -')
    .trim()
    .toLowerCase()
    .optional(),

  email: z.string()
    .email('Email inválido')
    .toLowerCase()
    .trim()
    .optional(),

  name: z.string()
    .min(3, 'Nome deve ter no mínimo 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  role: z.nativeEnum(UserRole).optional(),

  avatar: z.string()
    .url('Avatar deve ser uma URL válida')
    .optional()
    .or(z.literal('')),
}).refine(
  (data) => Object.keys(data).length > 0,
  { message: 'Ao menos um campo deve ser atualizado' }
);

export const UpdatePasswordSchema = z.object({
  currentPassword: z.string()
    .min(1, 'Senha atual é obrigatória'),

  newPassword: z.string()
    .min(8, 'Nova senha deve ter no mínimo 8 caracteres')
    .regex(
      passwordRegex,
      'Nova senha deve conter pelo menos uma letra maiúscula, uma minúscula, um número e um caractere especial'
    ),
}).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword'],
  }
);

export const UserFiltersSchema = z.object({
  search: z.string().trim().optional(),

  role: z.union([
    z.nativeEnum(UserRole),
    z.array(z.nativeEnum(UserRole)),
  ]).optional().transform((val) => {
    if (!val) return undefined;
    return Array.isArray(val) ? val : [val];
  }),

  isActive: z.union([
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

  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'lastLogin']).default('createdAt'),

  sortOrder: z.enum(['asc', 'desc']).default('desc'),
});

export const UserIdParamSchema = z.object({
  id: z.string().cuid('ID de usuário inválido'),
});

// ============================================================================
// Type Inference
// ============================================================================

export type CreateUserInput = z.infer<typeof CreateUserSchema>;
export type UpdateUserInput = z.infer<typeof UpdateUserSchema>;
export type UpdatePasswordInput = z.infer<typeof UpdatePasswordSchema>;
export type UserFiltersInput = z.infer<typeof UserFiltersSchema>;
