const { z } = require('zod');

// Schema base para validação de nota
const baseNoteSchema = {
  content: z.string()
    .min(1, 'Conteúdo da nota é obrigatório')
    .max(2000, 'Conteúdo deve ter no máximo 2000 caracteres')
    .trim(),

  important: z.boolean().default(false),

  category: z.string()
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  isPrivate: z.boolean().default(false),

  createdBy: z.string()
    .max(100, 'Criador deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal(''))
};

// Schema para criação de nota
const createNoteSchema = z.object({
  ...baseNoteSchema
}).strict();

// Schema para atualização de nota (todos os campos opcionais)
const updateNoteSchema = z.object({
  content: baseNoteSchema.content.optional(),
  important: baseNoteSchema.important.optional(),
  category: baseNoteSchema.category.optional(),
  isPrivate: baseNoteSchema.isPrivate.optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Schema para filtros de busca de notas
const noteFiltersSchema = z.object({
  important: z.enum(['true', 'false']).optional(),
  category: z.string().max(50).trim().optional(),
  isPrivate: z.enum(['true', 'false']).optional(),
  search: z.string().max(200).trim().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('20'),
  sortBy: z.enum(['createdAt', 'content', 'important', 'category']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

// Schema para parâmetros de ID de nota
const noteIdSchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .max(50, 'ID inválido')
    .trim()
}).strict();

// Schema para parâmetros de ID de lead
const leadIdSchema = z.object({
  leadId: z.string()
    .min(1, 'ID do lead é obrigatório')
    .max(50, 'ID do lead inválido')
    .trim()
}).strict();

// Schema para parâmetros combinados (lead e nota)
const leadNoteParamsSchema = z.object({
  leadId: z.string()
    .min(1, 'ID do lead é obrigatório')
    .max(50, 'ID do lead inválido')
    .trim(),

  noteId: z.string()
    .min(1, 'ID da nota é obrigatório')
    .max(50, 'ID da nota inválido')
    .trim()
}).strict();

// Schema para busca de notas importantes
const importantNotesFiltersSchema = z.object({
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('10'),
  sortBy: z.enum(['createdAt', 'content', 'category']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

// Categorias predefinidas para notas
const predefinedCategories = [
  'Contato',
  'Follow-up',
  'Reunião',
  'Proposta',
  'Negociação',
  'Feedback',
  'Problema',
  'Solução',
  'Observação',
  'Lembrete'
];

const categorySuggestionSchema = z.object({
  category: z.string()
    .max(50, 'Categoria deve ter no máximo 50 caracteres')
    .refine(
      (category) => predefinedCategories.includes(category),
      {
        message: `Categoria deve ser uma das categorias predefinidas: ${predefinedCategories.join(', ')}`,
        path: ['category']
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

// Middleware para validar conteúdo da nota (não muito longo ou muito curto)
const validateNoteContent = (req, res, next) => {
  try {
    if (req.body.content) {
      const content = req.body.content.trim();

      // Verificar se não é apenas espaços em branco
      if (content.length === 0) {
        return res.status(400).json({
          success: false,
          message: 'Conteúdo da nota não pode ser apenas espaços em branco',
          error: 'Conteúdo inválido'
        });
      }

      // Verificar se não é muito repetitivo (mesmo caractere repetido)
      const repetitivePattern = /(.)\1{20,}/; // Mais de 20 caracteres iguais seguidos
      if (repetitivePattern.test(content)) {
        return res.status(400).json({
          success: false,
          message: 'Conteúdo da nota parece inválido (muito repetitivo)',
          error: 'Conteúdo inválido'
        });
      }

      req.body.content = content;
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de conteúdo',
      error: error.message
    });
  }
};

// Middleware para validar permissões de nota privada
const validatePrivateNoteAccess = (req, res, next) => {
  try {
    // Por enquanto, permitir acesso a todas as notas
    // No futuro, implementar validação baseada no usuário logado

    // Exemplo de validação futura:
    // if (req.body.isPrivate || req.note?.isPrivate) {
    //   const userCanAccessPrivate = req.user?.canAccessPrivateNotes;
    //   if (!userCanAccessPrivate) {
    //     return res.status(403).json({
    //       success: false,
    //       message: 'Acesso negado a nota privada',
    //       error: 'Permissão insuficiente'
    //     });
    //   }
    // }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de permissões',
      error: error.message
    });
  }
};

module.exports = {
  createNoteSchema,
  updateNoteSchema,
  noteFiltersSchema,
  noteIdSchema,
  leadIdSchema,
  leadNoteParamsSchema,
  importantNotesFiltersSchema,
  categorySuggestionSchema,
  validateRequest,
  validateParams,
  validateQuery,
  validateNoteContent,
  validatePrivateNoteAccess,
  predefinedCategories
};