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
  Wheat,
  FileCheck,
  History,
  Send,
  Scale,
  Building2,
  Check,
  Inbox,
  CheckCircle2,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
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
import { toast } from 'sonner';

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
  Wheat,
  FileCheck,
  History,
  Send,
  Scale,
  Inbox,
  CheckCircle2,
};

interface Tenant {
  id: string;
  name: string;
  tier: 'tier1' | 'tier2' | 'tier3' | 'tier4';
  logo_initial: string;
  demo_email: string;
  tenant_id: string;
}

const demoTenants: Tenant[] = [
  {
    id: 'org-exporter',
    name: 'Green Valley Exports',
    tier: 'tier2',
    logo_initial: 'GV',
    demo_email: 'exporter@tracebud.com',
    tenant_id: 'tenant_brazil_001',
  },
  {
    id: 'org-coop',
    name: 'Kivu Producers Cooperative',
    tier: 'tier1',
    logo_initial: 'KP',
    demo_email: 'cooperative@tracebud.com',
    tenant_id: 'tenant_rwanda_001',
  },
  {
    id: 'org-importer',
    name: 'EU Coffee Importers Ltd',
    tier: 'tier3',
    logo_initial: 'EC',
    demo_email: 'importer@tracebud.com',
    tenant_id: 'tenant_germany_001',
  },
  {
    id: 'org-sponsor',
    name: 'Tracebud Sponsor Network',
    tier: 'tier4',
    logo_initial: 'TS',
    demo_email: 'sponsor@tracebud.com',
    tenant_id: 'tenant_sponsor_001',
  },
];

const tierLabels: Record<Tenant['tier'], string> = {
  tier1: 'Producer',
  tier2: 'Supplier',
  tier3: 'Buyer',
  tier4: 'Sponsor',
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole, impersonateDemo } = useAuth();

  const navItems = getVisibleNavItems(user);
  const secondaryNavItems = getVisibleSecondaryNavItems(user);
  const hasMultipleRoles = user && user.roles.length > 1;

  const activeTenant =
    demoTenants.find((tenant) => tenant.tenant_id === user?.tenant_id) ??
    demoTenants.find((tenant) => tenant.demo_email === user?.email) ??
    demoTenants[0];
  const hasMultipleTenants = demoTenants.length > 1;

  const handleTenantSwitch = async (tenant: Tenant) => {
    try {
      await impersonateDemo(tenant.demo_email);
      toast.success(`Switched organization to ${tenant.name}.`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to switch organization.');
    }
  };

  return (
    <aside className="flex h-screen w-64 flex-col" style={{ backgroundColor: '#064E3B' }}>

      {/* Logo */}
      <div className="flex h-16 items-center gap-3 px-5 flex-shrink-0">
        <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white flex-shrink-0 shadow-sm">
          <Image
            src="/tracebud-logo-v6.png"
            alt="Tracebud"
            width={28}
            height={28}
            className="rounded-md"
          />
        </div>
        <div className="flex flex-col min-w-0">
          <span className="text-[15px] font-semibold text-white leading-tight">Tracebud</span>
          <span className="text-[11px] text-white/50 leading-tight">EUDR Platform</span>
        </div>
      </div>

      <div className="mx-4 h-px bg-white/10" />

      {/* Tenant Context Switcher */}
      <div className="px-3 py-3 flex-shrink-0">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              className={cn(
                'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors',
                'bg-white/5 hover:bg-white/10 border border-white/10'
              )}
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold flex-shrink-0">
                {activeTenant.logo_initial}
              </div>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-white">
                  {activeTenant.name}
                </span>
                <span className="truncate text-[10px] text-white/50">
                  {tierLabels[activeTenant.tier]}
                </span>
              </div>
              {hasMultipleTenants && (
                <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/40" />
              )}
            </button>
          </DropdownMenuTrigger>
          {hasMultipleTenants && (
            <DropdownMenuContent align="start" className="w-64">
              <DropdownMenuLabel className="flex items-center gap-2">
                <Building2 className="h-4 w-4" />
                Switch organization
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              {demoTenants.map((tenant) => (
                <DropdownMenuItem
                  key={tenant.id}
                  className="flex items-center gap-3 py-2.5 cursor-pointer"
                  onClick={() => {
                    void handleTenantSwitch(tenant);
                  }}
                >
                  <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold flex-shrink-0">
                    {tenant.logo_initial}
                  </div>
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium">
                      {tenant.name}
                    </span>
                    <span className="truncate text-xs text-muted-foreground">
                      {tierLabels[tenant.tier]}
                    </span>
                  </div>
                  {tenant.id === activeTenant.id && (
                    <Check className="h-4 w-4 text-emerald-600 flex-shrink-0" />
                  )}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          )}
        </DropdownMenu>
      </div>

      {/* Role indicator */}
      {user && (
        <div className="px-3 pb-3 flex-shrink-0">
          <div className="flex items-center justify-between rounded-md bg-white/10 px-3 py-2.5">
            <div className="flex flex-col gap-1">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                Active role
              </span>
              <RoleBadge role={user.active_role} size="sm" />
            </div>
            {hasMultipleRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/60 hover:bg-white/10 hover:text-white"
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>Switch role</DropdownMenuLabel>
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
      <nav className="flex-1 overflow-y-auto px-3 py-1">
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          Navigation
        </p>
        {navItems.map((item) => {
          const isActive = pathname === item.href ||
            (item.href !== '/' && pathname.startsWith(item.href));
          const Icon = iconMap[item.icon] || LayoutDashboard;

          return (
            <Link
              key={item.name}
              href={item.href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5',
                isActive
                  ? 'bg-white/20 text-white shadow-sm'
                  : 'text-white/75 hover:bg-white/10 hover:text-white'
              )}
            >
              <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-white/60')} />
              {item.name}
            </Link>
          );
        })}

        {secondaryNavItems.length > 0 && (
          <>
            <div className="my-3 mx-3 h-px bg-white/10" />
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              Support
            </p>
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = iconMap[item.icon] || Settings;

              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5',
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-white/60')} />
                  {item.name}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/10">
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-white">
                  {user?.name || 'Guest'}
                </span>
                <span className="truncate text-[11px] text-white/50">
                  {user?.email || 'Not logged in'}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/40" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href="/settings">
                <Settings className="mr-2 h-4 w-4" />
                Account settings
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              Log out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
