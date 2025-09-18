const authService = require('../services/authService');

// Logger simples para evitar problemas
const logger = {
  info: (msg, data) => console.log('ℹ️ ', msg, data || ''),
  error: (msg, data) => console.error('❌', msg, data || ''),
  warn: (msg, data) => console.warn('⚠️ ', msg, data || ''),
  debug: (msg, data) => console.log('🔍', msg, data || '')
};

/**
 * Middleware de Autenticação Avançado
 * Sistema completo de autenticação com Prisma e sessões
 */

/**
 * Middleware de autenticação JWT
 */
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        success: false,
        message: 'Token de acesso requerido',
        error: 'MISSING_TOKEN'
      });
    }

    const token = authHeader.substring(7); // Remove 'Bearer '

    // Validar token
    const result = await authService.validateToken(token);

    if (!result.success) {
      return res.status(401).json({
        success: false,
        message: 'Token inválido ou expirado',
        error: 'INVALID_TOKEN'
      });
    }

    // Adicionar dados do usuário ao request
    req.user = result.data.user;
    req.session = result.data.session;

    // Log da requisição autenticada
    logger.debug('Requisição autenticada', {
      userId: req.user.id,
      email: req.user.email,
      role: req.user.role,
      method: req.method,
      path: req.path,
      ip: req.ip
    });

    next();
  } catch (error) {
    logger.error('Erro na autenticação', {
      error: error.message,
      path: req.path,
      method: req.method,
      ip: req.ip
    });

    res.status(401).json({
      success: false,
      message: 'Falha na autenticação',
      error: 'AUTHENTICATION_FAILED'
    });
  }
};

/**
 * Middleware de autorização por permissão
 */
const requirePermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      // Verificar se tem a permissão específica ou é admin (*)
      const hasPermission = req.user.permissions.includes(permission) ||
                          req.user.permissions.includes('*');

      if (!hasPermission) {
        logger.warn('Acesso negado por falta de permissão', {
          userId: req.user.id,
          email: req.user.email,
          role: req.user.role,
          requiredPermission: permission,
          userPermissions: req.user.permissions,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: `Permissão '${permission}' requerida`,
          error: 'INSUFFICIENT_PERMISSIONS'
        });
      }

      logger.debug('Acesso autorizado', {
        userId: req.user.id,
        email: req.user.email,
        permission,
        path: req.path
      });

      next();
    } catch (error) {
      logger.error('Erro na autorização', {
        error: error.message,
        permission,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro na verificação de permissões',
        error: 'AUTHORIZATION_ERROR'
      });
    }
  };
};

/**
 * Middleware de autorização por role
 */
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const hasRole = roleArray.includes(req.user.role);

      if (!hasRole) {
        logger.warn('Acesso negado por role insuficiente', {
          userId: req.user.id,
          email: req.user.email,
          userRole: req.user.role,
          requiredRoles: roleArray,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: `Role '${roleArray.join(' ou ')}' requerido`,
          error: 'INSUFFICIENT_ROLE'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro na verificação de role', {
        error: error.message,
        requiredRoles: roleArray,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro na verificação de role',
        error: 'ROLE_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware de autorização por nível de acesso
 */
const requireMinLevel = (minLevel) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      // Obter nível do usuário
      const result = await authService.getUserById(req.user.id);
      const userLevel = result.data.user.role.level;

      if (userLevel > minLevel) { // Menor número = maior nível
        logger.warn('Acesso negado por nível insuficiente', {
          userId: req.user.id,
          email: req.user.email,
          userLevel,
          requiredLevel: minLevel,
          path: req.path,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Nível de acesso insuficiente',
          error: 'INSUFFICIENT_LEVEL'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro na verificação de nível', {
        error: error.message,
        minLevel,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro na verificação de nível',
        error: 'LEVEL_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware opcional de autenticação (não falha se não houver token)
 */
const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith('Bearer ')) {
      const token = authHeader.substring(7);

      try {
        const result = await authService.validateToken(token);
        if (result.success) {
          req.user = result.data.user;
          req.session = result.data.session;
        }
      } catch (error) {
        // Ignorar erros de token em auth opcional
        logger.debug('Token inválido em auth opcional', { error: error.message });
      }
    }

    next();
  } catch (error) {
    logger.error('Erro na autenticação opcional', {
      error: error.message,
      path: req.path
    });

    // Em auth opcional, continuamos mesmo com erro
    next();
  }
};

/**
 * Middleware de autorização própria (usuário só pode acessar seus próprios dados)
 */
const requireSelfOrPermission = (permission) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'NOT_AUTHENTICATED'
        });
      }

      const targetUserId = req.params.id || req.params.userId;
      const isSelf = targetUserId === req.user.id;

      if (isSelf) {
        // Usuário acessando seus próprios dados
        next();
        return;
      }

      // Verificar se tem permissão para acessar dados de outros usuários
      const hasPermission = req.user.permissions.includes(permission) ||
                          req.user.permissions.includes('*');

      if (!hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Você só pode acessar seus próprios dados',
          error: 'SELF_ACCESS_ONLY'
        });
      }

      next();
    } catch (error) {
      logger.error('Erro na verificação de acesso próprio', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro na verificação de acesso',
        error: 'ACCESS_CHECK_ERROR'
      });
    }
  };
};

/**
 * Middleware para verificar se conta está ativa
 */
const requireActiveAccount = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      success: false,
      message: 'Usuário não autenticado',
      error: 'NOT_AUTHENTICATED'
    });
  }

  if (!req.user.isActive) {
    logger.warn('Tentativa de acesso com conta inativa', {
      userId: req.user.id,
      email: req.user.email
    });

    return res.status(403).json({
      success: false,
      message: 'Conta inativa',
      error: 'INACTIVE_ACCOUNT'
    });
  }

  next();
};

/**
 * Middleware combinado para casos comuns
 */
const authCombined = {
  // Autenticação básica
  basic: authenticateToken,

  // Admin apenas
  adminOnly: [
    authenticateToken,
    requireActiveAccount,
    requireRole('Admin')
  ],

  // Manager ou Admin
  managerUp: [
    authenticateToken,
    requireActiveAccount,
    requireRole(['Admin', 'Manager'])
  ],

  // Usuário autenticado e ativo
  authenticated: [
    authenticateToken,
    requireActiveAccount
  ],

  // Acesso próprio ou admin
  selfOrAdmin: [
    authenticateToken,
    requireActiveAccount,
    requireSelfOrPermission('users.read')
  ]
};

module.exports = {
  authenticateToken,
  requirePermission,
  requireRole,
  requireMinLevel,
  optionalAuth,
  requireSelfOrPermission,
  requireActiveAccount,
  authCombined
};