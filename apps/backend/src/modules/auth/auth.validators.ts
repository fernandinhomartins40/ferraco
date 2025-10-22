import { z } from 'zod';

// ============================================================================
// AUTH VALIDATORS - Zod Schemas
// ============================================================================

/**
 * Login Schema
 * Aceita email OU username para login
 */
export const LoginSchema = z.object({
  email: z
    .string()
    .min(1, 'Email or username is required')
    .optional(),
  username: z
    .string()
    .min(1, 'Email or username is required')
    .optional(),
  password: z
    .string()
    .min(1, 'Password is required'),
}).refine((data) => data.email || data.username, {
  message: 'Either email or username must be provided',
  path: ['email'],
});

export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Register Schema
 */
export const RegisterSchema = z.object({
  username: z
    .string()
    .min(3, 'Username must be at least 3 characters')
    .max(50, 'Username must be at most 50 characters')
    .regex(/^[a-zA-Z0-9_-]+$/, 'Username can only contain letters, numbers, underscores and hyphens'),
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters'),
  role: z
    .enum(['ADMIN', 'MANAGER', 'SALES', 'CONSULTANT', 'SUPPORT'])
    .optional(),
});

export type RegisterInput = z.infer<typeof RegisterSchema>;

/**
 * Change Password Schema
 */
export const ChangePasswordSchema = z.object({
  currentPassword: z
    .string()
    .min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(8, 'New password must be at least 8 characters')
    .max(100, 'New password must be at most 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Confirm password is required'),
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ChangePasswordInput = z.infer<typeof ChangePasswordSchema>;

/**
 * Refresh Token Schema
 */
export const RefreshTokenSchema = z.object({
  refreshToken: z
    .string()
    .min(1, 'Refresh token is required'),
});

export type RefreshTokenInput = z.infer<typeof RefreshTokenSchema>;

/**
 * Forgot Password Schema
 */
export const ForgotPasswordSchema = z.object({
  email: z
    .string()
    .email('Invalid email format')
    .min(1, 'Email is required'),
});

export type ForgotPasswordInput = z.infer<typeof ForgotPasswordSchema>;

/**
 * Reset Password Schema
 */
export const ResetPasswordSchema = z.object({
  token: z
    .string()
    .min(1, 'Reset token is required'),
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(100, 'Password must be at most 100 characters'),
  confirmPassword: z
    .string()
    .min(1, 'Confirm password is required'),
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Passwords do not match',
  path: ['confirmPassword'],
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

/**
 * Update Profile Schema
 */
export const UpdateProfileSchema = z.object({
  name: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(100, 'Name must be at most 100 characters')
    .optional(),
  avatar: z
    .string()
    .url('Invalid avatar URL')
    .optional()
    .nullable(),
  phone: z
    .string()
    .min(10, 'Phone must be at least 10 characters')
    .max(20, 'Phone must be at most 20 characters')
    .optional()
    .nullable(),
});

export type UpdateProfileInput = z.infer<typeof UpdateProfileSchema>;
