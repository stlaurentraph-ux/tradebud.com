'use client';

import { useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  Check,
  X,
  ArrowLeft,
  Building2,
  ShieldCheck,
  Gavel,
  Info,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import type { TenantRole, LegalWorkflowRole, CommercialTier } from '@/types';

// Canonical tenant roles
const TENANT_ROLES: { role: TenantRole; label: string; tier: CommercialTier }[] = [
  { role: 'exporter', label: 'Exporter', tier: 'tier_2' },
  { role: 'importer', label: 'Importer', tier: 'tier_3' },
  { role: 'cooperative', label: 'Cooperative', tier: 'tier_2' },
  { role: 'country_reviewer', label: 'Country Reviewer', tier: 'tier_3' },
  { role: 'sponsor', label: 'Network Sponsor', tier: 'tier_4' },
];

// Commercial tier permission groups
const PERMISSION_GROUPS = [
  {
    name: 'Packages/Shipments',
    permissions: [
      { key: 'packages:view', label: 'View Packages' },
      { key: 'packages:create', label: 'Create Packages' },
      { key: 'packages:edit', label: 'Edit Packages' },
      { key: 'packages:delete', label: 'Delete Packages' },
      { key: 'packages:seal_shipment', label: 'Seal Shipment' },
      { key: 'packages:submit_traces', label: 'Submit to TRACES' },
      { key: 'packages:approve', label: 'Approve Packages' },
    ],
  },
  {
    name: 'Plots',
    permissions: [
      { key: 'plots:view', label: 'View Plots' },
      { key: 'plots:create', label: 'Create Plots' },
      { key: 'plots:edit', label: 'Edit Plots' },
      { key: 'plots:delete', label: 'Delete Plots' },
      { key: 'plots:bulk_upload', label: 'Bulk Upload' },
    ],
  },
  {
    name: 'Farmers',
    permissions: [
      { key: 'farmers:view', label: 'View Farmers' },
      { key: 'farmers:create', label: 'Create Farmers' },
      { key: 'farmers:edit', label: 'Edit Farmers' },
      { key: 'farmers:delete', label: 'Delete Farmers' },
      { key: 'farmers:link_validation', label: 'Link Validation' },
    ],
  },
  {
    name: 'Compliance',
    permissions: [
      { key: 'compliance:view', label: 'View Compliance' },
      { key: 'compliance:run_check', label: 'Run Check' },
      { key: 'compliance:approve', label: 'Approve' },
      { key: 'compliance:create_issue', label: 'Create Issue' },
      { key: 'compliance:resolve_issue', label: 'Resolve Issue' },
    ],
  },
  {
    name: 'Requests',
    permissions: [
      { key: 'requests:view', label: 'View Requests' },
      { key: 'requests:create', label: 'Create Requests' },
      { key: 'requests:send', label: 'Send Requests' },
      { key: 'requests:respond', label: 'Respond' },
    ],
  },
  {
    name: 'Reports',
    permissions: [
      { key: 'reports:view', label: 'View Reports' },
      { key: 'reports:generate', label: 'Generate' },
      { key: 'reports:export', label: 'Export' },
    ],
  },
  {
    name: 'Admin',
    permissions: [
      { key: 'admin:view', label: 'View Admin' },
      { key: 'admin:manage_users', label: 'Manage Users' },
      { key: 'admin:manage_roles', label: 'Manage Roles' },
    ],
  },
];

// Permission matrix - which roles have which permissions
const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
  exporter: [
    'packages:view', 'packages:create', 'packages:edit', 'packages:delete', 'packages:seal_shipment', 'packages:submit_traces',
    'plots:view', 'plots:create', 'plots:edit', 'plots:delete', 'plots:bulk_upload',
    'farmers:view', 'farmers:create', 'farmers:edit', 'farmers:delete', 'farmers:link_validation',
    'compliance:view', 'compliance:run_check', 'compliance:create_issue', 'compliance:resolve_issue',
    'requests:view', 'requests:create', 'requests:send', 'requests:respond',
    'reports:view', 'reports:generate', 'reports:export',
    'admin:view',
  ],
  importer: [
    'packages:view', 'packages:approve',
    'plots:view',
    'farmers:view',
    'compliance:view', 'compliance:approve',
    'requests:view', 'requests:respond',
    'reports:view', 'reports:generate', 'reports:export',
    'admin:view',
  ],
  cooperative: [
    'packages:view', 'packages:create', 'packages:edit',
    'plots:view', 'plots:create', 'plots:edit', 'plots:bulk_upload',
    'farmers:view', 'farmers:create', 'farmers:edit', 'farmers:delete', 'farmers:link_validation',
    'compliance:view', 'compliance:create_issue',
    'requests:view', 'requests:respond',
    'reports:view',
  ],
  country_reviewer: [
    'packages:view', 'packages:approve',
    'plots:view',
    'farmers:view',
    'compliance:view', 'compliance:approve', 'compliance:resolve_issue',
    'reports:view', 'reports:generate',
  ],
  sponsor: [
    'packages:view',
    'plots:view',
    'farmers:view',
    'compliance:view',
    'requests:view', 'requests:create', 'requests:send',
    'reports:view', 'reports:generate', 'reports:export',
    'admin:view', 'admin:manage_users',
  ],
};

// Legal workflow roles
const LEGAL_WORKFLOW_ROLES: { role: LegalWorkflowRole; label: string; description: string }[] = [
  { role: 'OUT_OF_SCOPE', label: 'Out of Scope', description: 'Not subject to EUDR requirements' },
  { role: 'OPERATOR', label: 'Operator', description: 'Places goods on EU market or exports from EU' },
  { role: 'MICRO_SMALL_PRIMARY_OPERATOR', label: 'Micro/Small Primary Operator', description: 'Simplified obligations apply' },
  { role: 'DOWNSTREAM_OPERATOR_FIRST', label: 'Downstream Operator (First)', description: 'First downstream after initial placement' },
  { role: 'DOWNSTREAM_OPERATOR_SUBSEQUENT', label: 'Downstream Operator (Subsequent)', description: 'Subsequent downstream operators' },
  { role: 'TRADER', label: 'Trader', description: 'Makes product available on market' },
  { role: 'PENDING_MANUAL_CLASSIFICATION', label: 'Pending Classification', description: 'Awaiting manual role determination' },
];

// Legal workflow permissions
const LEGAL_WORKFLOW_PERMISSIONS = [
  { key: 'legal:submit_dds', label: 'Submit DDS' },
  { key: 'legal:submit_simplified_declaration', label: 'Submit Simplified Declaration' },
  { key: 'legal:retain_reference', label: 'Retain Reference' },
  { key: 'legal:downstream_reference', label: 'Downstream Reference' },
  { key: 'legal:trader_retention', label: 'Trader Retention' },
  { key: 'legal:acknowledge_liability', label: 'Acknowledge Liability' },
];

// Legal role permissions matrix
const LEGAL_ROLE_PERMISSIONS: Record<LegalWorkflowRole, string[]> = {
  OUT_OF_SCOPE: [],
  OPERATOR: ['legal:submit_dds', 'legal:retain_reference', 'legal:acknowledge_liability'],
  MICRO_SMALL_PRIMARY_OPERATOR: ['legal:submit_simplified_declaration', 'legal:retain_reference', 'legal:acknowledge_liability'],
  DOWNSTREAM_OPERATOR_FIRST: ['legal:downstream_reference', 'legal:retain_reference', 'legal:acknowledge_liability'],
  DOWNSTREAM_OPERATOR_SUBSEQUENT: ['legal:downstream_reference', 'legal:acknowledge_liability'],
  TRADER: ['legal:trader_retention'],
  PENDING_MANUAL_CLASSIFICATION: [],
};

export default function RBACMatrixPage() {
  const [activeTab, setActiveTab] = useState<'commercial' | 'legal'>('commercial');

  return (
    <PermissionGate permission="admin:view">
      <div className="flex flex-col">
        <AppHeader
          title="RBAC Permission Matrix"
          subtitle="View role-based access control permissions for commercial and legal workflow roles"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Admin', href: '/admin' },
            { label: 'RBAC Matrix' },
          ]}
          action={
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Admin
              </Link>
            </Button>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Info Banner */}
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">Understanding the Permission System</p>
                  <p className="text-sm text-blue-700 mt-1">
                    Tracebud separates <strong>Commercial Permissions</strong> (what features users can access based on their commercial tier) 
                    from <strong>Legal Workflow Permissions</strong> (what legal actions users can take per EUDR requirements). 
                    A user&apos;s legal role is determined per workflow, not as a static label.
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Tabs
            value={activeTab}
            onValueChange={(v) => {
              if (v === 'commercial' || v === 'legal') setActiveTab(v);
            }}
          >
            <TabsList className="grid w-full grid-cols-2 max-w-md">
              <TabsTrigger value="commercial" className="gap-2">
                <Building2 className="h-4 w-4" />
                Commercial Tier
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-2">
                <Gavel className="h-4 w-4" />
                Legal Workflow
              </TabsTrigger>
            </TabsList>

            {/* Commercial Tier Matrix */}
            <TabsContent value="commercial" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Commercial Tier Permission Matrix
                  </CardTitle>
                  <CardDescription>
                    Permissions available to each tenant role based on their commercial tier subscription
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-background">
                            Permission
                          </th>
                          {TENANT_ROLES.map((r) => (
                            <th key={r.role} className="text-center py-3 px-4 font-medium min-w-[100px]">
                              <div className="flex flex-col items-center gap-1">
                                <span>{r.label}</span>
                                <Badge variant="outline" className="text-xs">
                                  {r.tier}
                                </Badge>
                              </div>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {PERMISSION_GROUPS.map((group) => (
                          <>
                            <tr key={group.name} className="bg-secondary/30">
                              <td
                                colSpan={TENANT_ROLES.length + 1}
                                className="py-2 px-4 font-semibold text-foreground"
                              >
                                {group.name}
                              </td>
                            </tr>
                            {group.permissions.map((perm) => (
                              <tr key={perm.key} className="border-b hover:bg-secondary/20">
                                <td className="py-2 px-4 text-muted-foreground sticky left-0 bg-background">
                                  {perm.label}
                                </td>
                                {TENANT_ROLES.map((r) => {
                                  const hasPermission = ROLE_PERMISSIONS[r.role]?.includes(perm.key);
                                  return (
                                    <td key={r.role} className="text-center py-2 px-4">
                                      {hasPermission ? (
                                        <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                      ) : (
                                        <X className="h-4 w-4 text-gray-300 mx-auto" />
                                      )}
                                    </td>
                                  );
                                })}
                              </tr>
                            ))}
                          </>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            {/* Legal Workflow Matrix */}
            <TabsContent value="legal" className="mt-6 space-y-6">
              {/* Legal Roles Overview */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    EUDR Legal Workflow Roles
                  </CardTitle>
                  <CardDescription>
                    Legal roles are determined per workflow based on the entity&apos;s position in the supply chain
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {LEGAL_WORKFLOW_ROLES.map((role) => (
                      <div
                        key={role.role}
                        className={cn(
                          'p-4 rounded-lg border',
                          role.role === 'PENDING_MANUAL_CLASSIFICATION'
                            ? 'bg-amber-50/50 border-amber-200'
                            : role.role === 'OUT_OF_SCOPE'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-card'
                        )}
                      >
                        <p className="font-medium text-foreground">{role.label}</p>
                        <p className="text-sm text-muted-foreground mt-1">{role.description}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {LEGAL_ROLE_PERMISSIONS[role.role].length > 0 ? (
                            LEGAL_ROLE_PERMISSIONS[role.role].map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {perm.replace('legal:', '')}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">No legal permissions</span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              {/* Legal Permissions Matrix */}
              <Card>
                <CardHeader>
                  <CardTitle>Legal Workflow Permission Matrix</CardTitle>
                  <CardDescription>
                    What legal actions each workflow role can perform under EUDR
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-background">
                            Permission
                          </th>
                          {LEGAL_WORKFLOW_ROLES.map((r) => (
                            <th key={r.role} className="text-center py-3 px-2 font-medium min-w-[90px]">
                              <span className="text-xs">{r.label}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {LEGAL_WORKFLOW_PERMISSIONS.map((perm) => (
                          <tr key={perm.key} className="border-b hover:bg-secondary/20">
                            <td className="py-3 px-4 text-muted-foreground sticky left-0 bg-background">
                              {perm.label}
                            </td>
                            {LEGAL_WORKFLOW_ROLES.map((r) => {
                              const hasPermission = LEGAL_ROLE_PERMISSIONS[r.role]?.includes(perm.key);
                              return (
                                <td key={r.role} className="text-center py-3 px-2">
                                  {hasPermission ? (
                                    <Check className="h-4 w-4 text-emerald-600 mx-auto" />
                                  ) : (
                                    <X className="h-4 w-4 text-gray-300 mx-auto" />
                                  )}
                                </td>
                              );
                            })}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </PermissionGate>
  );
}
