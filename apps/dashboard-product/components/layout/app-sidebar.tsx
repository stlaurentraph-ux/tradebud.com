'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  FileText,
  Settings,
  HelpCircle,
  ChevronDown,
  LogOut,
  ShieldCheck,
  RefreshCw,
  Shield,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/lib/auth-context';
import { getVisibleNavItems, getVisibleSecondaryNavItems, getRoleDisplayName } from '@/lib/rbac';
import { RoleBadge } from '@/components/common/role-badge';
import type { TenantRole } from '@/types';

// Icon mapping
const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  FileText,
  Settings,
  HelpCircle,
  ShieldCheck,
  Shield,
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();

  const navItems = getVisibleNavItems(user);
  const secondaryNavItems = getVisibleSecondaryNavItems(user);
  const hasMultipleRoles = user && user.roles.length > 1;

  return (
    <aside className="flex h-screen w-64 flex-col bg-[#064E3B]">
      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-6">
        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white/95 flex-shrink-0">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={32}
            height={32}
            className="rounded-md"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-sm font-semibold text-white truncate">Tracebud</span>
          <span className="text-xs text-emerald-200 truncate">EUDR Platform</span>
        </div>
      </div>

      <Separator className="bg-white/10" />

      {/* Role indicator */}
      {user && (
        <div className="px-4 py-3">
          <div className="flex items-center justify-between rounded-lg bg-white/10 px-3 py-2">
            <div className="flex flex-col gap-1">
              <span className="text-xs font-semibold text-white">Active Role</span>
              <RoleBadge role={user.active_role} size="sm" />
            </div>
            {hasMultipleRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-200 hover:bg-white/10 hover:text-white">
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Switch Role</DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuRadioGroup
                    value={user.active_role}
                    onValueChange={(value) => switchRole(value as TenantRole)}
                  >
                    {user.roles.map((role) => (
                      <DropdownMenuRadioItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-2">
        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-emerald-300">
          Main
        </div>
        {navItems.map((item) => {
          const isActive = pathname === item.href || 
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = iconMap[item.icon] || LayoutDashboard;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}

        <Separator className="my-4 bg-white/10" />

        <div className="mb-2 px-3 text-xs font-medium uppercase tracking-wider text-emerald-300">
          Support
        </div>
        {secondaryNavItems.map((item) => {
          const isActive = pathname === item.href;
          const Icon = iconMap[item.icon] || Settings;
          
          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors',
                isActive
                  ? 'bg-emerald-500 text-white'
                  : 'text-emerald-100 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className="h-4 w-4" />
              {item.name}
            </Link>
          );
        })}
      </nav>

      {/* User Section */}
      <div className="border-t border-white/10 p-3">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" className="w-full justify-start gap-3 px-3 text-white hover:bg-white/10 hover:text-white">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-500 text-white text-xs">
                  {user?.name ? user.name[0].toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex flex-1 flex-col items-start text-left">
                <span className="text-sm font-medium text-white">
                  {user?.name || 'Guest'}
                </span>
                <span className="text-xs text-emerald-300">
                  {user?.email || 'Not logged in'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 text-emerald-300" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Account Settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
