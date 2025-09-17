const permissionService = require('../services/permissionService');
const logger = require('../utils/logger');

/**
 * Permission Controller
 * Controlador para gerenciamento granular de permissões
 */
class PermissionController {
  /**
   * Lista todas as permissões disponíveis
   */
  async listPermissions(req, res) {
    try {
      const {
        category,
        level,
        isActive,
        includeCustom,
        includeSystem,
        page,
        limit
      } = req.query;

      const result = await permissionService.listPermissions({
        category,
        level,
        isActive: isActive !== undefined ? isActive === 'true' : undefined,
        includeCustom: includeCustom !== undefined ? includeCustom === 'true' : true,
        includeSystem: includeSystem !== undefined ? includeSystem === 'true' : true,
        page: parseInt(page) || 1,
        limit: parseInt(limit) || 50
      });

      logger.info('Permissions listed', {
        requestedBy: req.user.id,
        filters: { category, level, isActive, includeCustom, includeSystem },
        resultCount: result.data.permissions.length
      });

      res.status(200).json({
        success: true,
        message: 'Permissões recuperadas com sucesso',
        data: result.data,
        pagination: result.pagination
      });

    } catch (error) {
      logger.error('Error listing permissions:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao listar permissões',
        error: error.message
      });
    }
  }

  /**
   * Cria uma nova permissão customizada
   */
  async createPermission(req, res) {
    try {
      const { name, description, category, level } = req.body;

      if (!name || !description || !category || !level) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const result = await permissionService.createPermission({
        name,
        description,
        category,
        level,
        createdBy: req.user.id
      });

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
          error: result.code
        });
      }

      logger.info('Permission created', {
        requestedBy: req.user.id,
        permissionName: name,
        category,
        level
      });

      res.status(201).json({
        success: true,
        message: 'Permissão criada com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error creating permission:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao criar permissão',
        error: error.message
      });
    }
  }

  /**
   * Atribui permissões a um usuário
   */
  async assignPermissionsToUser(req, res) {
    try {
      const { userId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissões devem ser fornecidas como array',
          error: 'INVALID_PERMISSIONS_FORMAT'
        });
      }

      const result = await permissionService.assignPermissionsToUser(
        userId,
        permissions,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
          error: result.code,
          details: result.details
        });
      }

      logger.info('Permissions assigned to user', {
        requestedBy: req.user.id,
        targetUserId: userId,
        permissionsCount: result.data.assignedCount
      });

      res.status(200).json({
        success: true,
        message: 'Permissões atribuídas ao usuário com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error assigning permissions to user:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao atribuir permissões ao usuário',
        error: error.message
      });
    }
  }

  /**
   * Atribui permissões a um role
   */
  async assignPermissionsToRole(req, res) {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;

      if (!Array.isArray(permissions)) {
        return res.status(400).json({
          success: false,
          message: 'Permissões devem ser fornecidas como array',
          error: 'INVALID_PERMISSIONS_FORMAT'
        });
      }

      const result = await permissionService.assignPermissionsToRole(
        roleId,
        permissions,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
          error: result.code,
          details: result.details
        });
      }

      logger.info('Permissions assigned to role', {
        requestedBy: req.user.id,
        targetRoleId: roleId,
        permissionsCount: result.data.assignedCount
      });

      res.status(200).json({
        success: true,
        message: 'Permissões atribuídas ao role com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error assigning permissions to role:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao atribuir permissões ao role',
        error: error.message
      });
    }
  }

  /**
   * Obtém permissões de um usuário
   */
  async getUserPermissions(req, res) {
    try {
      const { userId } = req.params;

      const result = await permissionService.getUserPermissions(userId);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
          error: result.code
        });
      }

      logger.info('User permissions retrieved', {
        requestedBy: req.user.id,
        targetUserId: userId,
        permissionsCount: result.data.permissions.length
      });

      res.status(200).json({
        success: true,
        message: 'Permissões do usuário recuperadas com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error getting user permissions:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar permissões do usuário',
        error: error.message
      });
    }
  }

  /**
   * Verifica se um usuário tem uma permissão específica
   */
  async checkUserPermission(req, res) {
    try {
      const { userId } = req.params;
      const { permission } = req.query;

      if (!permission) {
        return res.status(400).json({
          success: false,
          message: 'Permissão é obrigatória',
          error: 'MISSING_PERMISSION'
        });
      }

      const result = await permissionService.checkUserPermission(userId, permission);

      if (!result.success) {
        return res.status(404).json({
          success: false,
          message: result.error,
          error: result.code
        });
      }

      logger.info('User permission checked', {
        requestedBy: req.user.id,
        targetUserId: userId,
        permission,
        hasPermission: result.hasPermission
      });

      res.status(200).json({
        success: true,
        message: 'Verificação de permissão concluída',
        data: {
          userId,
          permission,
          hasPermission: result.hasPermission,
          reason: result.reason
        }
      });

    } catch (error) {
      logger.error('Error checking user permission:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao verificar permissão do usuário',
        error: error.message
      });
    }
  }

  /**
   * Cria template de permissões
   */
  async createPermissionTemplate(req, res) {
    try {
      const { name, description, permissions, roleLevel } = req.body;

      if (!name || !description || !Array.isArray(permissions) || !roleLevel) {
        return res.status(400).json({
          success: false,
          message: 'Todos os campos são obrigatórios',
          error: 'MISSING_REQUIRED_FIELDS'
        });
      }

      const result = await permissionService.createPermissionTemplate({
        name,
        description,
        permissions,
        roleLevel,
        createdBy: req.user.id
      });

      logger.info('Permission template created', {
        requestedBy: req.user.id,
        templateName: name,
        roleLevel,
        permissionsCount: permissions.length
      });

      res.status(201).json({
        success: true,
        message: 'Template de permissões criado com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error creating permission template:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao criar template de permissões',
        error: error.message
      });
    }
  }

  /**
   * Aplica template de permissões a um role
   */
  async applyPermissionTemplate(req, res) {
    try {
      const { roleId } = req.params;
      const { templateId } = req.body;

      if (!templateId) {
        return res.status(400).json({
          success: false,
          message: 'ID do template é obrigatório',
          error: 'MISSING_TEMPLATE_ID'
        });
      }

      const result = await permissionService.applyPermissionTemplate(
        roleId,
        templateId,
        req.user.id
      );

      if (!result.success) {
        return res.status(400).json({
          success: false,
          message: result.error,
          error: result.code
        });
      }

      logger.info('Permission template applied to role', {
        requestedBy: req.user.id,
        roleId,
        templateId,
        assignedCount: result.data.assignedCount
      });

      res.status(200).json({
        success: true,
        message: 'Template aplicado ao role com sucesso',
        data: result.data
      });

    } catch (error) {
      logger.error('Error applying permission template:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao aplicar template ao role',
        error: error.message
      });
    }
  }

  /**
   * Dashboard de permissões (resumo executivo)
   */
  async getPermissionsDashboard(req, res) {
    try {
      // Obter dados do dashboard em paralelo
      const [permissionsResult] = await Promise.all([
        permissionService.listPermissions({ page: 1, limit: 1000 })
      ]);

      const permissions = permissionsResult.data.permissions;

      // Calcular estatísticas
      const stats = {
        total: permissions.length,
        system: permissions.filter(p => p.isSystem).length,
        custom: permissions.filter(p => p.isCustom).length,
        byCategory: this._groupByCategory(permissions),
        byLevel: this._groupByLevel(permissions)
      };

      const dashboard = {
        stats,
        categories: permissionsResult.data.categories,
        levels: permissionsResult.data.levels,
        recentPermissions: permissions
          .filter(p => p.isCustom)
          .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
          .slice(0, 5),
        recommendations: this._generatePermissionRecommendations(stats),
        lastUpdated: new Date().toISOString()
      };

      logger.info('Permissions dashboard retrieved', {
        requestedBy: req.user.id,
        totalPermissions: stats.total
      });

      res.status(200).json({
        success: true,
        message: 'Dashboard de permissões recuperado com sucesso',
        data: dashboard
      });

    } catch (error) {
      logger.error('Error getting permissions dashboard:', error);

      res.status(500).json({
        success: false,
        message: 'Erro ao recuperar dashboard de permissões',
        error: error.message
      });
    }
  }

  // ==========================================
  // MÉTODOS PRIVADOS
  // ==========================================

  /**
   * Agrupa permissões por categoria
   */
  _groupByCategory(permissions) {
    return permissions.reduce((acc, permission) => {
      const category = permission.category || 'uncategorized';
      acc[category] = (acc[category] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Agrupa permissões por nível
   */
  _groupByLevel(permissions) {
    return permissions.reduce((acc, permission) => {
      const level = permission.level || 'unknown';
      acc[level] = (acc[level] || 0) + 1;
      return acc;
    }, {});
  }

  /**
   * Gera recomendações baseadas nas estatísticas
   */
  _generatePermissionRecommendations(stats) {
    const recommendations = [];

    // Recomendação sobre permissões customizadas
    if (stats.custom === 0) {
      recommendations.push({
        type: 'setup',
        priority: 'low',
        message: 'Considere criar permissões customizadas para necessidades específicas do seu negócio'
      });
    }

    // Recomendação sobre balanceamento
    if (stats.custom > stats.system * 2) {
      recommendations.push({
        type: 'organization',
        priority: 'medium',
        message: 'Muitas permissões customizadas. Considere revisar e consolidar permissões similares'
      });
    }

    // Recomendação sobre categorização
    const uncategorized = stats.byCategory.uncategorized || 0;
    if (uncategorized > 0) {
      recommendations.push({
        type: 'organization',
        priority: 'medium',
        message: `${uncategorized} permissões sem categoria. Considere organizá-las para melhor gestão`
      });
    }

    return recommendations;
  }
}

module.exports = new PermissionController();