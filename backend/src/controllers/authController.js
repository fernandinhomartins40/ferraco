const {
  generateToken,
  findUserByCredentials,
  verifyToken,
  USERS
} = require('../middleware/auth');
const logger = require('../utils/logger');

class AuthController {
  // Login do usuário
  async login(req, res) {
    try {
      const { username, password } = req.body;

      // Validar campos obrigatórios
      if (!username || !password) {
        logger.warn('Tentativa de login com campos faltando', {
          username: username || 'não fornecido',
          hasPassword: !!password
        });

        return res.status(400).json({
          success: false,
          message: 'Username e password são obrigatórios',
          error: 'Campos obrigatórios faltando'
        });
      }

      // Encontrar usuário
      const user = findUserByCredentials(username, password);

      if (!user) {
        // Delay para prevenir ataques de força bruta
        await new Promise(resolve => setTimeout(resolve, 1000));

        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          error: 'Username ou password incorretos'
        });
      }

      // Gerar token
      const token = generateToken(user);

      // Retornar dados do usuário (sem senha)
      const userResponse = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        permissions: user.permissions
      };

      logger.info('Login realizado com sucesso', {
        userId: user.id,
        username: user.username,
        role: user.role,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: userResponse,
          token,
          expiresIn: '24h'
        }
      });
    } catch (error) {
      logger.error('Erro no controller de login', {
        error: error.message,
        username: req.body?.username
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor no login',
        error: error.message
      });
    }
  }

  // Verificar token e obter informações do usuário
  async me(req, res) {
    try {
      // req.user já foi preenchido pelo middleware authenticateToken
      const userResponse = {
        id: req.user.id,
        username: req.user.username,
        name: req.user.name,
        role: req.user.role,
        email: req.user.email,
        permissions: req.user.permissions
      };

      logger.debug('Informações do usuário recuperadas', {
        userId: req.user.id,
        username: req.user.username
      });

      res.status(200).json({
        success: true,
        message: 'Informações do usuário recuperadas com sucesso',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      logger.error('Erro no controller ao obter informações do usuário', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao obter informações do usuário',
        error: error.message
      });
    }
  }

  // Logout (apenas log, JWT é stateless)
  async logout(req, res) {
    try {
      logger.info('Logout realizado', {
        userId: req.user?.id,
        username: req.user?.username,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
        data: {
          message: 'Token invalidado no cliente'
        }
      });
    } catch (error) {
      logger.error('Erro no controller de logout', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor no logout',
        error: error.message
      });
    }
  }

  // Verificar se token é válido
  async verifyToken(req, res) {
    try {
      const { token } = req.body;

      if (!token) {
        return res.status(400).json({
          success: false,
          message: 'Token é obrigatório',
          error: 'Token não fornecido'
        });
      }

      const decoded = verifyToken(token);

      logger.debug('Token verificado via endpoint', {
        userId: decoded.id,
        username: decoded.username
      });

      res.status(200).json({
        success: true,
        message: 'Token válido',
        data: {
          valid: true,
          user: {
            id: decoded.id,
            username: decoded.username,
            name: decoded.name,
            role: decoded.role,
            email: decoded.email,
            permissions: decoded.permissions
          }
        }
      });
    } catch (error) {
      logger.warn('Token inválido verificado via endpoint', {
        error: error.message
      });

      res.status(401).json({
        success: false,
        message: error.message,
        data: {
          valid: false
        }
      });
    }
  }

  // Listar usuários (apenas para admin)
  async listUsers(req, res) {
    try {
      const usersResponse = USERS.map(user => ({
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        permissions: user.permissions
        // Não incluir password
      }));

      logger.info('Lista de usuários recuperada', {
        requestedBy: req.user.username,
        totalUsers: usersResponse.length
      });

      res.status(200).json({
        success: true,
        message: 'Usuários recuperados com sucesso',
        data: {
          users: usersResponse,
          total: usersResponse.length
        }
      });
    } catch (error) {
      logger.error('Erro ao listar usuários', {
        error: error.message,
        requestedBy: req.user?.username
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao listar usuários',
        error: error.message
      });
    }
  }

  // Obter informações de um usuário específico (apenas para admin)
  async getUser(req, res) {
    try {
      const { id } = req.params;

      const user = USERS.find(u => u.id === id);

      if (!user) {
        return res.status(404).json({
          success: false,
          message: 'Usuário não encontrado',
          error: 'ID de usuário inválido'
        });
      }

      const userResponse = {
        id: user.id,
        username: user.username,
        name: user.name,
        role: user.role,
        email: user.email,
        permissions: user.permissions
      };

      logger.info('Informações de usuário específico recuperadas', {
        targetUserId: id,
        targetUsername: user.username,
        requestedBy: req.user.username
      });

      res.status(200).json({
        success: true,
        message: 'Usuário recuperado com sucesso',
        data: {
          user: userResponse
        }
      });
    } catch (error) {
      logger.error('Erro ao obter usuário específico', {
        error: error.message,
        userId: req.params.id,
        requestedBy: req.user?.username
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor ao obter usuário',
        error: error.message
      });
    }
  }

  // Status do sistema de autenticação
  async status(req, res) {
    try {
      const stats = {
        totalUsers: USERS.length,
        activeUsers: USERS.filter(u => u.role !== 'inactive').length,
        roles: [...new Set(USERS.map(u => u.role))],
        permissions: [...new Set(USERS.flatMap(u => u.permissions))],
        systemInfo: {
          jwtEnabled: true,
          tokenExpiry: '24h',
          authRequired: true
        }
      };

      logger.debug('Status do sistema de autenticação consultado', {
        requestedBy: req.user?.username || 'anônimo'
      });

      res.status(200).json({
        success: true,
        message: 'Status do sistema de autenticação',
        data: stats
      });
    } catch (error) {
      logger.error('Erro ao obter status do sistema de autenticação', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro interno do servidor',
        error: error.message
      });
    }
  }
}

module.exports = new AuthController();