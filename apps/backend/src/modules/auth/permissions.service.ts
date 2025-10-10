import { UserRole } from '@prisma/client';
import { prisma } from '../../config/database';
import { Permission, PermissionCheck } from './auth.types';

// ============================================================================
// ROLE PERMISSIONS CONFIGURATION
// ============================================================================

export const ROLE_PERMISSIONS: Record<UserRole, Permission[]> = {
  ADMIN: [
    { resource: 'users', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'notes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tags', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'communications', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'automations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'reports', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'integrations', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'teams', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'audit', actions: ['read'] },
    { resource: 'config', actions: ['read', 'update'] },
    { resource: 'ai', actions: ['create', 'read', 'update', 'delete'] },
  ],

  MANAGER: [
    { resource: 'users', actions: ['read'] },
    { resource: 'leads', actions: ['create', 'read', 'update', 'delete', 'export'] },
    { resource: 'notes', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'tags', actions: ['create', 'read', 'update', 'delete'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['create', 'read', 'update'] },
    { resource: 'automations', actions: ['create', 'read', 'update'] },
    { resource: 'reports', actions: ['create', 'read', 'export'] },
    { resource: 'integrations', actions: ['read'] },
    { resource: 'teams', actions: ['read', 'update'] },
    { resource: 'ai', actions: ['read', 'update'] },
  ],

  SALES: [
    { resource: 'leads', actions: ['create', 'read', 'update'] },
    { resource: 'notes', actions: ['create', 'read', 'update'] },
    { resource: 'tags', actions: ['read', 'update'] },
    { resource: 'pipeline', actions: ['read', 'update'] },
    { resource: 'communications', actions: ['create', 'read'] },
    { resource: 'reports', actions: ['read'] },
    { resource: 'ai', actions: ['read'] },
  ],

  CONSULTANT: [
    { resource: 'leads', actions: ['read'] },
    { resource: 'notes', actions: ['read'] },
    { resource: 'tags', actions: ['read'] },
    { resource: 'pipeline', actions: ['read'] },
    { resource: 'communications', actions: ['read'] },
    { resource: 'ai', actions: ['read'] },
  ],

  SUPPORT: [
    { resource: 'leads', actions: ['read'] },
    { resource: 'notes', actions: ['create', 'read'] },
    { resource: 'communications', actions: ['create', 'read'] },
    { resource: 'ai', actions: ['read'] },
  ],
};

// ============================================================================
// PERMISSIONS SERVICE
// ============================================================================

export class PermissionsService {
  /**
   * Get role-based permissions
   */
  getRolePermissions(role: UserRole): string[] {
    const permissions = ROLE_PERMISSIONS[role] || [];
    return permissions.flatMap(p =>
      p.actions.map(action => `${p.resource}:${action}`)
    );
  }

  /**
   * Get user permissions (role + custom)
   */
  async getUserPermissions(userId: string): Promise<string[]> {
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: {
        permissions: true,
      },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Base role permissions
    const rolePermissions = this.getRolePermissions(user.role);

    // Custom permissions from database
    const customPermissions = user.permissions.flatMap((p: { resource: string; actions: string }) => {
      try {
        const actions = JSON.parse(p.actions) as string[];
        return actions.map((action: string) => `${p.resource}:${action}`);
      } catch {
        return [];
      }
    });

    // Combine and deduplicate
    const allPermissions = new Set([...rolePermissions, ...customPermissions]);
    return Array.from(allPermissions);
  }

  /**
   * Check if user has specific permission
   */
  async hasPermission(userId: string, resource: string, action: string): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);
    const requiredPermission = `${resource}:${action}`;

    return permissions.includes(requiredPermission) ||
           permissions.includes(`${resource}:*`) ||
           permissions.includes('*:*');
  }

  /**
   * Check if user has all permissions (AND)
   */
  async hasAllPermissions(userId: string, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    return checks.every(check => {
      const requiredPermission = `${check.resource}:${check.action}`;
      return permissions.includes(requiredPermission) ||
             permissions.includes(`${check.resource}:*`) ||
             permissions.includes('*:*');
    });
  }

  /**
   * Check if user has any permission (OR)
   */
  async hasAnyPermission(userId: string, checks: PermissionCheck[]): Promise<boolean> {
    const permissions = await this.getUserPermissions(userId);

    return checks.some(check => {
      const requiredPermission = `${check.resource}:${check.action}`;
      return permissions.includes(requiredPermission) ||
             permissions.includes(`${check.resource}:*`) ||
             permissions.includes('*:*');
    });
  }

  /**
   * Add custom permission to user
   */
  async addCustomPermission(
    userId: string,
    resource: string,
    actions: string[]
  ): Promise<void> {
    await prisma.userPermission.upsert({
      where: {
        userId_resource: {
          userId,
          resource,
        },
      },
      update: {
        actions: JSON.stringify(actions),
      },
      create: {
        userId,
        resource,
        actions: JSON.stringify(actions),
      },
    });
  }

  /**
   * Remove custom permission from user
   */
  async removeCustomPermission(userId: string, resource: string): Promise<void> {
    await prisma.userPermission.deleteMany({
      where: {
        userId,
        resource,
      },
    });
  }

  /**
   * Get all available system permissions
   */
  getAllSystemPermissions(): Permission[] {
    const allPermissions = Object.values(ROLE_PERMISSIONS).flat();
    const uniquePermissions = new Map<string, Set<string>>();

    allPermissions.forEach(p => {
      if (!uniquePermissions.has(p.resource)) {
        uniquePermissions.set(p.resource, new Set());
      }
      p.actions.forEach(action => {
        uniquePermissions.get(p.resource)!.add(action);
      });
    });

    return Array.from(uniquePermissions.entries()).map(([resource, actions]) => ({
      resource,
      actions: Array.from(actions),
    }));
  }

  /**
   * Get permissions for multiple roles
   */
  getMultiRolePermissions(roles: UserRole[]): string[] {
    const allPermissions = new Set<string>();

    roles.forEach(role => {
      const rolePerms = this.getRolePermissions(role);
      rolePerms.forEach(perm => allPermissions.add(perm));
    });

    return Array.from(allPermissions);
  }
}

export const permissionsService = new PermissionsService();
