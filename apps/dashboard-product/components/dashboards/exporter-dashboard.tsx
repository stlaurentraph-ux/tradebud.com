'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  Package,
  Upload,
  ShieldCheck,
  AlertTriangle,
  CheckCircle2,
  Clock,
  TrendingUp,
  FileText,
  MapPin,
  Users,
  ArrowRight,
} from 'lucide-react';

interface ExporterDashboardProps {
  metrics: {
    total_packages: number;
    packages_by_status: Record<string, number>;
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
}

export function ExporterDashboard({ metrics }: ExporterDashboardProps) {
  const complianceRate = metrics.total_plots > 0 
    ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Primary Action Banner */}
      <Card className="border-emerald-200 bg-gradient-to-r from-emerald-50 to-teal-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-emerald-900">Ready to Submit?</h3>
            <p className="text-sm text-emerald-700">
              You have {metrics.packages_by_status?.['traces_ready'] || 0} packages ready for TRACES NT submission
            </p>
          </div>
          <Button asChild className="bg-emerald-600 hover:bg-emerald-700">
            <Link href="/compliance">
              <ShieldCheck className="mr-2 h-4 w-4" />
              Run Pre-Flight Check
            </Link>
          </Button>
        </CardContent>
      </Card>

      {/* Key Metrics for Exporters */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total DDS Packages</CardTitle>
            <Package className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_packages}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.packages_by_status?.['submitted'] || 0} submitted to TRACES
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Compliance Rate</CardTitle>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{complianceRate}%</div>
            <div className="mt-2 h-2 w-full rounded-full bg-gray-200">
              <div 
                className="h-2 rounded-full bg-emerald-500" 
                style={{ width: `${complianceRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Plots</CardTitle>
            <MapPin className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.compliant_plots}/{metrics.total_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">
              {metrics.total_plots - metrics.compliant_plots} need attention
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Active Farmers</CardTitle>
            <Users className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_farmers}</div>
            <p className="text-xs text-muted-foreground mt-1">Across all cooperatives</p>
          </CardContent>
        </Card>
      </div>

      {/* Package Pipeline */}
      <Card>
        <CardHeader>
          <CardTitle>DDS Package Pipeline</CardTitle>
          <CardDescription>Track packages through the EUDR compliance workflow</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-5 gap-2">
            {[
              { status: 'draft', label: 'Draft', icon: FileText, color: 'bg-gray-100 text-gray-700' },
              { status: 'in_review', label: 'In Review', icon: Clock, color: 'bg-blue-100 text-blue-700' },
              { status: 'preflight', label: 'Pre-flight', icon: AlertTriangle, color: 'bg-amber-100 text-amber-700' },
              { status: 'traces_ready', label: 'Ready', icon: CheckCircle2, color: 'bg-emerald-100 text-emerald-700' },
              { status: 'submitted', label: 'Submitted', icon: Upload, color: 'bg-green-100 text-green-700' },
            ].map((stage) => (
              <div key={stage.status} className="text-center">
                <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-full ${stage.color}`}>
                  <stage.icon className="h-5 w-5" />
                </div>
                <div className="text-2xl font-bold">{metrics.packages_by_status?.[stage.status] || 0}</div>
                <div className="text-xs text-muted-foreground">{stage.label}</div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Quick Actions for Exporters */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/packages/new">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-emerald-100">
                <Package className="h-6 w-6 text-emerald-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Create DDS Package</h4>
                <p className="text-sm text-muted-foreground">Start a new due diligence statement</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/compliance">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-amber-100">
                <ShieldCheck className="h-6 w-6 text-amber-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Pre-Flight Check</h4>
                <p className="text-sm text-muted-foreground">Verify compliance before TRACES</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>

        <Card className="cursor-pointer transition-colors hover:bg-muted/50">
          <Link href="/reports">
            <CardContent className="flex items-center gap-4 p-6">
              <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100">
                <TrendingUp className="h-6 w-6 text-blue-600" />
              </div>
              <div className="flex-1">
                <h4 className="font-semibold">Export Reports</h4>
                <p className="text-sm text-muted-foreground">Generate compliance documentation</p>
              </div>
              <ArrowRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Link>
        </Card>
      </div>
    </div>
  );
}
