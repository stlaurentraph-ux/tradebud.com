'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  Clock,
  FileSearch,
  BarChart3,
  MapPin,
  Eye,
  ArrowRight,
  Flag,
  Scale,
} from 'lucide-react';
import type { ShipmentStatus } from '@/types';

interface ReviewerDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
  };
}

export function ReviewerDashboard({ metrics }: ReviewerDashboardProps) {
  const pendingReview = metrics.packages_by_status?.READY || 0;
  const flaggedItems = Math.ceil((metrics.total_plots - metrics.compliant_plots) * 0.3);

  return (
    <div className="space-y-6">
      {/* Review Queue Banner */}
      <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-violet-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-purple-900">Compliance Review Queue</h3>
            <p className="text-sm text-purple-700">
              {pendingReview} packages awaiting your compliance review
            </p>
          </div>
          <Button asChild className="bg-purple-600 hover:bg-purple-700">
            <Link href="/compliance">
              <FileSearch className="mr-2 h-4 w-4" />
              Start Reviewing
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics for Reviewers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-600">{pendingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Packages to review</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Flagged Items</CardTitle>
            <Flag className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{flaggedItems}</div>
            <p className="text-xs text-muted-foreground mt-1">Require investigation</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Approved</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">
              {(metrics.packages_by_status?.SEALED || 0) + (metrics.packages_by_status?.SUBMITTED || 0)}
            </div>
            <p className="text-xs text-muted-foreground mt-1">This month</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plots</CardTitle>
            <MapPin className="h-4 w-4 text-purple-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">Under jurisdiction</p>
          </CardContent>
        </Card>
      </div>

      {/* Review Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Compliance Verification Status</CardTitle>
            <CardDescription>Overview of compliance checks in your jurisdiction</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Approved - No Issues', count: metrics.compliant_plots, icon: CheckCircle2, color: 'text-emerald-600', bg: 'bg-emerald-100' },
              { label: 'Under Review', count: pendingReview, icon: Clock, color: 'text-purple-600', bg: 'bg-purple-100' },
              { label: 'Amber Flag - Manual Check', count: Math.ceil(flaggedItems * 0.7), icon: AlertTriangle, color: 'text-amber-600', bg: 'bg-amber-100' },
              { label: 'Red Flag - Non-Compliant', count: Math.floor(flaggedItems * 0.3), icon: XCircle, color: 'text-red-600', bg: 'bg-red-100' },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4 p-3 rounded-lg bg-muted/30">
                <div className={`flex h-10 w-10 items-center justify-center rounded-full ${item.bg}`}>
                  <item.icon className={`h-5 w-5 ${item.color}`} />
                </div>
                <div className="flex-1">
                  <div className="font-medium">{item.label}</div>
                </div>
                <div className={`text-xl font-bold ${item.color}`}>{item.count}</div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Review Priority Queue</CardTitle>
            <CardDescription>Items requiring immediate attention</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between p-4 rounded-lg border border-red-200 bg-red-50">
              <div className="flex items-center gap-3">
                <XCircle className="h-5 w-5 text-red-600" />
                <div>
                  <div className="font-medium text-red-900">Deforestation Alerts</div>
                  <div className="text-sm text-red-700">Post-2020 satellite anomalies detected</div>
                </div>
              </div>
              <Badge className="bg-red-100 text-red-700">{Math.floor(flaggedItems * 0.3)}</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-amber-200 bg-amber-50">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-5 w-5 text-amber-600" />
                <div>
                  <div className="font-medium text-amber-900">Protected Area Overlaps</div>
                  <div className="text-sm text-amber-700">Plots near conservation zones</div>
                </div>
              </div>
              <Badge className="bg-amber-100 text-amber-700">{Math.ceil(flaggedItems * 0.4)}</Badge>
            </div>

            <div className="flex items-center justify-between p-4 rounded-lg border border-purple-200 bg-purple-50">
              <div className="flex items-center gap-3">
                <Scale className="h-5 w-5 text-purple-600" />
                <div>
                  <div className="font-medium text-purple-900">Land Tenure Verification</div>
                  <div className="text-sm text-purple-700">Documentation pending review</div>
                </div>
              </div>
              <Badge className="bg-purple-100 text-purple-700">{Math.ceil(flaggedItems * 0.3)}</Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Reviewers */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100">
                <FileSearch className="h-6 w-6 text-purple-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Review Queue</h4>
                <p className="text-sm text-muted-foreground">Process pending verifications</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/plots">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-teal-100">
                <MapPin className="h-6 w-6 text-teal-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Plot Registry</h4>
                <p className="text-sm text-muted-foreground">View all registered plots</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <BarChart3 className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Generate Reports</h4>
                <p className="text-sm text-muted-foreground">Export compliance data</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
