'use client';

import Link from 'next/link';
import { useState } from 'react';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PackagesTable } from '@/components/packages/packages-table';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/common/permission-gate';
import { useAuth } from '@/lib/auth-context';
import { defaultPackagesPageTab } from '@/lib/harvest-package-scope';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { cn } from '@/lib/utils';

export default function PackagesPage() {
  const { user } = useAuth();
  const [activeTabOverride, setActiveTabOverride] = useState<'my' | 'shared' | null>(null);
  const activeTab = activeTabOverride ?? defaultPackagesPageTab(user?.active_role);
  const tenantId = user?.tenant_id ?? null;
  const { packages, isLoading, error } = useHarvestPackages(tenantId, { scope: 'tenant' });
  const {
    packages: sharedPackages,
    isLoading: sharedLoading,
    error: sharedError,
  } = useHarvestPackages(tenantId, { scope: 'shared', enabled: user?.active_role === 'importer' });
  const isImporter = user?.active_role === 'importer';
  const isExporter = user?.active_role === 'exporter';
  const isCooperative = user?.active_role === 'cooperative';
  const loadError = error ?? sharedError;

  const displayedPackages = activeTab === 'shared' ? sharedPackages : packages;

  return (
    <div className="flex flex-col">
      <AppHeader
        title={isImporter || isExporter || isCooperative ? 'Shipments' : 'DDS Packages'}
        subtitle={
          isImporter
            ? 'Validate shipment completeness, coverage, and declaration readiness'
            : isExporter
              ? 'Assemble shipment packages from lineage-safe upstream inputs'
              : isCooperative
                ? 'Prepare cooperative handoff shipments with lineage coverage, blocker checks, and premium context'
              : 'Manage your Deforestation Due Diligence Statement packages'
        }
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: isImporter || isExporter || isCooperative ? 'Shipments' : 'DDS Packages' },
        ]}
        actions={
          <PermissionGate permission="packages:create">
            <Button asChild>
              <Link href="/packages/new">
                <Plus className="mr-2 h-4 w-4" />
                {isImporter || isExporter || isCooperative ? 'New Shipment' : 'New Package'}
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

        {/* Tab Toggle for Importers */}
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
              {isImporter ? 'My Shipments' : 'My Packages'}
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
              {isImporter ? `Shared Shipments (${sharedPackages.length})` : `Shared With Me (${sharedPackages.length})`}
            </Button>
          </div>
        )}

        {/* Packages Table */}
        {isLoading || (activeTab === 'shared' && sharedLoading) ? (
          <div className="rounded-md border border-border bg-card p-6 text-sm text-muted-foreground">
            {isImporter ? 'Loading shipments...' : 'Loading packages...'}
          </div>
        ) : (
          <PackagesTable packages={displayedPackages} readOnly={activeTab === 'shared'} />
        )}
      </div>
    </div>
  );
}
