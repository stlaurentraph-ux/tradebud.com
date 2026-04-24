'use client';

import Link from 'next/link';
import Image from 'next/image';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  Building2,
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
  Inbox,
  Scale,
  Zap,
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
import { useSponsorViewControls } from '@/lib/sponsor-view';

const DEV_SWITCHABLE_ROLES: TenantRole[] = ['cooperative', 'exporter', 'importer', 'country_reviewer', 'sponsor'];

function isDevRoleSwitcherEnabled(): boolean {
  return process.env.NODE_ENV !== 'production' || process.env.NEXT_PUBLIC_DEV_ROLE_SWITCHER === 'true';
}

const iconMap: Record<string, typeof LayoutDashboard> = {
  LayoutDashboard,
  Package,
  MapPin,
  Users,
  Building2,
  FileText,
  Settings,
  HelpCircle,
  ShieldCheck,
  Shield,
  Wheat,
  FileCheck,
  History,
  Send,
  Inbox,
  Scale,
  Zap,
};

const ONBOARDING_NAV_KEY_BY_NAME: Record<string, string> = {
  Overview: 'overview',
  'DDS Packages': 'packages',
  Shipments: 'packages',
  'Lots & Batches': 'harvests',
  Harvests: 'harvests',
  Plots: 'plots',
  Members: 'farmers',
  'Field Operations': 'outreach',
  Farmers: 'farmers',
  Producers: 'farmers',
  Network: 'contacts',
  Evidence: 'fpic',
  Outreach: 'outreach',
  Campaigns: 'outreach',
  Inbox: 'inbox',
  Requests: 'inbox',
  Contacts: 'contacts',
  FPIC: 'fpic',
  Compliance: 'compliance',
  Issues: 'compliance',
  Governance: 'settings',
  Reporting: 'reports',
  Organisations: 'organisations',
  'Compliance Health': 'compliance',
  Programmes: 'programmes',
  'Delegated Admin': 'governance',
  'Billing & Coverage': 'packages',
  'Role Decisions': 'role-decisions',
};

export function AppSidebar() {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const { sponsorView, setSponsorView } = useSponsorViewControls();

  const navItems = getVisibleNavItems(user);
  const secondaryNavItems = getVisibleSecondaryNavItems(user);
  const showDevRoleSwitcher = isDevRoleSwitcherEnabled();
  const switchableRoles = user
    ? (showDevRoleSwitcher ? DEV_SWITCHABLE_ROLES : user.roles)
    : [];
  const hasMultipleRoles = user && switchableRoles.length > 1;
  const isSponsor = user?.active_role === 'sponsor';
  const withSponsorView = (href: string) => {
    if (!isSponsor) return href;
    const separator = href.includes('?') ? '&' : '?';
    return `${href}${separator}sponsorView=${sponsorView}`;
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

      {/* Tenant Context */}
      <div className="px-3 py-3 flex-shrink-0">
        <div
          className={cn(
            'flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left',
            'bg-white/5 border border-white/10'
          )}
        >
          <div className="flex h-8 w-8 items-center justify-center rounded-md bg-emerald-600 text-white text-xs font-bold flex-shrink-0">
            {(user?.tenant_id?.slice(0, 2) || 'TB').toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-white">
              {user?.tenant_id || 'Workspace'}
            </span>
            <span className="truncate text-[10px] text-white/50">
              Tracebud tenant
            </span>
          </div>
        </div>
      </div>

      {/* Role indicator */}
      {user && (
        <div className="px-3 pb-3 space-y-2 flex-shrink-0">
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
                    {switchableRoles.map((role) => (
                      <DropdownMenuRadioItem key={role} value={role}>
                        {getRoleDisplayName(role)}
                      </DropdownMenuRadioItem>
                    ))}
                  </DropdownMenuRadioGroup>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
          {isSponsor && (
            <div className="rounded-md bg-white/10 px-3 py-2">
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">Sponsor view</span>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSponsorView('country')}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    sponsorView === 'country' ? 'bg-white text-emerald-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  )}
                >
                  Country
                </button>
                <button
                  type="button"
                  onClick={() => setSponsorView('brand')}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    sponsorView === 'brand' ? 'bg-white text-emerald-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  )}
                >
                  Brand
                </button>
              </div>
            </div>
          )}
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
          // Derive a stable slug for spotlight targeting
          const onboardingAttr = item.href === '/'
            ? 'nav-overview'
            : `nav-${item.href.replace(/^\//, '').replace(/\//g, '-')}`;

          return (
            <Link
              key={item.name}
              href={withSponsorView(item.href)}
              data-onboarding={ONBOARDING_NAV_KEY_BY_NAME[item.name] ? `nav-${ONBOARDING_NAV_KEY_BY_NAME[item.name]}` : undefined}
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
                  href={withSponsorView(item.href)}
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
              <Link href={withSponsorView('/settings')}>
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
