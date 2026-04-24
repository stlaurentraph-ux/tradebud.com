'use client';

import { useEffect, useMemo, useState } from 'react';
import { Download, Filter, Calendar, User, Package, MapPin, FileText } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/common/permission-gate';
import { cn } from '@/lib/utils';
import { useAuth } from '@/lib/auth-context';

interface AuditLogEntry {
  id: string;
  timestamp: string;
  user_email: string;
  action: string;
  entity_type: 'package' | 'plot' | 'farmer' | 'harvest' | 'fpic' | 'compliance';
  entity_id: string;
  entity_name: string;
  changes?: Record<string, { old: string; new: string }>;
  ip_address: string;
}

const auditLogEntries: AuditLogEntry[] = process.env.NODE_ENV !== 'production' ? [
  {
    id: 'log_001',
    timestamp: '2026-04-20T08:40:00.000Z',
    user_email: 'governance@kilimani.coop',
    action: 'approved',
    entity_type: 'compliance',
    entity_id: 'premium_0182',
    entity_name: 'Premium Distribution Decision #0182',
    changes: {
      status: { old: 'proposed', new: 'approved' },
      payout_split: { old: 'pending', new: '70_cash_30_services' },
    },
    ip_address: '102.45.11.82',
  },
  {
    id: 'log_002',
    timestamp: '2026-04-20T10:15:00.000Z',
    user_email: 'field.agent2@kilimani.coop',
    action: 'uploaded',
    entity_type: 'fpic',
    entity_id: 'doc_002',
    entity_name: 'Portability Release Statement - Member 812',
    ip_address: '102.45.13.20',
  },
  {
    id: 'log_003',
    timestamp: '2026-04-21T13:55:00.000Z',
    user_email: 'compliance.lead@kilimani.coop',
    action: 'updated',
    entity_type: 'harvest',
    entity_id: 'BATCH-2026-043',
    entity_name: 'Valley Group Lot 7',
    changes: {
      exception_status: { old: 'none', new: 'pending' },
    },
    ip_address: '102.45.14.77',
  },
] : [];

const actionColors: Record<string, string> = {
  created: 'bg-blue-500/20 text-blue-600',
  updated: 'bg-amber-500/20 text-amber-600',
  deleted: 'bg-destructive/20 text-destructive',
  approved: 'bg-emerald-500/20 text-emerald-600',
  rejected: 'bg-destructive/20 text-destructive',
  submitted: 'bg-purple-500/20 text-purple-600',
  uploaded: 'bg-indigo-500/20 text-indigo-600',
  exported: 'bg-slate-500/20 text-slate-600',
};

const entityIcons: Record<string, typeof Package> = {
  package: Package,
  plot: MapPin,
  farmer: User,
  harvest: FileText,
  fpic: FileText,
  compliance: FileText,
};

const entityLabels: Record<'package' | 'plot' | 'farmer' | 'harvest' | 'fpic' | 'compliance', string> = {
  package: 'Package',
  plot: 'Plot',
  farmer: 'Farmer',
  harvest: 'Harvest',
  fpic: 'Evidence',
  compliance: 'Compliance',
};

export default function AuditLogPage() {
  const { user } = useAuth();
  const isCooperative = user?.active_role === 'cooperative';
  const getEntityLabel = (entity: 'package' | 'plot' | 'farmer' | 'harvest' | 'fpic' | 'compliance') => {
    if (isCooperative && entity === 'farmer') return 'Member';
    return entityLabels[entity];
  };
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEntity, setFilterEntity] = useState<'all' | 'package' | 'plot' | 'farmer' | 'harvest' | 'fpic' | 'compliance'>('all');
  const [filterAction, setFilterAction] = useState<'all' | 'created' | 'updated' | 'deleted' | 'approved' | 'submitted' | 'uploaded' | 'exported'>('all');
  const [dateRange, setDateRange] = useState<'all' | '7d' | '30d' | '90d'>('all');
  const [backendEntries, setBackendEntries] = useState<AuditLogEntry[]>([]);

  useEffect(() => {
    if (!isCooperative) return;
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    void fetch('/api/cooperative/audit-log', { headers, cache: 'no-store' })
      .then((response) => response.json())
      .then((payload: { entries?: AuditLogEntry[] }) => {
        if (Array.isArray(payload.entries)) setBackendEntries(payload.entries);
      })
      .catch(() => undefined);
  }, [isCooperative]);

  const baseEntries = useMemo(
    () => (isCooperative && backendEntries.length > 0 ? backendEntries : auditLogEntries),
    [backendEntries, isCooperative],
  );

  const filteredLog = baseEntries.filter((entry) => {
    if (filterEntity !== 'all' && entry.entity_type !== filterEntity) return false;
    if (filterAction !== 'all' && entry.action !== filterAction) return false;
    const query = searchQuery.toLowerCase();
    return (
      entry.user_email.toLowerCase().includes(query) ||
      entry.entity_name.toLowerCase().includes(query) ||
      entry.entity_id.toLowerCase().includes(query)
    );
  });

  return (
    <PermissionGate permission="audit:view">
      <div className="flex flex-col">
        <AppHeader
          title="Audit Log"
          subtitle={
            isCooperative
              ? 'Immutable trail across member, consent, portability, batch, shipment, and premium-governance events'
              : 'Complete activity trail for compliance and 5-year retention'
          }
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Audit Log' },
          ]}
          actions={
            <PermissionGate permission="audit:export">
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                Export CSV
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {/* Search */}
                <Input
                  placeholder={
                    isCooperative
                      ? 'Search by user, member, plot, batch, portability request, premium record, or ID...'
                      : 'Search by user, entity name, or ID...'
                  }
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="max-w-xs"
                />

                {/* Filter Groups */}
                <div className="grid gap-4 md:grid-cols-3">
                  {/* Entity Type Filter */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Entity Type</p>
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'package', 'plot', 'farmer', 'harvest', 'fpic', 'compliance'] as const).map((entity) => (
                        <Button
                          key={entity}
                          variant={filterEntity === entity ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setFilterEntity(entity)}
                          className="capitalize"
                        >
                          {entity === 'all' ? 'All' : getEntityLabel(entity)}
                        </Button>
                      ))}
                    </div>
                  </div>

                  {/* Action Filter */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Action</p>
                    <div className="flex flex-wrap gap-1">
                      {(['all', 'created', 'updated', 'deleted', 'approved', 'submitted', 'uploaded', 'exported'] as const).map(
                        (action) => (
                          <Button
                            key={action}
                            variant={filterAction === action ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setFilterAction(action)}
                            className="capitalize"
                          >
                            {action}
                          </Button>
                        )
                      )}
                    </div>
                  </div>

                  {/* Date Range Filter */}
                  <div>
                    <p className="text-sm font-medium text-muted-foreground mb-2">Date Range</p>
                    <div className="flex flex-wrap gap-1">
                      {(['all', '7d', '30d', '90d'] as const).map((range) => (
                        <Button
                          key={range}
                          variant={dateRange === range ? 'default' : 'outline'}
                          size="sm"
                          onClick={() => setDateRange(range)}
                        >
                          {range === 'all' ? 'All Time' : range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : '90 Days'}
                        </Button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Audit Log Entries */}
          <div className="space-y-2">
            {filteredLog.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
                <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
                <p className="mt-4 text-sm text-muted-foreground">No entries match your filters</p>
              </div>
            ) : (
              filteredLog.map((entry) => {
                const EntityIcon = entityIcons[entry.entity_type] || FileText;
                return (
                  <div
                    key={entry.id}
                    className="flex items-start gap-4 rounded-lg border border-border p-4 hover:bg-secondary/30 transition-colors"
                  >
                    {/* Entity Icon */}
                    <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-secondary flex-shrink-0">
                      <EntityIcon className="h-5 w-5 text-muted-foreground" />
                    </div>

                    {/* Main Content */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2 flex-wrap">
                        <span className="font-medium text-foreground">{entry.user_email}</span>
                        <Badge className={cn('capitalize', actionColors[entry.action] || 'bg-slate-500/20 text-slate-600')}>
                          {entry.action}
                        </Badge>
                        <span className="text-sm text-muted-foreground">{getEntityLabel(entry.entity_type)}</span>
                      </div>

                      <p className="text-sm text-foreground mb-2">
                        <span className="font-medium">{entry.entity_name}</span>
                        <span className="text-muted-foreground"> (ID: {entry.entity_id})</span>
                      </p>

                      {/* Changes if available */}
                      {entry.changes && Object.keys(entry.changes).length > 0 && (
                        <div className="text-xs text-muted-foreground mb-2 space-y-1">
                          {Object.entries(entry.changes).map(([field, { old, new: newVal }]) => (
                            <div key={field}>
                              <span className="font-medium">{field}:</span> {old} → {newVal}
                            </div>
                          ))}
                        </div>
                      )}

                      {/* Timestamp & IP */}
                      <div className="flex items-center gap-3 text-xs text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {new Date(entry.timestamp).toLocaleString()}
                        </div>
                        <span>•</span>
                        <div>IP: {entry.ip_address}</div>
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Info Box */}
          <Card className="border-slate-200 bg-slate-50">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <FileText className="h-5 w-5 text-slate-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-medium text-slate-900">
                    5-Year Retention & Audit Trail
                  </p>
                  <p className="text-slate-800 mt-1">
                    All due diligence documentation and activity logs are retained securely for exactly 5 years per EUDR Section IX requirements. 
                    This audit log captures every action performed on packages, plots, members and producers, FPIC documents, and compliance checks with 
                    user identity, timestamp, and IP address for accountability.
                    {isCooperative ? ' Cooperative governance decisions, portability actions, and premium-approval events are included in the same immutable trail.' : ''}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
