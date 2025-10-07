import { z } from 'zod';
import { PASSWORD } from '../../config/constants';

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    password: z.string().min(PASSWORD.minLength, `Senha deve ter no mínimo ${PASSWORD.minLength} caracteres`),
  }),
});

export const registerSchema = z.object({
  body: z.object({
    email: z.string().email('Email inválido'),
    username: z
      .string()
      .min(3, 'Nome de usuário deve ter no mínimo 3 caracteres')
      .max(50, 'Nome de usuário deve ter no máximo 50 caracteres')
      .regex(/^[a-zA-Z0-9_-]+$/, 'Nome de usuário deve conter apenas letras, números, hífens e underscores'),
    password: z
      .string()
      .min(PASSWORD.minLength, `Senha deve ter no mínimo ${PASSWORD.minLength} caracteres`)
      .max(100, 'Senha deve ter no máximo 100 caracteres'),
    name: z.string().min(2, 'Nome deve ter no mínimo 2 caracteres').max(100, 'Nome deve ter no máximo 100 caracteres'),
  }),
});

export const changePasswordSchema = z.object({
  body: z.object({
    currentPassword: z.string().min(1, 'Senha atual é obrigatória'),
    newPassword: z
      .string()
      .min(PASSWORD.minLength, `Nova senha deve ter no mínimo ${PASSWORD.minLength} caracteres`)
      .max(100, 'Nova senha deve ter no máximo 100 caracteres'),
  }),
});
