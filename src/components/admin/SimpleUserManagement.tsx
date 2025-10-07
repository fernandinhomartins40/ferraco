import { useState, useEffect } from 'react';
import { Users, Shield, UserCheck, Key, Clock, Activity } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import PermissionGate from '@/components/PermissionGate';
import { httpClient } from '@/utils/authUtils';
import { useToast } from '@/hooks/use-toast';
import { securityLogger, SecurityEventType, SecurityLevel } from '@/utils/securityLogger';

interface BackendUser {
  id: string;
  username: string;
  name: string;
  role: 'admin' | 'sales' | 'consultant';
  email: string;
  permissions: string[];
}

const SimpleUserManagement = () => {
  const [users, setUsers] = useState<BackendUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user: currentUser } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    loadUsers();
  }, []);

  const loadUsers = async () => {
    setLoading(true);
    setError(null);

    try {
      // Log access to user management
      securityLogger.logEvent(
        SecurityEventType.SENSITIVE_DATA_ACCESS,
        SecurityLevel.MEDIUM,
        'Accessing user management interface',
        { resource: 'user_management' },
        currentUser?.id,
        currentUser?.username,
        currentUser?.role
      );

      const response = await httpClient.get('/auth/users');

      if (response.success && response.data) {
        const data = response.data as { users?: BackendUser[] };
        setUsers(data.users || []);

        securityLogger.logUserAction(
          'view',
          'users_list',
          currentUser?.id,
          currentUser?.username,
          currentUser?.role,
          { userCount: data.users?.length || 0 }
        );
      } else {
        throw new Error(response.message || 'Falha ao carregar usuários');
      }
    } catch (err: any) {
      const errorMessage = err.message || 'Erro ao carregar usuários';
      setError(errorMessage);

      securityLogger.logEvent(
        SecurityEventType.ERROR_OCCURRED,
        SecurityLevel.HIGH,
        `Failed to load users: ${errorMessage}`,
        { error: err.message },
        currentUser?.id,
        currentUser?.username
      );

      toast({
        title: 'Erro',
        description: errorMessage,
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const getRoleDisplayName = (role: string) => {
    const roleNames = {
      admin: 'Administrador',
      sales: 'Vendedor',
      consultant: 'Consultor',
    };
    return roleNames[role as keyof typeof roleNames] || role;
  };

  const getRoleColor = (role: string) => {
    const roleColors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      sales: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      consultant: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
    };
    return roleColors[role as keyof typeof roleColors] || 'bg-gray-100 text-gray-800';
  };

  const getPermissionSummary = (permissions: string[]) => {
    const categories = {
      leads: permissions.filter(p => p.startsWith('leads')).length,
      tags: permissions.filter(p => p.startsWith('tags')).length,
      notes: permissions.filter(p => p.startsWith('notes')).length,
      admin: permissions.filter(p => p.startsWith('admin')).length,
    };

    return Object.entries(categories)
      .filter(([_, count]) => count > 0)
      .map(([category, count]) => `${category}: ${count}`)
      .join(', ');
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Carregando usuários...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center space-x-2">
          <Users className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
        </div>

        <Card>
          <CardContent className="p-6">
            <div className="text-center text-red-600">
              <p className="font-medium">Erro ao carregar usuários</p>
              <p className="text-sm mt-1">{error}</p>
              <button
                onClick={loadUsers}
                className="mt-4 px-4 py-2 bg-primary text-primary-foreground rounded hover:bg-primary/90"
              >
                Tentar Novamente
              </button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <PermissionGate
      permission="admin:read"
      showDeniedMessage
      deniedMessage="Apenas administradores podem acessar a gestão de usuários."
    >
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Users className="h-6 w-6" />
            <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          </div>
          <Badge variant="outline" className="flex items-center space-x-1">
            <UserCheck className="w-4 h-4" />
            <span>{users.length} usuários</span>
          </Badge>
        </div>

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{users.length}</div>
              <p className="text-xs text-muted-foreground">
                Usuários ativos no sistema
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Administradores</CardTitle>
              <Shield className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'admin').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários com acesso total
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Vendedores</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {users.filter(u => u.role === 'sales').length}
              </div>
              <p className="text-xs text-muted-foreground">
                Usuários de vendas ativas
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Users Table */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <UserCheck className="h-5 w-5" />
              <span>Usuários do Sistema</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Usuário</TableHead>
                  <TableHead>Papel</TableHead>
                  <TableHead>Permissões</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <Avatar className="h-8 w-8">
                          <AvatarFallback className="text-sm">
                            {user.name.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <div>
                          <div className="font-medium">{user.name}</div>
                          <div className="text-sm text-muted-foreground">
                            @{user.username}
                          </div>
                          {user.email && (
                            <div className="text-xs text-muted-foreground">
                              {user.email}
                            </div>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={getRoleColor(user.role)}>
                        {getRoleDisplayName(user.role)}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="text-sm">
                          {user.permissions.length} permissões
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {getPermissionSummary(user.permissions)}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                        <span className="text-sm text-green-600">Ativo</span>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Current User Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <Key className="h-5 w-5" />
              <span>Sua Conta</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center space-x-4 p-4 bg-muted/50 rounded-lg">
              <Avatar className="h-12 w-12">
                <AvatarFallback className="text-lg">
                  {currentUser?.name?.substring(0, 2).toUpperCase()}
                </AvatarFallback>
              </Avatar>
              <div className="flex-1">
                <div className="font-medium">{currentUser?.name}</div>
                <div className="text-sm text-muted-foreground">
                  @{currentUser?.username} • {currentUser?.email}
                </div>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge className={getRoleColor(currentUser?.role || '')}>
                    {getRoleDisplayName(currentUser?.role || '')}
                  </Badge>
                  <div className="text-xs text-muted-foreground">
                    {currentUser?.permissions?.length || 0} permissões ativas
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Security Notice */}
        <Card className="border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <CardContent className="p-4">
            <div className="flex items-start space-x-3">
              <Shield className="h-5 w-5 text-amber-600 mt-0.5" />
              <div className="text-sm">
                <p className="font-medium text-amber-800 dark:text-amber-200">
                  Informações de Segurança
                </p>
                <p className="text-amber-700 dark:text-amber-300 mt-1">
                  Esta página exibe usuários do sistema backend. Para funcionalidades completas de gestão
                  (criar, editar, excluir usuários), seria necessário implementar endpoints adicionais no backend.
                  Atualmente, o sistema suporta autenticação e autorização robustas.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </PermissionGate>
  );
};

export default SimpleUserManagement;