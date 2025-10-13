import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { Home, Users, BarChart3, ArrowLeft, Moon, Sun, Bell, Settings, Tags, MessageCircle, Zap, FileText, Brain, Target, LinkIcon, Shield, LogOut, User, ChevronRight, Clock, AlertTriangle, Bot, KeyRound, Palette } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, usePermissions, useSession } from '@/hooks/useAuth';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import { ConditionalRender } from '@/components/ProtectedRoute';
import InactivityWarningModal from '@/components/InactivityWarningModal';
import { leadStorage } from '@/utils/leadStorage';
import { logger } from '@/lib/logger';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { hasPermission, hasRole, isAdmin } = usePermissions();
  const { sessionInfo } = useSession();
  const [showSessionWarning, setShowSessionWarning] = useState(false);

  // DEMO MODE: Mock user for demo purposes
  const demoUser = user || {
    id: 'demo',
    name: 'Usuário Demo',
    email: 'demo@ferraco.com',
    role: 'admin',
    permissions: []
  };

  // Mock permission checks for demo mode
  const demoHasPermission = () => true;
  const demoIsAdmin = () => true;

  // Inactivity timer with 30-minute timeout and 5-minute warning
  const inactivityTimer = useInactivityTimer({
    timeout: 30 * 60 * 1000, // 30 minutes
    warningTime: 5 * 60 * 1000, // 5 minutes warning
    enabled: false, // Disabled in demo mode
    onWarning: () => {
      logger.debug('⚠️ Aviso de inatividade ativado');
    },
    onTimeout: () => {
      logger.debug('🔒 Logout por inatividade executado');
    }
  });

  const stats = leadStorage.getAdvancedStats();
  const alertCount = stats.oldLeadsCount;

  // Navigation items - Simplified menu
  const navItems = [
    {
      href: '/admin',
      label: 'Dashboard',
      icon: BarChart3,
      show: true
    },
    {
      href: '/admin/leads',
      label: 'Leads',
      icon: Users,
      badge: alertCount > 0 ? alertCount : undefined,
      badgeVariant: 'destructive' as const,
      show: true
    },
    {
      href: '/admin/whatsapp',
      label: 'WhatsApp',
      icon: MessageCircle,
      show: true
    },
    {
      href: '/admin/reports',
      label: 'Relatórios',
      icon: FileText,
      show: true
    },
    {
      href: '/admin/landing-page',
      label: 'Landing Page',
      icon: Palette,
      show: true
    },
    {
      href: '/admin/chatbot-config',
      label: 'Chat',
      icon: Bot,
      show: true
    },
  ].filter(item => item.show);

  // Breadcrumb generation
  const getBreadcrumbs = () => {
    const pathSegments = location.pathname.split('/').filter(Boolean);
    const breadcrumbs = [{ label: 'Início', href: '/' }];

    if (pathSegments.length > 0 && pathSegments[0] === 'admin') {
      breadcrumbs.push({ label: 'Admin', href: '/admin' });

      if (pathSegments.length > 1) {
        const currentPage = navItems.find(item => item.href === location.pathname);
        if (currentPage) {
          breadcrumbs.push({ label: currentPage.label, href: location.pathname });
        }
      }
    }

    return breadcrumbs;
  };

  const breadcrumbs = getBreadcrumbs();

  // User role display
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

  // Handle logout
  const handleLogout = () => {
    logout();
    navigate('/');
  };

  // Session warning effect
  useEffect(() => {
    if (sessionInfo.isExpiringSoon && !showSessionWarning) {
      setShowSessionWarning(true);
    }
  }, [sessionInfo.isExpiringSoon]); // Removed showSessionWarning from deps to prevent loop

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.ctrlKey || e.metaKey) {
        switch (e.key) {
          case 'd':
            e.preventDefault();
            window.location.href = '/admin';
            break;
          case 'l':
            e.preventDefault();
            window.location.href = '/admin/leads';
            break;
          case 't':
            e.preventDefault();
            window.location.href = '/admin/tags';
            break;
          case 'w':
            e.preventDefault();
            window.location.href = '/admin/whatsapp';
            break;
          case 'r':
            e.preventDefault();
            window.location.href = '/admin/reports';
            break;
          case 'k':
            e.preventDefault();
            toggleTheme();
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [toggleTheme]);

  return (
    <div className="min-h-screen bg-background transition-colors duration-300">
      {/* Session Warning Alert */}
      {showSessionWarning && sessionInfo.isExpiringSoon && (
        <Alert className="m-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
          <Clock className="h-4 w-4 text-amber-600" />
          <AlertDescription className="flex items-center justify-between">
            <span className="text-amber-800 dark:text-amber-200">
              Sua sessão expira em {Math.ceil((sessionInfo.timeUntilExpiration || 0) / 60000)} minutos.
              Salve seu trabalho.
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => setShowSessionWarning(false)}
              className="ml-4"
            >
              Entendi
            </Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Header */}
      <header className="bg-card shadow-sm border-b border-border transition-colors duration-300">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <h1 className="text-2xl font-bold text-primary">
                Painel Administrativo
              </h1>
              {alertCount > 0 && (
                <Badge variant="destructive" className="animate-pulse">
                  <Bell size={12} className="mr-1" />
                  {alertCount} leads antigos
                </Badge>
              )}
            </div>

            {/* User Info and Actions */}
            <div className="flex items-center space-x-4">
              {/* User Dropdown Menu */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="flex items-center space-x-2 hover:bg-muted">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className={cn('text-sm font-medium', getRoleColor(demoUser.role))}>
                        {demoUser.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div className="text-left hidden sm:block">
                      <div className="text-sm font-medium">{demoUser.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {getRoleDisplayName(demoUser.role)}
                      </div>
                    </div>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuLabel>
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{demoUser.name}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {demoUser.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={() => navigate('/admin/profile')}>
                    <User className="mr-2 h-4 w-4" />
                    <span>Meu Perfil</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate('/admin/profile?tab=password')}>
                    <KeyRound className="mr-2 h-4 w-4" />
                    <span>Trocar Senha</span>
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive focus:text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Sair</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>

              {/* Theme Toggle */}
              <Button
                variant="ghost"
                size="icon"
                onClick={toggleTheme}
                className="relative group"
                title={`Alterar para tema ${theme === 'light' ? 'escuro' : 'claro'} (Ctrl+K)`}
              >
                <Sun className="h-[1.2rem] w-[1.2rem] rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                <Moon className="absolute h-[1.2rem] w-[1.2rem] rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                <span className="sr-only">Alternar tema</span>
              </Button>

              {/* Back to Site */}
              <Button variant="outline" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft size={16} />
                  <span className="hidden sm:inline">Voltar ao Site</span>
                </Link>
              </Button>
            </div>
          </div>

          {/* Breadcrumbs */}
          <div className="mt-3 flex items-center space-x-2 text-sm text-muted-foreground">
            {breadcrumbs.map((crumb, index) => (
              <div key={crumb.href} className="flex items-center">
                {index > 0 && <ChevronRight className="w-4 h-4 mx-2" />}
                {index === breadcrumbs.length - 1 ? (
                  <span className="font-medium text-foreground">{crumb.label}</span>
                ) : (
                  <Link
                    to={crumb.href}
                    className="hover:text-foreground transition-colors"
                  >
                    {crumb.label}
                  </Link>
                )}
              </div>
            ))}
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card shadow-sm border-r border-border min-h-[calc(100vh-73px)] transition-colors duration-300">
          <nav className="p-4">
            <ul className="space-y-1">
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} className="transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant}
                          className="text-xs animate-pulse"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </li>
                );
              })}
            </ul>

            {/* Keyboard shortcuts info */}
            <div className="mt-6 p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground">
              <div className="font-medium mb-2">Atalhos de teclado:</div>
              <div className="space-y-1">
                <div className="grid grid-cols-1 gap-1">
                  <div>Ctrl+D - Dashboard</div>
                  <div>Ctrl+L - Leads</div>
                  <div>Ctrl+T - Tags</div>
                  <div>Ctrl+W - WhatsApp</div>
                  <div>Ctrl+R - Relatórios</div>
                  <div className="border-t border-border/30 pt-1 mt-1">
                    <div>Ctrl+K - Alternar tema</div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6 overflow-x-hidden">
          {children}
        </main>
      </div>

      {/* Inactivity Warning Modal - Disabled in demo mode */}
      <InactivityWarningModal
        isOpen={false} // Disabled in demo mode
        timeRemaining={inactivityTimer.timeRemaining}
        totalWarningTime={5 * 60 * 1000} // 5 minutes
        onExtendSession={inactivityTimer.extendSession}
        onLogout={inactivityTimer.handleTimeout}
        userName={demoUser.name}
      />
    </div>
  );
};

export default AdminLayout;