'use client';

import Link from 'next/link';
import { Plus, Upload, ShieldCheck, FileText } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { PermissionGate } from '@/components/common/permission-gate';

const actions = [
  {
    label: 'New Package',
    description: 'Create a new DDS package',
    href: '/packages/new',
    icon: Plus,
    permission: 'packages:create' as const,
    variant: 'default' as const,
  },
  {
    label: 'Bulk Upload',
    description: 'Import plots from CSV',
    href: '/plots/bulk-upload',
    icon: Upload,
    permission: 'plots:bulk_upload' as const,
    variant: 'outline' as const,
  },
  {
    label: 'Run Compliance',
    description: 'Start pre-flight check',
    href: '/compliance',
    icon: ShieldCheck,
    permission: 'compliance:run_check' as const,
    variant: 'outline' as const,
  },
  {
    label: 'Generate Report',
    description: 'Export compliance report',
    href: '/reports/new',
    icon: FileText,
    permission: 'reports:generate' as const,
    variant: 'outline' as const,
  },
];

export function QuickActions() {
  return (
    <Card className="border-border bg-card">
      <CardHeader className="pb-2">
        <CardTitle className="text-base font-medium">Quick Actions</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 gap-2">
          {actions.map((action) => (
            <PermissionGate key={action.label} permission={action.permission}>
              <Button
                variant={action.variant}
                className="h-auto flex-col items-start gap-1 p-3 text-left"
                asChild
              >
                <Link href={action.href}>
                  <div className="flex w-full items-center gap-2">
                    <action.icon className="h-4 w-4" />
                    <span className="text-sm font-medium">{action.label}</span>
                  </div>
                  <span className="text-xs text-muted-foreground font-normal">
                    {action.description}
                  </span>
                </Link>
              </Button>
            </PermissionGate>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
