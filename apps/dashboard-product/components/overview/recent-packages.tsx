'use client';

import Link from 'next/link';
import { ArrowRight } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import type { DDSPackage } from '@/types';
import { useAuth } from '@/lib/auth-context';
import { useLocale } from '@/lib/locale-context';
import {
  getComplianceStatusLabel,
  getComplianceStatusStyles,
  getShipmentStatusLabel,
  getShipmentStatusStyles,
} from '@/lib/status-labels';

interface RecentPackagesProps {
  packages: DDSPackage[];
}

export function RecentPackages({ packages }: RecentPackagesProps) {
  const { user } = useAuth();
  const { t } = useLocale();
  const role = user?.active_role;
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
            const statusLabel = getShipmentStatusLabel(pkg.status, role, t);
            const statusClassName = getShipmentStatusStyles(pkg.status);
            const complianceLabel = getComplianceStatusLabel(pkg.compliance_status, t);
            const complianceClassName = getComplianceStatusStyles(pkg.compliance_status);

            return (
              <Link
                key={pkg.id}
                href={`/packages/${pkg.id}`}
                className="flex items-center gap-3 rounded-lg border border-border p-3 transition-colors hover:bg-secondary/50"
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-sm font-medium text-foreground">{pkg.code}</span>
                    <Badge variant="outline" className={`text-[10px] ${statusClassName} border-0`}>
                      {statusLabel}
                    </Badge>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{pkg.supplier_name}</p>
                  <div className="mt-1 flex items-center gap-2 text-xs text-muted-foreground">
                    <span>{pkg.plots.length} plots</span>
                    <span className="text-border">-</span>
                    <span>{pkg.farmers.length} producers</span>
                  </div>
                </div>
                <Badge variant="outline" className={`text-[10px] ${complianceClassName} border-0`}>
                  {complianceLabel}
                </Badge>
              </Link>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
}
