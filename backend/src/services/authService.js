const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

// Logger simples para evitar problemas
const logger = {
  info: (msg, data) => console.log('ℹ️ ', msg, data || ''),
  error: (msg, data) => console.error('❌', msg, data || ''),
  warn: (msg, data) => console.warn('⚠️ ', msg, data || ''),
  debug: (msg, data) => console.log('🔍', msg, data || '')
};

const prisma = new PrismaClient();

/**
 * Authentication Service
 * Serviços de autenticação, autorização e gerenciamento de usuários
 */
class AuthService {
  /**
   * Autentica um usuário com email e senha
   */
  async authenticateUser(email, password) {
    try {
      const user = await prisma.user.findUnique({
        where: { email },
        include: {
          role: {
            include: {
              users: false // Não incluir outros usuários do mesmo role
            }
          },
          sessions: {
            where: {
              expiresAt: { gt: new Date() }
            },
            orderBy: { createdAt: 'desc' },
            take: 5 // Apenas as 5 sessões mais recentes ativas
          }
        }
      });

      if (!user) {
        throw new Error('Credenciais inválidas');
      }

      if (!user.isActive) {
        throw new Error('Usuário inativo');
      }

      // Verificar senha
      const isPasswordValid = await bcrypt.compare(password, user.password);
      if (!isPasswordValid) {
        throw new Error('Credenciais inválidas');
      }

      // Atualizar último login
      await prisma.user.update({
        where: { id: user.id },
        data: { lastLogin: new Date() }
      });

      return {
        success: true,
        data: { user }
      };
    } catch (error) {
      logger.error('Error in authenticateUser:', error);
      throw error;
    }
  }

  /**
   * Cria uma nova sessão para o usuário
   */
  async createSession(userId, ipAddress, userAgent) {
    try {
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 24); // 24 horas

      // Gerar token JWT
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      const tokenPayload = {
        id: user.id,
        email: user.email,
        name: user.name,
        roleId: user.roleId,
        role: user.role.name,
        permissions: JSON.parse(user.role.permissions)
      };

      const token = jwt.sign(tokenPayload, process.env.JWT_SECRET, {
        expiresIn: '24h',
        issuer: 'ferraco-crm',
        audience: 'ferraco-users'
      });

      // Salvar sessão no banco
      const session = await prisma.session.create({
        data: {
          userId,
          token: crypto.createHash('sha256').update(token).digest('hex'), // Hash do token
          expiresAt
        }
      });

      // Limpar sessões antigas do usuário (manter apenas 10)
      await this._cleanupOldSessions(userId);

      return {
        success: true,
        data: {
          token,
          session,
          user: tokenPayload,
          expiresAt
        }
      };
    } catch (error) {
      logger.error('Error in createSession:', error);
      throw error;
    }
  }

  /**
   * Valida um token JWT
   */
  async validateToken(token) {
    try {
      // Verificar token JWT
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Verificar se a sessão ainda existe e é válida
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');
      const session = await prisma.session.findFirst({
        where: {
          token: tokenHash,
          expiresAt: { gt: new Date() }
        },
        include: {
          user: {
            include: { role: true }
          }
        }
      });

      if (!session) {
        throw new Error('Sessão inválida ou expirada');
      }

      if (!session.user.isActive) {
        throw new Error('Usuário inativo');
      }

      return {
        success: true,
        data: {
          user: {
            id: session.user.id,
            email: session.user.email,
            name: session.user.name,
            roleId: session.user.roleId,
            role: session.user.role.name,
            permissions: JSON.parse(session.user.role.permissions),
            avatar: session.user.avatar,
            preferences: session.user.preferences ? JSON.parse(session.user.preferences) : {}
          },
          session
        }
      };
    } catch (error) {
      logger.error('Error in validateToken:', error);
      throw error;
    }
  }

  /**
   * Invalida uma sessão (logout)
   */
  async invalidateSession(token) {
    try {
      const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

      const deletedSession = await prisma.session.deleteMany({
        where: { token: tokenHash }
      });

      return {
        success: true,
        data: { deletedSessions: deletedSession.count }
      };
    } catch (error) {
      logger.error('Error in invalidateSession:', error);
      throw error;
    }
  }

  /**
   * Cria um novo usuário
   */
  async createUser(userData) {
    try {
      const { name, email, password, roleId } = userData;

      // Verificar se email já existe
      const existingUser = await prisma.user.findUnique({
        where: { email }
      });

      if (existingUser) {
        throw new Error('Email já cadastrado');
      }

      // Verificar se role existe
      const role = await prisma.userRole.findUnique({
        where: { id: roleId }
      });

      if (!role) {
        throw new Error('Role não encontrado');
      }

      // Hash da senha
      const hashedPassword = await bcrypt.hash(password, 12);

      // Criar usuário
      const user = await prisma.user.create({
        data: {
          name,
          email,
          password: hashedPassword,
          roleId,
          preferences: JSON.stringify({
            theme: 'light',
            language: 'pt-BR',
            notifications: true
          })
        },
        include: { role: true }
      });

      // Remover senha da resposta
      const { password: _, ...userResponse } = user;

      return {
        success: true,
        data: { user: userResponse }
      };
    } catch (error) {
      logger.error('Error in createUser:', error);
      throw error;
    }
  }

  /**
   * Atualiza um usuário
   */
  async updateUser(userId, updateData) {
    try {
      const { password, ...otherData } = updateData;

      let dataToUpdate = { ...otherData };

      // Se a senha foi fornecida, fazer hash
      if (password) {
        dataToUpdate.password = await bcrypt.hash(password, 12);
      }

      const user = await prisma.user.update({
        where: { id: userId },
        data: dataToUpdate,
        include: { role: true }
      });

      // Remover senha da resposta
      const { password: _, ...userResponse } = user;

      return {
        success: true,
        data: { user: userResponse }
      };
    } catch (error) {
      logger.error('Error in updateUser:', error);
      throw error;
    }
  }

  /**
   * Altera a senha de um usuário após validar a senha atual
   */
  async changePassword(userId, currentPassword, newPassword) {
    try {
      // Buscar o usuário
      const user = await prisma.user.findUnique({
        where: { id: userId }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      if (!user.isActive) {
        throw new Error('Usuário inativo');
      }

      // Verificar senha atual
      const isCurrentPasswordValid = await bcrypt.compare(currentPassword, user.password);
      if (!isCurrentPasswordValid) {
        throw new Error('Senha atual incorreta');
      }

      // Hash da nova senha
      const hashedNewPassword = await bcrypt.hash(newPassword, 12);

      // Atualizar senha no banco
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          password: hashedNewPassword,
          updatedAt: new Date()
        },
        include: { role: true }
      });

      // Invalidar todas as sessões ativas do usuário (forçar novo login)
      await prisma.session.updateMany({
        where: {
          userId: userId,
          expiresAt: { gt: new Date() }
        },
        data: {
          expiresAt: new Date() // Expirar imediatamente
        }
      });

      // Remover senha da resposta
      const { password: _, ...userResponse } = updatedUser;

      logger.info('Senha alterada com sucesso', {
        userId: userId,
        email: user.email,
        name: user.name
      });

      return {
        success: true,
        message: 'Senha alterada com sucesso',
        data: { user: userResponse }
      };
    } catch (error) {
      logger.error('Error in changePassword:', error);
      throw error;
    }
  }

  /**
   * Lista usuários com filtros
   */
  async listUsers(filters = {}) {
    try {
      const { roleId, isActive, page = 1, limit = 20, search } = filters;

      const where = {};
      if (roleId) where.roleId = roleId;
      if (isActive !== undefined) where.isActive = isActive;
      if (search) {
        where.OR = [
          { name: { contains: search } },
          { email: { contains: search } }
        ];
      }

      const skip = (page - 1) * limit;

      const users = await prisma.user.findMany({
        where,
        include: {
          role: true,
          sessions: {
            where: { expiresAt: { gt: new Date() } },
            select: { id: true, createdAt: true }
          },
          _count: {
            select: { auditLogs: true }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.user.count({ where });

      // Remover senhas das respostas
      const usersResponse = users.map(({ password, ...user }) => ({
        ...user,
        preferences: user.preferences ? JSON.parse(user.preferences) : {},
        role: {
          ...user.role,
          permissions: JSON.parse(user.role.permissions)
        }
      }));

      return {
        success: true,
        data: { users: usersResponse },
        pagination: {
          total,
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil(total / limit)
        }
      };
    } catch (error) {
      logger.error('Error in listUsers:', error);
      throw error;
    }
  }

  /**
   * Obtém um usuário por ID
   */
  async getUserById(userId) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          role: true,
          sessions: {
            where: { expiresAt: { gt: new Date() } },
            orderBy: { createdAt: 'desc' }
          },
          auditLogs: {
            orderBy: { timestamp: 'desc' },
            take: 10
          }
        }
      });

      if (!user) {
        throw new Error('Usuário não encontrado');
      }

      // Remover senha da resposta
      const { password, ...userResponse } = user;

      return {
        success: true,
        data: {
          user: {
            ...userResponse,
            preferences: userResponse.preferences ? JSON.parse(userResponse.preferences) : {},
            role: {
              ...userResponse.role,
              permissions: JSON.parse(userResponse.role.permissions)
            }
          }
        }
      };
    } catch (error) {
      logger.error('Error in getUserById:', error);
      throw error;
    }
  }

  /**
   * Gerencia roles de usuário
   */
  async createRole(roleData) {
    try {
      const { name, description, level, permissions, canCreateUsers = false, canManageRoles = false, canViewAuditLogs = false } = roleData;

      const role = await prisma.userRole.create({
        data: {
          name,
          description,
          level,
          permissions: JSON.stringify(permissions),
          canCreateUsers,
          canManageRoles,
          canViewAuditLogs
        }
      });

      return {
        success: true,
        data: {
          role: {
            ...role,
            permissions: JSON.parse(role.permissions)
          }
        }
      };
    } catch (error) {
      logger.error('Error in createRole:', error);
      throw error;
    }
  }

  /**
   * Lista roles
   */
  async listRoles() {
    try {
      const roles = await prisma.userRole.findMany({
        include: {
          users: {
            select: { id: true, name: true, email: true }
          }
        },
        orderBy: { level: 'asc' }
      });

      const rolesResponse = roles.map(role => ({
        ...role,
        permissions: JSON.parse(role.permissions)
      }));

      return {
        success: true,
        data: { roles: rolesResponse }
      };
    } catch (error) {
      logger.error('Error in listRoles:', error);
      throw error;
    }
  }

  /**
   * Verifica se usuário tem uma permissão específica
   */
  async hasPermission(userId, permission) {
    try {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { role: true }
      });

      if (!user || !user.isActive) {
        return { success: false, hasPermission: false };
      }

      const permissions = JSON.parse(user.role.permissions);
      const hasPermission = permissions.includes(permission) || permissions.includes('*');

      return {
        success: true,
        hasPermission,
        userRole: user.role.name
      };
    } catch (error) {
      logger.error('Error in hasPermission:', error);
      return { success: false, hasPermission: false };
    }
  }

  /**
   * Gera token de recuperação de senha
   */
  async generatePasswordResetToken(email) {
    try {
      const user = await prisma.user.findUnique({
        where: { email }
      });

      if (!user) {
        // Por segurança, não revelamos se o email existe
        return { success: true, message: 'Se o email existir, um token foi enviado' };
      }

      const token = crypto.randomBytes(32).toString('hex');
      const expiresAt = new Date();
      expiresAt.setHours(expiresAt.getHours() + 1); // 1 hora

      // Em um sistema real, isso seria salvo em uma tabela específica
      // Por enquanto, vamos simular
      logger.info('Password reset token generated', {
        userId: user.id,
        email: user.email,
        token,
        expiresAt
      });

      return {
        success: true,
        data: { token, expiresAt },
        message: 'Token de recuperação gerado'
      };
    } catch (error) {
      logger.error('Error in generatePasswordResetToken:', error);
      throw error;
    }
  }

  /**
   * Obtém estatísticas de autenticação
   */
  async getAuthStats() {
    try {
      const totalUsers = await prisma.user.count();
      const activeUsers = await prisma.user.count({ where: { isActive: true } });
      const activeSessions = await prisma.session.count({
        where: { expiresAt: { gt: new Date() } }
      });

      const usersByRole = await prisma.userRole.findMany({
        include: {
          _count: {
            select: { users: true }
          }
        }
      });

      // Últimos logins (últimas 24h)
      const yesterday = new Date();
      yesterday.setDate(yesterday.getDate() - 1);

      const recentLogins = await prisma.user.count({
        where: {
          lastLogin: { gte: yesterday }
        }
      });

      return {
        success: true,
        data: {
          totalUsers,
          activeUsers,
          inactiveUsers: totalUsers - activeUsers,
          activeSessions,
          recentLogins,
          usersByRole: usersByRole.map(role => ({
            role: role.name,
            count: role._count.users,
            level: role.level
          }))
        }
      };
    } catch (error) {
      logger.error('Error in getAuthStats:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Limpa sessões antigas do usuário
   */
  async _cleanupOldSessions(userId) {
    try {
      // Manter apenas as 10 sessões mais recentes
      const oldSessions = await prisma.session.findMany({
        where: { userId },
        orderBy: { createdAt: 'desc' },
        skip: 10
      });

      if (oldSessions.length > 0) {
        await prisma.session.deleteMany({
          where: {
            id: { in: oldSessions.map(s => s.id) }
          }
        });
      }
    } catch (error) {
      logger.error('Error cleaning up old sessions:', error);
    }
  }

  /**
   * Inicializa dados padrão do sistema
   */
  async initializeDefaultData() {
    try {
      // Verificar se já existem dados
      const existingRoles = await prisma.userRole.count();
      if (existingRoles > 0) {
        return { success: true, message: 'Dados já inicializados' };
      }

      // Criar roles padrão
      const adminRole = await prisma.userRole.create({
        data: {
          name: 'Admin',
          description: 'Administrador do sistema',
          level: 1,
          permissions: JSON.stringify(['*']), // Todas as permissões
          canCreateUsers: true,
          canManageRoles: true,
          canViewAuditLogs: true
        }
      });

      const managerRole = await prisma.userRole.create({
        data: {
          name: 'Manager',
          description: 'Gerente de vendas',
          level: 2,
          permissions: JSON.stringify([
            'leads.read', 'leads.write', 'leads.delete',
            'opportunities.read', 'opportunities.write',
            'reports.read', 'crm.read', 'ai.read'
          ]),
          canCreateUsers: false,
          canManageRoles: false,
          canViewAuditLogs: true
        }
      });

      const userRole = await prisma.userRole.create({
        data: {
          name: 'User',
          description: 'Usuário padrão',
          level: 3,
          permissions: JSON.stringify([
            'leads.read', 'leads.write',
            'opportunities.read',
            'crm.read'
          ]),
          canCreateUsers: false,
          canManageRoles: false,
          canViewAuditLogs: false
        }
      });

      // Criar usuário admin padrão
      const adminPassword = await bcrypt.hash('admin123', 12);
      await prisma.user.create({
        data: {
          name: 'Administrador',
          email: 'admin@ferraco.com',
          password: adminPassword,
          roleId: adminRole.id,
          preferences: JSON.stringify({
            theme: 'light',
            language: 'pt-BR',
            notifications: true
          })
        }
      });

      logger.info('Default authentication data initialized successfully');

      return {
        success: true,
        message: 'Dados padrão inicializados',
        data: {
          roles: [adminRole, managerRole, userRole],
          defaultAdmin: {
            email: 'admin@ferraco.com',
            password: 'admin123'
          }
        }
      };
    } catch (error) {
      logger.error('Error in initializeDefaultData:', error);
      throw error;
    }
  }
}

module.exports = new AuthService();