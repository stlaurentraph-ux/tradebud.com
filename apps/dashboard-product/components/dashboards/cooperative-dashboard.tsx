'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import Link from 'next/link';
import {
  MapPin,
  Users,
  AlertTriangle,
  CheckCircle2,
  Plus,
  ArrowRight,
  TreePine,
  FileCheck,
} from 'lucide-react';

interface CooperativeDashboardProps {
  metrics: {
    total_plots: number;
    compliant_plots: number;
    total_farmers: number;
  };
}

export function CooperativeDashboard({ metrics }: CooperativeDashboardProps) {
  const pendingPlots = metrics.total_plots - metrics.compliant_plots;
  const verificationRate = metrics.total_plots > 0 
    ? Math.round((metrics.compliant_plots / metrics.total_plots) * 100) 
    : 0;

  return (
    <div className="space-y-6">
      {/* Primary Action Banner */}
      <Card className="border-teal-200 bg-gradient-to-r from-teal-50 to-cyan-50">
        <CardContent className="flex items-center justify-between p-6">
          <div className="space-y-1">
            <h3 className="text-lg font-semibold text-teal-900">Farmer & Plot Management</h3>
            <p className="text-sm text-teal-700">
              Manage {metrics.total_farmers} farmers and {metrics.total_plots} plots in your cooperative
            </p>
          </div>
          <div className="flex gap-2">
            <Button asChild variant="outline" className="border-teal-300 hover:bg-teal-100">
              <Link href="/farmers">
                <Users className="mr-2 h-4 w-4" />
                Add Farmer
              </Link>
            </Button>
            <Button asChild className="bg-teal-600 hover:bg-teal-700">
              <Link href="/plots">
                <Plus className="mr-2 h-4 w-4" />
                Register Plot
              </Link>
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Key Metrics for Cooperatives */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Farmers</CardTitle>
            <Users className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_farmers}</div>
            <p className="text-xs text-muted-foreground mt-1">Registered members</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Total Plots</CardTitle>
            <MapPin className="h-4 w-4 text-teal-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics.total_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">Mapped farm areas</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Verified Plots</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{metrics.compliant_plots}</div>
            <p className="text-xs text-muted-foreground mt-1">EUDR compliant</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Pending Review</CardTitle>
            <AlertTriangle className="h-4 w-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pendingPlots}</div>
            <p className="text-xs text-muted-foreground mt-1">Need verification</p>
          </CardContent>
        </Card>
      </div>

      {/* Plot Verification Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Plot Verification Progress</CardTitle>
          <CardDescription>Track EUDR compliance verification across your cooperative</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium">Overall Verification Rate</span>
              <span className="text-lg font-bold">{verificationRate}%</span>
            </div>
            <div className="h-4 w-full rounded-full bg-gray-100">
              <div 
                className="h-4 rounded-full bg-gradient-to-r from-teal-500 to-emerald-500 transition-all" 
                style={{ width: `${verificationRate}%` }}
              />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 pt-4 border-t">
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full bg-emerald-500" />
                <span className="text-sm font-medium">Compliant</span>
              </div>
              <div className="text-2xl font-bold text-emerald-600">{metrics.compliant_plots}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full bg-amber-500" />
                <span className="text-sm font-medium">Pending</span>
              </div>
              <div className="text-2xl font-bold text-amber-600">{Math.floor(pendingPlots * 0.6)}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-2 mb-1">
                <div className="h-3 w-3 rounded-full bg-red-500" />
                <span className="text-sm font-medium">Issues</span>
              </div>
              <div className="text-2xl font-bold text-red-600">{Math.ceil(pendingPlots * 0.4)}</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Cooperative Tasks */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TreePine className="h-5 w-5 text-teal-600" />
              Land Management
            </CardTitle>
            <CardDescription>Register and verify farm plots</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/plots" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Register New Plot</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/plots" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <MapPin className="h-4 w-4" />
                <span className="font-medium">View All Plots</span>
              </div>
              <Badge variant="outline">{metrics.total_plots}</Badge>
            </Link>
            <Link href="/plots" className="flex items-center justify-between p-3 rounded-lg bg-amber-50 hover:bg-amber-100 transition-colors">
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-amber-700">Plots Needing Review</span>
              </div>
              <Badge className="bg-amber-100 text-amber-700">{pendingPlots}</Badge>
            </Link>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-teal-600" />
              Farmer Management
            </CardTitle>
            <CardDescription>Manage cooperative members</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Link href="/farmers" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Plus className="h-4 w-4" />
                <span className="font-medium">Add New Farmer</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
            <Link href="/farmers" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <Users className="h-4 w-4" />
                <span className="font-medium">View All Farmers</span>
              </div>
              <Badge variant="outline">{metrics.total_farmers}</Badge>
            </Link>
            <Link href="/farmers" className="flex items-center justify-between p-3 rounded-lg bg-muted/50 hover:bg-muted transition-colors">
              <div className="flex items-center gap-3">
                <FileCheck className="h-4 w-4" />
                <span className="font-medium">FPIC Documentation</span>
              </div>
              <ArrowRight className="h-4 w-4 text-muted-foreground" />
            </Link>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
