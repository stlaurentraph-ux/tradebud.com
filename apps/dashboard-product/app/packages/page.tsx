'use client';

import Link from 'next/link';
import { useContext, useMemo, useState } from 'react';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PackagesTable } from '@/components/packages/packages-table';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/common/permission-gate';
import { useAuth } from '@/lib/auth-context';
import { defaultPackagesPageTab } from '@/lib/harvest-package-scope';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { LocaleContext } from '@/lib/locale-context';
import { getDashboardBreadcrumbLabel } from '@/lib/terminology-labels';
import {
  getMyPackagesTabLabel,
  getNewPackageCtaLabel,
  getPackagesLoadingMessage,
  getPackagesPageSubtitle,
  getPackagesPageTitle,
  getSharedPackagesTabLabel,
} from '@/lib/workflow-terminology-labels';
import { cn } from '@/lib/utils';

export default function PackagesPage() {
  const { user } = useAuth();
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const role = user?.active_role;
  const [activeTabOverride, setActiveTabOverride] = useState<'my' | 'shared' | null>(null);
  const activeTab = activeTabOverride ?? defaultPackagesPageTab(role);
  const tenantId = user?.tenant_id ?? null;
  const { packages, isLoading, error } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const {
    packages: sharedPackages,
    isLoading: sharedLoading,
    error: sharedError,
  } = useHarvestPackages(tenantId, { scope: 'shared', enabled: role === 'importer' });
  const isImporter = role === 'importer';
  const loadError = error ?? sharedError;

  const displayedPackages = activeTab === 'shared' ? sharedPackages : packages;
  const pageTitle = useMemo(() => getPackagesPageTitle(role, t), [role, t]);

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageTitle}
        subtitle={getPackagesPageSubtitle(role, t)}
        breadcrumbs={[
          { label: getDashboardBreadcrumbLabel(t), href: '/' },
          { label: pageTitle },
        ]}
        actions={
          <PermissionGate permission="packages:create">
            <Button asChild>
              <Link href="/packages/new">
                <Plus className="mr-2 h-4 w-4" />
                {getNewPackageCtaLabel(role, t)}
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {loadError && (
          <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
            {loadError}
          </div>
        )}

        {isImporter && (
          <div className="flex gap-2 border-b border-border">
            <Button
              variant="ghost"
              onClick={() => setActiveTabOverride('my')}
              className={cn(
                'rounded-none border-b-2 px-4 py-2 font-medium transition-colors',
                activeTab === 'my'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {getMyPackagesTabLabel(role, t)}
            </Button>
            <Button
              variant="ghost"
              onClick={() => setActiveTabOverride('shared')}
              className={cn(
                'rounded-none border-b-2 px-4 py-2 font-medium transition-colors',
                activeTab === 'shared'
                  ? 'border-emerald-500 text-emerald-600'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {getSharedPackagesTabLabel(role, sharedPackages.length, t)}
            </Button>
          </div>
        )}

        {isLoading || (activeTab === 'shared' && sharedLoading) ? (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            {getPackagesLoadingMessage(role, t)}
          </div>
        ) : (
          <PackagesTable packages={displayedPackages} readOnly={activeTab === 'shared'} />
        )}
      </div>
    </div>
  );
}
