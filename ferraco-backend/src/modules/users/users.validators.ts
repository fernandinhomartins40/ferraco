import { z } from 'zod';
import { PASSWORD } from '../../config/constants';

export const createUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    username: z
      .string()
      .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
      .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, hífens e underscores'),
    password: z.string().min(PASSWORD.minLength, `Senha deve ter no mínimo ${PASSWORD.minLength} caracteres`),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres'),
    role: z.enum(['ADMIN', 'SALES', 'CONSULTANT', 'USER']).optional(),
  }),
});

export const updateUserSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido').optional(),
    username: z
      .string()
      .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
      .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, hífens e underscores')
      .optional(),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').optional(),
    role: z.enum(['ADMIN', 'SALES', 'CONSULTANT', 'USER']).optional(),
    avatar: z.string().url('Avatar deve ser uma URL válida').optional(),
    isActive: z.boolean().optional(),
  }),
});

export const userFiltersSchema = z.object({
  query: z.object({
    search: z.string().optional(),
    role: z.enum(['ADMIN', 'SALES', 'CONSULTANT', 'USER']).optional(),
    isActive: z.enum(['true', 'false']).optional(),
    page: z.string().regex(/^\d+$/).optional(),
    limit: z.string().regex(/^\d+$/).optional(),
  }),
});

export const userIdSchema = z.object({
  params: z.object({
    id: z.string().uuid('ID inválido'),
  }),
});
