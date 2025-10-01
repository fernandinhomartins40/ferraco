import {
  User,
  UserRole,
  Permission,
  PermissionCondition,
  UserPreferences,
  NotificationSettings,
  EmailNotifications,
  PushNotifications,
  InAppNotifications,
  AuditLog,
  DigitalSignature,
  Team
} from '@/types/lead';
import { logger } from '@/lib/logger';

export class UserStorage {
  private readonly STORAGE_KEYS = {
    USERS: 'ferraco_users',
    ROLES: 'ferraco_roles',
    PERMISSIONS: 'ferraco_permissions',
    AUDIT_LOGS: 'ferraco_audit_logs',
    DIGITAL_SIGNATURES: 'ferraco_digital_signatures',
    TEAMS: 'ferraco_teams',
    CURRENT_USER: 'ferraco_current_user',
    USER_SESSIONS: 'ferraco_user_sessions'
  };

  private currentUser: User | null = null;

  // 👤 User Management
  getUsers(): User[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.USERS);
      const users = stored ? JSON.parse(stored) : [];

      if (users.length === 0) {
        return this.initializeDefaultUsers();
      }

      return users;
    } catch (error) {
      logger.error('Erro ao carregar usuários:', error);
      return this.initializeDefaultUsers();
    }
  }

  createUser(
    email: string,
    name: string,
    roleId: string,
    teams: string[] = []
  ): User {
    try {
      const role = this.getRole(roleId);
      if (!role) {
        throw new Error('Role não encontrada');
      }

      const user: User = {
        id: `user_${Date.now()}`,
        email,
        name,
        role,
        isActive: true,
        permissions: role.permissions.map(permName => this.getPermissionByName(permName)).filter(Boolean) as Permission[],
        teams,
        createdAt: new Date().toISOString(),
        preferences: this.getDefaultPreferences(),
      };

      const users = this.getUsers();

      // Check for duplicate email
      if (users.some(u => u.email.toLowerCase() === email.toLowerCase())) {
        throw new Error('Email já está em uso');
      }

      users.push(user);
      this.saveUsers(users);

      this.logAction('user_created', 'users', user.id, {
        email,
        name,
        role: role.name
      });

      return user;
    } catch (error) {
      logger.error('Erro ao criar usuário:', error);
      throw error;
    }
  }

  updateUser(userId: string, updates: Partial<User>): boolean {
    try {
      const users = this.getUsers();
      const index = users.findIndex(u => u.id === userId);

      if (index === -1) return false;

      const oldUser = { ...users[index] };
      users[index] = { ...users[index], ...updates };
      this.saveUsers(users);

      this.logAction('user_updated', 'users', userId, {
        changes: this.getChanges(oldUser, users[index])
      });

      return true;
    } catch (error) {
      logger.error('Erro ao atualizar usuário:', error);
      return false;
    }
  }

  deactivateUser(userId: string): boolean {
    try {
      const result = this.updateUser(userId, { isActive: false });
      if (result) {
        this.logAction('user_deactivated', 'users', userId, {});
      }
      return result;
    } catch (error) {
      logger.error('Erro ao desativar usuário:', error);
      return false;
    }
  }

  activateUser(userId: string): boolean {
    try {
      const result = this.updateUser(userId, { isActive: true });
      if (result) {
        this.logAction('user_activated', 'users', userId, {});
      }
      return result;
    } catch (error) {
      logger.error('Erro ao ativar usuário:', error);
      return false;
    }
  }

  deleteUser(userId: string): boolean {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);

      if (!user) return false;

      // Don't allow deletion of the last admin
      const admins = users.filter(u => u.role.level >= 5 && u.isActive);
      if (user.role.level >= 5 && admins.length <= 1) {
        throw new Error('Não é possível deletar o último administrador');
      }

      const filtered = users.filter(u => u.id !== userId);
      this.saveUsers(filtered);

      this.logAction('user_deleted', 'users', userId, {
        email: user.email,
        name: user.name
      });

      return true;
    } catch (error) {
      logger.error('Erro ao deletar usuário:', error);
      return false;
    }
  }

  getUser(userId: string): User | null {
    return this.getUsers().find(u => u.id === userId) || null;
  }

  getUserByEmail(email: string): User | null {
    return this.getUsers().find(u => u.email.toLowerCase() === email.toLowerCase()) || null;
  }

  // 🔐 Authentication & Session
  getCurrentUser(): User | null {
    if (this.currentUser) return this.currentUser;

    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.CURRENT_USER);
      if (stored) {
        this.currentUser = JSON.parse(stored);
        return this.currentUser;
      }
    } catch (error) {
      logger.error('Erro ao carregar usuário atual:', error);
    }

    return null;
  }

  setCurrentUser(user: User): void {
    try {
      this.currentUser = user;
      localStorage.setItem(this.STORAGE_KEYS.CURRENT_USER, JSON.stringify(user));

      // Update last login
      this.updateUser(user.id, { lastLogin: new Date().toISOString() });

      this.logAction('user_login', 'authentication', user.id, {});
    } catch (error) {
      logger.error('Erro ao definir usuário atual:', error);
    }
  }

  logout(): void {
    try {
      if (this.currentUser) {
        this.logAction('user_logout', 'authentication', this.currentUser.id, {});
      }

      this.currentUser = null;
      localStorage.removeItem(this.STORAGE_KEYS.CURRENT_USER);
    } catch (error) {
      logger.error('Erro ao fazer logout:', error);
    }
  }

  // 🎭 Role Management
  getRoles(): UserRole[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.ROLES);
      const roles = stored ? JSON.parse(stored) : [];

      if (roles.length === 0) {
        return this.initializeDefaultRoles();
      }

      return roles;
    } catch (error) {
      logger.error('Erro ao carregar roles:', error);
      return this.initializeDefaultRoles();
    }
  }

  createRole(
    name: string,
    description: string,
    level: number,
    permissions: string[]
  ): UserRole {
    try {
      const role: UserRole = {
        id: `role_${Date.now()}`,
        name,
        description,
        level,
        permissions,
        canCreateUsers: level >= 4,
        canManageRoles: level >= 5,
        canViewAuditLogs: level >= 4
      };

      const roles = this.getRoles();
      roles.push(role);
      this.saveRoles(roles);

      this.logAction('role_created', 'roles', role.id, {
        name,
        level,
        permissions: permissions.length
      });

      return role;
    } catch (error) {
      logger.error('Erro ao criar role:', error);
      throw error;
    }
  }

  updateRole(roleId: string, updates: Partial<UserRole>): boolean {
    try {
      const roles = this.getRoles();
      const index = roles.findIndex(r => r.id === roleId);

      if (index === -1) return false;

      const oldRole = { ...roles[index] };
      roles[index] = { ...roles[index], ...updates };
      this.saveRoles(roles);

      this.logAction('role_updated', 'roles', roleId, {
        changes: this.getChanges(oldRole, roles[index])
      });

      return true;
    } catch (error) {
      logger.error('Erro ao atualizar role:', error);
      return false;
    }
  }

  deleteRole(roleId: string): boolean {
    try {
      const roles = this.getRoles();
      const users = this.getUsers();

      // Check if any user is using this role
      if (users.some(u => u.role.id === roleId)) {
        throw new Error('Não é possível deletar role em uso');
      }

      const filtered = roles.filter(r => r.id !== roleId);
      this.saveRoles(filtered);

      this.logAction('role_deleted', 'roles', roleId, {});
      return true;
    } catch (error) {
      logger.error('Erro ao deletar role:', error);
      return false;
    }
  }

  getRole(roleId: string): UserRole | null {
    return this.getRoles().find(r => r.id === roleId) || null;
  }

  // 🔒 Permission System
  hasPermission(userId: string, resource: string, action: string, context?: any): boolean {
    try {
      const user = this.getUser(userId);
      if (!user || !user.isActive) return false;

      // Super admin always has permission
      if (user.role.level >= 5) return true;

      // Check user permissions
      const permission = user.permissions.find(p => p.resource === resource);
      if (!permission) return false;

      // Check if action is allowed
      if (!permission.actions.includes(action)) return false;

      // Check conditions if any
      if (permission.conditions && permission.conditions.length > 0) {
        return this.evaluatePermissionConditions(permission.conditions, context);
      }

      return true;
    } catch (error) {
      logger.error('Erro ao verificar permissão:', error);
      return false;
    }
  }

  private evaluatePermissionConditions(conditions: PermissionCondition[], context: any): boolean {
    return conditions.every(condition => {
      const contextValue = context?.[condition.field];

      switch (condition.operator) {
        case 'equals':
          return contextValue === condition.value;
        case 'not_equals':
          return contextValue !== condition.value;
        case 'in':
          return Array.isArray(condition.value) && condition.value.includes(contextValue);
        case 'not_in':
          return Array.isArray(condition.value) && !condition.value.includes(contextValue);
        default:
          return false;
      }
    });
  }

  getAllPermissions(): Permission[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.PERMISSIONS);
      const permissions = stored ? JSON.parse(stored) : [];

      if (permissions.length === 0) {
        return this.initializeDefaultPermissions();
      }

      return permissions;
    } catch (error) {
      logger.error('Erro ao carregar permissões:', error);
      return this.initializeDefaultPermissions();
    }
  }

  getPermissionByName(name: string): Permission | null {
    return this.getAllPermissions().find(p => p.resource === name) || null;
  }

  // 📋 Audit Logging
  logAction(
    action: string,
    resource: string,
    resourceId: string,
    details: Record<string, any>,
    success: boolean = true,
    errorMessage?: string
  ): void {
    try {
      const currentUser = this.getCurrentUser();
      const auditLog: AuditLog = {
        id: `audit_${Date.now()}`,
        userId: currentUser?.id || 'system',
        userName: currentUser?.name || 'Sistema',
        action,
        resource,
        resourceId,
        details,
        ipAddress: '127.0.0.1', // In real app, get from request
        userAgent: navigator.userAgent,
        timestamp: new Date().toISOString(),
        success,
        errorMessage
      };

      const logs = this.getAuditLogs();
      logs.push(auditLog);

      // Keep only last 1000 logs
      if (logs.length > 1000) {
        logs.splice(0, logs.length - 1000);
      }

      localStorage.setItem(this.STORAGE_KEYS.AUDIT_LOGS, JSON.stringify(logs));
    } catch (error) {
      logger.error('Erro ao registrar log de auditoria:', error);
    }
  }

  getAuditLogs(userId?: string, resource?: string, limit: number = 100): AuditLog[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.AUDIT_LOGS);
      let logs = stored ? JSON.parse(stored) : [];

      // Filter by user if specified
      if (userId) {
        logs = logs.filter((log: AuditLog) => log.userId === userId);
      }

      // Filter by resource if specified
      if (resource) {
        logs = logs.filter((log: AuditLog) => log.resource === resource);
      }

      // Sort by timestamp (newest first) and limit
      return logs
        .sort((a: AuditLog, b: AuditLog) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
        .slice(0, limit);
    } catch (error) {
      logger.error('Erro ao carregar logs de auditoria:', error);
      return [];
    }
  }

  // ✍️ Digital Signature
  createDigitalSignature(
    userId: string,
    leadId: string,
    documentType: DigitalSignature['documentType'],
    signatureData: string
  ): DigitalSignature {
    try {
      const signature: DigitalSignature = {
        id: `sig_${Date.now()}`,
        userId,
        leadId,
        documentType,
        signatureData,
        timestamp: new Date().toISOString(),
        ipAddress: '127.0.0.1',
        isValid: true,
        certificateId: `cert_${Date.now()}`
      };

      const signatures = this.getDigitalSignatures();
      signatures.push(signature);
      this.saveDigitalSignatures(signatures);

      this.logAction('digital_signature_created', 'signatures', signature.id, {
        leadId,
        documentType
      });

      return signature;
    } catch (error) {
      logger.error('Erro ao criar assinatura digital:', error);
      throw error;
    }
  }

  getDigitalSignatures(leadId?: string): DigitalSignature[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.DIGITAL_SIGNATURES);
      let signatures = stored ? JSON.parse(stored) : [];

      if (leadId) {
        signatures = signatures.filter((sig: DigitalSignature) => sig.leadId === leadId);
      }

      return signatures;
    } catch (error) {
      logger.error('Erro ao carregar assinaturas digitais:', error);
      return [];
    }
  }

  validateDigitalSignature(signatureId: string): boolean {
    try {
      const signatures = this.getDigitalSignatures();
      const signature = signatures.find(s => s.id === signatureId);

      if (!signature) return false;

      // In a real implementation, this would validate against a certificate authority
      return signature.isValid;
    } catch (error) {
      logger.error('Erro ao validar assinatura digital:', error);
      return false;
    }
  }

  // 👥 Team Management
  getTeams(): Team[] {
    try {
      const stored = localStorage.getItem(this.STORAGE_KEYS.TEAMS);
      return stored ? JSON.parse(stored) : [];
    } catch (error) {
      logger.error('Erro ao carregar equipes:', error);
      return [];
    }
  }

  createTeam(name: string, description: string, leadUserId: string, members: string[] = []): Team {
    try {
      const team: Team = {
        id: `team_${Date.now()}`,
        name,
        description,
        members: [...members, leadUserId],
        lead: leadUserId,
        permissions: [],
        createdAt: new Date().toISOString(),
        isActive: true
      };

      const teams = this.getTeams();
      teams.push(team);
      this.saveTeams(teams);

      this.logAction('team_created', 'teams', team.id, {
        name,
        leadUserId,
        membersCount: team.members.length
      });

      return team;
    } catch (error) {
      logger.error('Erro ao criar equipe:', error);
      throw error;
    }
  }

  updateTeam(teamId: string, updates: Partial<Team>): boolean {
    try {
      const teams = this.getTeams();
      const index = teams.findIndex(t => t.id === teamId);

      if (index === -1) return false;

      teams[index] = { ...teams[index], ...updates };
      this.saveTeams(teams);

      this.logAction('team_updated', 'teams', teamId, { updates });
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar equipe:', error);
      return false;
    }
  }

  addUserToTeam(teamId: string, userId: string): boolean {
    try {
      const teams = this.getTeams();
      const team = teams.find(t => t.id === teamId);

      if (!team || team.members.includes(userId)) return false;

      team.members.push(userId);
      this.saveTeams(teams);

      this.logAction('user_added_to_team', 'teams', teamId, { userId });
      return true;
    } catch (error) {
      logger.error('Erro ao adicionar usuário à equipe:', error);
      return false;
    }
  }

  removeUserFromTeam(teamId: string, userId: string): boolean {
    try {
      const teams = this.getTeams();
      const team = teams.find(t => t.id === teamId);

      if (!team) return false;

      team.members = team.members.filter(id => id !== userId);
      this.saveTeams(teams);

      this.logAction('user_removed_from_team', 'teams', teamId, { userId });
      return true;
    } catch (error) {
      logger.error('Erro ao remover usuário da equipe:', error);
      return false;
    }
  }

  getUserTeams(userId: string): Team[] {
    return this.getTeams().filter(team => team.members.includes(userId));
  }

  // ⚙️ User Preferences
  updateUserPreferences(userId: string, preferences: Partial<UserPreferences>): boolean {
    try {
      const users = this.getUsers();
      const user = users.find(u => u.id === userId);

      if (!user) return false;

      user.preferences = { ...user.preferences, ...preferences };
      this.saveUsers(users);

      this.logAction('preferences_updated', 'users', userId, { preferences });
      return true;
    } catch (error) {
      logger.error('Erro ao atualizar preferências:', error);
      return false;
    }
  }

  // 📊 User Analytics
  getUserStats(): {
    totalUsers: number;
    activeUsers: number;
    usersByRole: Record<string, number>;
    recentLogins: number;
    totalTeams: number;
  } {
    const users = this.getUsers();
    const teams = this.getTeams();
    const logs = this.getAuditLogs();

    const activeUsers = users.filter(u => u.isActive).length;
    const usersByRole: Record<string, number> = {};

    users.forEach(user => {
      const roleName = user.role.name;
      usersByRole[roleName] = (usersByRole[roleName] || 0) + 1;
    });

    const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const recentLogins = logs.filter(log =>
      log.action === 'user_login' &&
      new Date(log.timestamp) > oneDayAgo
    ).length;

    return {
      totalUsers: users.length,
      activeUsers,
      usersByRole,
      recentLogins,
      totalTeams: teams.length
    };
  }

  // 🏗️ Initialization Methods
  private initializeDefaultUsers(): User[] {
    const adminRole = this.getRoles().find(r => r.level >= 5) || this.initializeDefaultRoles()[0];

    const defaultUsers: User[] = [
      {
        id: 'user_admin',
        email: 'admin@ferraco.com.br',
        name: 'Administrador',
        role: adminRole,
        isActive: true,
        permissions: adminRole.permissions.map(permName => this.getPermissionByName(permName)).filter(Boolean) as Permission[],
        teams: [],
        createdAt: new Date().toISOString(),
        preferences: this.getDefaultPreferences()
      }
    ];

    this.saveUsers(defaultUsers);
    return defaultUsers;
  }

  private initializeDefaultRoles(): UserRole[] {
    const defaultRoles: UserRole[] = [
      {
        id: 'role_admin',
        name: 'Administrador',
        description: 'Acesso completo ao sistema',
        level: 5,
        permissions: ['leads', 'reports', 'automations', 'tags', 'whatsapp', 'users', 'roles', 'audit', 'integrations'],
        canCreateUsers: true,
        canManageRoles: true,
        canViewAuditLogs: true
      },
      {
        id: 'role_manager',
        name: 'Gerente',
        description: 'Gestão de leads e equipe',
        level: 4,
        permissions: ['leads', 'reports', 'automations', 'tags', 'whatsapp', 'users'],
        canCreateUsers: true,
        canManageRoles: false,
        canViewAuditLogs: true
      },
      {
        id: 'role_sales',
        name: 'Vendedor',
        description: 'Gestão de leads próprios',
        level: 3,
        permissions: ['leads', 'whatsapp', 'tags'],
        canCreateUsers: false,
        canManageRoles: false,
        canViewAuditLogs: false
      },
      {
        id: 'role_viewer',
        name: 'Visualizador',
        description: 'Apenas visualização',
        level: 1,
        permissions: ['leads'],
        canCreateUsers: false,
        canManageRoles: false,
        canViewAuditLogs: false
      }
    ];

    this.saveRoles(defaultRoles);
    return defaultRoles;
  }

  private initializeDefaultPermissions(): Permission[] {
    const defaultPermissions: Permission[] = [
      {
        resource: 'leads',
        actions: ['create', 'read', 'update', 'delete', 'export']
      },
      {
        resource: 'reports',
        actions: ['read', 'create', 'export']
      },
      {
        resource: 'automations',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'tags',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'whatsapp',
        actions: ['read', 'send', 'configure']
      },
      {
        resource: 'users',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'roles',
        actions: ['read', 'create', 'update', 'delete']
      },
      {
        resource: 'audit',
        actions: ['read']
      },
      {
        resource: 'integrations',
        actions: ['read', 'create', 'update', 'delete', 'sync']
      }
    ];

    localStorage.setItem(this.STORAGE_KEYS.PERMISSIONS, JSON.stringify(defaultPermissions));
    return defaultPermissions;
  }

  private getDefaultPreferences(): UserPreferences {
    return {
      theme: 'light',
      language: 'pt-BR',
      timezone: 'America/Sao_Paulo',
      notifications: {
        email: {
          newLeads: true,
          leadUpdates: true,
          automationResults: false,
          weeklyReports: true,
          systemAlerts: true
        },
        push: {
          enabled: false,
          urgentLeads: true,
          assignedTasks: true,
          deadlines: true
        },
        inApp: {
          enabled: true,
          sound: false,
          desktop: true
        }
      },
      dashboard: 'default'
    };
  }

  // 💾 Storage Methods
  private saveUsers(users: User[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.USERS, JSON.stringify(users));
    } catch (error) {
      logger.error('Erro ao salvar usuários:', error);
    }
  }

  private saveRoles(roles: UserRole[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.ROLES, JSON.stringify(roles));
    } catch (error) {
      logger.error('Erro ao salvar roles:', error);
    }
  }

  private saveTeams(teams: Team[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.TEAMS, JSON.stringify(teams));
    } catch (error) {
      logger.error('Erro ao salvar equipes:', error);
    }
  }

  private saveDigitalSignatures(signatures: DigitalSignature[]): void {
    try {
      localStorage.setItem(this.STORAGE_KEYS.DIGITAL_SIGNATURES, JSON.stringify(signatures));
    } catch (error) {
      logger.error('Erro ao salvar assinaturas digitais:', error);
    }
  }

  // 🛠️ Utility Methods
  private getChanges(oldObj: any, newObj: any): Record<string, { from: any; to: any }> {
    const changes: Record<string, { from: any; to: any }> = {};

    Object.keys(newObj).forEach(key => {
      if (oldObj[key] !== newObj[key]) {
        changes[key] = { from: oldObj[key], to: newObj[key] };
      }
    });

    return changes;
  }

  // 🔄 Initialize
  initializeUserSystem(): void {
    try {
      // Initialize default data if needed
      this.getRoles();
      this.getAllPermissions();
      this.getUsers();

      // Set default admin user if no current user
      if (!this.getCurrentUser()) {
        const adminUser = this.getUsers().find(u => u.role.level >= 5);
        if (adminUser) {
          this.setCurrentUser(adminUser);
        }
      }

      logger.debug('✅ Sistema de usuários inicializado com sucesso');
    } catch (error) {
      logger.error('❌ Erro ao inicializar sistema de usuários:', error);
    }
  }
}

export const userStorage = new UserStorage();