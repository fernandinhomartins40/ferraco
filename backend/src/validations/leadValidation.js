const { z } = require('zod');

// Status válidos para leads
const leadStatusEnum = z.enum(['NOVO', 'EM_ANDAMENTO', 'CONCLUIDO']);

// Prioridades válidas
const priorityEnum = z.enum(['LOW', 'MEDIUM', 'HIGH']);

// Schema base para validação de lead
const baseLeadSchema = {
  name: z.string()
    .min(2, 'Nome deve ter pelo menos 2 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  phone: z.string()
    .min(10, 'Telefone deve ter pelo menos 10 dígitos')
    .max(20, 'Telefone deve ter no máximo 20 caracteres')
    .regex(/^[\d\s\(\)\-\+]+$/, 'Telefone deve conter apenas números e caracteres válidos')
    .trim(),

  email: z.string()
    .email('Email deve ter um formato válido')
    .max(255, 'Email deve ter no máximo 255 caracteres')
    .trim()
    .toLowerCase()
    .optional()
    .or(z.literal('')),

  status: leadStatusEnum.default('NOVO'),

  source: z.string()
    .min(1, 'Fonte é obrigatória')
    .max(50, 'Fonte deve ter no máximo 50 caracteres')
    .trim()
    .default('website'),

  priority: priorityEnum.default('MEDIUM'),

  assignedTo: z.string()
    .max(100, 'Responsável deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal('')),

  nextFollowUp: z.string()
    .datetime('Data de follow-up deve ser uma data válida')
    .optional()
    .or(z.literal('')),

  leadScore: z.number()
    .min(0, 'Score deve ser maior ou igual a 0')
    .max(100, 'Score deve ser menor ou igual a 100')
    .optional(),

  pipelineStage: z.string()
    .max(50, 'Estágio do pipeline deve ter no máximo 50 caracteres')
    .trim()
    .optional()
    .or(z.literal(''))
};

// Schema para criação de lead
const createLeadSchema = z.object({
  ...baseLeadSchema
}).strict();

// Schema para atualização de lead (todos os campos opcionais)
const updateLeadSchema = z.object({
  name: baseLeadSchema.name.optional(),
  phone: baseLeadSchema.phone.optional(),
  email: baseLeadSchema.email.optional(),
  status: baseLeadSchema.status.optional(),
  source: baseLeadSchema.source.optional(),
  priority: baseLeadSchema.priority.optional(),
  assignedTo: baseLeadSchema.assignedTo.optional(),
  nextFollowUp: baseLeadSchema.nextFollowUp.optional(),
  leadScore: baseLeadSchema.leadScore.optional(),
  pipelineStage: baseLeadSchema.pipelineStage.optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Schema para filtros de busca
const leadFiltersSchema = z.object({
  status: leadStatusEnum.optional(),
  priority: priorityEnum.optional(),
  source: z.string().max(50).trim().optional(),
  assignedTo: z.string().max(100).trim().optional(),
  search: z.string().max(100).trim().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('10'),
  sortBy: z.enum(['createdAt', 'updatedAt', 'name', 'status', 'priority']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
}).strict();

// Schema para parâmetros de ID
const leadIdSchema = z.object({
  id: z.string()
    .min(1, 'ID é obrigatório')
    .max(50, 'ID inválido')
    .trim()
}).strict();

// Schema para adição de nota
const addNoteSchema = z.object({
  content: z.string()
    .min(1, 'Conteúdo da nota é obrigatório')
    .max(1000, 'Nota deve ter no máximo 1000 caracteres')
    .trim(),

  important: z.boolean().default(false),

  createdBy: z.string()
    .max(100, 'Criador deve ter no máximo 100 caracteres')
    .trim()
    .optional()
    .or(z.literal(''))
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

      // Substituir o body com os dados validados e transformados
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

module.exports = {
  createLeadSchema,
  updateLeadSchema,
  leadFiltersSchema,
  leadIdSchema,
  addNoteSchema,
  validateRequest,
  validateParams,
  validateQuery,
  leadStatusEnum,
  priorityEnum
};