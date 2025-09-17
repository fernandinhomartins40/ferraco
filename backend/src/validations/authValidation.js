const { z } = require('zod');

// Schema para login
const loginSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username deve ter no máximo 50 caracteres')
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),

  password: z.string()
    .min(6, 'Password deve ter pelo menos 6 caracteres')
    .max(100, 'Password deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, 'Password deve conter pelo menos uma letra e um número')
}).strict();

// Schema para verificação de token
const verifyTokenSchema = z.object({
  token: z.string()
    .min(1, 'Token é obrigatório')
    .max(1000, 'Token inválido (muito longo)')
    .trim()
}).strict();

// Schema para parâmetros de ID de usuário
const userIdSchema = z.object({
  id: z.string()
    .min(1, 'ID do usuário é obrigatório')
    .max(50, 'ID do usuário inválido')
    .trim()
}).strict();

// Schema para mudança de senha (futuro uso)
const changePasswordSchema = z.object({
  currentPassword: z.string()
    .min(6, 'Password atual deve ter pelo menos 6 caracteres')
    .max(100, 'Password atual inválido'),

  newPassword: z.string()
    .min(6, 'Nova senha deve ter pelo menos 6 caracteres')
    .max(100, 'Nova senha deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, 'Nova senha deve conter pelo menos uma letra e um número'),

  confirmPassword: z.string()
    .min(6, 'Confirmação de senha obrigatória')
    .max(100, 'Confirmação de senha inválida')
}).strict().refine(
  (data) => data.newPassword === data.confirmPassword,
  {
    message: 'Nova senha e confirmação devem ser iguais',
    path: ['confirmPassword']
  }
).refine(
  (data) => data.currentPassword !== data.newPassword,
  {
    message: 'Nova senha deve ser diferente da senha atual',
    path: ['newPassword']
  }
);

// Schema para atualização de perfil (futuro uso)
const updateProfileSchema = z.object({
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .trim()
    .optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Roles válidos
const validRoles = ['admin', 'sales', 'consultant'];

// Permissões válidas
const validPermissions = [
  'leads:read',
  'leads:write',
  'tags:read',
  'tags:write',
  'notes:read',
  'notes:write',
  'admin:read',
  'admin:write'
];

// Schema para criação de usuário (futuro uso)
const createUserSchema = z.object({
  username: z.string()
    .min(3, 'Username deve ter pelo menos 3 caracteres')
    .max(50, 'Username deve ter no máximo 50 caracteres')
    .trim()
    .regex(/^[a-zA-Z0-9_]+$/, 'Username deve conter apenas letras, números e underscore'),

  password: z.string()
    .min(6, 'Password deve ter pelo menos 6 caracteres')
    .max(100, 'Password deve ter no máximo 100 caracteres')
    .regex(/^(?=.*[a-zA-Z])(?=.*[0-9])/, 'Password deve conter pelo menos uma letra e um número'),

  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  email: z.string()
    .email('Email inválido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .trim(),

  role: z.enum(validRoles, {
    errorMap: () => ({ message: `Role deve ser um dos: ${validRoles.join(', ')}` })
  }),

  permissions: z.array(
    z.enum(validPermissions, {
      errorMap: () => ({ message: `Permissão inválida` })
    })
  ).min(1, 'Pelo menos uma permissão deve ser fornecida')
    .max(validPermissions.length, 'Muitas permissões fornecidas')
}).strict();

// Schema para filtros de busca de usuários
const userFiltersSchema = z.object({
  role: z.enum([...validRoles, 'all']).default('all').optional(),
  active: z.enum(['true', 'false', 'all']).default('all').optional(),
  search: z.string().max(100).trim().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('10'),
  sortBy: z.enum(['username', 'name', 'role', 'email']).default('username'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
}).strict();

// Middleware de validação
const validateRequest = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.body);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          message: 'Dados de entrada inválidos',
          errors
        });
      }

      req.body = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno na validação',
        error: error.message
      });
    }
  };
};

// Middleware para validação de parâmetros
const validateParams = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.params);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          message: 'Parâmetros inválidos',
          errors
        });
      }

      req.params = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno na validação de parâmetros',
        error: error.message
      });
    }
  };
};

// Middleware para validação de query parameters
const validateQuery = (schema) => {
  return (req, res, next) => {
    try {
      const result = schema.safeParse(req.query);

      if (!result.success) {
        const errors = result.error.errors.map(err => ({
          field: err.path.join('.'),
          message: err.message,
          received: err.received
        }));

        return res.status(400).json({
          success: false,
          message: 'Parâmetros de consulta inválidos',
          errors
        });
      }

      req.query = result.data;
      next();
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: 'Erro interno na validação de query',
        error: error.message
      });
    }
  };
};

// Middleware para validação de força da senha
const validatePasswordStrength = (req, res, next) => {
  try {
    const password = req.body.password || req.body.newPassword;

    if (!password) {
      return next(); // Let schema validation handle missing password
    }

    const checks = {
      length: password.length >= 8,
      uppercase: /[A-Z]/.test(password),
      lowercase: /[a-z]/.test(password),
      number: /[0-9]/.test(password),
      special: /[!@#$%^&*(),.?":{}|<>]/.test(password)
    };

    const score = Object.values(checks).filter(Boolean).length;
    const strength = score <= 2 ? 'fraca' : score <= 3 ? 'média' : score <= 4 ? 'forte' : 'muito forte';

    // Para produção, pode exigir senha mais forte
    if (score < 3) {
      return res.status(400).json({
        success: false,
        message: 'Senha muito fraca',
        error: 'A senha deve ter pelo menos 8 caracteres, incluindo maiúsculas, minúsculas e números',
        passwordStrength: {
          score,
          strength,
          checks,
          recommendations: [
            !checks.length && 'Use pelo menos 8 caracteres',
            !checks.uppercase && 'Inclua pelo menos uma letra maiúscula',
            !checks.lowercase && 'Inclua pelo menos uma letra minúscula',
            !checks.number && 'Inclua pelo menos um número',
            !checks.special && 'Considere usar caracteres especiais'
          ].filter(Boolean)
        }
      });
    }

    // Adicionar informações de força da senha ao request
    req.passwordStrength = { score, strength, checks };

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de senha',
      error: error.message
    });
  }
};

module.exports = {
  loginSchema,
  verifyTokenSchema,
  userIdSchema,
  changePasswordSchema,
  updateProfileSchema,
  createUserSchema,
  userFiltersSchema,
  validateRequest,
  validateParams,
  validateQuery,
  validatePasswordStrength,
  validRoles,
  validPermissions
};