import { ReactNode } from 'react';
import { usePermissions, useRoleAccess } from '@/hooks/useAuth';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Shield, Lock, AlertTriangle } from 'lucide-react';

interface PermissionGateProps {
  children: ReactNode;
  permission?: string | string[];
  role?: string | string[];
  minimumRole?: string;
  requireAll?: boolean; // For multiple permissions, require all (AND) vs any (OR)
  fallback?: ReactNode;
  showDeniedMessage?: boolean;
  deniedMessage?: string;
  loading?: ReactNode;
}

/**
 * Advanced permission gate component that controls access to UI elements
 * based on user permissions and roles
 */
const PermissionGate: React.FC<PermissionGateProps> = ({
  children,
  permission,
  role,
  minimumRole,
  requireAll = false,
  fallback = null,
  showDeniedMessage = false,
  deniedMessage,
  loading = null
}) => {
  const {
    user,
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  } = usePermissions();

  const { hasMinimumRole, displayName, roleColor } = useRoleAccess();

  // Show loading state if provided
  if (!isAuthenticated && loading) {
    return <>{loading}</>;
  }

  // Not authenticated
  if (!isAuthenticated) {
    if (showDeniedMessage) {
      return (
        <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
          <Lock className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800 dark:text-red-200">
            {deniedMessage || 'É necessário fazer login para acessar este conteúdo.'}
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check minimum role requirement
  if (minimumRole && !hasMinimumRole(minimumRole)) {
    if (showDeniedMessage) {
      return (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="space-y-2">
              <p>
                {deniedMessage || 'Nível de acesso insuficiente para este conteúdo.'}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <span>Seu nível:</span>
                <Badge className={roleColor}>
                  {displayName}
                </Badge>
                <span>Necessário:</span>
                <Badge variant="outline">
                  {minimumRole === 'admin' ? 'Administrador' :
                   minimumRole === 'sales' ? 'Vendedor' :
                   minimumRole === 'consultant' ? 'Consultor' : minimumRole}
                </Badge>
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check role requirement
  if (role && !hasRole(role)) {
    if (showDeniedMessage) {
      const requiredRoles = Array.isArray(role) ? role : [role];
      return (
        <Alert className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Shield className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <div className="space-y-2">
              <p>
                {deniedMessage || 'Perfil de usuário incompatível com este conteúdo.'}
              </p>
              <div className="flex items-center space-x-2 text-sm">
                <span>Seu perfil:</span>
                <Badge className={roleColor}>
                  {displayName}
                </Badge>
                <span>Necessário:</span>
                {requiredRoles.map(r => (
                  <Badge key={r} variant="outline">
                    {r === 'admin' ? 'Administrador' :
                     r === 'sales' ? 'Vendedor' :
                     r === 'consultant' ? 'Consultor' : r}
                  </Badge>
                ))}
              </div>
            </div>
          </AlertDescription>
        </Alert>
      );
    }
    return <>{fallback}</>;
  }

  // Check permission requirement
  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];
    let hasAccess = false;

    if (requireAll) {
      // Require ALL permissions (AND logic)
      hasAccess = hasAllPermissions(permissions);
    } else {
      // Require ANY permission (OR logic)
      hasAccess = hasAnyPermission(permissions);
    }

    if (!hasAccess) {
      if (showDeniedMessage) {
        return (
          <Alert className="border-red-200 bg-red-50 dark:border-red-800 dark:bg-red-950">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800 dark:text-red-200">
              <div className="space-y-2">
                <p>
                  {deniedMessage || 'Você não tem permissão para acessar este conteúdo.'}
                </p>
                <div className="text-sm space-y-1">
                  <div>
                    <span className="font-medium">Permissões necessárias:</span>
                    <div className="flex flex-wrap gap-1 mt-1">
                      {permissions.map(perm => (
                        <Badge key={perm} variant="outline" className="text-xs">
                          {perm}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  {user?.permissions && user.permissions.length > 0 && (
                    <div>
                      <span className="font-medium">Suas permissões:</span>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {user.permissions.map(perm => (
                          <Badge key={perm} variant="secondary" className="text-xs">
                            {perm}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </AlertDescription>
          </Alert>
        );
      }
      return <>{fallback}</>;
    }
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Higher-order component for wrapping components with permission checks
 */
export const withPermissionGate = <T extends object>(
  Component: React.ComponentType<T>,
  gateProps: Omit<PermissionGateProps, 'children'>
) => {
  return (props: T) => (
    <PermissionGate {...gateProps}>
      <Component {...props} />
    </PermissionGate>
  );
};

/**
 * Hook for permission-based conditional rendering logic
 */
export const usePermissionGate = (gateProps: Omit<PermissionGateProps, 'children'>) => {
  const {
    permission,
    role,
    minimumRole,
    requireAll = false
  } = gateProps;

  const {
    isAuthenticated,
    hasPermission,
    hasRole,
    hasAnyPermission,
    hasAllPermissions
  } = usePermissions();

  const { hasMinimumRole } = useRoleAccess();

  if (!isAuthenticated) {
    return false;
  }

  if (minimumRole && !hasMinimumRole(minimumRole)) {
    return false;
  }

  if (role && !hasRole(role)) {
    return false;
  }

  if (permission) {
    const permissions = Array.isArray(permission) ? permission : [permission];

    if (requireAll) {
      return hasAllPermissions(permissions);
    } else {
      return hasAnyPermission(permissions);
    }
  }

  return true;
};

/**
 * Component for inline permission checks with custom rendering
 */
interface InlinePermissionCheckProps {
  permission?: string | string[];
  role?: string | string[];
  minimumRole?: string;
  requireAll?: boolean;
  children: (hasAccess: boolean) => ReactNode;
}

export const InlinePermissionCheck: React.FC<InlinePermissionCheckProps> = ({
  children,
  ...gateProps
}) => {
  const hasAccess = usePermissionGate(gateProps);
  return <>{children(hasAccess)}</>;
};

export default PermissionGate;