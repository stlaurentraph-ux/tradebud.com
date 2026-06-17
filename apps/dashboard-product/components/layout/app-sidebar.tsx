'use client';

import Link from 'next/link';
import { TracebudLogo } from '@/components/brand/tracebud-logo';
import { usePathname } from 'next/navigation';
import { useState } from 'react';
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
  ChevronRight,
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
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import {
  getVisibleNavSections,
  getVisibleSecondaryNavItems,
  getRoleDisplayName,
  type NavItem,
  type ResolvedNavSection,
} from '@/lib/rbac';
import { RoleBadge } from '@/components/common/role-badge';
import { DemoDataSidebarToggle } from '@/components/demo/demo-data-sidebar-toggle';
import { FreeTrialNavBadge } from '@/components/layout/free-trial-nav-badge';
import { translateNavItemName } from '@/lib/nav-labels';
import { getAppChromeCopy } from '@/lib/workflow-terminology-labels';
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

function translateNavLabel(name: string, t: (key: string) => string): string {
  return translateNavItemName(name, t);
}

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
  Suppliers: 'contacts',
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

function isNavItemActive(pathname: string, href: string): boolean {
  return pathname === href || (href !== '/' && pathname.startsWith(href));
}

function SidebarNavLink({
  item,
  pathname,
  withSponsorView,
  t,
}: {
  item: NavItem;
  pathname: string;
  withSponsorView: (href: string) => string;
  t: (key: string) => string;
}) {
  const isActive = isNavItemActive(pathname, item.href);
  const Icon = iconMap[item.icon] || LayoutDashboard;

  return (
    <Link
      href={withSponsorView(item.href)}
      data-onboarding={
        ONBOARDING_NAV_KEY_BY_NAME[item.name]
          ? `nav-${ONBOARDING_NAV_KEY_BY_NAME[item.name]}`
          : undefined
      }
      aria-current={isActive ? 'page' : undefined}
      className={cn(
        'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
        isActive
          ? 'bg-white/20 text-white shadow-sm'
          : 'text-white/75 hover:bg-white/10 hover:text-white'
      )}
      aria-label={item.name}
    >
      <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-white/60')} />
      {translateNavLabel(item.name, t)}
    </Link>
  );
}

function SidebarNavSection({
  section,
  pathname,
  withSponsorView,
  t,
}: {
  section: ResolvedNavSection;
  pathname: string;
  withSponsorView: (href: string) => string;
  t: (key: string) => string;
}) {
  const hasActiveChild = section.items.some((item) => isNavItemActive(pathname, item.href));
  const [manualOpen, setManualOpen] = useState(false);
  const open = hasActiveChild || manualOpen;

  const sectionLabel = t(section.labelKey);

  return (
    <Collapsible open={open} onOpenChange={setManualOpen} className="mb-1">
      <CollapsibleTrigger
        className={cn(
          'flex w-full items-center justify-between rounded-md px-3 py-1.5 text-left text-[11px] font-semibold uppercase tracking-widest transition-colors',
          hasActiveChild ? 'text-white/70' : 'text-white/45 hover:text-white/60'
        )}
        aria-label={`${sectionLabel} section`}
      >
        <span>{sectionLabel}</span>
        {open ? (
          <ChevronDown className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        ) : (
          <ChevronRight className="h-3.5 w-3.5 flex-shrink-0" aria-hidden="true" />
        )}
      </CollapsibleTrigger>
      <CollapsibleContent className="mt-0.5">
        {section.items.map((item) => (
          <SidebarNavLink
            key={item.name}
            item={item}
            pathname={pathname}
            withSponsorView={withSponsorView}
            t={t}
          />
        ))}
      </CollapsibleContent>
    </Collapsible>
  );
}

export function AppSidebar({ workspaceDisplayName }: { workspaceDisplayName?: string | null }) {
  const pathname = usePathname();
  const { user, logout, switchRole } = useAuth();
  const { t } = useLocale();
  const { sponsorView, setSponsorView } = useSponsorViewControls();

  const { overview, sections } = getVisibleNavSections(user);
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
    <aside className="flex h-screen w-64 flex-col bg-sidebar">

      {/* Logo */}
      <div className="flex h-[4.5rem] items-center gap-3.5 px-5 flex-shrink-0">
        <TracebudLogo size="lg" variant="contrast" priority />
        <div className="flex flex-col min-w-0">
          <span className="text-base font-semibold text-white leading-tight">Tracebud</span>
          <span className="text-[11px] text-white/50 leading-tight">{getAppChromeCopy('eudr_platform', t)}</span>
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
            {(workspaceDisplayName?.slice(0, 2) || user?.tenant_id?.slice(0, 2) || 'TB').toUpperCase()}
          </div>
          <div className="flex min-w-0 flex-1 flex-col">
            <span className="truncate text-sm font-medium text-white">
              {workspaceDisplayName || user?.tenant_id || getAppChromeCopy('workspace_fallback', t)}
            </span>
            <span className="truncate text-[10px] text-white/50">
              {workspaceDisplayName
                ? getAppChromeCopy('org_workspace', t)
                : getAppChromeCopy('tracebud_tenant', t)}
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
                {getAppChromeCopy('active_role', t)}
              </span>
              <RoleBadge role={user.active_role} size="sm" />
            </div>
            {hasMultipleRoles && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-white/60 hover:bg-white/10 hover:text-white focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
                    aria-label={getAppChromeCopy('switch_role_aria', t)}
                    title={getAppChromeCopy('switch_role', t)}
                  >
                    <RefreshCw className="h-3.5 w-3.5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <DropdownMenuLabel>{getAppChromeCopy('switch_role', t)}</DropdownMenuLabel>
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
              <span className="text-[10px] font-semibold uppercase tracking-widest text-white/50">
                {getAppChromeCopy('sponsor_view', t)}
              </span>
              <div className="mt-2 grid grid-cols-2 gap-1">
                <button
                  type="button"
                  onClick={() => setSponsorView('country')}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    sponsorView === 'country' ? 'bg-white text-emerald-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  )}
                >
                  {getAppChromeCopy('sponsor_country', t)}
                </button>
                <button
                  type="button"
                  onClick={() => setSponsorView('brand')}
                  className={cn(
                    'rounded px-2 py-1 text-xs font-medium transition-colors',
                    sponsorView === 'brand' ? 'bg-white text-emerald-900' : 'bg-white/10 text-white/80 hover:bg-white/20'
                  )}
                >
                  {getAppChromeCopy('sponsor_brand', t)}
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Main Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-1" aria-label={getAppChromeCopy('main_nav_aria', t)}>
        <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
          {t('nav.navigation')}
        </p>
        {overview && (
          <SidebarNavLink
            item={overview}
            pathname={pathname}
            withSponsorView={withSponsorView}
            t={t}
          />
        )}
        {sections.map((section) => (
          <SidebarNavSection
            key={section.id}
            section={section}
            pathname={pathname}
            withSponsorView={withSponsorView}
            t={t}
          />
        ))}

        {secondaryNavItems.length > 0 && (
          <>
            <div className="my-3 mx-3 h-px bg-white/10" />
            <p className="mb-1.5 px-3 text-[10px] font-semibold uppercase tracking-widest text-white/40">
              {t('nav.support')}
            </p>
            {secondaryNavItems.map((item) => {
              const isActive = pathname === item.href;
              const Icon = iconMap[item.icon] || Settings;

              return (
                <Link
                  key={item.name}
                  href={withSponsorView(item.href)}
                  aria-current={isActive ? 'page' : undefined}
                  className={cn(
                    'flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors mb-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary',
                    isActive
                      ? 'bg-white/20 text-white shadow-sm'
                      : 'text-white/75 hover:bg-white/10 hover:text-white'
                  )}
                  aria-label={item.name}
                >
                  <Icon className={cn('h-4 w-4 flex-shrink-0', isActive ? 'text-white' : 'text-white/60')} />
                  {translateNavLabel(item.name, t)}
                </Link>
              );
            })}
          </>
        )}
      </nav>

      {/* User Section */}
      <div className="flex-shrink-0 p-3 border-t border-white/10">
        <FreeTrialNavBadge />
        <DemoDataSidebarToggle />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button 
              className="flex w-full items-center gap-3 rounded-md px-3 py-2.5 text-left transition-colors hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary"
              aria-label={getAppChromeCopy('user_menu_aria', t, { name: user?.name || getAppChromeCopy('guest', t) })}
            >
              <Avatar className="h-8 w-8 flex-shrink-0">
                <AvatarFallback className="bg-emerald-500 text-white text-xs font-semibold">
                  {user?.name ? user.name.charAt(0).toUpperCase() : 'U'}
                </AvatarFallback>
              </Avatar>
              <div className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-sm font-medium text-white">
                  {user?.name || getAppChromeCopy('guest', t)}
                </span>
                <span className="truncate text-[11px] text-white/50">
                  {user?.email || getAppChromeCopy('not_logged_in', t)}
                </span>
              </div>
              <ChevronDown className="h-4 w-4 flex-shrink-0 text-white/40" aria-hidden="true" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuItem asChild>
              <Link href={withSponsorView('/settings')}>
                <Settings className="mr-2 h-4 w-4" />
                {getAppChromeCopy('account_settings', t)}
              </Link>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive focus:text-destructive">
              <LogOut className="mr-2 h-4 w-4" />
              {getAppChromeCopy('log_out', t)}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </aside>
  );
}
