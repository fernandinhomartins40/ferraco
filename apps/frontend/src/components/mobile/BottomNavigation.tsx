/**
 * BottomNavigation - Navegação inferior mobile (iOS/Android padrão)
 *
 * Guidelines:
 * - iOS: 49pt height (~56px)
 * - Android: 56dp height (~56px)
 * - 3-5 itens principais
 * - Touch target: 48x48 dp mínimo
 * - Sempre visível (não esconder ao scroll)
 * - Estado ativo com cor primária
 */

import { Link, useLocation } from 'react-router-dom';
import { BarChart3, Users, MessageCircle, FileText, MoreVertical } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Separator } from '@/components/ui/separator';
import {
  Send,
  Palette,
  Bot,
  Repeat,
  KeyRound,
  User,
  LogOut,
  Settings
} from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useNavigate } from 'react-router-dom';

interface NavItem {
  href: string;
  label: string;
  icon: React.ElementType;
  match?: RegExp; // Pattern para highlight (ex: /^\/admin\/whatsapp/)
}

const mainNavItems: NavItem[] = [
  {
    href: '/admin',
    label: 'Dashboard',
    icon: BarChart3,
    match: /^\/admin$/
  },
  {
    href: '/admin/leads',
    label: 'Leads',
    icon: Users,
    match: /^\/admin\/leads/
  },
  {
    href: '/admin/whatsapp',
    label: 'WhatsApp',
    icon: MessageCircle,
    match: /^\/admin\/whatsapp/
  },
  {
    href: '/admin/reports',
    label: 'Relatórios',
    icon: FileText,
    match: /^\/admin\/reports/
  },
];

const secondaryNavItems: NavItem[] = [
  {
    href: '/admin/whatsapp-automations',
    label: 'Automações WhatsApp',
    icon: Send,
  },
  {
    href: '/admin/landing-page',
    label: 'Landing Page',
    icon: Palette,
  },
  {
    href: '/admin/chatbot-config',
    label: 'Configuração Chatbot',
    icon: Bot,
  },
  {
    href: '/admin/recurrence/dashboard',
    label: 'Recorrência',
    icon: Repeat,
  },
  {
    href: '/admin/api-keys',
    label: 'API Externa',
    icon: KeyRound,
  },
];

export function BottomNavigation() {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout, user } = useAuth();

  const isActive = (item: NavItem) => {
    if (item.match) {
      return item.match.test(location.pathname);
    }
    return location.pathname === item.href;
  };

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg">
      <div className="flex items-center justify-around h-16">
        {mainNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px] transition-colors",
                "hover:bg-muted/50 rounded-lg",
                active && "text-primary"
              )}
            >
              <Icon className={cn(
                "h-6 w-6 transition-transform",
                active && "scale-110"
              )} />
              <span className={cn(
                "text-[10px] font-medium leading-none",
                active ? "text-primary" : "text-muted-foreground"
              )}>
                {item.label}
              </span>
            </Link>
          );
        })}

        {/* Menu "Mais" */}
        <Sheet>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 px-3 py-2 min-w-[64px]",
                "hover:bg-muted/50 rounded-lg transition-colors"
              )}
            >
              <MoreVertical className="h-6 w-6 text-muted-foreground" />
              <span className="text-[10px] font-medium leading-none text-muted-foreground">
                Mais
              </span>
            </button>
          </SheetTrigger>

          <SheetContent side="bottom" className="h-[80vh] p-0">
            <SheetHeader className="px-6 py-4 border-b">
              <SheetTitle>Menu Completo</SheetTitle>
            </SheetHeader>

            <div className="overflow-y-auto h-[calc(80vh-80px)]">
              {/* Secondary Navigation */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                  Outras Páginas
                </p>
                {secondaryNavItems.map((item) => {
                  const Icon = item.icon;
                  const active = isActive(item);

                  return (
                    <Link
                      key={item.href}
                      to={item.href}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 rounded-lg transition-colors",
                        active
                          ? "bg-primary text-primary-foreground"
                          : "hover:bg-muted"
                      )}
                    >
                      <Icon className="h-5 w-5" />
                      <span className="font-medium">{item.label}</span>
                    </Link>
                  );
                })}
              </div>

              <Separator className="my-2" />

              {/* User Actions */}
              <div className="p-4 space-y-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                  Conta
                </p>

                <Link
                  to="/admin/profile"
                  className="flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-muted transition-colors"
                >
                  <User className="h-5 w-5" />
                  <span className="font-medium">Meu Perfil</span>
                </Link>

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-destructive/10 text-destructive transition-colors"
                >
                  <LogOut className="h-5 w-5" />
                  <span className="font-medium">Sair</span>
                </button>
              </div>
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Safe area for iOS home indicator */}
      <div className="h-safe-area-inset-bottom bg-card" />
    </nav>
  );
}
