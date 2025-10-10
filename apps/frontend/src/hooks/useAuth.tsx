import { logger } from '@/lib/logger';
import type { User } from '@ferraco/shared';

export type AuthContextType = {
  user: User | null;
  isAuthenticated: boolean;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  checkAuth: () => Promise<void>;
  updateUser: (userData: Partial<User>) => Promise<void>;
};

/**
 * Custom hook for authentication (stub - sem backend)
 */
export const useAuth = (): AuthContextType => {
  const user: User = {
    id: 'demo',
    name: 'Demo User',
    username: 'demo',
    email: 'demo@ferraco.com',
    role: 'admin',
    permissions: ['admin:read', 'admin:write', 'leads:read', 'leads:write', 'tags:read', 'tags:write', 'notes:read', 'notes:write'],
    isActive: true,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  return {
    user,
    isAuthenticated: true,
    token: 'demo-token',
    login: async () => {
      logger.info('Login stub called');
    },
    logout: () => {
      logger.info('Logout stub called');
    },
    refreshToken: async () => {
      logger.info('Refresh token stub called');
    },
    checkAuth: async () => {
      logger.info('Check auth stub called');
    },
    updateUser: async (userData: Partial<User>) => {
      logger.info('Update user stub called', { userData });
    },
  };
};

/**
 * Hook for checking specific permissions
 */
export const usePermissions = () => {
  const { user, isAuthenticated } = useAuth();

  const hasPermission = (permission: string): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return user.permissions.includes(permission);
  };

  const hasRole = (role: string | string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    const roles = Array.isArray(role) ? role : [role];
    return roles.includes(user.role);
  };

  const hasAnyPermission = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return permissions.some(permission => user.permissions.includes(permission));
  };

  const hasAllPermissions = (permissions: string[]): boolean => {
    if (!isAuthenticated || !user) {
      return false;
    }
    return permissions.every(permission => user.permissions.includes(permission));
  };

  const isAdmin = (): boolean => {
    return hasRole('admin');
  };

  const isSales = (): boolean => {
    return hasRole('sales');
  };

  const isConsultant = (): boolean => {
    return hasRole('consultant');
  };

  const canRead = (resource: string): boolean => {
    return hasPermission(`${resource}:read`);
  };

  const canWrite = (resource: string): boolean => {
    return hasPermission(`${resource}:write`);
  };

  const canManage = (resource: string): boolean => {
    return hasAllPermissions([`${resource}:read`, `${resource}:write`]);
  };

  return {
    user,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions,
    isAdmin,
    isSales,
    isConsultant,
    canRead,
    canWrite,
    canManage,
    permissions: {
      canReadLeads: canRead('leads'),
      canWriteLeads: canWrite('leads'),
      canManageLeads: canManage('leads'),
      canReadTags: canRead('tags'),
      canWriteTags: canWrite('tags'),
      canManageTags: canManage('tags'),
      canReadNotes: canRead('notes'),
      canWriteNotes: canWrite('notes'),
      canManageNotes: canManage('notes'),
      canReadAdmin: canRead('admin'),
      canWriteAdmin: canWrite('admin'),
      canManageAdmin: canManage('admin'),
    }
  };
};

/**
 * Hook for role-based access control
 */
export const useRoleAccess = () => {
  const { user, isAuthenticated } = useAuth();

  const getRoleLevel = (): number => {
    if (!isAuthenticated || !user) return 0;

    switch (user.role) {
      case 'admin':
        return 3;
      case 'sales':
        return 2;
      case 'consultant':
        return 1;
      default:
        return 0;
    }
  };

  const hasMinimumRole = (minimumRole: string): boolean => {
    const roleHierarchy = {
      'consultant': 1,
      'sales': 2,
      'admin': 3
    };

    const userLevel = getRoleLevel();
    const requiredLevel = roleHierarchy[minimumRole as keyof typeof roleHierarchy] || 0;

    return userLevel >= requiredLevel;
  };

  const getRoleDisplayName = (): string => {
    if (!isAuthenticated || !user) return 'Visitante';

    switch (user.role) {
      case 'admin':
        return 'Administrador';
      case 'sales':
        return 'Vendedor';
      case 'consultant':
        return 'Consultor';
      default:
        return 'Usuário';
    }
  };

  const getRoleColor = (): string => {
    if (!isAuthenticated || !user) return 'gray';

    switch (user.role) {
      case 'admin':
        return 'red';
      case 'sales':
        return 'blue';
      case 'consultant':
        return 'green';
      default:
        return 'gray';
    }
  };

  return {
    user,
    isAuthenticated,
    roleLevel: getRoleLevel(),
    hasMinimumRole,
    displayName: getRoleDisplayName(),
    roleColor: getRoleColor(),
  };
};

/**
 * Hook for session management
 */
export const useSession = () => {
  const { user, isAuthenticated, logout } = useAuth();

  return {
    user,
    isAuthenticated,
    sessionInfo: {
      isValid: true,
      expiresAt: null,
      timeUntilExpiration: null,
      isExpiringSoon: false,
    },
    extendSession: async () => true,
    validateSession: async () => true,
    logout,
  };
};

export default useAuth;
