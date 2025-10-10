export const API_PREFIX = process.env.API_PREFIX || '/api';
export const PORT = parseInt(process.env.PORT || '3000', 10);
export const NODE_ENV = process.env.NODE_ENV || 'development';

export const CORS_OPTIONS = {
  origin: process.env.CORS_ORIGIN?.split(',') || ['http://localhost:5173'],
  credentials: true,
  optionsSuccessStatus: 200,
};

export const BCRYPT_ROUNDS = parseInt(process.env.BCRYPT_ROUNDS || '12', 10);

export const RATE_LIMIT = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  maxRequests: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  authMax: parseInt(process.env.RATE_LIMIT_AUTH_MAX || '10', 10),
  strictMax: parseInt(process.env.RATE_LIMIT_STRICT_MAX || '5', 10),
};

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 20,
  maxLimit: 100,
};

export const LEAD_SCORING = {
  email: 20,
  phone: 10,
  company: 15,
  position: 10,
  source: 10,
  address: 15,
  document: 10,
};

export const AUTOMATION_LIMITS = {
  maxActive: 50,
  maxConditions: 10,
  maxActions: 10,
};

export const TAG_LIMITS = {
  maxPerLead: 20,
};

export const COMMUNICATION_LIMITS = {
  whatsapp: { count: 100, hours: 24 },
  email: { count: 50, hours: 24 },
  sms: { count: 20, hours: 24 },
};

export const FILE_UPLOAD = {
  maxSize: 25 * 1024 * 1024, // 25MB
  maxAttachments: 10,
};

export const ERRORS = {
  UNAUTHORIZED: 'Unauthorized',
  FORBIDDEN: 'Forbidden',
  NOT_FOUND: 'Not Found',
  VALIDATION_ERROR: 'Validation Error',
  INTERNAL_ERROR: 'Internal Server Error',
  DUPLICATE_ENTRY: 'Duplicate Entry',
  RATE_LIMIT_EXCEEDED: 'Too Many Requests',
};
