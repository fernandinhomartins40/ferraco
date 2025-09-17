const rateLimit = require('express-rate-limit');
const helmet = require('helmet');
const validator = require('validator');
const logger = require('../utils/logger');

/**
 * Middleware de Segurança Avançado
 * Implementa múltiplas camadas de segurança conforme OWASP
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
  skipSuccessfulRequests: true, // Não contar logins bem-sucedidos
  standardHeaders: true,
  legacyHeaders: false,
  handler: (req, res) => {
    logger.warn('Auth rate limit exceeded', {
      ip: req.ip,
      email: req.body?.email,
      userAgent: req.get('User-Agent')
    });

    res.status(429).json({
      success: false,
      error: 'Muitas tentativas de login, tente novamente em 15 minutos',
      code: 'AUTH_RATE_LIMIT_EXCEEDED',
      retryAfter: 15 * 60
    });
  }
});

/**
 * Rate limiting para operações críticas
 */
const criticalOperationsLimit = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hora
  max: 10, // máximo 10 operações críticas por hora
  message: {
    error: 'Limite de operações críticas excedido, tente novamente em 1 hora',
    code: 'CRITICAL_OPERATIONS_LIMIT_EXCEEDED',
    retryAfter: 60 * 60
  },
  handler: (req, res) => {
    logger.warn('Critical operations limit exceeded', {
      ip: req.ip,
      userId: req.user?.id,
      endpoint: req.originalUrl,
      method: req.method
    });

    res.status(429).json({
      success: false,
      error: 'Limite de operações críticas excedido, tente novamente em 1 hora',
      code: 'CRITICAL_OPERATIONS_LIMIT_EXCEEDED',
      retryAfter: 60 * 60
    });
  }
});

/**
 * Rate limiting progressivo (aumenta conforme falhas)
 */
const progressiveRateLimit = (basePenalty = 1) => {
  const attempts = new Map(); // IP -> { count, lastAttempt }

  return (req, res, next) => {
    const clientIP = req.ip;
    const now = Date.now();
    const resetTime = 15 * 60 * 1000; // 15 minutos

    let clientData = attempts.get(clientIP) || { count: 0, lastAttempt: now };

    // Reset contador se passou muito tempo
    if (now - clientData.lastAttempt > resetTime) {
      clientData = { count: 0, lastAttempt: now };
    }

    // Calcular limite dinâmico
    const dynamicLimit = Math.max(1, 5 - (clientData.count * basePenalty));

    if (clientData.count >= dynamicLimit) {
      logger.warn('Progressive rate limit exceeded', {
        ip: clientIP,
        attempts: clientData.count,
        dynamicLimit
      });

      return res.status(429).json({
        success: false,
        error: 'Limite progressivo excedido',
        code: 'PROGRESSIVE_RATE_LIMIT_EXCEEDED',
        attemptsCount: clientData.count
      });
    }

    // Incrementar contador em caso de falha
    res.on('finish', () => {
      if (res.statusCode >= 400) {
        clientData.count++;
        clientData.lastAttempt = now;
        attempts.set(clientIP, clientData);
      }
    });

    next();
  };
};

// ==========================================
// HELMET CONFIGURATION (SEGURANÇA HEADERS)
// ==========================================

/**
 * Configuração avançada do Helmet
 */
const helmetConfig = helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'", "https://cdn.jsdelivr.net"],
      scriptSrc: ["'self'", "https://cdn.gpteng.co"],
      imgSrc: ["'self'", "data:", "https:"],
      fontSrc: ["'self'", "https://cdn.jsdelivr.net"],
      connectSrc: ["'self'"],
      mediaSrc: ["'self'"],
      objectSrc: ["'none'"],
      childSrc: ["'self'"],
      frameAncestors: ["'none'"],
      formAction: ["'self'"],
      upgradeInsecureRequests: [],
    },
  },
  crossOriginEmbedderPolicy: false,
  crossOriginOpenerPolicy: { policy: "same-origin" },
  crossOriginResourcePolicy: { policy: "cross-origin" },
  dnsPrefetchControl: { allow: false },
  frameguard: { action: 'deny' },
  hidePoweredBy: true,
  hsts: {
    maxAge: 31536000, // 1 ano
    includeSubDomains: true,
    preload: true
  },
  ieNoOpen: true,
  noSniff: true,
  referrerPolicy: { policy: "strict-origin-when-cross-origin" },
  xssFilter: true
});

// ==========================================
// VALIDAÇÃO E SANITIZAÇÃO
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
// DETECÇÃO DE AMEAÇAS
// ==========================================

/**
 * Middleware de detecção de ameaças
 */
const threatDetection = (req, res, next) => {
  try {
    const threats = [];
    const userAgent = req.get('User-Agent') || '';
    const body = JSON.stringify(req.body || {});
    const query = JSON.stringify(req.query || {});

    // Detectar SQL Injection
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

    // Detectar XSS
    const xssPatterns = [
      /<script[^>]*>.*?<\/script>/gi,
      /<iframe[^>]*>.*?<\/iframe>/gi,
      /javascript:\s*[^;]+/gi,
      /on\w+\s*=\s*["'][^"']*["']/gi
    ];

    xssPatterns.forEach(pattern => {
      if (pattern.test(body) || pattern.test(query)) {
        threats.push('XSS_ATTEMPT');
      }
    });

    // Detectar bots maliciosos
    const maliciousBots = [
      /sqlmap/i,
      /nikto/i,
      /nessus/i,
      /burp/i,
      /zap/i,
      /metasploit/i
    ];

    maliciousBots.forEach(pattern => {
      if (pattern.test(userAgent)) {
        threats.push('MALICIOUS_BOT');
      }
    });

    // Detectar path traversal
    const pathTraversalPatterns = [
      /\.\.\//g,
      /\.\.\\\\g,
      /%2e%2e%2f/gi,
      /%252e%252e%252f/gi
    ];

    const path = req.originalUrl;
    pathTraversalPatterns.forEach(pattern => {
      if (pattern.test(path)) {
        threats.push('PATH_TRAVERSAL_ATTEMPT');
      }
    });

    if (threats.length > 0) {
      logger.warn('Security threat detected', {
        ip: req.ip,
        userAgent,
        endpoint: req.originalUrl,
        method: req.method,
        threats,
        userId: req.user?.id
      });

      return res.status(403).json({
        success: false,
        error: 'Requisição bloqueada por motivos de segurança',
        code: 'SECURITY_THREAT_DETECTED',
        threatTypes: threats
      });
    }

    next();
  } catch (error) {
    logger.error('Error in threat detection middleware:', error);
    next();
  }
};

// ==========================================
// IP WHITELIST/BLACKLIST
// ==========================================

/**
 * Middleware de IP whitelist
 */
const ipWhitelist = (allowedIPs = []) => {
  return (req, res, next) => {
    if (allowedIPs.length === 0) {
      return next();
    }

    const clientIP = req.ip;

    if (!allowedIPs.includes(clientIP)) {
      logger.warn('IP not in whitelist', {
        ip: clientIP,
        allowedIPs,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Acesso negado - IP não autorizado',
        code: 'IP_NOT_WHITELISTED'
      });
    }

    next();
  };
};

/**
 * Middleware de IP blacklist
 */
const ipBlacklist = (blockedIPs = []) => {
  return (req, res, next) => {
    const clientIP = req.ip;

    if (blockedIPs.includes(clientIP)) {
      logger.warn('IP in blacklist', {
        ip: clientIP,
        endpoint: req.originalUrl
      });

      return res.status(403).json({
        success: false,
        error: 'Acesso negado - IP bloqueado',
        code: 'IP_BLACKLISTED'
      });
    }

    next();
  };
};

// ==========================================
// CORS SECURITY
// ==========================================

/**
 * Configuração segura de CORS
 */
const corsSecurityConfig = {
  origin: (origin, callback) => {
    // Lista de origens permitidas
    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:80',
      'http://127.0.0.1:3000',
      'http://127.0.0.1:80',
      process.env.FRONTEND_URL
    ].filter(Boolean);

    // Permitir requisições sem origin (mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      logger.warn('CORS origin blocked', { origin, allowedOrigins });
      callback(new Error('Não permitido pelo CORS'), false);
    }
  },
  credentials: true,
  optionsSuccessStatus: 200,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: [
    'Origin',
    'X-Requested-With',
    'Content-Type',
    'Accept',
    'Authorization',
    'Cache-Control',
    'X-CSRF-Token'
  ],
  maxAge: 86400 // 24 horas
};

// ==========================================
// REQUEST SIZE LIMITS
// ==========================================

/**
 * Middleware de limite de tamanho de requisição
 */
const requestSizeLimit = (maxSize = '10mb') => {
  return (req, res, next) => {
    const contentLength = parseInt(req.get('content-length') || '0', 10);
    const maxSizeBytes = parseSize(maxSize);

    if (contentLength > maxSizeBytes) {
      logger.warn('Request size limit exceeded', {
        ip: req.ip,
        contentLength,
        maxSize,
        endpoint: req.originalUrl
      });

      return res.status(413).json({
        success: false,
        error: 'Tamanho da requisição muito grande',
        code: 'REQUEST_TOO_LARGE',
        maxSize
      });
    }

    next();
  };
};

/**
 * Converte string de tamanho para bytes
 */
function parseSize(size) {
  const units = { b: 1, kb: 1024, mb: 1024 * 1024, gb: 1024 * 1024 * 1024 };
  const match = size.toString().match(/^(\d+)\s*([kmg]?b)$/i);

  if (!match) return 1024 * 1024; // 1MB default

  const value = parseInt(match[1], 10);
  const unit = match[2].toLowerCase();

  return value * (units[unit] || 1);
}

// ==========================================
// SECURITY HEADERS PERSONALIZADOS
// ==========================================

/**
 * Headers de segurança personalizados
 */
const customSecurityHeaders = (req, res, next) => {
  // Header personalizado de API
  res.setHeader('X-API-Version', '1.0.0');
  res.setHeader('X-Powered-By-Ferraco', 'true');

  // Security headers adicionais
  res.setHeader('X-Download-Options', 'noopen');
  res.setHeader('X-Permitted-Cross-Domain-Policies', 'none');
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');

  next();
};

module.exports = {
  // Rate Limiting
  apiRateLimit,
  authRateLimit,
  criticalOperationsLimit,
  progressiveRateLimit,

  // Headers de Segurança
  helmetConfig,
  customSecurityHeaders,

  // Validação e Sanitização
  inputValidation,

  // Detecção de Ameaças
  threatDetection,

  // IP Control
  ipWhitelist,
  ipBlacklist,

  // CORS Security
  corsSecurityConfig,

  // Size Limits
  requestSizeLimit
};