import { ReactNode, useEffect } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth, usePermissions } from '@/hooks/useAuth';
import { useFirstLogin } from '@/hooks/useFirstLogin';
import FirstLoginSetup from '@/components/FirstLoginSetup';
import { Loader2, Shield, AlertTriangle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';

interface ProtectedRouteProps {
  children: ReactNode;
  requiredPermission?: string;
  requiredRole?: string | string[];
  fallbackPath?: string;
  showUnauthorized?: boolean;
}

/**
 * Component to protect routes based on authentication and authorization
 */
const ProtectedRoute: React.FC<ProtectedRouteProps> = ({
  children,
  requiredPermission,
  requiredRole,
  fallbackPath = '/login',
  showUnauthorized = true,
}) => {
  const { isAuthenticated, isLoading, user } = useAuth();
  const { hasPermission, hasRole } = usePermissions();
  const { isFirstLogin, isCheckingFirstLogin } = useFirstLogin();
  const location = useLocation();

  // Show loading spinner while checking authentication or first login
  if (isLoading || isCheckingFirstLogin) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <Loader2 className="h-8 w-8 animate-spin mx-auto text-primary" />
          <div className="space-y-2">
            <h3 className="text-lg font-medium">
              {isLoading ? 'Verificando autenticação...' : 'Verificando configuração da conta...'}
            </h3>
            <p className="text-sm text-muted-foreground">
              {isLoading
                ? 'Aguarde enquanto validamos suas credenciais'
                : 'Verificando se é necessário configurar sua conta'
              }
            </p>
          </div>
        </div>
      </div>
    );
  }

  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return (
      <Navigate
        to={fallbackPath}
        state={{ from: location }}
        replace
      />
    );
  }

  // If first login is required, show setup component
  if (isFirstLogin) {
    return <FirstLoginSetup />;
  }

  // Check role-based access
  if (requiredRole && !hasRole(requiredRole)) {
    if (!showUnauthorized) {
      return <Navigate to="/" replace />;
    }

    return (
      <UnauthorizedPage
        reason="role"
        requiredRole={requiredRole}
        userRole={user?.role}
      />
    );
  }

  // Check permission-based access
  if (requiredPermission && !hasPermission(requiredPermission)) {
    if (!showUnauthorized) {
      return <Navigate to="/" replace />;
    }

    return (
      <UnauthorizedPage
        reason="permission"
        requiredPermission={requiredPermission}
        userPermissions={user?.permissions}
      />
    );
  }

  // All checks passed, render children
  return <>{children}</>;
};

/**
 * Unauthorized access page
 */
interface UnauthorizedPageProps {
  reason: 'role' | 'permission';
  requiredRole?: string | string[];
  requiredPermission?: string;
  userRole?: string;
  userPermissions?: string[];
}

const UnauthorizedPage: React.FC<UnauthorizedPageProps> = ({
  reason,
  requiredRole,
  requiredPermission,
  userRole,
  userPermissions,
}) => {
  const { logout } = useAuth();

  const handleGoHome = () => {
    window.location.href = '/';
  };

  const handleLogout = () => {
    logout();
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      sales: 'Vendedor',
      consultant: 'Consultor',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-md">
        <Card className="border-destructive/20">
          <CardHeader className="text-center space-y-4">
            <div className="mx-auto w-12 h-12 bg-destructive/10 rounded-full flex items-center justify-center">
              <Shield className="h-6 w-6 text-destructive" />
            </div>
            <div>
              <CardTitle className="text-destructive">Acesso Negado</CardTitle>
              <CardDescription>
                Você não tem permissão para acessar esta área
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* Error Details */}
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                {reason === 'role' ? (
                  <div className="space-y-2">
                    <p className="font-medium">Nível de acesso insuficiente</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Seu nível:</span>{' '}
                        {userRole ? getRoleDisplayName(userRole) : 'Não definido'}
                      </p>
                      <p>
                        <span className="font-medium">Necessário:</span>{' '}
                        {Array.isArray(requiredRole)
                          ? requiredRole.map(getRoleDisplayName).join(' ou ')
                          : requiredRole ? getRoleDisplayName(requiredRole) : 'Não especificado'
                        }
                      </p>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-2">
                    <p className="font-medium">Permissão específica necessária</p>
                    <div className="text-sm space-y-1">
                      <p>
                        <span className="font-medium">Requerida:</span>{' '}
                        <code className="bg-muted px-1 rounded">{requiredPermission}</code>
                      </p>
                      {userPermissions && userPermissions.length > 0 && (
                        <div>
                          <p className="font-medium">Suas permissões:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {userPermissions.map((permission, index) => (
                              <code key={index} className="bg-muted px-1 rounded text-xs">
                                {permission}
                              </code>
                            ))}
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </AlertDescription>
            </Alert>

            {/* Action Buttons */}
            <div className="space-y-3">
              <Button
                onClick={handleGoHome}
                className="w-full"
                variant="outline"
              >
                Voltar ao Site Principal
              </Button>

              <Button
                onClick={handleLogout}
                variant="secondary"
                className="w-full"
              >
                Fazer Login com Outra Conta
              </Button>
            </div>

            {/* Help Text */}
            <div className="text-center text-sm text-muted-foreground">
              <p>Entre em contato com o administrador do sistema</p>
              <p>se você acredita que deveria ter acesso a esta área.</p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

/**
 * Higher-order component for protecting components with permissions
 */
export const withPermission = (
  Component: React.ComponentType<any>,
  requiredPermission: string
) => {
  return (props: any) => (
    <ProtectedRoute requiredPermission={requiredPermission}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Higher-order component for protecting components with roles
 */
export const withRole = (
  Component: React.ComponentType<any>,
  requiredRole: string | string[]
) => {
  return (props: any) => (
    <ProtectedRoute requiredRole={requiredRole}>
      <Component {...props} />
    </ProtectedRoute>
  );
};

/**
 * Component for conditional rendering based on permissions
 */
interface ConditionalRenderProps {
  children: ReactNode;
  permission?: string;
  role?: string | string[];
  fallback?: ReactNode;
}

export const ConditionalRender: React.FC<ConditionalRenderProps> = ({
  children,
  permission,
  role,
  fallback = null,
}) => {
  const { hasPermission, hasRole } = usePermissions();

  // Check permission
  if (permission && !hasPermission(permission)) {
    return <>{fallback}</>;
  }

  // Check role
  if (role && !hasRole(role)) {
    return <>{fallback}</>;
  }

  return <>{children}</>;
};

export default ProtectedRoute;