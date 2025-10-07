import { useState, useEffect, memo, useCallback, useMemo } from 'react';
import {
  Users,
  Shield,
  UserPlus,
  Edit,
  Trash2,
  Eye,
  Lock,
  Unlock,
  Activity,
  FileText,
  Crown,
  Key,
  Search,
  Filter,
  Download,
  Settings,
  CheckCircle,
  XCircle,
  AlertTriangle,
  Clock,
  UserCheck,
  FileSignature
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Switch } from '@/components/ui/switch';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { usePermissions } from '@/hooks/useAuth';
import PermissionGate, { InlinePermissionCheck } from '@/components/PermissionGate';
import { userStorage } from '@/utils/userStorage';
import type {
  User,
  UserRole,
  Permission,
  AuditLog,
  Team,
  DigitalSignature
} from '@/types/lead';

const UserManagement = () => {
  const { toast } = useToast();
  const [users, setUsers] = useState<User[]>([]);
  const [roles, setRoles] = useState<UserRole[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>([]);
  const [signatures, setSignatures] = useState<DigitalSignature[]>([]);
  const [isCreateUserOpen, setIsCreateUserOpen] = useState(false);
  const [isCreateRoleOpen, setIsCreateRoleOpen] = useState(false);
  const [isCreateTeamOpen, setIsCreateTeamOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedRole, setSelectedRole] = useState<UserRole | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');

  // New user form state
  const [newUser, setNewUser] = useState({
    name: '',
    email: '',
    role: '',
    teams: [] as string[],
    isActive: true
  });

  // New role form state
  const [newRole, setNewRole] = useState({
    name: '',
    description: '',
    level: 1,
    permissions: [] as string[],
    canCreateUsers: false,
    canManageRoles: false,
    canViewAuditLogs: false
  });

  // New team form state
  const [newTeam, setNewTeam] = useState({
    name: '',
    description: '',
    members: [] as string[],
    lead: ''
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = () => {
    setUsers(userStorage.getUsers());
    setRoles(userStorage.getRoles());
    setTeams(userStorage.getTeams());
    setAuditLogs(userStorage.getAuditLogs());
    setSignatures(userStorage.getDigitalSignatures());
  };

  const createUser = () => {
    if (!newUser.name || !newUser.email || !newUser.role) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const user = userStorage.createUser(
      newUser.email,
      newUser.name,
      newUser.role,
      newUser.teams
    );

    setUsers([...users, user]);
    setNewUser({ name: '', email: '', role: '', teams: [], isActive: true });
    setIsCreateUserOpen(false);

    toast({
      title: 'Usuário Criado',
      description: `${user.name} foi criado com sucesso`,
    });
  };

  const createRole = () => {
    if (!newRole.name || !newRole.description) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const role = userStorage.createRole(
      newRole.name,
      newRole.description,
      newRole.level,
      newRole.permissions
    );

    setRoles([...roles, role]);
    setNewRole({
      name: '',
      description: '',
      level: 1,
      permissions: [],
      canCreateUsers: false,
      canManageRoles: false,
      canViewAuditLogs: false
    });
    setIsCreateRoleOpen(false);

    toast({
      title: 'Perfil Criado',
      description: `${role.name} foi criado com sucesso`,
    });
  };

  const createTeam = () => {
    if (!newTeam.name || !newTeam.description) {
      toast({
        title: 'Erro',
        description: 'Preencha todos os campos obrigatórios',
        variant: 'destructive',
      });
      return;
    }

    const team = userStorage.createTeam(
      newTeam.name,
      newTeam.description,
      newTeam.lead,
      newTeam.members
    );

    setTeams([...teams, team]);
    setNewTeam({ name: '', description: '', members: [], lead: '' });
    setIsCreateTeamOpen(false);

    toast({
      title: 'Equipe Criada',
      description: `${team.name} foi criada com sucesso`,
    });
  };

  const toggleUserStatus = (userId: string) => {
    const updatedUsers = users.map(user =>
      user.id === userId ? { ...user, isActive: !user.isActive } : user
    );
    setUsers(updatedUsers);
    userStorage.updateUser(userId, { isActive: !users.find(u => u.id === userId)?.isActive });

    toast({
      title: 'Status Atualizado',
      description: 'Status do usuário foi alterado',
    });
  };

  const getFilteredUsers = useMemo(() => {
    return users.filter(user => {
      const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          user.email.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesRole = filterRole === 'all' || user.role.id === filterRole;
      const matchesStatus = filterStatus === 'all' ||
                          (filterStatus === 'active' && user.isActive) ||
                          (filterStatus === 'inactive' && !user.isActive);

      return matchesSearch && matchesRole && matchesStatus;
    });
  }, [users, searchTerm, filterRole, filterStatus]);

  const getUserStats = useMemo(() => {
    const totalUsers = users.length;
    const activeUsers = users.filter(u => u.isActive).length;
    const totalRoles = roles.length;
    const totalTeams = teams.length;
    const recentLogins = users.filter(u => u.lastLogin &&
      new Date(u.lastLogin) > new Date(Date.now() - 24 * 60 * 60 * 1000)).length;

    return { totalUsers, activeUsers, totalRoles, totalTeams, recentLogins };
  }, [users, roles, teams]);

  const availablePermissions = [
    'leads.create', 'leads.read', 'leads.update', 'leads.delete', 'leads.export',
    'reports.create', 'reports.read', 'reports.update', 'reports.delete', 'reports.export',
    'automations.create', 'automations.read', 'automations.update', 'automations.delete',
    'tags.create', 'tags.read', 'tags.update', 'tags.delete',
    'whatsapp.send', 'whatsapp.read', 'whatsapp.configure',
    'analytics.view', 'analytics.export',
    'integrations.create', 'integrations.read', 'integrations.update', 'integrations.delete',
    'crm.create', 'crm.read', 'crm.update', 'crm.delete',
    'ai.analyze', 'ai.configure',
    'users.create', 'users.read', 'users.update', 'users.delete',
    'roles.create', 'roles.read', 'roles.update', 'roles.delete',
    'teams.create', 'teams.read', 'teams.update', 'teams.delete',
    'audit.view', 'audit.export',
    'signatures.create', 'signatures.view', 'signatures.verify'
  ];

  const stats = getUserStats;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Gestão de Usuários</h1>
          <p className="text-muted-foreground">Gerencie usuários, perfis, equipes e permissões</p>
        </div>
        <div className="flex space-x-2">
          <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="h-4 w-4 mr-2" />
                Novo Usuário
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Shield className="h-4 w-4 mr-2" />
                Novo Perfil
              </Button>
            </DialogTrigger>
          </Dialog>
          <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Users className="h-4 w-4 mr-2" />
                Nova Equipe
              </Button>
            </DialogTrigger>
          </Dialog>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Usuários Ativos</CardTitle>
            <UserCheck className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.activeUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Perfis</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalRoles}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Equipes</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalTeams}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Logins 24h</CardTitle>
            <Activity className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-600">{stats.recentLogins}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="users" className="space-y-6">
        <TabsList>
          <TabsTrigger value="users">Usuários</TabsTrigger>
          <TabsTrigger value="roles">Perfis</TabsTrigger>
          <TabsTrigger value="teams">Equipes</TabsTrigger>
          <TabsTrigger value="audit">Auditoria</TabsTrigger>
          <TabsTrigger value="signatures">Assinaturas</TabsTrigger>
        </TabsList>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Usuários do Sistema</CardTitle>
                <div className="flex space-x-2">
                  <div className="relative">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Buscar usuários..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8 w-64"
                    />
                  </div>
                  <Select value={filterRole} onValueChange={setFilterRole}>
                    <SelectTrigger className="w-40">
                      <SelectValue placeholder="Filtrar por perfil" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos os perfis</SelectItem>
                      {roles.map(role => (
                        <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Select value={filterStatus} onValueChange={setFilterStatus}>
                    <SelectTrigger className="w-32">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Todos</SelectItem>
                      <SelectItem value="active">Ativos</SelectItem>
                      <SelectItem value="inactive">Inativos</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Perfil</TableHead>
                    <TableHead>Equipes</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Último Login</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getFilteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          <Avatar className="h-8 w-8">
                            <AvatarImage src={user.avatar} />
                            <AvatarFallback>{user.name.charAt(0)}</AvatarFallback>
                          </Avatar>
                          <div>
                            <div className="font-medium">{user.name}</div>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>{user.email}</TableCell>
                      <TableCell>
                        <Badge variant={user.role.level >= 4 ? 'default' : 'secondary'}>
                          {user.role.name}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex flex-wrap gap-1">
                          {user.teams.slice(0, 2).map(teamId => {
                            const team = teams.find(t => t.id === teamId);
                            return team ? (
                              <Badge key={team.id} variant="outline" className="text-xs">
                                {team.name}
                              </Badge>
                            ) : null;
                          })}
                          {user.teams.length > 2 && (
                            <Badge variant="outline" className="text-xs">
                              +{user.teams.length - 2}
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={user.isActive}
                            onCheckedChange={() => toggleUserStatus(user.id)}
                          />
                          <span className={user.isActive ? 'text-green-600' : 'text-red-600'}>
                            {user.isActive ? 'Ativo' : 'Inativo'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString('pt-BR') : 'Nunca'}
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}>
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Roles Tab */}
        <TabsContent value="roles" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Perfis de Acesso</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {roles.map((role) => (
                  <Card key={role.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Crown className="h-4 w-4 text-amber-500" />
                          <CardTitle className="text-lg">{role.name}</CardTitle>
                        </div>
                        <Badge variant={role.level >= 4 ? 'default' : 'secondary'}>
                          Nível {role.level}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{role.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Permissões</span>
                          <Badge variant="outline">{role.permissions.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Criar usuários</span>
                          {role.canCreateUsers ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Gerenciar perfis</span>
                          {role.canManageRoles ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Ver auditoria</span>
                          {role.canViewAuditLogs ? (
                            <CheckCircle className="h-4 w-4 text-green-600" />
                          ) : (
                            <XCircle className="h-4 w-4 text-red-600" />
                          )}
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                        <Button variant="ghost" size="sm">
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Teams Tab */}
        <TabsContent value="teams" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Equipes</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teams.map((team) => (
                  <Card key={team.id} className="cursor-pointer hover:shadow-md transition-shadow">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-2">
                          <Users className="h-4 w-4 text-blue-500" />
                          <CardTitle className="text-lg">{team.name}</CardTitle>
                        </div>
                        <Badge variant={team.isActive ? 'default' : 'secondary'}>
                          {team.isActive ? 'Ativa' : 'Inativa'}
                        </Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">{team.description}</p>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span>Membros</span>
                          <Badge variant="outline">{team.members.length}</Badge>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span>Líder</span>
                          <span className="font-medium">
                            {users.find(u => u.id === team.lead)?.name || 'Não definido'}
                          </span>
                        </div>
                        <div className="text-sm">
                          <span>Criada em: </span>
                          <span>{new Date(team.createdAt).toLocaleDateString('pt-BR')}</span>
                        </div>
                      </div>
                      <div className="flex space-x-2 mt-4">
                        <Button variant="outline" size="sm" className="flex-1">
                          <Eye className="h-4 w-4 mr-1" />
                          Ver
                        </Button>
                        <Button variant="outline" size="sm" className="flex-1">
                          <Edit className="h-4 w-4 mr-1" />
                          Editar
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Audit Tab */}
        <TabsContent value="audit" className="space-y-6">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Log de Auditoria</CardTitle>
                <Button variant="outline">
                  <Download className="h-4 w-4 mr-2" />
                  Exportar
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data/Hora</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Ação</TableHead>
                    <TableHead>Recurso</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Detalhes</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {auditLogs.slice(0, 20).map((log) => (
                    <TableRow key={log.id}>
                      <TableCell>
                        <div className="text-sm">
                          {new Date(log.timestamp).toLocaleString('pt-BR')}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium">{log.userName}</div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{log.action}</Badge>
                      </TableCell>
                      <TableCell>{log.resource}</TableCell>
                      <TableCell>
                        {log.success ? (
                          <Badge variant="default" className="bg-green-100 text-green-800">
                            Sucesso
                          </Badge>
                        ) : (
                          <Badge variant="destructive">
                            Erro
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{log.ipAddress}</TableCell>
                      <TableCell className="text-right">
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Signatures Tab */}
        <TabsContent value="signatures" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Assinaturas Digitais</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Data</TableHead>
                    <TableHead>Usuário</TableHead>
                    <TableHead>Lead</TableHead>
                    <TableHead>Tipo de Documento</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>IP</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {signatures.map((signature) => (
                    <TableRow key={signature.id}>
                      <TableCell>
                        {new Date(signature.timestamp).toLocaleDateString('pt-BR')}
                      </TableCell>
                      <TableCell>
                        {users.find(u => u.id === signature.userId)?.name || 'Usuário desconhecido'}
                      </TableCell>
                      <TableCell>{signature.leadId}</TableCell>
                      <TableCell>
                        <Badge variant="outline">{signature.documentType}</Badge>
                      </TableCell>
                      <TableCell>
                        {signature.isValid ? (
                          <div className="flex items-center space-x-1">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="text-green-600">Válida</span>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-1">
                            <AlertTriangle className="h-4 w-4 text-red-600" />
                            <span className="text-red-600">Inválida</span>
                          </div>
                        )}
                      </TableCell>
                      <TableCell className="font-mono text-sm">{signature.ipAddress}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end space-x-1">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Create User Dialog */}
      <Dialog open={isCreateUserOpen} onOpenChange={setIsCreateUserOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Novo Usuário</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome Completo</label>
              <Input
                value={newUser.name}
                onChange={(e) => setNewUser({ ...newUser, name: e.target.value })}
                placeholder="Digite o nome completo"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Email</label>
              <Input
                type="email"
                value={newUser.email}
                onChange={(e) => setNewUser({ ...newUser, email: e.target.value })}
                placeholder="email@exemplo.com"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Perfil</label>
              <Select value={newUser.role} onValueChange={(value) => setNewUser({ ...newUser, role: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione um perfil" />
                </SelectTrigger>
                <SelectContent>
                  {roles.map(role => (
                    <SelectItem key={role.id} value={role.id}>{role.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                checked={newUser.isActive}
                onCheckedChange={(checked) => setNewUser({ ...newUser, isActive: checked })}
              />
              <label className="text-sm font-medium">Usuário ativo</label>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateUserOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createUser}>
                Criar Usuário
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Role Dialog */}
      <Dialog open={isCreateRoleOpen} onOpenChange={setIsCreateRoleOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Criar Novo Perfil</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium">Nome do Perfil</label>
                <Input
                  value={newRole.name}
                  onChange={(e) => setNewRole({ ...newRole, name: e.target.value })}
                  placeholder="Ex: Gerente"
                />
              </div>
              <div>
                <label className="text-sm font-medium">Nível de Acesso</label>
                <Select value={newRole.level.toString()} onValueChange={(value) => setNewRole({ ...newRole, level: parseInt(value) })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">Nível 1 - Básico</SelectItem>
                    <SelectItem value="2">Nível 2 - Intermediário</SelectItem>
                    <SelectItem value="3">Nível 3 - Avançado</SelectItem>
                    <SelectItem value="4">Nível 4 - Administrador</SelectItem>
                    <SelectItem value="5">Nível 5 - Super Admin</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newRole.description}
                onChange={(e) => setNewRole({ ...newRole, description: e.target.value })}
                placeholder="Descreva as responsabilidades deste perfil"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Permissões</label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto">
                {availablePermissions.map((permission) => (
                  <div key={permission} className="flex items-center space-x-2">
                    <Checkbox
                      checked={newRole.permissions.includes(permission)}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setNewRole({ ...newRole, permissions: [...newRole.permissions, permission] });
                        } else {
                          setNewRole({ ...newRole, permissions: newRole.permissions.filter(p => p !== permission) });
                        }
                      }}
                    />
                    <label className="text-sm">{permission}</label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex space-x-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={newRole.canCreateUsers}
                  onCheckedChange={(checked) => setNewRole({ ...newRole, canCreateUsers: !!checked })}
                />
                <label className="text-sm">Pode criar usuários</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={newRole.canManageRoles}
                  onCheckedChange={(checked) => setNewRole({ ...newRole, canManageRoles: !!checked })}
                />
                <label className="text-sm">Pode gerenciar perfis</label>
              </div>
              <div className="flex items-center space-x-2">
                <Checkbox
                  checked={newRole.canViewAuditLogs}
                  onCheckedChange={(checked) => setNewRole({ ...newRole, canViewAuditLogs: !!checked })}
                />
                <label className="text-sm">Pode ver auditoria</label>
              </div>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateRoleOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createRole}>
                Criar Perfil
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Create Team Dialog */}
      <Dialog open={isCreateTeamOpen} onOpenChange={setIsCreateTeamOpen}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Criar Nova Equipe</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm font-medium">Nome da Equipe</label>
              <Input
                value={newTeam.name}
                onChange={(e) => setNewTeam({ ...newTeam, name: e.target.value })}
                placeholder="Ex: Vendas"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Descrição</label>
              <Textarea
                value={newTeam.description}
                onChange={(e) => setNewTeam({ ...newTeam, description: e.target.value })}
                placeholder="Descreva o propósito desta equipe"
              />
            </div>
            <div>
              <label className="text-sm font-medium">Líder da Equipe</label>
              <Select value={newTeam.lead} onValueChange={(value) => setNewTeam({ ...newTeam, lead: value })}>
                <SelectTrigger>
                  <SelectValue placeholder="Selecione o líder" />
                </SelectTrigger>
                <SelectContent>
                  {users.filter(u => u.isActive).map(user => (
                    <SelectItem key={user.id} value={user.id}>{user.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex justify-end space-x-2">
              <Button variant="outline" onClick={() => setIsCreateTeamOpen(false)}>
                Cancelar
              </Button>
              <Button onClick={createTeam}>
                Criar Equipe
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default memo(UserManagement);