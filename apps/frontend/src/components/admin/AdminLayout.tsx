import { ReactNode, useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import {
  Home, Users, BarChart3, ArrowLeft, Moon, Sun, Bell,
  MessageCircle, FileText, Bot, KeyRound, Palette, Send,
  Repeat, LogOut, User, ChevronRight, Clock, Menu
} from 'lucide-react';
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
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
  useSidebar,
} from '@/components/ui/sidebar';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { useAuth, usePermissions, useSession } from '@/hooks/useAuth';
import { useInactivityTimer } from '@/hooks/useInactivityTimer';
import InactivityWarningModal from '@/components/InactivityWarningModal';
import { leadStorage } from '@/utils/leadStorage';
import { logger } from '@/lib/logger';
import { BottomNavigation } from '@/components/mobile/BottomNavigation';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  return (
    <SidebarProvider defaultOpen={true}>
      <AdminLayoutContent>{children}</AdminLayoutContent>
    </SidebarProvider>
  );
};

const AdminLayoutContent = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { theme, toggleTheme } = useTheme();
  const { user, logout } = useAuth();
  const { hasPermission, hasRole, isAdmin } = usePermissions();
  const { sessionInfo } = useSession();
  const [showSessionWarning, setShowSessionWarning] = useState(false);
  const { isMobile, toggleSidebar } = useSidebar();

  // DEMO MODE: Mock user for demo purposes
  const demoUser = user || {
    id: 'demo',
    name: 'Usuário Demo',
    email: 'demo@ferraco.com',
    role: 'admin',
    permissions: []
  };

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
      href: '/admin/whatsapp-automations',
      label: 'Automações WA',
      icon: Send,
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
    {
      href: '/admin/recurrence/dashboard',
      label: 'Recorrência',
      icon: Repeat,
      show: true
    },
    {
      href: '/admin/api-keys',
      label: 'API Externa',
      icon: KeyRound,
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
  }, [sessionInfo.isExpiringSoon]);

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
    <>
      {/* Responsive Sidebar */}
      <Sidebar collapsible="offcanvas">
        <SidebarHeader className="border-b border-sidebar-border">
          <div className="flex items-center gap-2 px-4 py-2">
            <BarChart3 className="h-6 w-6 text-primary" />
            <div className="flex flex-col">
              <span className="text-sm font-bold text-sidebar-foreground">Ferraco CRM</span>
              <span className="text-xs text-muted-foreground">Admin Panel</span>
            </div>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarMenu>
            {navItems.map((item) => {
              const Icon = item.icon;
              const isActive = location.pathname === item.href;

              return (
                <SidebarMenuItem key={item.href}>
                  <SidebarMenuButton
                    asChild
                    isActive={isActive}
                    tooltip={item.label}
                    onClick={() => isMobile && toggleSidebar()}
                  >
                    <Link to={item.href} className="flex items-center justify-between w-full">
                      <div className="flex items-center gap-3">
                        <Icon className="h-4 w-4" />
                        <span>{item.label}</span>
                      </div>
                      {item.badge && (
                        <Badge
                          variant={item.badgeVariant}
                          className="ml-auto text-xs"
                        >
                          {item.badge}
                        </Badge>
                      )}
                    </Link>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border">
          {/* Keyboard shortcuts - Hidden on mobile */}
          <div className="hidden md:block p-3 bg-muted/50 rounded-lg text-xs text-muted-foreground mx-2 mb-2">
            <div className="font-medium mb-2">Atalhos:</div>
            <div className="space-y-1">
              <div>Ctrl+D - Dashboard</div>
              <div>Ctrl+L - Leads</div>
              <div>Ctrl+W - WhatsApp</div>
              <div>Ctrl+K - Tema</div>
            </div>
          </div>
        </SidebarFooter>
      </Sidebar>

      {/* Main Content Area */}
      <SidebarInset className="overflow-x-hidden">
        <div className="min-h-screen bg-background max-w-full overflow-x-hidden">
          {/* Session Warning Alert */}
          {showSessionWarning && sessionInfo.isExpiringSoon && (
            <Alert className="m-4 border-amber-200 bg-amber-50 dark:border-amber-800 dark:bg-amber-950">
              <Clock className="h-4 w-4 text-amber-600" />
              <AlertDescription className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                <span className="text-amber-800 dark:text-amber-200 text-sm">
                  Sua sessão expira em {Math.ceil((sessionInfo.timeUntilExpiration || 0) / 60000)} minutos.
                  Salve seu trabalho.
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => setShowSessionWarning(false)}
                  className="shrink-0"
                >
                  Entendi
                </Button>
              </AlertDescription>
            </Alert>
          )}

          {/* Mobile-First Header */}
          <header className="sticky top-0 z-10 bg-card shadow-sm border-b border-border max-w-full overflow-x-hidden">
            <div className="flex items-center gap-2 px-4 py-3 max-w-full overflow-x-hidden">
              {/* Mobile Menu Toggle */}
              <SidebarTrigger className="md:hidden" />

              {/* Title + Alerts */}
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <h1 className="text-lg md:text-2xl font-bold text-primary truncate">
                  Painel Admin
                </h1>
                {alertCount > 0 && (
                  <Badge variant="destructive" className="hidden sm:flex animate-pulse shrink-0">
                    <Bell size={12} className="mr-1" />
                    {alertCount}
                  </Badge>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 sm:gap-2 shrink-0">
                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm" className="gap-2">
                      <Avatar className="h-7 w-7">
                        <AvatarFallback className={cn('text-xs font-medium', getRoleColor(demoUser.role))}>
                          {demoUser.name.substring(0, 2).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="text-left hidden lg:block">
                        <div className="text-xs font-medium">{demoUser.name}</div>
                        <div className="text-[10px] text-muted-foreground">
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
                  className="h-9 w-9"
                  title={`Alterar tema (Ctrl+K)`}
                >
                  <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
                  <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
                  <span className="sr-only">Alternar tema</span>
                </Button>

                {/* Back to Site - Hidden on mobile */}
                <Button variant="outline" size="sm" asChild className="hidden sm:flex">
                  <Link to="/" className="gap-2">
                    <ArrowLeft size={14} />
                    <span className="hidden lg:inline">Voltar ao Site</span>
                  </Link>
                </Button>
              </div>
            </div>

            {/* Breadcrumbs - Hidden on mobile */}
            <div className="hidden md:flex items-center gap-2 px-4 pb-3 text-sm text-muted-foreground overflow-x-auto">
              {breadcrumbs.map((crumb, index) => (
                <div key={crumb.href} className="flex items-center shrink-0">
                  {index > 0 && <ChevronRight className="w-3 h-3 mx-1" />}
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
          </header>

          {/* Main Content with responsive padding + bottom nav spacing */}
          <main className="p-4 md:p-6 pb-20 md:pb-6 max-w-full overflow-x-hidden">
            {children}
          </main>
        </div>
      </SidebarInset>

      {/* Bottom Navigation - Mobile Only */}
      <BottomNavigation />

      {/* Inactivity Warning Modal */}
      <InactivityWarningModal
        isOpen={false} // Disabled in demo mode
        timeRemaining={inactivityTimer.timeRemaining}
        totalWarningTime={5 * 60 * 1000}
        onExtendSession={inactivityTimer.extendSession}
        onLogout={inactivityTimer.handleTimeout}
        userName={demoUser.name}
      />
    </>
  );
};

export default AdminLayout;
