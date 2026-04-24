'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Package,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  Eye,
  FileSearch,
  Globe,
  TrendingUp,
  ArrowRight,
  MapPin,
} from 'lucide-react';
import type { ShipmentStatus } from '@/types';

interface ImporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<ShipmentStatus, number>;
    total_plots: number;
    compliant_plots: number;
  };
}

export function ImporterDashboard({ metrics }: ImporterDashboardProps) {
  const pendingReview = (metrics.packages_by_status?.READY || 0) + (metrics.packages_by_status?.ON_HOLD || 0);
  const approvedPackages = (metrics.packages_by_status?.SEALED || 0) + (metrics.packages_by_status?.SUBMITTED || 0);
  const isVirginTenant = metrics.total_packages === 0 && metrics.total_plots === 0;

  return (
    <div className="space-y-6">
      {isVirginTenant ? (
        <Card className="border-emerald-200 bg-emerald-50/40">
          <CardHeader>
            <CardTitle>Welcome to your importer workspace</CardTitle>
            <CardDescription>
              This workspace starts empty. Complete onboarding to connect exporters, review incoming DDS packages, and track compliance.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              <Link href="/outreach" className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-muted">
                Review campaign requests
              </Link>
              <Link href="/compliance" className="inline-flex items-center rounded border px-3 py-1.5 text-sm hover:bg-muted">
                Open compliance queue
              </Link>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {/* Status Overview Banner */}
      <Card className="border-blue-200 bg-gradient-to-r from-blue-50 to-indigo-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-blue-900">Supply Chain Visibility</h3>
            <p className="text-sm text-blue-700">
              Monitor {metrics.total_packages} DDS packages from your export partners
            </p>
          </div>
          <Badge variant="outline" className="border-blue-300 bg-blue-100 text-blue-700">
            <Eye className="mr-1 h-3 w-3" />
            Read-Only Access
          </Badge>
        </CardContent>
      </Card>

      {/* Key Metrics for Importers */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Incoming Packages</CardTitle>
            <Package className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">From verified exporters</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <Clock className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingReview}</div>
            <p className="text-xs text-muted-foreground mt-1">Awaiting compliance verification</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">EUDR Compliant</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{approvedPackages}</div>
            <p className="text-xs text-muted-foreground mt-1">Ready for EU market</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Traced Origins</CardTitle>
            <MapPin className="h-4 w-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">Verified plot locations</p>
          </CardContent>
        </Card>
      </div>

      {/* Compliance Overview */}
      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Package Compliance Status</CardTitle>
            <CardDescription>Overview of incoming shipments by verification status</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: 'Fully Compliant', count: approvedPackages, color: 'bg-emerald-500', icon: CheckCircle2 },
              { label: 'Ready', count: metrics.packages_by_status?.READY || 0, color: 'bg-blue-500', icon: Clock },
              { label: 'On Hold', count: metrics.packages_by_status?.ON_HOLD || 0, color: 'bg-amber-500', icon: AlertTriangle },
              { label: 'Draft', count: metrics.packages_by_status?.DRAFT || 0, color: 'bg-gray-400', icon: FileSearch },
            ].map((item) => (
              <div key={item.label} className="flex items-center gap-4">
                <item.icon className="h-5 w-5 text-muted-foreground" />
                <div className="flex-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-sm font-medium">{item.label}</span>
                    <span className="text-sm font-semibold">{item.count}</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-gray-100">
                    <div 
                      className={`h-2 rounded-full ${item.color}`}
                      style={{ width: `${metrics.total_packages > 0 ? (item.count / metrics.total_packages) * 100 : 0}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Supply Chain Traceability</CardTitle>
            <CardDescription>Live metrics from your current tenant data</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <Globe className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">Origin Countries</div>
                  <div className="text-sm text-muted-foreground">Verified source locations</div>
                </div>
              </div>
              <Badge>{metrics.total_plots > 0 ? 'Origin data available' : 'No origin data yet'}</Badge>
            </div>
            <div className="flex items-center justify-between p-4 rounded-lg bg-muted/50">
              <div className="flex items-center gap-3">
                <ShieldCheck className="h-5 w-5 text-emerald-600" />
                <div>
                  <div className="font-medium">Deforestation Free</div>
                  <div className="text-sm text-muted-foreground">Post Dec 31, 2020 baseline</div>
                </div>
              </div>
              <Badge variant="outline" className="border-emerald-500 text-emerald-600">
                {Math.round((metrics.compliant_plots / metrics.total_plots) * 100) || 0}% Verified
              </Badge>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Quick Actions for Importers (Read-Only) */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/packages">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <Package className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">View All Packages</h4>
                <p className="text-sm text-muted-foreground">Browse incoming DDS packages</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <ShieldCheck className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Compliance Status</h4>
                <p className="text-sm text-muted-foreground">Review verification results</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-indigo-100">
                <TrendingUp className="h-6 w-6 text-indigo-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Download Reports</h4>
                <p className="text-sm text-muted-foreground">Export compliance documentation</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
