import { useAuthContext, type User, type AuthContextType } from '@/contexts/AuthContext';

/**
 * Custom hook for authentication
 * Provides easy access to auth state and methods
 */
export const useAuth = (): AuthContextType => {
  return useAuthContext();
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
    // Common permission checks
    permissions: {
      // Leads
      canReadLeads: canRead('leads'),
      canWriteLeads: canWrite('leads'),
      canManageLeads: canManage('leads'),

      // Tags
      canReadTags: canRead('tags'),
      canWriteTags: canWrite('tags'),
      canManageTags: canManage('tags'),

      // Notes
      canReadNotes: canRead('notes'),
      canWriteNotes: canWrite('notes'),
      canManageNotes: canManage('notes'),

      // Admin
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
  const { user, isAuthenticated, token, refreshToken, logout, checkAuth } = useAuth();

  const getSessionInfo = () => {
    if (!token) {
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiration: null,
        isExpiringSoon: false,
      };
    }

    try {
      // Decode JWT to get expiration
      const payload = JSON.parse(atob(token.split('.')[1]));
      const expiresAt = new Date(payload.exp * 1000);
      const now = new Date();
      const timeUntilExpiration = expiresAt.getTime() - now.getTime();
      const isExpiringSoon = timeUntilExpiration < 5 * 60 * 1000; // 5 minutes

      return {
        isValid: timeUntilExpiration > 0,
        expiresAt,
        timeUntilExpiration,
        isExpiringSoon,
      };
    } catch (error) {
      console.error('Error parsing token:', error);
      return {
        isValid: false,
        expiresAt: null,
        timeUntilExpiration: null,
        isExpiringSoon: false,
      };
    }
  };

  const extendSession = async () => {
    try {
      await refreshToken();
      return true;
    } catch (error) {
      console.error('Failed to extend session:', error);
      return false;
    }
  };

  const validateSession = async () => {
    try {
      await checkAuth();
      return true;
    } catch (error) {
      console.error('Session validation failed:', error);
      return false;
    }
  };

  return {
    user,
    isAuthenticated,
    sessionInfo: getSessionInfo(),
    extendSession,
    validateSession,
    logout,
  };
};

export default useAuth;