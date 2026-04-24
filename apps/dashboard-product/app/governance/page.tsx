'use client';

import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Scale, Wallet, Users, FileCheck } from 'lucide-react';

const premiumDecisions = [
  { id: 'PD-0182', status: 'approved', amount: '$18,240', split: '70% cash / 30% services' },
  { id: 'PD-0181', status: 'distributed', amount: '$11,900', split: '65% cash / 35% services' },
  { id: 'PD-0180', status: 'proposed', amount: '$8,760', split: 'Pending committee vote' },
];

export default function GovernancePage() {
  return (
    <div className="flex flex-col">
      <AppHeader
        title="Governance"
        subtitle="Manage cooperative structure, premium distribution, portability review, and Open Chain readiness"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Governance' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Users className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">1,284</p>
                  <p className="text-xs text-muted-foreground">Active members</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Wallet className="h-5 w-5 text-emerald-600" />
                <div>
                  <p className="text-2xl font-bold">$38,900</p>
                  <p className="text-xs text-muted-foreground">Premium pool tracked</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-amber-500" />
                <div>
                  <p className="text-2xl font-bold">4</p>
                  <p className="text-xs text-muted-foreground">Portability reviews pending</p>
                </div>
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center gap-3">
                <FileCheck className="h-5 w-5 text-primary" />
                <div>
                  <p className="text-2xl font-bold">83%</p>
                  <p className="text-xs text-muted-foreground">Health snapshot completion</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>Premium Distribution Decisions</CardTitle>
            <CardDescription>
              Auditable cooperative-level approvals with member communication and payout split context.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            {premiumDecisions.map((record) => (
              <div key={record.id} className="flex items-center justify-between rounded-lg border p-3">
                <div>
                  <p className="text-sm font-medium">{record.id}</p>
                  <p className="text-xs text-muted-foreground">{record.split}</p>
                </div>
                <div className="flex items-center gap-3">
                  <p className="text-sm font-semibold">{record.amount}</p>
                  <Badge variant="outline" className="capitalize">
                    {record.status}
                  </Badge>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
