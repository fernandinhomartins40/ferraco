const { PrismaClient } = require('@prisma/client');
const logger = require('../utils/logger');

const prisma = new PrismaClient();

/**
 * Permission Service
 * Serviço para gerenciamento granular de permissões
 */
class PermissionService {
  constructor() {
    this.permissionCache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutos

    // Definir permissões padrão do sistema
    this.systemPermissions = new Map([
      // Permissões de usuários
      ['users.create', { description: 'Criar usuários', category: 'users', level: 'write' }],
      ['users.read', { description: 'Visualizar usuários', category: 'users', level: 'read' }],
      ['users.update', { description: 'Editar usuários', category: 'users', level: 'write' }],
      ['users.delete', { description: 'Deletar usuários', category: 'users', level: 'delete' }],
      ['users.manage_roles', { description: 'Gerenciar roles de usuários', category: 'users', level: 'admin' }],

      // Permissões de leads
      ['leads.create', { description: 'Criar leads', category: 'leads', level: 'write' }],
      ['leads.read', { description: 'Visualizar leads', category: 'leads', level: 'read' }],
      ['leads.update', { description: 'Editar leads', category: 'leads', level: 'write' }],
      ['leads.delete', { description: 'Deletar leads', category: 'leads', level: 'delete' }],
      ['leads.export', { description: 'Exportar leads', category: 'leads', level: 'read' }],
      ['leads.import', { description: 'Importar leads', category: 'leads', level: 'write' }],
      ['leads.assign', { description: 'Atribuir leads', category: 'leads', level: 'write' }],

      // Permissões de auditoria
      ['audit.read', { description: 'Visualizar logs de auditoria', category: 'audit', level: 'read' }],
      ['audit.export', { description: 'Exportar logs de auditoria', category: 'audit', level: 'read' }],
      ['audit.cleanup', { description: 'Limpar logs antigos', category: 'audit', level: 'admin' }],

      // Permissões de backup
      ['backup.create', { description: 'Criar backups', category: 'backup', level: 'admin' }],
      ['backup.read', { description: 'Visualizar backups', category: 'backup', level: 'read' }],
      ['backup.restore', { description: 'Restaurar backups', category: 'backup', level: 'admin' }],
      ['backup.delete', { description: 'Deletar backups', category: 'backup', level: 'admin' }],
      ['backup.manage', { description: 'Gerenciar configurações de backup', category: 'backup', level: 'admin' }],

      // Permissões de health checks
      ['health.read', { description: 'Visualizar status de saúde', category: 'health', level: 'read' }],
      ['health.manage', { description: 'Gerenciar health checks', category: 'health', level: 'admin' }],

      // Permissões de sistema
      ['system.settings', { description: 'Alterar configurações do sistema', category: 'system', level: 'admin' }],
      ['system.logs', { description: 'Visualizar logs do sistema', category: 'system', level: 'read' }],
      ['system.maintenance', { description: 'Executar manutenção do sistema', category: 'system', level: 'admin' }],

      // Permissões de relatórios
      ['reports.view', { description: 'Visualizar relatórios', category: 'reports', level: 'read' }],
      ['reports.create', { description: 'Criar relatórios', category: 'reports', level: 'write' }],
      ['reports.export', { description: 'Exportar relatórios', category: 'reports', level: 'read' }],

      // Permissões especiais
      ['*', { description: 'Acesso total (Super Admin)', category: 'special', level: 'super' }]
    ]);
  }

  /**
   * Cria uma nova permissão customizada
   */
  async createPermission(permissionData) {
    try {
      const { name, description, category, level, createdBy } = permissionData;

      // Verificar se a permissão já existe
      const existingPermission = await prisma.permission.findUnique({
        where: { name }
      });

      if (existingPermission) {
        return {
          success: false,
          error: 'Permissão já existe',
          code: 'PERMISSION_EXISTS'
        };
      }

      // Criar permissão
      const permission = await prisma.permission.create({
        data: {
          name,
          description,
          category,
          level,
          isCustom: true,
          isActive: true,
          createdBy
        }
      });

      // Invalidar cache
      this._invalidateCache();

      logger.info('Permission created', {
        permissionId: permission.id,
        name: permission.name,
        createdBy
      });

      return {
        success: true,
        data: { permission }
      };

    } catch (error) {
      logger.error('Error creating permission:', error);
      throw error;
    }
  }

  /**
   * Lista todas as permissões
   */
  async listPermissions(filters = {}) {
    try {
      const {
        category,
        level,
        isActive = true,
        includeCustom = true,
        includeSystem = true,
        page = 1,
        limit = 50
      } = filters;

      const where = {};

      if (category) where.category = category;
      if (level) where.level = level;
      if (isActive !== undefined) where.isActive = isActive;

      // Filtrar por tipo
      if (!includeCustom || !includeSystem) {
        where.isCustom = includeCustom && !includeSystem ? true : false;
      }

      const skip = (page - 1) * limit;

      const permissions = await prisma.permission.findMany({
        where,
        orderBy: [
          { category: 'asc' },
          { name: 'asc' }
        ],
        skip,
        take: parseInt(limit)
      });

      const total = await prisma.permission.count({ where });

      // Incluir permissões do sistema se solicitado
      let allPermissions = [...permissions];

      if (includeSystem) {
        const systemPerms = Array.from(this.systemPermissions.entries()).map(([name, info]) => ({
          id: name,
          name,
          description: info.description,
          category: info.category,
          level: info.level,
          isCustom: false,
          isActive: true,
          isSystem: true
        }));

        // Filtrar permissões do sistema se necessário
        let filteredSystemPerms = systemPerms;

        if (category) {
          filteredSystemPerms = systemPerms.filter(p => p.category === category);
        }

        if (level) {
          filteredSystemPerms = systemPerms.filter(p => p.level === level);
        }

        allPermissions = [...allPermissions, ...filteredSystemPerms];
      }

      return {
        success: true,
        data: {
          permissions: allPermissions,
          categories: this._getCategories(),
          levels: this._getLevels()
        },
        pagination: {
          total: total + (includeSystem ? this.systemPermissions.size : 0),
          page: parseInt(page),
          limit: parseInt(limit),
          pages: Math.ceil((total + (includeSystem ? this.systemPermissions.size : 0)) / limit)
        }
      };

    } catch (error) {
      logger.error('Error listing permissions:', error);
      throw error;
    }
  }

  /**
   * Atribui permissões a um usuário
   */
  async assignPermissionsToUser(userId, permissions, assignedBy) {
    try {
      // Verificar se o usuário existe
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { userPermissions: true }
      });

      if (!user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        };
      }

      // Validar permissões
      const validPermissions = await this._validatePermissions(permissions);

      if (validPermissions.invalid.length > 0) {
        return {
          success: false,
          error: 'Permissões inválidas encontradas',
          code: 'INVALID_PERMISSIONS',
          details: validPermissions.invalid
        };
      }

      // Remover permissões existentes
      await prisma.userPermission.deleteMany({
        where: { userId }
      });

      // Criar novas permissões
      const userPermissions = await Promise.all(
        validPermissions.valid.map(permission =>
          prisma.userPermission.create({
            data: {
              userId,
              permission: permission.name,
              assignedBy,
              assignedAt: new Date()
            }
          })
        )
      );

      // Invalidar cache do usuário
      this._invalidateUserCache(userId);

      logger.info('Permissions assigned to user', {
        userId,
        permissions: validPermissions.valid.map(p => p.name),
        assignedBy
      });

      return {
        success: true,
        data: {
          userPermissions,
          assignedCount: userPermissions.length
        }
      };

    } catch (error) {
      logger.error('Error assigning permissions to user:', error);
      throw error;
    }
  }

  /**
   * Atribui permissões a um role
   */
  async assignPermissionsToRole(roleId, permissions, assignedBy) {
    try {
      // Verificar se o role existe
      const role = await prisma.role.findUnique({
        where: { id: roleId },
        include: { rolePermissions: true }
      });

      if (!role) {
        return {
          success: false,
          error: 'Role não encontrado',
          code: 'ROLE_NOT_FOUND'
        };
      }

      // Validar permissões
      const validPermissions = await this._validatePermissions(permissions);

      if (validPermissions.invalid.length > 0) {
        return {
          success: false,
          error: 'Permissões inválidas encontradas',
          code: 'INVALID_PERMISSIONS',
          details: validPermissions.invalid
        };
      }

      // Remover permissões existentes
      await prisma.rolePermission.deleteMany({
        where: { roleId }
      });

      // Criar novas permissões
      const rolePermissions = await Promise.all(
        validPermissions.valid.map(permission =>
          prisma.rolePermission.create({
            data: {
              roleId,
              permission: permission.name,
              assignedBy,
              assignedAt: new Date()
            }
          })
        )
      );

      // Invalidar cache de todos os usuários com este role
      this._invalidateRoleCache(roleId);

      logger.info('Permissions assigned to role', {
        roleId,
        roleName: role.name,
        permissions: validPermissions.valid.map(p => p.name),
        assignedBy
      });

      return {
        success: true,
        data: {
          rolePermissions,
          assignedCount: rolePermissions.length
        }
      };

    } catch (error) {
      logger.error('Error assigning permissions to role:', error);
      throw error;
    }
  }

  /**
   * Obtém todas as permissões de um usuário (diretas + do role)
   */
  async getUserPermissions(userId) {
    try {
      const cacheKey = `user_permissions_${userId}`;
      const cached = this._getCached(cacheKey);

      if (cached) {
        return cached;
      }

      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: {
          userPermissions: true,
          role: {
            include: {
              rolePermissions: true
            }
          }
        }
      });

      if (!user) {
        return {
          success: false,
          error: 'Usuário não encontrado',
          code: 'USER_NOT_FOUND'
        };
      }

      // Combinar permissões diretas e do role
      const directPermissions = user.userPermissions.map(up => up.permission);
      const rolePermissions = user.role?.rolePermissions?.map(rp => rp.permission) || [];

      const allPermissions = [...new Set([...directPermissions, ...rolePermissions])];

      // Verificar se tem permissão total
      const hasFullAccess = allPermissions.includes('*');

      const result = {
        success: true,
        data: {
          userId,
          permissions: allPermissions,
          directPermissions,
          rolePermissions,
          hasFullAccess,
          role: user.role ? {
            id: user.role.id,
            name: user.role.name,
            level: user.role.level
          } : null
        }
      };

      // Cache por 5 minutos
      this._setCached(cacheKey, result, this.cacheExpiry);

      return result;

    } catch (error) {
      logger.error('Error getting user permissions:', error);
      throw error;
    }
  }

  /**
   * Verifica se um usuário tem uma permissão específica
   */
  async checkUserPermission(userId, permission) {
    try {
      const userPermissions = await this.getUserPermissions(userId);

      if (!userPermissions.success) {
        return {
          success: false,
          hasPermission: false,
          error: userPermissions.error
        };
      }

      const { permissions, hasFullAccess } = userPermissions.data;

      // Se tem acesso total, autorizar tudo
      if (hasFullAccess) {
        return {
          success: true,
          hasPermission: true,
          reason: 'full_access'
        };
      }

      // Verificar permissão específica
      const hasPermission = permissions.includes(permission);

      return {
        success: true,
        hasPermission,
        reason: hasPermission ? 'direct_permission' : 'no_permission'
      };

    } catch (error) {
      logger.error('Error checking user permission:', error);
      throw error;
    }
  }

  /**
   * Cria template de permissões para roles específicos
   */
  async createPermissionTemplate(templateData) {
    try {
      const { name, description, permissions, roleLevel, createdBy } = templateData;

      const template = await prisma.permissionTemplate.create({
        data: {
          name,
          description,
          permissions: JSON.stringify(permissions),
          roleLevel,
          isActive: true,
          createdBy
        }
      });

      logger.info('Permission template created', {
        templateId: template.id,
        name: template.name,
        createdBy
      });

      return {
        success: true,
        data: { template }
      };

    } catch (error) {
      logger.error('Error creating permission template:', error);
      throw error;
    }
  }

  /**
   * Aplica template de permissões a um role
   */
  async applyPermissionTemplate(roleId, templateId, appliedBy) {
    try {
      const template = await prisma.permissionTemplate.findUnique({
        where: { id: templateId }
      });

      if (!template || !template.isActive) {
        return {
          success: false,
          error: 'Template não encontrado ou inativo',
          code: 'TEMPLATE_NOT_FOUND'
        };
      }

      const permissions = JSON.parse(template.permissions);

      const result = await this.assignPermissionsToRole(roleId, permissions, appliedBy);

      if (result.success) {
        logger.info('Permission template applied', {
          roleId,
          templateId,
          templateName: template.name,
          appliedBy
        });
      }

      return result;

    } catch (error) {
      logger.error('Error applying permission template:', error);
      throw error;
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Valida uma lista de permissões
   */
  async _validatePermissions(permissions) {
    const valid = [];
    const invalid = [];

    for (const permission of permissions) {
      const permissionName = typeof permission === 'string' ? permission : permission.name;

      // Verificar se é permissão do sistema
      if (this.systemPermissions.has(permissionName)) {
        valid.push({
          name: permissionName,
          ...this.systemPermissions.get(permissionName),
          isSystem: true
        });
        continue;
      }

      // Verificar se é permissão customizada
      const customPermission = await prisma.permission.findUnique({
        where: { name: permissionName, isActive: true }
      });

      if (customPermission) {
        valid.push({
          name: customPermission.name,
          description: customPermission.description,
          category: customPermission.category,
          level: customPermission.level,
          isSystem: false
        });
      } else {
        invalid.push(permissionName);
      }
    }

    return { valid, invalid };
  }

  /**
   * Obtém categorias de permissões
   */
  _getCategories() {
    const systemCategories = [...new Set(Array.from(this.systemPermissions.values()).map(p => p.category))];
    return [...systemCategories].sort();
  }

  /**
   * Obtém níveis de permissões
   */
  _getLevels() {
    const systemLevels = [...new Set(Array.from(this.systemPermissions.values()).map(p => p.level))];
    return [...systemLevels].sort();
  }

  /**
   * Cache helpers
   */
  _getCached(key) {
    const cached = this.permissionCache.get(key);
    if (cached && Date.now() < cached.expiry) {
      return cached.data;
    }
    this.permissionCache.delete(key);
    return null;
  }

  _setCached(key, data, ttl) {
    this.permissionCache.set(key, {
      data,
      expiry: Date.now() + ttl
    });
  }

  _invalidateCache() {
    this.permissionCache.clear();
  }

  _invalidateUserCache(userId) {
    const keysToDelete = [];
    for (const [key] of this.permissionCache) {
      if (key.includes(`user_permissions_${userId}`)) {
        keysToDelete.push(key);
      }
    }
    keysToDelete.forEach(key => this.permissionCache.delete(key));
  }

  _invalidateRoleCache(roleId) {
    // Invalidar cache de todos os usuários (simplificado)
    this.permissionCache.clear();
  }
}

module.exports = new PermissionService();