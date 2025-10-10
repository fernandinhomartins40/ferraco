import { ReactNode } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth, usePermissions } from '@/hooks/useAuth';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
  fallbackPath?: string;
}

/**
 * Component to protect routes based on authentication and permissions
 */
export const ProtectedRoute = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login',
}: ProtectedRouteProps) => {
  const { isAuthenticated } = useAuth();
  const { hasPermission, hasRole } = usePermissions();

  if (!isAuthenticated) {
    return <Navigate to={fallbackPath} replace />;
  }

  if (requiredPermission && !hasPermission(requiredPermission)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (requiredRole && !hasRole(requiredRole)) {
    return <Navigate to="/unauthorized" replace />;
  }

  return <>{children}</>;
};

interface ConditionalRenderProps {
  children: ReactNode;
  condition: boolean;
  fallback?: ReactNode;
}

/**
 * Component to conditionally render content based on a condition
 */
export const ConditionalRender = ({
  children,
  condition,
  fallback = null,
}: ConditionalRenderProps) => {
  if (!condition) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface PermissionGateProps {
  children: ReactNode;
  permission: string;
  fallback?: ReactNode;
}

/**
 * Component to gate content based on permissions
 */
export const PermissionGate = ({
  children,
  permission,
  fallback = null,
}: PermissionGateProps) => {
  const { hasPermission } = usePermissions();

  if (!hasPermission(permission)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

interface RoleGateProps {
  children: ReactNode;
  role: string | string[];
  fallback?: ReactNode;
}

/**
 * Component to gate content based on roles
 */
export const RoleGate = ({
  children,
  role,
  fallback = null,
}: RoleGateProps) => {
  const { hasRole } = usePermissions();

  if (!hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;
