const { z } = require('zod');

// Tipos válidos de triggers
const validTriggerTypes = [
  'lead_created',
  'lead_updated',
  'tag_added',
  'status_changed',
  'time_based',
  'custom_field'
];

// Tipos válidos de ações
const validActionTypes = [
  'add_tag',
  'remove_tag',
  'update_status',
  'add_note',
  'send_webhook',
  'assign_to'
];

// Status válidos para leads
const validLeadStatuses = [
  'novo',
  'qualificado',
  'interessado',
  'proposta',
  'negociacao',
  'ganho',
  'perdido',
  'descartado'
];

// Schema para condições de trigger
const triggerConditionsSchema = z.object({
  // Para lead_created e lead_updated
  status: z.enum(validLeadStatuses).optional(),
  tag: z.string().trim().optional(),
  source: z.string().trim().optional(),
  field: z.string().trim().optional(),
  customField: z.string().trim().optional(),

  // Para tag_added
  tagName: z.string().trim().optional(),
  tagId: z.string().trim().optional(),

  // Para status_changed
  from: z.enum([...validLeadStatuses, 'any']).optional(),
  to: z.enum(validLeadStatuses).optional(),

  // Para time_based
  delay: z.number().int().min(1).optional(),
  unit: z.enum(['minutes', 'hours', 'days', 'weeks']).optional(),
  fromEvent: z.enum(['created', 'updated', 'tagged', 'status_changed']).optional(),

  // Para custom_field
  operator: z.enum(['equals', 'not_equals', 'contains', 'not_contains', 'greater_than', 'less_than']).optional(),
  value: z.union([z.string(), z.number(), z.boolean()]).optional()
}).passthrough();

// Schema para parâmetros de ação
const actionParametersSchema = z.object({
  // Para add_tag/remove_tag
  tagName: z.string().trim().optional(),
  tagId: z.string().trim().optional(),

  // Para update_status
  newStatus: z.enum(validLeadStatuses).optional(),

  // Para add_note
  content: z.string().trim().optional(),
  type: z.enum(['comment', 'followup', 'meeting', 'call', 'email', 'other']).optional(),

  // Para send_webhook
  url: z.string().url().optional(),
  method: z.enum(['GET', 'POST', 'PUT', 'PATCH', 'DELETE']).optional(),
  headers: z.record(z.string()).optional(),
  payload: z.record(z.any()).optional(),

  // Para assign_to
  userId: z.string().trim().optional(),
  userName: z.string().trim().optional()
}).passthrough();

// Schema para trigger individual
const triggerSchema = z.object({
  type: z.enum(validTriggerTypes, {
    errorMap: () => ({ message: `Tipo de trigger deve ser um dos: ${validTriggerTypes.join(', ')}` })
  }),
  conditions: triggerConditionsSchema.optional().default({})
}).strict();

// Schema para ação individual
const actionSchema = z.object({
  type: z.enum(validActionTypes, {
    errorMap: () => ({ message: `Tipo de ação deve ser um dos: ${validActionTypes.join(', ')}` })
  }),
  parameters: actionParametersSchema.optional().default({}),
  delay: z.number().int().min(0).max(86400).optional().default(0), // máximo 24 horas em segundos
  order: z.number().int().min(1).optional().default(1)
}).strict();

// Schema para criação de automação
const createAutomationSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim(),

  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),

  active: z.boolean().default(true),

  triggers: z.array(triggerSchema)
    .min(1, 'Pelo menos um trigger deve ser definido')
    .max(5, 'Máximo 5 triggers por automação'),

  actions: z.array(actionSchema)
    .min(1, 'Pelo menos uma ação deve ser definida')
    .max(10, 'Máximo 10 ações por automação'),

  priority: z.number()
    .int()
    .min(1, 'Prioridade deve ser pelo menos 1')
    .max(10, 'Prioridade deve ser no máximo 10')
    .default(5)
}).strict();

// Schema para atualização de automação
const updateAutomationSchema = z.object({
  name: z.string()
    .min(3, 'Nome deve ter pelo menos 3 caracteres')
    .max(100, 'Nome deve ter no máximo 100 caracteres')
    .trim()
    .optional(),

  description: z.string()
    .max(500, 'Descrição deve ter no máximo 500 caracteres')
    .trim()
    .optional(),

  active: z.boolean().optional(),

  triggers: z.array(triggerSchema)
    .min(1, 'Pelo menos um trigger deve ser definido')
    .max(5, 'Máximo 5 triggers por automação')
    .optional(),

  actions: z.array(actionSchema)
    .min(1, 'Pelo menos uma ação deve ser definida')
    .max(10, 'Máximo 10 ações por automação')
    .optional(),

  priority: z.number()
    .int()
    .min(1, 'Prioridade deve ser pelo menos 1')
    .max(10, 'Prioridade deve ser no máximo 10')
    .optional()
}).strict().refine(
  (data) => Object.keys(data).length > 0,
  'Pelo menos um campo deve ser fornecido para atualização'
);

// Schema para ID de automação
const automationIdSchema = z.object({
  id: z.string()
    .min(1, 'ID da automação é obrigatório')
    .max(50, 'ID da automação inválido')
    .trim()
}).strict();

// Schema para toggle de status
const toggleStatusSchema = z.object({
  active: z.boolean({
    required_error: 'Status ativo é obrigatório',
    invalid_type_error: 'Status ativo deve ser verdadeiro ou falso'
  })
}).strict();

// Schema para teste de automação
const testAutomationSchema = z.object({
  testData: z.object({
    leadId: z.string().trim().optional(),
    leadData: z.record(z.any()).optional(),
    triggerType: z.enum(validTriggerTypes).optional(),
    customData: z.record(z.any()).optional()
  }).optional().default({})
}).strict();

// Schema para trigger manual
const manualTriggerSchema = z.object({
  leadId: z.string()
    .min(1, 'ID do lead é obrigatório')
    .trim(),
  triggerData: z.record(z.any()).optional().default({})
}).strict();

// Schema para filtros de automações
const automationFiltersSchema = z.object({
  active: z.enum(['true', 'false', 'all']).default('all').optional(),
  triggerType: z.enum([...validTriggerTypes, 'all']).default('all').optional(),
  priority: z.string().regex(/^\d+$/, 'Prioridade deve ser um número').optional(),
  search: z.string().max(100).trim().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('10'),
  sortBy: z.enum(['name', 'priority', 'createdAt', 'updatedAt', 'executionCount']).default('name'),
  sortOrder: z.enum(['asc', 'desc']).default('asc')
}).strict();

// Schema para filtros de execuções
const executionFiltersSchema = z.object({
  status: z.enum(['success', 'failed', 'partial', 'all']).default('all').optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  page: z.string().regex(/^\d+$/, 'Página deve ser um número').default('1'),
  limit: z.string().regex(/^\d+$/, 'Limite deve ser um número').default('10'),
  sortBy: z.enum(['createdAt', 'status', 'triggerType']).default('createdAt'),
  sortOrder: z.enum(['asc', 'desc']).default('desc')
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

// Validação personalizada para triggers baseados em tempo
const validateTimeBased = (req, res, next) => {
  try {
    if (req.body.triggers) {
      const timeBasedTriggers = req.body.triggers.filter(t => t.type === 'time_based');

      for (const trigger of timeBasedTriggers) {
        const { delay, unit, fromEvent } = trigger.conditions || {};

        if (!delay || !unit || !fromEvent) {
          return res.status(400).json({
            success: false,
            message: 'Triggers baseados em tempo requerem delay, unit e fromEvent',
            error: 'Configuração incompleta para trigger time_based'
          });
        }

        // Validar limites baseados na unidade
        const maxDelays = { minutes: 1440, hours: 24, days: 30, weeks: 12 };
        if (delay > maxDelays[unit]) {
          return res.status(400).json({
            success: false,
            message: `Delay para ${unit} não pode exceder ${maxDelays[unit]}`,
            error: 'Delay excede limite permitido'
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de triggers baseados em tempo',
      error: error.message
    });
  }
};

// Validação personalizada para webhooks
const validateWebhookActions = (req, res, next) => {
  try {
    if (req.body.actions) {
      const webhookActions = req.body.actions.filter(a => a.type === 'send_webhook');

      for (const action of webhookActions) {
        const { url, method } = action.parameters || {};

        if (!url || !method) {
          return res.status(400).json({
            success: false,
            message: 'Ações de webhook requerem url e method',
            error: 'Configuração incompleta para ação send_webhook'
          });
        }

        // Validar URL
        try {
          new URL(url);
        } catch {
          return res.status(400).json({
            success: false,
            message: 'URL do webhook inválida',
            error: 'URL mal formada'
          });
        }
      }
    }

    next();
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: 'Erro interno na validação de ações de webhook',
      error: error.message
    });
  }
};

module.exports = {
  // Schemas
  createAutomationSchema,
  updateAutomationSchema,
  automationIdSchema,
  toggleStatusSchema,
  testAutomationSchema,
  manualTriggerSchema,
  automationFiltersSchema,
  executionFiltersSchema,

  // Middlewares
  validateRequest,
  validateParams,
  validateQuery,
  validateTimeBased,
  validateWebhookActions,

  // Constantes
  validTriggerTypes,
  validActionTypes,
  validLeadStatuses
};