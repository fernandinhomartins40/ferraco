import { logger } from '@/lib/logger';
import type { User } from '@ferraco/shared';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import apiClient from '@/lib/apiClient';

const API_URL = '/api/auth';

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

interface AuthStore {
  user: User | null;
  token: string | null;
  refreshToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuth: (user: User, token: string, refreshToken: string) => void;
  clearAuth: () => void;
  setLoading: (loading: boolean) => void;
  setUser: (user: User) => void;
}

const useAuthStore = create<AuthStore>()(
  persist(
    (set) => ({
      user: null,
      token: null,
      refreshToken: null,
      isAuthenticated: false,
      isLoading: false,

      setAuth: (user, token, refreshToken) => {
        set({
          user,
          token,
          refreshToken,
          isAuthenticated: true,
          isLoading: false,
        });
      },

      clearAuth: () => {
        set({
          user: null,
          token: null,
          refreshToken: null,
          isAuthenticated: false,
          isLoading: false,
        });
      },

      setLoading: (loading) => set({ isLoading: loading }),
      setUser: (user) => set({ user }),
    }),
    {
      name: 'ferraco-auth-storage',
      partialize: (state) => ({
        user: state.user,
        token: state.token,
        refreshToken: state.refreshToken,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);

/**
 * Hook de autenticação com integração real ao backend
 */
export const useAuth = (): AuthContextType => {
  const { user, token, refreshToken: storedRefreshToken, isAuthenticated } = useAuthStore();
  const { setAuth, clearAuth, setUser } = useAuthStore();

  const login = async (email: string, password: string): Promise<void> => {
    try {
      logger.info('Attempting login', { email });

      const response = await apiClient.post(`${API_URL}/login`, { email, password });
      const { user, accessToken, refreshToken } = response.data.data;

      setAuth(user, accessToken, refreshToken);
      logger.info('Login successful', { userId: user.id });
    } catch (error) {
      logger.error('Login failed', { error });
      throw error;
    }
  };

  const logout = (): void => {
    try {
      logger.info('Logging out');
      clearAuth();
    } catch (error) {
      logger.error('Logout error', { error });
    }
  };

  const refreshTokenFn = async (): Promise<void> => {
    if (!storedRefreshToken) {
      logger.warn('No refresh token available');
      clearAuth();
      return;
    }

    try {
      logger.info('Refreshing token');

      const response = await apiClient.post(`${API_URL}/refresh`, {
        refreshToken: storedRefreshToken,
      });

      const { user, accessToken, refreshToken } = response.data.data;
      setAuth(user, accessToken, refreshToken);

      logger.info('Token refreshed successfully');
    } catch (error) {
      logger.error('Token refresh failed', { error });
      clearAuth();
      throw error;
    }
  };

  const checkAuth = async (): Promise<void> => {
    if (!token) {
      logger.debug('No token, user not authenticated');
      clearAuth();
      return;
    }

    try {
      logger.info('Checking authentication');

      const response = await apiClient.get(`${API_URL}/me`);

      setUser(response.data);
      logger.info('Auth check successful');
    } catch (error) {
      logger.error('Auth check failed', { error });

      // Tentar refresh token
      if (storedRefreshToken) {
        try {
          await refreshTokenFn();
        } catch {
          clearAuth();
        }
      } else {
        clearAuth();
      }
    }
  };

  const updateUser = async (userData: Partial<User>): Promise<void> => {
    if (!token) {
      throw new Error('Not authenticated');
    }

    try {
      logger.info('Updating user', { userData });

      const response = await apiClient.put(`${API_URL}/profile`, userData);

      setUser(response.data);
      logger.info('User updated successfully');
    } catch (error) {
      logger.error('User update failed', { error });
      throw error;
    }
  };

  return {
    user,
    isAuthenticated,
    token,
    login,
    logout,
    refreshToken: refreshTokenFn,
    checkAuth,
    updateUser,
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
