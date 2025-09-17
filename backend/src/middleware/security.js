const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Middleware de Segurança Simplificado e Funcional
 * Implementa segurança essencial sem bugs de regex
 */

// ==========================================
// RATE LIMITING CONFIGURADO
// ==========================================

/**
 * Rate limiting geral para API
 */
const apiRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 100, // máximo 100 requests por IP
  message: {
    error: 'Muitas requisições, tente novamente em 15 minutos',
    code: 'RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      method: req.method
    });

    res.status(429).json({
      success: false,
      error: 'Muitas requisições, tente novamente em 15 minutos',
      code: 'RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

/**
 * Rate limiting rigoroso para autenticação
 */
const authRateLimit = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutos
  max: 5, // máximo 5 tentativas de login
  message: {
    error: 'Muitas tentativas de login, tente novamente em 15 minutos',
    code: 'AUTH_RATE_LIMIT_EXCEEDED',
    retryAfter: 15 * 60
  },
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      userAgent: req.get('User-Agent'),
      endpoint: req.originalUrl,
      email: req.body?.email
    });

    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login, tente novamente em 15 minutos',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

// ==========================================
// HELMET CONFIGURATION
// ==========================================

const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false
});

// ==========================================
// INPUT VALIDATION
// ==========================================

/**
 * Middleware de validação de entrada
 */
const inputValidation = (rules = {}) => {
  return (req, res, next) => {
    try {
      const errors = [];

      // Validar campos do body
      if (rules.body) {
        for (const [field, rule] of Object.entries(rules.body)) {
          const value = req.body?.[field];

          if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push(`Campo '${field}' é obrigatório`);
            continue;
          }

          if (value !== undefined && value !== null && value !== '') {
            if (rule.type === 'email' && !validator.isEmail(value)) {
              errors.push(`Campo '${field}' deve ser um email válido`);
            }

            if (rule.type === 'url' && !validator.isURL(value)) {
              errors.push(`Campo '${field}' deve ser uma URL válida`);
            }

            if (rule.minLength && value.length < rule.minLength) {
              errors.push(`Campo '${field}' deve ter pelo menos ${rule.minLength} caracteres`);
            }

            if (rule.maxLength && value.length > rule.maxLength) {
              errors.push(`Campo '${field}' deve ter no máximo ${rule.maxLength} caracteres`);
            }

            if (rule.pattern && !rule.pattern.test(value)) {
              errors.push(`Campo '${field}' tem formato inválido`);
            }

            if (rule.sanitize) {
              req.body[field] = validator.escape(value);
            }
          }
        }
      }

      // Validar parâmetros da URL
      if (rules.params) {
        for (const [param, rule] of Object.entries(rules.params)) {
          const value = req.params[param];

          if (rule.required && !value) {
            errors.push(`Parâmetro '${param}' é obrigatório`);
            continue;
          }

          if (value) {
            if (rule.type === 'uuid' && !validator.isUUID(value)) {
              errors.push(`Parâmetro '${param}' deve ser um UUID válido`);
            }

            if (rule.type === 'int' && !validator.isInt(value)) {
              errors.push(`Parâmetro '${param}' deve ser um número inteiro`);
            }
          }
        }
      }

      // Validar query parameters
      if (rules.query) {
        for (const [param, rule] of Object.entries(rules.query)) {
          const value = req.query[param];

          if (rule.required && (value === undefined || value === null || value === '')) {
            errors.push(`Query parameter '${param}' é obrigatório`);
            continue;
          }

          if (value !== undefined && value !== null && value !== '') {
            if (rule.type === 'email' && !validator.isEmail(value)) {
              errors.push(`Query parameter '${param}' deve ser um email válido`);
            }

            if (rule.type === 'url' && !validator.isURL(value)) {
              errors.push(`Query parameter '${param}' deve ser uma URL válida`);
            }

            if (rule.type === 'int') {
              const intValue = parseInt(value);
              if (isNaN(intValue)) {
                errors.push(`Query parameter '${param}' deve ser um número inteiro`);
              } else {
                if (rule.min !== undefined && intValue < rule.min) {
                  errors.push(`Query parameter '${param}' deve ser pelo menos ${rule.min}`);
                }
                if (rule.max !== undefined && intValue > rule.max) {
                  errors.push(`Query parameter '${param}' deve ser no máximo ${rule.max}`);
                }
                req.query[param] = intValue;
              }
            }

            if (rule.minLength && value.length < rule.minLength) {
              errors.push(`Query parameter '${param}' deve ter pelo menos ${rule.minLength} caracteres`);
            }

            if (rule.maxLength && value.length > rule.maxLength) {
              errors.push(`Query parameter '${param}' deve ter no máximo ${rule.maxLength} caracteres`);
            }

            if (rule.pattern && !rule.pattern.test(value)) {
              errors.push(`Query parameter '${param}' tem formato inválido`);
            }

            if (rule.sanitize) {
              req.query[param] = validator.escape(value);
            }
          }
        }
      }

      if (errors.length > 0) {
        logger.warn('Input validation failed', {
          ip: req.ip,
          endpoint: req.originalUrl,
          errors,
          userId: req.user?.id
        });

        return res.status(400).json({
          success: false,
          error: 'Dados de entrada inválidos',
          code: 'VALIDATION_ERROR',
          details: errors
        });
      }

      next();
    } catch (error) {
      logger.error('Error in input validation middleware:', error);
      next(error);
    }
  };
};

// ==========================================
// THREAT DETECTION SIMPLIFICADO
// ==========================================

/**
 * Middleware de detecção de ameaças básico
 */
const threatDetection = (req, res, next) => {
  try {
    const threats = [];
    const userAgent = req.get('User-Agent') || '';
    const path = req.path || '';
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});

    // Detectar SQL Injection básico
    const sqlPatterns = [
      /(\s|^)(union|select|insert|update|delete|drop|create|alter)\s/i,
      /(\s|^)(or|and)\s+\d+\s*=\s*\d+/i,
      /\'\s*(or|and)\s*\'/i,
      /\;\s*(drop|delete|truncate)/i
    ];

    sqlPatterns.forEach(pattern => {
      if (pattern.test(body) || pattern.test(query)) {
        threats.push('SQL_INJECTION_ATTEMPT');
      }
    });

    // Detectar XSS básico
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /javascript:/i,
      /on\w+\s*=/i
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(body) || pattern.test(query)) {
        threats.push('XSS_ATTEMPT');
      }
    });

    if (threats.length > 0) {
      logger.warn('Security threat detected', {
        ip: req.ip,
        userAgent,
        endpoint: req.originalUrl,
        threats,
        body: req.body,
        query: req.query
      });

      return res.status(403).json({
        success: false,
        error: 'Solicitação bloqueada por segurança',
        code: 'SECURITY_VIOLATION'
      });
    }

    next();
  } catch (error) {
    logger.error('Error in threat detection middleware:', error);
    next();
  }
};

module.exports = {
  // Rate Limiting
  apiRateLimit,
  authRateLimit,

  // Headers de Segurança
  helmetConfig,

  // Validação e Sanitização
  inputValidation,

  // Detecção de Ameaças
  threatDetection
};