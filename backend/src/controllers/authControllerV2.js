const authService = require('../services/authService');
const logger = require('../utils/logger');

/**
 * Authentication Controller V2
 * Controlador completo de autenticação usando Prisma
 */
class AuthControllerV2 {
  /**
   * Login do usuário
   */
  async login(req, res) {
    try {
      const { email, password } = req.body;

      // Validar campos obrigatórios
      if (!email || !password) {
        logger.warn('Tentativa de login com campos faltando', {
          email: email || 'não fornecido',
          hasPassword: !!password,
          ip: req.ip
        });

        return res.status(400).json({
          success: false,
          message: 'Email e senha são obrigatórios',
          error: 'MISSING_CREDENTIALS'
        });
      }

      // Autenticar usuário
      const authResult = await authService.authenticateUser(email, password);

      if (!authResult.success) {
        // Delay para prevenir ataques de força bruta
        await new Promise(resolve => setTimeout(resolve, 1000));

        return res.status(401).json({
          success: false,
          message: 'Credenciais inválidas',
          error: 'INVALID_CREDENTIALS'
        });
      }

      // Criar sessão
      const sessionResult = await authService.createSession(
        authResult.data.user.id,
        req.ip,
        req.get('User-Agent')
      );

      // Log de auditoria
      logger.info('Login realizado com sucesso', {
        userId: authResult.data.user.id,
        email: authResult.data.user.email,
        name: authResult.data.user.name,
        role: authResult.data.user.role.name,
        ip: req.ip,
        userAgent: req.get('User-Agent')
      });

      // Retornar dados do usuário (sem senha)
      res.status(200).json({
        success: true,
        message: 'Login realizado com sucesso',
        data: {
          user: sessionResult.data.user,
          token: sessionResult.data.token,
          expiresAt: sessionResult.data.expiresAt,
          sessionId: sessionResult.data.session.id
        }
      });

    } catch (error) {
      logger.error('Erro no login', {
        error: error.message,
        email: req.body?.email,
        ip: req.ip
      });

      // Delay para prevenir ataques de força bruta
      await new Promise(resolve => setTimeout(resolve, 1000));

      res.status(401).json({
        success: false,
        message: error.message || 'Erro na autenticação',
        error: 'AUTHENTICATION_FAILED'
      });
    }
  }

  /**
   * Registro de novo usuário
   */
  async register(req, res) {
    try {
      const { name, email, password, roleId } = req.body;

      // Validar campos obrigatórios
      if (!name || !email || !password) {
        return res.status(400).json({
          success: false,
          message: 'Nome, email e senha são obrigatórios',
          error: 'MISSING_FIELDS'
        });
      }

      // Validar força da senha
      if (password.length < 6) {
        return res.status(400).json({
          success: false,
          message: 'Senha deve ter pelo menos 6 caracteres',
          error: 'WEAK_PASSWORD'
        });
      }

      // Se roleId não fornecido, usar role User padrão
      let finalRoleId = roleId;
      if (!finalRoleId) {
        const roles = await authService.listRoles();
        const userRole = roles.data.roles.find(r => r.name === 'User');
        finalRoleId = userRole?.id;
      }

      const result = await authService.createUser({
        name,
        email,
        password,
        roleId: finalRoleId
      });

      logger.info('Usuário registrado com sucesso', {
        userId: result.data.user.id,
        email: result.data.user.email,
        name: result.data.user.name,
        role: result.data.user.role.name,
        registeredBy: req.user?.id || 'self-registration',
        ip: req.ip
      });

      // Remover dados sensíveis da resposta
      const { password: _, ...userResponse } = result.data.user;

      res.status(201).json({
        success: true,
        message: 'Usuário registrado com sucesso',
        data: { user: userResponse }
      });

    } catch (error) {
      logger.error('Erro no registro', {
        error: error.message,
        email: req.body?.email,
        ip: req.ip
      });

      res.status(400).json({
        success: false,
        message: error.message || 'Erro no registro',
        error: 'REGISTRATION_FAILED'
      });
    }
  }

  /**
   * Obter informações do usuário atual
   */
  async me(req, res) {
    try {
      const result = await authService.getUserById(req.user.id);

      res.status(200).json({
        success: true,
        message: 'Informações do usuário recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao obter informações do usuário', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar informações do usuário',
        error: 'USER_INFO_ERROR'
      });
    }
  }

  /**
   * Logout do usuário
   */
  async logout(req, res) {
    try {
      const token = req.headers.authorization?.replace('Bearer ', '');

      if (token) {
        await authService.invalidateSession(token);
      }

      logger.info('Logout realizado', {
        userId: req.user?.id,
        email: req.user?.email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: 'Logout realizado com sucesso',
        data: { message: 'Sessão invalidada' }
      });

    } catch (error) {
      logger.error('Erro no logout', {
        error: error.message,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro no logout',
        error: 'LOGOUT_ERROR'
      });
    }
  }

  /**
   * Listar usuários (apenas para usuários com permissão)
   */
  async listUsers(req, res) {
    try {
      // Verificar permissão
      const permission = await authService.hasPermission(req.user.id, 'users.read');
      if (!permission.hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada para listar usuários',
          error: 'PERMISSION_DENIED'
        });
      }

      const result = await authService.listUsers(req.query);

      logger.info('Lista de usuários recuperada', {
        requestedBy: req.user.id,
        email: req.user.email,
        totalUsers: result.data.users.length
      });

      res.status(200).json({
        success: true,
        message: 'Usuários recuperados com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Erro ao listar usuários', {
        error: error.message,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao listar usuários',
        error: 'LIST_USERS_ERROR'
      });
    }
  }

  /**
   * Obter usuário específico
   */
  async getUser(req, res) {
    try {
      const { id } = req.params;

      // Verificar se pode ver outros usuários ou apenas o próprio
      if (id !== req.user.id) {
        const permission = await authService.hasPermission(req.user.id, 'users.read');
        if (!permission.hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Permissão negada',
            error: 'PERMISSION_DENIED'
          });
        }
      }

      const result = await authService.getUserById(id);

      res.status(200).json({
        success: true,
        message: 'Usuário recuperado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao obter usuário', {
        error: error.message,
        targetUserId: req.params.id,
        requestedBy: req.user?.id
      });

      const statusCode = error.message.includes('não encontrado') ? 404 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao obter usuário',
        error: 'GET_USER_ERROR'
      });
    }
  }

  /**
   * Atualizar usuário
   */
  async updateUser(req, res) {
    try {
      const { id } = req.params;
      const updateData = req.body;

      // Verificar permissão
      if (id !== req.user.id) {
        const permission = await authService.hasPermission(req.user.id, 'users.write');
        if (!permission.hasPermission) {
          return res.status(403).json({
            success: false,
            message: 'Permissão negada para atualizar usuário',
            error: 'PERMISSION_DENIED'
          });
        }
      }

      // Remover campos que não devem ser atualizados diretamente
      const { id: _, createdAt, updatedAt, ...allowedData } = updateData;

      const result = await authService.updateUser(id, allowedData);

      logger.info('Usuário atualizado', {
        targetUserId: id,
        updatedBy: req.user.id,
        email: req.user.email,
        fields: Object.keys(allowedData)
      });

      res.status(200).json({
        success: true,
        message: 'Usuário atualizado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao atualizar usuário', {
        error: error.message,
        targetUserId: req.params.id,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao atualizar usuário',
        error: 'UPDATE_USER_ERROR'
      });
    }
  }

  /**
   * Gerenciar roles
   */
  async listRoles(req, res) {
    try {
      const permission = await authService.hasPermission(req.user.id, 'roles.read');
      if (!permission.hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada para listar roles',
          error: 'PERMISSION_DENIED'
        });
      }

      const result = await authService.listRoles();

      res.status(200).json({
        success: true,
        message: 'Roles recuperados com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao listar roles', {
        error: error.message,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao listar roles',
        error: 'LIST_ROLES_ERROR'
      });
    }
  }

  /**
   * Criar nova role
   */
  async createRole(req, res) {
    try {
      const permission = await authService.hasPermission(req.user.id, 'roles.write');
      if (!permission.hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada para criar roles',
          error: 'PERMISSION_DENIED'
        });
      }

      const result = await authService.createRole(req.body);

      logger.info('Role criado', {
        roleName: req.body.name,
        createdBy: req.user.id,
        email: req.user.email
      });

      res.status(201).json({
        success: true,
        message: 'Role criado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao criar role', {
        error: error.message,
        roleName: req.body?.name,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: error.message || 'Erro ao criar role',
        error: 'CREATE_ROLE_ERROR'
      });
    }
  }

  /**
   * Verificar permissão específica
   */
  async checkPermission(req, res) {
    try {
      const { permission } = req.params;

      const result = await authService.hasPermission(req.user.id, permission);

      res.status(200).json({
        success: true,
        message: 'Permissão verificada',
        data: {
          permission,
          hasPermission: result.hasPermission,
          userRole: result.userRole
        }
      });

    } catch (error) {
      logger.error('Erro ao verificar permissão', {
        error: error.message,
        permission: req.params.permission,
        userId: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão',
        error: 'CHECK_PERMISSION_ERROR'
      });
    }
  }

  /**
   * Alterar senha do usuário
   */
  async changePassword(req, res) {
    try {
      const { currentPassword, newPassword } = req.body;

      // Validar campos obrigatórios
      if (!currentPassword || !newPassword) {
        return res.status(400).json({
          success: false,
          message: 'Senha atual e nova senha são obrigatórias',
          error: 'MISSING_PASSWORDS'
        });
      }

      // Validar força da nova senha
      if (newPassword.length < 8) {
        return res.status(400).json({
          success: false,
          message: 'Nova senha deve ter pelo menos 8 caracteres',
          error: 'WEAK_PASSWORD'
        });
      }

      // Verificar se a nova senha é diferente da atual
      if (currentPassword === newPassword) {
        return res.status(400).json({
          success: false,
          message: 'A nova senha deve ser diferente da senha atual',
          error: 'SAME_PASSWORD'
        });
      }

      const result = await authService.changePassword(
        req.user.id,
        currentPassword,
        newPassword
      );

      logger.info('Senha alterada via changePassword', {
        userId: req.user.id,
        email: req.user.email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao alterar senha', {
        error: error.message,
        userId: req.user?.id,
        ip: req.ip
      });

      const statusCode = error.message.includes('Senha atual incorreta') ? 400 : 500;
      res.status(statusCode).json({
        success: false,
        message: error.message || 'Erro ao alterar senha',
        error: 'CHANGE_PASSWORD_ERROR'
      });
    }
  }

  /**
   * Solicitar recuperação de senha
   */
  async requestPasswordReset(req, res) {
    try {
      const { email } = req.body;

      if (!email) {
        return res.status(400).json({
          success: false,
          message: 'Email é obrigatório',
          error: 'MISSING_EMAIL'
        });
      }

      const result = await authService.generatePasswordResetToken(email);

      logger.info('Token de recuperação solicitado', {
        email,
        ip: req.ip
      });

      res.status(200).json({
        success: true,
        message: result.message
      });

    } catch (error) {
      logger.error('Erro ao solicitar recuperação de senha', {
        error: error.message,
        email: req.body?.email
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao processar solicitação',
        error: 'PASSWORD_RESET_ERROR'
      });
    }
  }

  /**
   * Obter estatísticas de autenticação
   */
  async getAuthStats(req, res) {
    try {
      const permission = await authService.hasPermission(req.user.id, 'admin.stats');
      if (!permission.hasPermission) {
        return res.status(403).json({
          success: false,
          message: 'Permissão negada para ver estatísticas',
          error: 'PERMISSION_DENIED'
        });
      }

      const result = await authService.getAuthStats();

      res.status(200).json({
        success: true,
        message: 'Estatísticas de autenticação recuperadas',
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao obter estatísticas de autenticação', {
        error: error.message,
        requestedBy: req.user?.id
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao obter estatísticas',
        error: 'AUTH_STATS_ERROR'
      });
    }
  }

  /**
   * Inicializar dados padrão do sistema
   */
  async initializeSystem(req, res) {
    try {
      const result = await authService.initializeDefaultData();

      logger.info('Sistema inicializado', {
        requestedBy: req.ip,
        userAgent: req.get('User-Agent')
      });

      res.status(200).json({
        success: true,
        message: result.message,
        data: result.data
      });

    } catch (error) {
      logger.error('Erro ao inicializar sistema', {
        error: error.message
      });

      res.status(500).json({
        success: false,
        message: 'Erro ao inicializar sistema',
        error: 'SYSTEM_INIT_ERROR'
      });
    }
  }
}

module.exports = new AuthControllerV2();