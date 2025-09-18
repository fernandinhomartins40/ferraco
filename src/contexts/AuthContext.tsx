import React, { createContext, useContext, useReducer, useEffect, ReactNode, useState } from 'react';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';

// Types
export interface User {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'sales' | 'consultant';
  email: string;
  permissions: string[];
}

export interface AuthState {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

type AuthAction =
  | { type: 'LOGIN_START' }
  | { type: 'LOGIN_SUCCESS'; payload: { user: User; token: string } }
  | { type: 'LOGIN_FAILURE'; payload: string }
  | { type: 'LOGOUT' }
  | { type: 'SET_LOADING'; payload: boolean }
  | { type: 'CLEAR_ERROR' }
  | { type: 'TOKEN_REFRESH'; payload: { user: User; token: string } }
  | { type: 'TOKEN_EXPIRED' };

export interface AuthContextType {
  state: AuthState;
  login: (username: string, password: string, rememberMe?: boolean) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
  clearError: () => void;
  checkAuth: () => Promise<void>;
  // Convenience getters
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  token: string | null;
}

// Storage keys
const TOKEN_STORAGE_KEY = 'ferraco_auth_token';
const USER_STORAGE_KEY = 'ferraco_auth_user';
const REMEMBER_ME_KEY = 'ferraco_remember_me';

// API base URL
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001/api';

// Initial state
const initialState: AuthState = {
  user: null,
  token: null,
  isAuthenticated: false,
  isLoading: true, // Start with loading to check stored auth
  error: null,
};

// Auth reducer
const authReducer = (state: AuthState, action: AuthAction): AuthState => {
  switch (action.type) {
    case 'LOGIN_START':
      return {
        ...state,
        isLoading: true,
        error: null,
      };

    case 'LOGIN_SUCCESS':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'LOGIN_FAILURE':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: action.payload,
      };

    case 'LOGOUT':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: null,
      };

    case 'SET_LOADING':
      return {
        ...state,
        isLoading: action.payload,
      };

    case 'CLEAR_ERROR':
      return {
        ...state,
        error: null,
      };

    case 'TOKEN_REFRESH':
      return {
        ...state,
        user: action.payload.user,
        token: action.payload.token,
        isAuthenticated: true,
        isLoading: false,
        error: null,
      };

    case 'TOKEN_EXPIRED':
      return {
        ...state,
        user: null,
        token: null,
        isAuthenticated: false,
        isLoading: false,
        error: 'Sessão expirada. Faça login novamente.',
      };

    default:
      return state;
  }
};

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Auth Provider component
export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Utility functions for localStorage
  const saveAuthData = (user: User, token: string, rememberMe: boolean = false) => {
    try {
      const storage = rememberMe ? localStorage : sessionStorage;
      storage.setItem(TOKEN_STORAGE_KEY, token);
      storage.setItem(USER_STORAGE_KEY, JSON.stringify(user));

      // Save remember me preference
      if (rememberMe) {
        localStorage.setItem(REMEMBER_ME_KEY, 'true');
      } else {
        localStorage.removeItem(REMEMBER_ME_KEY);
      }

      console.log(`💾 Dados salvos em ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
    } catch (error) {
      console.error('Failed to save auth data to storage:', error);
    }
  };

  const loadAuthData = (): { user: User; token: string; rememberMe: boolean } | null => {
    try {
      // Check if remember me was enabled
      const rememberMe = localStorage.getItem(REMEMBER_ME_KEY) === 'true';

      // Try to load from localStorage first (for remember me), then sessionStorage
      let token = localStorage.getItem(TOKEN_STORAGE_KEY);
      let userStr = localStorage.getItem(USER_STORAGE_KEY);

      if (!token || !userStr) {
        // If not found in localStorage, try sessionStorage
        token = sessionStorage.getItem(TOKEN_STORAGE_KEY);
        userStr = sessionStorage.getItem(USER_STORAGE_KEY);
      }

      if (token && userStr) {
        const user = JSON.parse(userStr);
        console.log(`📱 Dados carregados de ${rememberMe ? 'localStorage' : 'sessionStorage'}`);
        return { user, token, rememberMe };
      }
    } catch (error) {
      console.error('Failed to load auth data from storage:', error);
    }
    return null;
  };

  const clearAuthData = () => {
    try {
      // Clear from both storages
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      localStorage.removeItem(USER_STORAGE_KEY);
      localStorage.removeItem(REMEMBER_ME_KEY);
      sessionStorage.removeItem(TOKEN_STORAGE_KEY);
      sessionStorage.removeItem(USER_STORAGE_KEY);
      console.log('🗑️ Dados de autenticação limpos');
    } catch (error) {
      console.error('Failed to clear auth data from storage:', error);
    }
  };

  // API call function
  const apiCall = async (endpoint: string, options: RequestInit = {}) => {
    const url = `${API_BASE_URL}${endpoint}`;

    const config: RequestInit = {
      headers: {
        'Content-Type': 'application/json',
        ...options.headers,
      },
      ...options,
    };

    // Add token to headers if available
    if (state.token && !endpoint.includes('/auth/login')) {
      config.headers = {
        ...config.headers,
        'Authorization': `Bearer ${state.token}`,
      };
    }

    const response = await fetch(url, config);

    if (!response.ok) {
      if (response.status === 401) {
        // Token expired or invalid
        dispatch({ type: 'TOKEN_EXPIRED' });
        clearAuthData();
        throw new Error('Sessão expirada. Faça login novamente.');
      }

      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP ${response.status}: ${response.statusText}`);
    }

    return response.json();
  };

  // Login function
  const login = async (username: string, password: string, rememberMe: boolean = false): Promise<void> => {
    dispatch({ type: 'LOGIN_START' });

    try {
      const response = await apiCall('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: username, password }),
      });

      if (response.success && response.data) {
        const { user, token } = response.data;

        // Save to storage (localStorage if rememberMe, sessionStorage otherwise)
        saveAuthData(user, token, rememberMe);

        // Update state
        dispatch({
          type: 'LOGIN_SUCCESS',
          payload: { user, token }
        });

        console.log(`✅ Login bem-sucedido: ${user.name} (${user.role}) - Remember me: ${rememberMe}`);

        // Log successful login
        securityLogger.logAuthentication(
          SecurityEventType.LOGIN_SUCCESS,
          user.id,
          user.username,
          {
            role: user.role,
            rememberMe,
            loginTime: new Date().toISOString()
          }
        );
      } else {
        throw new Error(response.message || 'Credenciais inválidas');
      }
    } catch (error: any) {
      console.error('❌ Erro no login:', error);

      // Log failed login attempt
      securityLogger.logAuthentication(
        SecurityEventType.LOGIN_FAILED,
        undefined,
        username,
        {
          error: error.message,
          attempt: 'invalid_credentials',
          timestamp: new Date().toISOString()
        }
      );

      dispatch({
        type: 'LOGIN_FAILURE',
        payload: error.message || 'Erro no login. Tente novamente.'
      });
      throw error;
    }
  };

  // Logout function
  const logout = () => {
    const currentUser = state.user;

    // Call logout endpoint (optional, since JWT is stateless)
    if (state.token) {
      apiCall('/auth/logout', { method: 'POST' })
        .catch(error => console.warn('Logout endpoint failed:', error));
    }

    // Log logout event
    securityLogger.logAuthentication(
      SecurityEventType.LOGOUT,
      currentUser?.id,
      currentUser?.username,
      {
        logoutTime: new Date().toISOString(),
        reason: 'user_initiated'
      }
    );

    // Clear data
    clearAuthData();
    dispatch({ type: 'LOGOUT' });

    console.log('👋 Logout realizado');
  };

  // Refresh token / verify current session
  const refreshToken = async (): Promise<void> => {
    if (!state.token) {
      throw new Error('Nenhum token disponível para renovar');
    }

    try {
      const response = await apiCall('/auth/me');

      if (response.success && response.data) {
        const user = response.data.user;

        // Update user data but keep same token
        saveAuthData(user, state.token);
        dispatch({
          type: 'TOKEN_REFRESH',
          payload: { user, token: state.token }
        });
      } else {
        throw new Error('Falha ao renovar sessão');
      }
    } catch (error: any) {
      console.error('❌ Erro ao renovar token:', error);
      dispatch({ type: 'TOKEN_EXPIRED' });
      clearAuthData();
      throw error;
    }
  };

  // Check authentication on app start
  const checkAuth = async (): Promise<void> => {
    dispatch({ type: 'SET_LOADING', payload: true });

    try {
      const authData = loadAuthData();

      if (!authData) {
        // No stored auth data
        dispatch({ type: 'SET_LOADING', payload: false });
        return;
      }

      // Verify token with backend
      const response = await fetch(`${API_BASE_URL}/auth/verify-token`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ token: authData.token }),
      });

      if (response.ok) {
        const result = await response.json();

        if (result.success && result.data && result.data.valid) {
          // Token is still valid
          dispatch({
            type: 'LOGIN_SUCCESS',
            payload: {
              user: result.data.user || authData.user,
              token: authData.token
            }
          });
          console.log('✅ Sessão restaurada automaticamente');
        } else {
          // Token is invalid
          clearAuthData();
          dispatch({ type: 'SET_LOADING', payload: false });
        }
      } else {
        // Token verification failed
        clearAuthData();
        dispatch({ type: 'SET_LOADING', payload: false });
      }
    } catch (error) {
      console.error('❌ Erro ao verificar autenticação:', error);
      clearAuthData();
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  };

  // Clear error function
  const clearError = () => {
    dispatch({ type: 'CLEAR_ERROR' });
  };

  // Initialize auth on mount
  useEffect(() => {
    checkAuth();
  }, []);

  // Auto-logout on token expiration (optional - JWT handles this)
  useEffect(() => {
    if (state.token) {
      try {
        // Decode JWT to check expiration
        const payload = JSON.parse(atob(state.token.split('.')[1]));
        const expirationTime = payload.exp * 1000; // Convert to milliseconds
        const currentTime = Date.now();
        const timeUntilExpiration = expirationTime - currentTime;

        if (timeUntilExpiration <= 0) {
          // Token is already expired
          logout();
        } else {
          // Set timeout to logout when token expires
          const timeoutId = setTimeout(() => {
            dispatch({ type: 'TOKEN_EXPIRED' });
            clearAuthData();
          }, timeUntilExpiration);

          return () => clearTimeout(timeoutId);
        }
      } catch (error) {
        console.error('Error parsing JWT token:', error);
      }
    }
  }, [state.token]);

  // Context value
  const contextValue: AuthContextType = {
    state,
    login,
    logout,
    refreshToken,
    clearError,
    checkAuth,
    // Convenience getters
    user: state.user,
    isAuthenticated: state.isAuthenticated,
    isLoading: state.isLoading,
    error: state.error,
    token: state.token,
  };

  return (
    <AuthContext.Provider value={contextValue}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuthContext = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};