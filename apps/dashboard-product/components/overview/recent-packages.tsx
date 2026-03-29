'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DDSPackage, PackageStatus, ComplianceStatus } from '@/types';

interface RecentPackagesProps {
  packages: DDSPackage[];
}

const statusVariants: Record<PackageStatus, { label: string; className: string }> = {
  draft: { label: 'Draft', className: 'bg-muted text-muted-foreground' },
  in_review: { label: 'In Review', className: 'bg-chart-2/20 text-chart-2' },
  preflight_check: { label: 'Pre-flight', className: 'bg-chart-3/20 text-chart-3' },
  traces_ready: { label: 'TRACES Ready', className: 'bg-primary/20 text-primary' },
  submitted: { label: 'Submitted', className: 'bg-chart-5/20 text-chart-5' },
  approved: { label: 'Approved', className: 'bg-primary/20 text-primary' },
  rejected: { label: 'Rejected', className: 'bg-destructive/20 text-destructive' },
};

const complianceVariants: Record<ComplianceStatus, { label: string; className: string }> = {
  passed: { label: 'Passed', className: 'bg-primary/20 text-primary' },
  warnings: { label: 'Warnings', className: 'bg-chart-3/20 text-chart-3' },
  blocked: { label: 'Blocked', className: 'bg-destructive/20 text-destructive' },
  pending: { label: 'Pending', className: 'bg-muted text-muted-foreground' },
};

export function RecentPackages({ packages }: RecentPackagesProps) {
  const recentPackages = packages.slice(0, 5);

  return (
    <Card className="border-border bg-card">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-base font-medium">Recent Packages</CardTitle>
        <Button variant="ghost" size="sm" className="text-xs gap-1" asChild>
          <Link href="/packages">
            View all
            <ArrowRight className="h-3 w-3" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recentPackages.map((pkg) => {
            const status = statusVariants[pkg.status];
            const compliance = complianceVariants[pkg.compliance_status];

            return (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{pkg.code}</span>
                    <Badge variant="outline" className={`text-[10px] ${status.className} border-0`}>
                      {status.label}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{pkg.supplier_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{pkg.plots.length} plots</span>
                    <span className="text-border">-</span>
                    <span>{pkg.farmers.length} farmers</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${compliance.className} border-0`}>
                  {compliance.label}
                </Badge>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
