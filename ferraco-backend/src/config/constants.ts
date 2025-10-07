export const APP_CONFIG = {
  name: process.env.APP_NAME || 'Ferraco CRM API',
  version: '1.0.0',
  port: parseInt(process.env.PORT || '3001', 10),
  env: process.env.NODE_ENV || 'development',
  isDevelopment: process.env.NODE_ENV === 'development',
  isProduction: process.env.NODE_ENV === 'production',
};

export const CORS_CONFIG = {
  origin: process.env.ALLOWED_ORIGINS?.split(',') || [
    'http://localhost:8080',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  credentials: true,
  optionsSuccessStatus: 200,
};

export const RATE_LIMIT_CONFIG = {
  windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '60000', 10),
  max: parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100', 10),
  message: 'Too many requests from this IP, please try again later.',
  standardHeaders: true,
  legacyHeaders: false,
};

export const PAGINATION = {
  defaultPage: 1,
  defaultLimit: 10,
  maxLimit: 100,
};

export const PASSWORD = {
  minLength: 6,
  saltRounds: 10,
};

export const USER_ROLES = {
  ADMIN: 'ADMIN',
  SALES: 'SALES',
  CONSULTANT: 'CONSULTANT',
  USER: 'USER',
} as const;

export const LEAD_STATUS = {
  NOVO: 'NOVO',
  EM_ANDAMENTO: 'EM_ANDAMENTO',
  CONCLUIDO: 'CONCLUIDO',
  PERDIDO: 'PERDIDO',
  DESCARTADO: 'DESCARTADO',
} as const;

export const LEAD_PRIORITY = {
  LOW: 'LOW',
  MEDIUM: 'MEDIUM',
  HIGH: 'HIGH',
  URGENT: 'URGENT',
} as const;
