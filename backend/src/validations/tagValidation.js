const { z } = require('zod');

// Schema base para validação de tag
const baseTagSchema = {
  name: z.string()
    .min(2, 'Nome da tag deve ter pelo menos 2 caracteres')
    .max(50, 'Nome da tag deve ter no máximo 50 caracteres')
    .trim()
    .refine(
      (val) => /^[a-zA-ZÀ-ÿ0-9\s\-_]+$/.test(val),
      'Nome da tag deve conter apenas letras, números, espaços, hífens e underscores'
    ),

  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .trim(),

  description: z.string()
    .max(200, 'Descrição deve ter no máximo 200 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  category: z.string()
    .max(30, 'Categoria deve ter no máximo 30 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  isActive: z.boolean().default(true),

  isSystem: z.boolean().default(false),

  createdBy: z.string()
    .max(100, 'Criador deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal(''))
};

// Schema para criação de tag
const createTagSchema = z.object({
  ...baseTagSchema
}).strict();

// Schema para atualização de tag (todos os campos opcionais)
const updateTagSchema = z.object({
  name: baseTagSchema.name.optional(),
  color: baseTagSchema.color.optional(),
  description: baseTagSchema.description.optional(),
  category: baseTagSchema.category.optional(),
  isActive: baseTagSchema.isActive.optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Schema para filtros de busca de tags
const tagFiltersSchema = z.object({
  isActive: z.enum(['true', 'false']).optional(),
  category: z.string().max(30).trim().optional(),
  isSystem: z.enum(['true', 'false']).optional(),
  search: z.string().max(100).trim().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('50'),
  sortBy: z.enum(['name', 'createdAt', 'category', 'isActive']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
}).strict();

// Schema para parâmetros de ID
const tagIdSchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .max(50, 'ID inválido')
    .trim()
}).strict();

// Schema para associação de tag a lead
const tagLeadAssociationSchema = z.object({
  leadId: z.string()
    .min(1, 'ID do lead é obrigatório')
    .max(50, 'ID do lead inválido')
    .trim(),

  tagId: z.string()
    .min(1, 'ID da tag é obrigatório')
    .max(50, 'ID da tag inválido')
    .trim(),

  addedBy: z.string()
    .max(100, 'Responsável deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal(''))
}).strict();

// Schema para parâmetros de associação
const associationParamsSchema = z.object({
  leadId: z.string()
    .min(1, 'ID do lead é obrigatório')
    .max(50, 'ID do lead inválido')
    .trim(),

  tagId: z.string()
    .min(1, 'ID da tag é obrigatório')
    .max(50, 'ID da tag inválido')
    .trim()
}).strict();

// Validação de cores específicas (cores comuns para tags)
const predefinedColors = [
  '#FF6B6B', // Vermelho
  '#4ECDC4', // Turquesa
  '#45B7D1', // Azul
  '#96CEB4', // Verde
  '#FFEAA7', // Amarelo
  '#DDA0DD', // Lilás
  '#98D8C8', // Verde claro
  '#F7DC6F', // Amarelo claro
  '#BB8FCE', // Roxo claro
  '#85C1E9', // Azul claro
  '#F8C471', // Laranja claro
  '#82E0AA', // Verde menta
  '#F1948A', // Rosa claro
  '#D7DBDD', // Cinza claro
  '#566573'  // Cinza escuro
];

const colorSuggestionSchema = z.object({
  color: z.string()
    .regex(/^#[0-9A-Fa-f]{6}$/, 'Cor deve estar no formato hexadecimal (#RRGGBB)')
    .refine(
      (color) => predefinedColors.includes(color.toUpperCase()),
      {
        message: `Cor deve ser uma das cores predefinidas: ${predefinedColors.join(', ')}`,
        path: ['color']
      }
    )
    .optional()
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

      // Verificar se o nome da tag já existe (apenas para criação)
      if (req.method === 'POST' && req.route.path === '/') {
        // Esta validação será feita no controller para acessar o banco
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

// Middleware para validar nome único de tag
const validateUniqueTagName = async (req, res, next) => {
  try {
    if (!req.body.name) {
      return next();
    }

    const { PrismaClient } = require('@prisma/client');
    const prisma = new PrismaClient();

    const existingTag = await prisma.tag.findFirst({
      where: {
        name: req.body.name.trim(),
        // Para atualização, excluir a própria tag
        ...(req.params.id && { id: { not: req.params.id } })
      }
    });

    if (existingTag) {
      return res.status(409).json({
        success: false,
        message: 'Já existe uma tag com este nome',
        error: 'Nome da tag deve ser único'
      });
    }

    await prisma.$disconnect();
    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de nome único',
      error: error.message
    });
  }
};

module.exports = {
  createTagSchema,
  updateTagSchema,
  tagFiltersSchema,
  tagIdSchema,
  tagLeadAssociationSchema,
  associationParamsSchema,
  colorSuggestionSchema,
  validateRequest,
  validateParams,
  validateQuery,
  validateUniqueTagName,
  predefinedColors
};