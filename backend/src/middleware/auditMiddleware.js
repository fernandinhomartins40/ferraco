const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Middleware de Auditoria
 * Registra todas as ações dos usuários para compliance e segurança
 */

/**
 * Middleware principal de auditoria
 */
const auditMiddleware = (action, options = {}) => {
  return async (req, res, next) => {
    // Capturar dados da requisição
    const startTime = Date.now();
    const originalSend = res.send;
    const originalJson = res.json;

    // Dados base da auditoria
    const auditData = {
      action: action || _generateAction(req),
      resource: _getResourceName(req),
      resourceId: req.params.id || req.params.leadId || req.params.userId || null,
      method: req.method,
      endpoint: req.originalUrl,
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      timestamp: new Date(),
      userId: null,
      userName: 'Anônimo',
      success: false,
      details: {}
    };

    // Se o usuário está autenticado
    if (req.user) {
      auditData.userId = req.user.id;
      auditData.userName = req.user.name || req.user.email;
    }

    // Capturar dados da requisição (se necessário)
    if (options.logRequestBody && req.body) {
      auditData.details.requestBody = _sanitizeRequestBody(req.body);
    }

    if (options.logQuery && req.query && Object.keys(req.query).length > 0) {
      auditData.details.queryParams = req.query;
    }

    if (options.logParams && req.params && Object.keys(req.params).length > 0) {
      auditData.details.routeParams = req.params;
    }

    // Interceptar resposta
    res.send = function(data) {
      _finalizeAudit(auditData, data, res.statusCode, startTime, options);
      originalSend.call(this, data);
    };

    res.json = function(data) {
      _finalizeAudit(auditData, data, res.statusCode, startTime, options);
      originalJson.call(this, data);
    };

    // Interceptar erros
    const originalNext = next;
    next = function(error) {
      if (error) {
        auditData.success = false;
        auditData.details.error = {
          message: error.message,
          stack: error.stack
        };
        _saveAuditLog(auditData);
      }
      originalNext(error);
    };

    next();
  };
};

/**
 * Middleware específico para ações de alta criticidade
 */
const criticalAuditMiddleware = (action) => {
  return auditMiddleware(action, {
    logRequestBody: true,
    logQuery: true,
    logParams: true,
    logResponse: true,
    forceSave: true
  });
};

/**
 * Middleware para ações de dados sensíveis
 */
const sensitiveDataAuditMiddleware = (action) => {
  return auditMiddleware(action, {
    logRequestBody: false, // Não loggar dados sensíveis
    logQuery: true,
    logParams: true,
    logResponse: false,
    sensitiveData: true
  });
};

/**
 * Middleware para operações de leitura
 */
const readAuditMiddleware = (resource) => {
  return auditMiddleware(`${resource}_READ`, {
    logRequestBody: false,
    logQuery: true,
    logParams: true,
    logResponse: false
  });
};

/**
 * Middleware para operações de escrita
 */
const writeAuditMiddleware = (resource, operation = 'WRITE') => {
  return auditMiddleware(`${resource}_${operation}`, {
    logRequestBody: true,
    logQuery: true,
    logParams: true,
    logResponse: false
  });
};

/**
 * Middleware para operações de exclusão
 */
const deleteAuditMiddleware = (resource) => {
  return auditMiddleware(`${resource}_DELETE`, {
    logRequestBody: false,
    logQuery: true,
    logParams: true,
    logResponse: true,
    forceSave: true
  });
};

// ==========================================
// FUNÇÕES AUXILIARES PRIVADAS
// ==========================================

/**
 * Gera ação automaticamente baseada na requisição
 */
function _generateAction(req) {
  const resource = _getResourceName(req);
  const method = req.method.toLowerCase();

  const actionMap = {
    get: 'READ',
    post: 'CREATE',
    put: 'UPDATE',
    patch: 'UPDATE',
    delete: 'DELETE'
  };

  return `${resource}_${actionMap[method] || method.toUpperCase()}`;
}

/**
 * Extrai nome do recurso da URL
 */
function _getResourceName(req) {
  const path = req.route?.path || req.originalUrl;

  // Extrair recurso da URL (ex: /api/leads -> LEADS)
  const match = path.match(/\/api\/([^\/]+)/);
  if (match) {
    return match[1].toUpperCase();
  }

  return 'UNKNOWN';
}

/**
 * Sanitiza dados da requisição para remover informações sensíveis
 */
function _sanitizeRequestBody(body) {
  const sensitiveFields = ['password', 'token', 'secret', 'key', 'credentials'];
  const sanitized = { ...body };

  sensitiveFields.forEach(field => {
    if (sanitized[field]) {
      sanitized[field] = '[REDACTED]';
    }
  });

  // Limitar tamanho do body logado
  const bodyString = JSON.stringify(sanitized);
  if (bodyString.length > 2000) {
    return { _truncated: true, _size: bodyString.length };
  }

  return sanitized;
}

/**
 * Finaliza auditoria com dados da resposta
 */
function _finalizeAudit(auditData, responseData, statusCode, startTime, options) {
  auditData.success = statusCode < 400;
  auditData.details.statusCode = statusCode;
  auditData.details.responseTime = Date.now() - startTime;

  // Loggar resposta se necessário
  if (options.logResponse && responseData) {
    try {
      const parsedResponse = typeof responseData === 'string' ? JSON.parse(responseData) : responseData;
      auditData.details.response = {
        success: parsedResponse.success || false,
        message: parsedResponse.message || '',
        dataSize: JSON.stringify(parsedResponse.data || {}).length
      };
    } catch (e) {
      auditData.details.response = { _parseError: true };
    }
  }

  _saveAuditLog(auditData);
}

/**
 * Salva log de auditoria no banco
 */
async function _saveAuditLog(auditData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: auditData.userId,
        userName: auditData.userName,
        action: auditData.action,
        resource: auditData.resource,
        resourceId: auditData.resourceId,
        details: JSON.stringify(auditData.details),
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        timestamp: auditData.timestamp,
        success: auditData.success
      }
    });

    logger.debug('Audit log saved', {
      action: auditData.action,
      resource: auditData.resource,
      userId: auditData.userId,
      success: auditData.success
    });

  } catch (error) {
    logger.error('Failed to save audit log', {
      error: error.message,
      auditData: {
        action: auditData.action,
        resource: auditData.resource,
        userId: auditData.userId
      }
    });
  }
}

/**
 * Auditoria manual para casos específicos
 */
const auditAction = async (userId, action, resource, resourceId = null, details = {}, success = true) => {
  try {
    await prisma.auditLog.create({
      data: {
        userId,
        userName: 'System', // Será atualizado se necessário
        action,
        resource,
        resourceId,
        details: JSON.stringify(details),
        ipAddress: '127.0.0.1',
        userAgent: 'System',
        timestamp: new Date(),
        success
      }
    });

    logger.info('Manual audit log created', {
      userId,
      action,
      resource,
      resourceId
    });

  } catch (error) {
    logger.error('Failed to create manual audit log', {
      error: error.message,
      userId,
      action,
      resource
    });
  }
};

/**
 * Middleware para auditoria de login/logout
 */
const authAuditMiddleware = (action) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    const originalJson = res.json;

    const auditData = {
      action,
      resource: 'AUTH',
      email: req.body?.email || 'unknown',
      ipAddress: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || '',
      timestamp: new Date(),
      success: false
    };

    res.send = res.json = function(data) {
      const responseData = typeof data === 'string' ? JSON.parse(data) : data;
      auditData.success = responseData.success || false;

      if (auditData.success && action === 'LOGIN' && responseData.data?.user) {
        auditData.userId = responseData.data.user.id;
        auditData.userName = responseData.data.user.name;
      }

      // Salvar log de auditoria de autenticação
      _saveAuthAuditLog(auditData);

      (action === 'LOGIN' ? originalJson : originalSend).call(this, data);
    };

    next();
  };
};

/**
 * Salva log específico de autenticação
 */
async function _saveAuthAuditLog(auditData) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: auditData.userId || null,
        userName: auditData.userName || auditData.email,
        action: auditData.action,
        resource: 'AUTH',
        resourceId: null,
        details: JSON.stringify({
          email: auditData.email,
          userAgent: auditData.userAgent,
          timestamp: auditData.timestamp
        }),
        ipAddress: auditData.ipAddress,
        userAgent: auditData.userAgent,
        timestamp: auditData.timestamp,
        success: auditData.success
      }
    });

    logger.info('Auth audit log saved', {
      action: auditData.action,
      email: auditData.email,
      success: auditData.success,
      ip: auditData.ipAddress
    });

  } catch (error) {
    logger.error('Failed to save auth audit log', {
      error: error.message,
      action: auditData.action,
      email: auditData.email
    });
  }
}

module.exports = {
  auditMiddleware,
  criticalAuditMiddleware,
  sensitiveDataAuditMiddleware,
  readAuditMiddleware,
  writeAuditMiddleware,
  deleteAuditMiddleware,
  authAuditMiddleware,
  auditAction
};