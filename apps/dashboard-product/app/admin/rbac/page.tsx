'use client';

import { Fragment, useContext, useState } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs, translatePageHeader } from '@/lib/nav-labels';
import {
  getAdminPageTitle,
  getAdminRbacCopy,
  getAdminRbacCommercialRoleLabel,
  getAdminRbacPermissionGroupLabel,
  getAdminRbacCommercialPermissionLabel,
  getAdminRbacLegalPermissionLabel,
  getLegalRoleFilterLabel,
  getLegalRoleDescriptionLabel,
  type AdminRbacPermissionGroupId,
} from '@/lib/workflow-terminology-labels';

const TENANT_ROLES: { role: TenantRole; tier: CommercialTier }[] = [
  { role: 'exporter', tier: 'tier_2' },
  { role: 'importer', tier: 'tier_3' },
  { role: 'cooperative', tier: 'tier_2' },
  { role: 'country_reviewer', tier: 'tier_3' },
  { role: 'sponsor', tier: 'tier_4' },
];

const PERMISSION_GROUPS: {
  id: AdminRbacPermissionGroupId;
  permissions: { key: string }[];
}[] = [
  {
    id: 'packages_shipments',
    permissions: [
      { key: 'packages:view' },
      { key: 'packages:create' },
      { key: 'packages:edit' },
      { key: 'packages:delete' },
      { key: 'packages:seal_shipment' },
      { key: 'packages:submit_traces' },
      { key: 'packages:approve' },
    ],
  },
  {
    id: 'plots',
    permissions: [
      { key: 'plots:view' },
      { key: 'plots:create' },
      { key: 'plots:edit' },
      { key: 'plots:delete' },
      { key: 'plots:bulk_upload' },
    ],
  },
  {
    id: 'farmers',
    permissions: [
      { key: 'farmers:view' },
      { key: 'farmers:create' },
      { key: 'farmers:edit' },
      { key: 'farmers:delete' },
      { key: 'farmers:link_validation' },
    ],
  },
  {
    id: 'compliance',
    permissions: [
      { key: 'compliance:view' },
      { key: 'compliance:run_check' },
      { key: 'compliance:approve' },
      { key: 'compliance:create_issue' },
      { key: 'compliance:resolve_issue' },
    ],
  },
  {
    id: 'requests',
    permissions: [
      { key: 'requests:view' },
      { key: 'requests:create' },
      { key: 'requests:send' },
      { key: 'requests:archive' },
      { key: 'requests:respond' },
    ],
  },
  {
    id: 'reports',
    permissions: [
      { key: 'reports:view' },
      { key: 'reports:generate' },
      { key: 'reports:export' },
    ],
  },
  {
    id: 'admin',
    permissions: [
      { key: 'admin:view' },
      { key: 'admin:manage_users' },
      { key: 'admin:manage_roles' },
    ],
  },
];

const ROLE_PERMISSIONS: Record<TenantRole, string[]> = {
  exporter: [
    'packages:view', 'packages:create', 'packages:edit', 'packages:delete', 'packages:seal_shipment', 'packages:submit_traces',
    'plots:view', 'plots:create', 'plots:edit', 'plots:delete', 'plots:bulk_upload',
    'farmers:view', 'farmers:create', 'farmers:edit', 'farmers:delete', 'farmers:link_validation',
    'compliance:view', 'compliance:run_check', 'compliance:create_issue', 'compliance:resolve_issue',
    'requests:view', 'requests:create', 'requests:send', 'requests:archive', 'requests:respond',
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
    'requests:view', 'requests:create', 'requests:send', 'requests:archive',
    'reports:view', 'reports:generate', 'reports:export',
    'admin:view', 'admin:manage_users',
  ],
};

const LEGAL_WORKFLOW_ROLES: LegalWorkflowRole[] = [
  'OUT_OF_SCOPE',
  'OPERATOR',
  'MICRO_SMALL_PRIMARY_OPERATOR',
  'DOWNSTREAM_OPERATOR_FIRST',
  'DOWNSTREAM_OPERATOR_SUBSEQUENT',
  'TRADER',
  'PENDING_MANUAL_CLASSIFICATION',
];

const LEGAL_WORKFLOW_PERMISSIONS = [
  { key: 'legal:submit_dds' },
  { key: 'legal:submit_simplified_declaration' },
  { key: 'legal:retain_reference' },
  { key: 'legal:downstream_reference' },
  { key: 'legal:trader_retention' },
  { key: 'legal:acknowledge_liability' },
];

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const pageHeader = translatePageHeader(t, 'rbac_matrix', {
    title: getAdminRbacCopy('title', t),
    subtitle: getAdminRbacCopy('subtitle', t),
  });
  const [activeTab, setActiveTab] = useState<'commercial' | 'legal'>('commercial');

  return (
    <PermissionGate permission="admin:view">
      <div className="flex flex-col">
        <AppHeader
          title={pageHeader.title}
          subtitle={pageHeader.subtitle}
          breadcrumbs={buildAppBreadcrumbs(t, { name: getAdminPageTitle(t), href: '/admin' }, { name: getAdminRbacCopy('title', t) })}
          actions={
            <Button variant="outline" asChild>
              <Link href="/admin">
                <ArrowLeft className="mr-2 h-4 w-4" />
                {getAdminRbacCopy('back_to_admin', t)}
              </Link>
            </Button>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          <Card className="bg-blue-50/50 border-blue-200">
            <CardContent className="pt-6">
              <div className="flex items-start gap-4">
                <Info className="h-5 w-5 text-blue-600 mt-0.5" />
                <div>
                  <p className="font-medium text-blue-900">{getAdminRbacCopy('info_title', t)}</p>
                  <p className="text-sm text-blue-700 mt-1">
                    {getAdminRbacCopy('info_body_prefix', t)}{' '}
                    <strong>{getAdminRbacCopy('info_commercial_label', t)}</strong>{' '}
                    {getAdminRbacCopy('info_body_mid', t)}{' '}
                    <strong>{getAdminRbacCopy('info_legal_label', t)}</strong>{' '}
                    {getAdminRbacCopy('info_body_suffix', t)}
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
                {getAdminRbacCopy('tab_commercial', t)}
              </TabsTrigger>
              <TabsTrigger value="legal" className="gap-2">
                <Gavel className="h-4 w-4" />
                {getAdminRbacCopy('tab_legal', t)}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="commercial" className="mt-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    {getAdminRbacCopy('commercial_title', t)}
                  </CardTitle>
                  <CardDescription>{getAdminRbacCopy('commercial_subtitle', t)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-background">
                            {getAdminRbacCopy('table_permission', t)}
                          </th>
                          {TENANT_ROLES.map((r) => (
                            <th key={r.role} className="text-center py-3 px-4 font-medium min-w-[100px]">
                              <div className="flex flex-col items-center gap-1">
                                <span>{getAdminRbacCommercialRoleLabel(r.role, t)}</span>
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
                          <Fragment key={group.id}>
                            <tr className="bg-secondary/30">
                              <td
                                colSpan={TENANT_ROLES.length + 1}
                                className="py-2 px-4 font-semibold text-foreground"
                              >
                                {getAdminRbacPermissionGroupLabel(group.id, t)}
                              </td>
                            </tr>
                            {group.permissions.map((perm) => (
                              <tr key={perm.key} className="border-b hover:bg-secondary/20">
                                <td className="py-2 px-4 text-muted-foreground sticky left-0 bg-background">
                                  {getAdminRbacCommercialPermissionLabel(perm.key, t)}
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
                          </Fragment>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="legal" className="mt-6 space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Gavel className="h-5 w-5" />
                    {getAdminRbacCopy('legal_roles_title', t)}
                  </CardTitle>
                  <CardDescription>{getAdminRbacCopy('legal_roles_subtitle', t)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                    {LEGAL_WORKFLOW_ROLES.map((role) => (
                      <div
                        key={role}
                        className={cn(
                          'p-4 rounded-lg border',
                          role === 'PENDING_MANUAL_CLASSIFICATION'
                            ? 'bg-amber-50/50 border-amber-200'
                            : role === 'OUT_OF_SCOPE'
                            ? 'bg-gray-50 border-gray-200'
                            : 'bg-card'
                        )}
                      >
                        <p className="font-medium text-foreground">{getLegalRoleFilterLabel(role, t)}</p>
                        <p className="text-sm text-muted-foreground mt-1">{getLegalRoleDescriptionLabel(role, t)}</p>
                        <div className="mt-3 flex flex-wrap gap-1">
                          {LEGAL_ROLE_PERMISSIONS[role].length > 0 ? (
                            LEGAL_ROLE_PERMISSIONS[role].map((perm) => (
                              <Badge key={perm} variant="secondary" className="text-xs">
                                {getAdminRbacLegalPermissionLabel(perm, t)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-xs text-muted-foreground">
                              {getAdminRbacCopy('no_legal_permissions', t)}
                            </span>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>{getAdminRbacCopy('legal_matrix_title', t)}</CardTitle>
                  <CardDescription>{getAdminRbacCopy('legal_matrix_subtitle', t)}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead>
                        <tr className="border-b">
                          <th className="text-left py-3 px-4 font-medium text-muted-foreground sticky left-0 bg-background">
                            {getAdminRbacCopy('table_permission', t)}
                          </th>
                          {LEGAL_WORKFLOW_ROLES.map((role) => (
                            <th key={role} className="text-center py-3 px-2 font-medium min-w-[90px]">
                              <span className="text-xs">{getLegalRoleFilterLabel(role, t)}</span>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {LEGAL_WORKFLOW_PERMISSIONS.map((perm) => (
                          <tr key={perm.key} className="border-b hover:bg-secondary/20">
                            <td className="py-3 px-4 text-muted-foreground sticky left-0 bg-background">
                              {getAdminRbacLegalPermissionLabel(perm.key, t)}
                            </td>
                            {LEGAL_WORKFLOW_ROLES.map((role) => {
                              const hasPermission = LEGAL_ROLE_PERMISSIONS[role]?.includes(perm.key);
                              return (
                                <td key={role} className="text-center py-3 px-2">
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
