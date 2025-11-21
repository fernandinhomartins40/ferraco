/**
 * MobileBottomNav - Navegação inferior para mobile
 * Padrão nativo de apps mobile com 5 itens principais
 */

import { Link, useLocation } from 'react-router-dom';
import {
  BarChart3,
  Users,
  MessageCircle,
  FileText,
  Menu,
  Home
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useState } from 'react';

interface NavItem {
  href: string;
  icon: any;
  label: string;
  badge?: number;
}

interface MobileBottomNavProps {
  alertCount?: number;
  secondaryNavItems?: NavItem[];
}

export const MobileBottomNav = ({ alertCount = 0, secondaryNavItems = [] }: MobileBottomNavProps) => {
  const location = useLocation();
  const [isMoreOpen, setIsMoreOpen] = useState(false);

  // Primary navigation items (bottom bar)
  const primaryNavItems: NavItem[] = [
    {
      href: '/admin',
      icon: Home,
      label: 'Início',
    },
    {
      href: '/admin/leads',
      icon: Users,
      label: 'Leads',
      badge: alertCount > 0 ? alertCount : undefined,
    },
    {
      href: '/admin/whatsapp',
      icon: MessageCircle,
      label: 'Chat',
    },
    {
      href: '/admin/reports',
      icon: FileText,
      label: 'Relatórios',
    },
  ];

  const isActive = (href: string) => {
    if (href === '/admin') {
      return location.pathname === href;
    }
    return location.pathname.startsWith(href);
  };

  return (
    <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-card border-t border-border z-50 safe-area-inset-bottom">
      <div className="flex items-center justify-around h-16 px-2">
        {/* Primary Navigation Items */}
        {primaryNavItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.href);

          return (
            <Link
              key={item.href}
              to={item.href}
              className={cn(
                'flex flex-col items-center justify-center flex-1 h-full relative transition-colors',
                active
                  ? 'text-primary'
                  : 'text-muted-foreground active:text-primary'
              )}
            >
              <div className="relative">
                <Icon
                  size={24}
                  className={cn(
                    'transition-transform',
                    active && 'scale-110'
                  )}
                />
                {item.badge && (
                  <Badge
                    variant="destructive"
                    className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
                  >
                    {item.badge > 9 ? '9+' : item.badge}
                  </Badge>
                )}
              </div>
              <span className={cn(
                'text-xs mt-1 font-medium',
                active && 'font-semibold'
              )}>
                {item.label}
              </span>
              {active && (
                <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-1 bg-primary rounded-full" />
              )}
            </Link>
          );
        })}

        {/* More Menu (Sheet) */}
        <Sheet open={isMoreOpen} onOpenChange={setIsMoreOpen}>
          <SheetTrigger asChild>
            <button className="flex flex-col items-center justify-center flex-1 h-full text-muted-foreground active:text-primary transition-colors">
              <Menu size={24} />
              <span className="text-xs mt-1 font-medium">Mais</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-[80vh] rounded-t-3xl">
            <SheetHeader className="mb-6">
              <SheetTitle>Menu Completo</SheetTitle>
            </SheetHeader>

            <div className="space-y-2 overflow-y-auto h-[calc(80vh-100px)]">
              {secondaryNavItems.map((item) => {
                const Icon = item.icon;
                const active = isActive(item.href);

                return (
                  <Link
                    key={item.href}
                    to={item.href}
                    onClick={() => setIsMoreOpen(false)}
                    className={cn(
                      'flex items-center gap-4 p-4 rounded-lg transition-colors',
                      active
                        ? 'bg-primary text-primary-foreground'
                        : 'hover:bg-muted active:bg-muted'
                    )}
                  >
                    <Icon size={24} />
                    <span className="font-medium">{item.label}</span>
                    {item.badge && (
                      <Badge variant="secondary" className="ml-auto">
                        {item.badge}
                      </Badge>
                    )}
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>

      {/* Safe area spacer for iOS */}
      <div className="h-[env(safe-area-inset-bottom)]" />
    </nav>
  );
};
