import type { User } from '@ferraco/shared';

/**
 * Utility functions for authentication and authorization
 */

/**
 * Check if a user has a specific permission
 */
export const hasPermission = (user: User | null, permission: string): boolean => {
  if (!user) return false;
  return user.permissions.includes(permission);
};

/**
 * Check if a user has any of the specified permissions
 */
export const hasAnyPermission = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.some(permission => user.permissions.includes(permission));
};

/**
 * Check if a user has all of the specified permissions
 */
export const hasAllPermissions = (user: User | null, permissions: string[]): boolean => {
  if (!user) return false;
  return permissions.every(permission => user.permissions.includes(permission));
};

/**
 * Check if a user has a specific role
 */
export const hasRole = (user: User | null, role: string | string[]): boolean => {
  if (!user) return false;
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
};

/**
 * Get the display name for a user
 */
export const getUserDisplayName = (user: User | null): string => {
  if (!user) return 'Visitante';
  return user.name || user.username || user.email;
};

/**
 * Get the initials from a user's name
 */
export const getUserInitials = (user: User | null): string => {
  if (!user) return '?';

  const name = user.name || user.username || user.email;
  const parts = name.split(' ');

  if (parts.length >= 2) {
    return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
  }

  return name.substring(0, 2).toUpperCase();
};

/**
 * Check if a user is active
 */
export const isUserActive = (user: User | null): boolean => {
  if (!user) return false;
  return user.isActive !== false; // Default to true if not specified
};

/**
 * Get role color for UI display
 */
export const getRoleColor = (role: string): string => {
  const roleColors: Record<string, string> = {
    admin: 'red',
    sales: 'blue',
    consultant: 'green',
    manager: 'purple',
    support: 'yellow',
  };

  return roleColors[role] || 'gray';
};

/**
 * Get role display name (translated)
 */
export const getRoleDisplayName = (role: string): string => {
  const roleNames: Record<string, string> = {
    admin: 'Administrador',
    sales: 'Vendedor',
    consultant: 'Consultor',
    manager: 'Gerente',
    support: 'Suporte',
  };

  return roleNames[role] || role;
};

/**
 * Check if a user can perform an action on a resource
 */
export const canPerformAction = (
  user: User | null,
  resource: string,
  action: 'read' | 'write' | 'delete' | 'manage'
): boolean => {
  if (!user) return false;

  const permission = `${resource}:${action}`;
  return user.permissions.includes(permission);
};

/**
 * Get all permissions for a specific resource
 */
export const getResourcePermissions = (user: User | null, resource: string): string[] => {
  if (!user) return [];

  return user.permissions.filter(permission => permission.startsWith(`${resource}:`));
};

/**
 * Check if user is admin
 */
export const isAdmin = (user: User | null): boolean => {
  return hasRole(user, 'admin');
};

/**
 * Validate password strength
 */
export const validatePasswordStrength = (password: string): {
  isValid: boolean;
  score: number;
  feedback: string[];
} => {
  const feedback: string[] = [];
  let score = 0;

  if (password.length >= 8) {
    score += 20;
  } else {
    feedback.push('Senha deve ter no mínimo 8 caracteres');
  }

  if (password.length >= 12) {
    score += 10;
  }

  if (/[a-z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Senha deve conter letras minúsculas');
  }

  if (/[A-Z]/.test(password)) {
    score += 15;
  } else {
    feedback.push('Senha deve conter letras maiúsculas');
  }

  if (/[0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Senha deve conter números');
  }

  if (/[^a-zA-Z0-9]/.test(password)) {
    score += 20;
  } else {
    feedback.push('Senha deve conter caracteres especiais');
  }

  return {
    isValid: score >= 70,
    score,
    feedback,
  };
};

/**
 * Format last login date
 */
export const formatLastLogin = (lastLogin: string | undefined): string => {
  if (!lastLogin) return 'Nunca';

  const date = new Date(lastLogin);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);

  if (diffMins < 1) return 'Agora mesmo';
  if (diffMins < 60) return `${diffMins} minuto${diffMins > 1 ? 's' : ''} atrás`;
  if (diffHours < 24) return `${diffHours} hora${diffHours > 1 ? 's' : ''} atrás`;
  if (diffDays < 7) return `${diffDays} dia${diffDays > 1 ? 's' : ''} atrás`;

  return date.toLocaleDateString('pt-BR');
};
