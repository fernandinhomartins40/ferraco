import { ReactNode, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Home, Users, BarChart3, ArrowLeft, Moon, Sun, Bell, Settings, Tags, MessageCircle, Zap, FileText, Brain, Target, Link, Shield, Separator } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import { useTheme } from '@/contexts/ThemeContext';
import { leadStorage } from '@/utils/leadStorage';

interface AdminLayoutProps {
  children: ReactNode;
}

const AdminLayout = ({ children }: AdminLayoutProps) => {
  const location = useLocation();
  const { theme, toggleTheme } = useTheme();

  const stats = leadStorage.getAdvancedStats();
  const alertCount = stats.oldLeadsCount;

  const navItems = [
    // CORE - Funcionalidades Principais
    { href: '/admin', label: 'Dashboard', icon: BarChart3, section: 'core' },
    {
      href: '/admin/leads',
      label: 'Leads',
      icon: Users,
      badge: alertCount > 0 ? alertCount : undefined,
      badgeVariant: 'destructive' as const,
      section: 'core'
    },

    // FASE 2 - Automação e Comunicação
    { href: '/admin/tags', label: 'Tags', icon: Tags, section: 'phase2' },
    { href: '/admin/whatsapp', label: 'WhatsApp', icon: MessageCircle, section: 'phase2' },
    { href: '/admin/automations', label: 'Automações', icon: Zap, section: 'phase2' },
    { href: '/admin/reports', label: 'Relatórios', icon: FileText, section: 'phase2' },

    // FASE 3 - Recursos Avançados
    { href: '/admin/ai', label: 'IA & Analytics', icon: Brain, section: 'phase3', isNew: true },
    { href: '/admin/crm', label: 'CRM & Pipeline', icon: Target, section: 'phase3', isNew: true },
    { href: '/admin/integrations', label: 'Integrações', icon: Link, section: 'phase3', isNew: true },
    { href: '/admin/users', label: 'Usuários', icon: Shield, section: 'phase3', isNew: true },
  ];

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
          case 'a':
            e.preventDefault();
            window.location.href = '/admin/automations';
            break;
          case 'r':
            e.preventDefault();
            window.location.href = '/admin/reports';
            break;
          // Fase 3 - Atalhos Avançados
          case 'i':
            e.preventDefault();
            window.location.href = '/admin/ai';
            break;
          case 'c':
            e.preventDefault();
            window.location.href = '/admin/crm';
            break;
          case 'g':
            e.preventDefault();
            window.location.href = '/admin/integrations';
            break;
          case 'u':
            e.preventDefault();
            window.location.href = '/admin/users';
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
            <div className="flex items-center space-x-2">
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
              <Button variant="outline" asChild>
                <Link to="/" className="flex items-center space-x-2">
                  <ArrowLeft size={16} />
                  <span>Voltar ao Site</span>
                </Link>
              </Button>
            </div>
          </div>
        </div>
      </header>

      <div className="flex">
        {/* Sidebar */}
        <aside className="w-64 bg-card shadow-sm border-r border-border min-h-[calc(100vh-73px)] transition-colors duration-300">
          <nav className="p-4">
            <ul className="space-y-1">
              {/* Core Section */}
              {navItems.filter(item => item.section === 'core').map((item) => {
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

              {/* Separator */}
              <li className="py-2">
                <div className="border-t border-border/50"></div>
              </li>

              {/* Phase 2 Section */}
              <li className="px-3 py-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Automação</span>
              </li>
              {navItems.filter(item => item.section === 'phase2').map((item) => {
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

              {/* Separator */}
              <li className="py-2">
                <div className="border-t border-border/50"></div>
              </li>

              {/* Phase 3 Section */}
              <li className="px-3 py-1">
                <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center">
                  🚀 Recursos Avançados
                  <Badge variant="secondary" className="ml-2 text-[10px] px-1.5 py-0.5">NOVO</Badge>
                </span>
              </li>
              {navItems.filter(item => item.section === 'phase3').map((item) => {
                const Icon = item.icon;
                const isActive = location.pathname === item.href;

                return (
                  <li key={item.href}>
                    <Link
                      to={item.href}
                      className={cn(
                        "flex items-center justify-between px-3 py-2 rounded-lg transition-all duration-200 group relative",
                        isActive
                          ? "bg-primary text-primary-foreground shadow-sm"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground hover:shadow-sm"
                      )}
                    >
                      <div className="flex items-center space-x-3">
                        <Icon size={20} className="transition-transform group-hover:scale-110" />
                        <span className="font-medium">{item.label}</span>
                      </div>
                      {item.isNew && (
                        <Badge variant="outline" className="text-[10px] px-1.5 py-0.5 bg-gradient-to-r from-blue-500 to-purple-500 text-white border-0">
                          NOVO
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
                  <div>Ctrl+A - Automações</div>
                  <div>Ctrl+R - Relatórios</div>
                  <div className="border-t border-border/30 pt-1 mt-1">
                    <div className="text-blue-400 font-medium">🚀 Fase 3:</div>
                  </div>
                  <div>Ctrl+I - IA & Analytics</div>
                  <div>Ctrl+C - CRM & Pipeline</div>
                  <div>Ctrl+G - Integrações</div>
                  <div>Ctrl+U - Usuários</div>
                  <div className="border-t border-border/30 pt-1 mt-1">
                    <div>Ctrl+K - Alternar tema</div>
                  </div>
                </div>
              </div>
            </div>
          </nav>
        </aside>

        {/* Main Content */}
        <main className="flex-1 p-6">
          {children}
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;