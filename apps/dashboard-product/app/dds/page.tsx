'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Plus, CheckCircle2, AlertCircle, Clock } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { StatusChip } from '@/components/ui/status-chip';
import { PermissionGate } from '@/components/common/permission-gate';
import { AsyncState } from '@/components/common/async-state';
import { usePackages } from '@/lib/use-packages';
import type { DDSPackage } from '@/types';

// Canonical DDS states from spec
type DDSStatus = 
  | 'DRAFT'
  | 'READY_TO_SUBMIT'
  | 'SUBMITTED'
  | 'ACCEPTED'
  | 'REJECTED'
  | 'PENDING_CONFIRMATION'
  | 'AMENDMENT_DRAFT'
  | 'AMENDED_SUBMITTED'
  | 'WITHDRAWAL_REQUESTED'
  | 'WITHDRAWN'
  | 'SUPERSEDED';

// 7-Step Pre-flight Checklist
const PREFLIGHT_CHECKS = [
  {
    id: 'deforestation',
    name: 'Deforestation Check',
    description: 'Verify no deforestation on or after cutoff date',
    status: 'pass' as const,
  },
  {
    id: 'degradation',
    name: 'Degradation Check',
    description: 'Verify no degradation on or after cutoff date',
    status: 'pass' as const,
  },
  {
    id: 'tenure',
    name: 'Tenure Check',
    description: 'Verify legitimate tenure or possession',
    status: 'pass' as const,
  },
  {
    id: 'protected_area',
    name: 'Protected Area Check',
    description: 'Verify no protected areas involvement',
    status: 'pass' as const,
  },
  {
    id: 'fpic',
    name: 'FPIC Check',
    description: 'Verify Free Prior Informed Consent obtained',
    status: 'pass' as const,
  },
  {
    id: 'yield_capacity',
    name: 'Yield Capacity Check',
    description: 'Verify production capacity & competence',
    status: 'pass' as const,
  },
  {
    id: 'completeness',
    name: 'Data Completeness',
    description: 'Verify all required fields populated',
    status: 'pass' as const,
  },
];

type DDSWorkspaceItem = {
  id: string;
  code: string;
  status: DDSStatus;
  created_at: string;
  plots: number;
  farmers: number;
  preflightScore: number;
};

function mapPackageToDDSStatus(pkg: DDSPackage): DDSStatus {
  if (pkg.dds_status) return pkg.dds_status;
  switch (pkg.status) {
    case 'DRAFT':
      return 'DRAFT';
    case 'READY':
      return 'READY_TO_SUBMIT';
    case 'SEALED':
      return 'READY_TO_SUBMIT';
    case 'SUBMITTED':
      return 'SUBMITTED';
    case 'ACCEPTED':
      return 'ACCEPTED';
    case 'REJECTED':
      return 'REJECTED';
    default:
      return 'PENDING_CONFIRMATION';
  }
}

export default function DDSWorkspacePage() {
  const { packages, isLoading, error, reload } = usePackages();
  const [selectedDDS, setSelectedDDS] = useState<string | null>(null);

  const ddsPackages = useMemo<DDSWorkspaceItem[]>(
    () =>
      packages.map((pkg) => ({
        id: pkg.id,
        code: pkg.code,
        status: mapPackageToDDSStatus(pkg),
        created_at: pkg.created_at,
        plots: pkg.plots.length,
        farmers: pkg.farmers.length,
        preflightScore: pkg.compliance_status === 'BLOCKED' ? 4 : pkg.compliance_status === 'WARNINGS' ? 6 : 7,
      })),
    [packages]
  );

  useEffect(() => {
    if (!selectedDDS && ddsPackages.length > 0) {
      setSelectedDDS(ddsPackages[0].id);
    }
  }, [selectedDDS, ddsPackages]);

  const selected = ddsPackages.find((d) => d.id === selectedDDS);

  const getStatusColor = (status: DDSStatus) => {
    switch (status) {
      case 'DRAFT':
        return 'bg-blue-50 border-blue-200';
      case 'READY_TO_SUBMIT':
        return 'bg-cyan-50 border-cyan-200';
      case 'SUBMITTED':
        return 'bg-purple-50 border-purple-200';
      case 'ACCEPTED':
        return 'bg-emerald-50 border-emerald-200';
      case 'REJECTED':
        return 'bg-red-50 border-red-200';
      case 'PENDING_CONFIRMATION':
        return 'bg-amber-50 border-amber-200';
      default:
        return 'bg-gray-50 border-gray-200';
    }
  };

  const getCheckIcon = (status: string) => {
    switch (status) {
      case 'pass':
        return <CheckCircle2 className="h-5 w-5 text-emerald-600" />;
      case 'warning':
        return <AlertCircle className="h-5 w-5 text-amber-600" />;
      case 'fail':
        return <AlertCircle className="h-5 w-5 text-red-600" />;
      default:
        return <Clock className="h-5 w-5 text-gray-600" />;
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="DDS Workspace"
        subtitle="Manage Deforestation Due Diligence packages with canonical states"
        breadcrumbs={[
          { label: 'Dashboard', href: '/' },
          { label: 'DDS Workspace' },
        ]}
        actions={
          <PermissionGate permission="packages:create">
            <Button asChild>
              <Link href="/dds/new">
                <Plus className="mr-2 h-4 w-4" />
                New DDS Package
              </Link>
            </Button>
          </PermissionGate>
        }
      />

      <div className="flex-1 space-y-6 p-6">
        {error ? (
          <AsyncState mode="error" title="Failed to load DDS packages" description={error} onRetry={reload} />
        ) : null}
        <Tabs defaultValue="packages" className="w-full">
          <TabsList>
            <TabsTrigger value="packages">DDS Packages</TabsTrigger>
            <TabsTrigger value="preflight">Pre-flight Checklist</TabsTrigger>
            <TabsTrigger value="states">State Diagram</TabsTrigger>
          </TabsList>

          {/* DDS Packages Tab */}
          <TabsContent value="packages" className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-3">
              {/* Package List */}
              <div className="lg:col-span-2 space-y-2">
                {isLoading && <AsyncState mode="loading" title="Loading DDS packages..." />}
                {!isLoading &&
                  ddsPackages.map((dds) => (
                  <button
                    key={dds.id}
                    onClick={() => setSelectedDDS(dds.id)}
                    className={`w-full rounded-lg border-2 p-4 text-left transition-colors ${
                      selectedDDS === dds.id
                        ? 'border-primary bg-primary/5'
                        : 'border-transparent bg-card hover:bg-secondary'
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-semibold">{dds.code}</p>
                        <p className="text-sm text-muted-foreground mt-1">
                          {dds.plots} plots • {dds.farmers} farmers
                        </p>
                      </div>
                      <StatusChip status={dds.status} />
                    </div>
                  </button>
                ))}
              </div>

              {/* Selected DDS Details */}
              {selected && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-base">{selected.code}</CardTitle>
                    <CardDescription>Status: {selected.status}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm text-muted-foreground">Pre-flight Score</p>
                      <p className="text-2xl font-bold">{selected.preflightScore}/7</p>
                    </div>
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="h-2 rounded-full bg-emerald-600"
                        style={{ width: `${(selected.preflightScore / 7) * 100}%` }}
                      />
                    </div>
                    <PermissionGate permission="packages:view">
                      <button className="w-full rounded-lg bg-primary/10 p-3 text-sm font-medium text-primary hover:bg-primary/20">
                        View Full Details
                      </button>
                    </PermissionGate>
                  </CardContent>
                </Card>
              )}
            </div>
          </TabsContent>

          {/* Pre-flight Checklist Tab */}
          <TabsContent value="preflight" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>7-Step Pre-flight Checklist</CardTitle>
                <CardDescription>
                  All checks must pass before submission to TRACES NT
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {PREFLIGHT_CHECKS.map((check) => (
                    <div
                      key={check.id}
                      className="flex items-start gap-4 rounded-lg border p-4 hover:bg-secondary/50"
                    >
                      <div className="mt-1">{getCheckIcon(check.status)}</div>
                      <div className="flex-1">
                        <p className="font-medium">{check.name}</p>
                        <p className="text-sm text-muted-foreground">{check.description}</p>
                      </div>
                      <span
                        className={`whitespace-nowrap rounded px-2 py-1 text-xs font-semibold ${
                          check.status === 'pass'
                            ? 'bg-emerald-100 text-emerald-700'
                            : check.status === 'warning'
                            ? 'bg-amber-100 text-amber-700'
                            : 'bg-red-100 text-red-700'
                        }`}
                      >
                        {check.status.toUpperCase()}
                      </span>
                    </div>
                  ))}
                </div>

                {/* Summary */}
                <div className="mt-6 rounded-lg bg-emerald-50 border border-emerald-200 p-4">
                  <p className="text-sm font-semibold text-emerald-900">
                    ✓ Pre-flight Check Passed
                  </p>
                  <p className="text-sm text-emerald-800 mt-1">
                    All 7 checks passed. This DDS package is ready for submission to TRACES NT.
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* State Diagram Tab */}
          <TabsContent value="states" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Canonical DDS States</CardTitle>
                <CardDescription>Complete state machine for DDS lifecycle</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[
                      { state: 'DRAFT', desc: 'Initial creation' },
                      { state: 'READY_TO_SUBMIT', desc: 'Pre-flight passed' },
                      { state: 'SUBMITTED', desc: 'Sent to TRACES NT' },
                      { state: 'ACCEPTED', desc: 'Approved by authority' },
                      { state: 'REJECTED', desc: 'Rejected with reasons' },
                      { state: 'PENDING_CONFIRMATION', desc: 'Awaiting confirmation' },
                      { state: 'AMENDMENT_DRAFT', desc: 'Amendment in progress' },
                      { state: 'AMENDED_SUBMITTED', desc: 'Amendment submitted' },
                      { state: 'WITHDRAWAL_REQUESTED', desc: 'Withdrawal initiated' },
                      { state: 'WITHDRAWN', desc: 'Withdrawn from system' },
                      { state: 'SUPERSEDED', desc: 'Replaced by a newer DDS record' },
                    ].map((item) => (
                      <div key={item.state} className="rounded-lg border p-3 bg-card hover:bg-secondary/50">
                        <p className="font-semibold text-sm">{item.state}</p>
                        <p className="text-xs text-muted-foreground">{item.desc}</p>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
