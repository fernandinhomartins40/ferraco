const jwt = require('jsonwebtoken');
const logger = require('../utils/logger');

// Chave secreta para JWT (em produção, deve vir do .env)
const JWT_SECRET = process.env.JWT_SECRET || 'ferraco-crm-secret-2024';
const JWT_EXPIRES_IN = process.env.JWT_EXPIRES_IN || '24h';

// Usuários básicos hardcoded para a Fase 2
const USERS = [
  {
    id: '1',
    username: 'admin',
    password: 'Admin123!', // Em produção, usar hash
    name: 'Administrador',
    role: 'admin',
    email: 'admin@ferraco.com',
    permissions: ['leads:read', 'leads:write', 'tags:read', 'tags:write', 'notes:read', 'notes:write', 'admin:read', 'admin:write']
  },
  {
    id: '2',
    username: 'vendedor',
    password: 'Vend123!', // Em produção, usar hash
    name: 'Vendedor',
    role: 'sales',
    email: 'vendedor@ferraco.com',
    permissions: ['leads:read', 'leads:write', 'tags:read', 'notes:read', 'notes:write']
  },
  {
    id: '3',
    username: 'consultor',
    password: 'Cons123!', // Em produção, usar hash
    name: 'Consultor',
    role: 'consultant',
    email: 'consultor@ferraco.com',
    permissions: ['leads:read', 'tags:read', 'notes:read']
  }
];

// Gerar token JWT
const generateToken = (user) => {
  try {
    const payload = {
      id: user.id,
      username: user.username,
      name: user.name,
      role: user.role,
      email: user.email,
      permissions: user.permissions
    };

    const token = jwt.sign(payload, JWT_SECRET, {
      expiresIn: JWT_EXPIRES_IN,
      issuer: 'ferraco-crm',
      audience: 'ferraco-crm-users'
    });

    logger.info('Token gerado com sucesso', {
      userId: user.id,
      username: user.username,
      role: user.role
    });

    return token;
  } catch (error) {
    logger.error('Erro ao gerar token JWT', {
      error: error.message,
      userId: user.id
    });
    throw new Error('Erro interno ao gerar token');
  }
};

// Verificar token JWT
const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET, {
      issuer: 'ferraco-crm',
      audience: 'ferraco-crm-users'
    });

    logger.debug('Token verificado com sucesso', {
      userId: decoded.id,
      username: decoded.username,
      role: decoded.role
    });

    return decoded;
  } catch (error) {
    if (error.name === 'TokenExpiredError') {
      logger.warn('Token expirado', { token: token.substring(0, 20) + '...' });
      throw new Error('Token expirado');
    } else if (error.name === 'JsonWebTokenError') {
      logger.warn('Token inválido', { token: token.substring(0, 20) + '...' });
      throw new Error('Token inválido');
    } else {
      logger.error('Erro ao verificar token', { error: error.message });
      throw new Error('Erro interno na verificação do token');
    }
  }
};

// Encontrar usuário por credenciais
const findUserByCredentials = (username, password) => {
  const user = USERS.find(u => u.username === username && u.password === password);

  if (user) {
    logger.info('Usuário autenticado com sucesso', {
      userId: user.id,
      username: user.username,
      role: user.role
    });
  } else {
    logger.warn('Tentativa de login com credenciais inválidas', {
      username,
      timestamp: new Date().toISOString()
    });
  }

  return user;
};

// Encontrar usuário por ID
const findUserById = (id) => {
  return USERS.find(u => u.id === id);
};

// Middleware de autenticação
const authenticateToken = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      logger.warn('Acesso negado - Token não fornecido', {
        url: req.url,
        method: req.method,
        ip: req.ip
      });

      return res.status(401).json({
        success: false,
        message: 'Token de acesso não fornecido',
        error: 'Autenticação necessária'
      });
    }

    const decoded = verifyToken(token);

    // Verificar se usuário ainda existe
    const user = findUserById(decoded.id);
    if (!user) {
      logger.warn('Token válido mas usuário não encontrado', {
        userId: decoded.id,
        username: decoded.username
      });

      return res.status(401).json({
        success: false,
        message: 'Usuário não encontrado',
        error: 'Token inválido'
      });
    }

    // Adicionar informações do usuário ao request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      name: decoded.name,
      role: decoded.role,
      email: decoded.email,
      permissions: decoded.permissions
    };

    logger.debug('Usuário autenticado com sucesso', {
      userId: req.user.id,
      username: req.user.username,
      url: req.url,
      method: req.method
    });

    next();
  } catch (error) {
    logger.error('Erro na autenticação', {
      error: error.message,
      url: req.url,
      method: req.method
    });

    return res.status(401).json({
      success: false,
      message: error.message || 'Token inválido',
      error: 'Falha na autenticação'
    });
  }
};

// Middleware de autorização por permissão
const requirePermission = (permission) => {
  return (req, res, next) => {
    try {
      if (!req.user) {
        logger.error('Middleware de autorização chamado sem autenticação', {
          permission,
          url: req.url
        });

        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'Autenticação necessária'
        });
      }

      if (!req.user.permissions.includes(permission)) {
        logger.warn('Acesso negado - Permissão insuficiente', {
          userId: req.user.id,
          username: req.user.username,
          requiredPermission: permission,
          userPermissions: req.user.permissions,
          url: req.url,
          method: req.method
        });

        return res.status(403).json({
          success: false,
          message: 'Permissão insuficiente para esta ação',
          error: 'Acesso negado',
          requiredPermission: permission
        });
      }

      logger.debug('Autorização concedida', {
        userId: req.user.id,
        username: req.user.username,
        permission,
        url: req.url
      });

      next();
    } catch (error) {
      logger.error('Erro na autorização', {
        error: error.message,
        permission,
        url: req.url
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno na autorização',
        error: error.message
      });
    }
  };
};

// Middleware de autorização por role
const requireRole = (roles) => {
  const roleArray = Array.isArray(roles) ? roles : [roles];

  return (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          success: false,
          message: 'Usuário não autenticado',
          error: 'Autenticação necessária'
        });
      }

      if (!roleArray.includes(req.user.role)) {
        logger.warn('Acesso negado - Role insuficiente', {
          userId: req.user.id,
          username: req.user.username,
          userRole: req.user.role,
          requiredRoles: roleArray,
          url: req.url
        });

        return res.status(403).json({
          success: false,
          message: 'Nível de acesso insuficiente',
          error: 'Acesso negado',
          requiredRoles: roleArray
        });
      }

      next();
    } catch (error) {
      logger.error('Erro na autorização por role', {
        error: error.message,
        roles: roleArray
      });

      return res.status(500).json({
        success: false,
        message: 'Erro interno na autorização',
        error: error.message
      });
    }
  };
};

// Middleware opcional de autenticação (não bloqueia se não tiver token)
const optionalAuth = (req, res, next) => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
      // Sem token, continuar sem usuário
      req.user = null;
      return next();
    }

    const decoded = verifyToken(token);
    const user = findUserById(decoded.id);

    if (user) {
      req.user = {
        id: decoded.id,
        username: decoded.username,
        name: decoded.name,
        role: decoded.role,
        email: decoded.email,
        permissions: decoded.permissions
      };
    } else {
      req.user = null;
    }

    next();
  } catch (error) {
    // Em caso de erro, continuar sem usuário
    logger.debug('Token opcional inválido, continuando sem autenticação', {
      error: error.message
    });
    req.user = null;
    next();
  }
};

module.exports = {
  generateToken,
  verifyToken,
  findUserByCredentials,
  findUserById,
  authenticateToken,
  requirePermission,
  requireRole,
  optionalAuth,
  USERS
};