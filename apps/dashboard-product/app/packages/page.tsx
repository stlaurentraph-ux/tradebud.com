'use client';

import Link from 'next/link';
import { Plus } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PackagesTable } from '@/components/packages/packages-table';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/common/permission-gate';
import { mockPackages } from '@/lib/mock-data';

export default function PackagesPage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="DDS Packages"
        subtitle="Manage your Deforestation Due Diligence Statement packages"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Packages' },
        ]}
        actions={
          <PermissionGate permission="packages:create">
            <Button asChild>
              <Link href="/packages/new">
                <Plus className="mr-2 h-4 w-4" />
                New Package
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex-1 p-6">
        <PackagesTable packages={mockPackages} />
      </div>
    </div>
  );
}
