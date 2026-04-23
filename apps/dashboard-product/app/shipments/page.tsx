'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  Package,
  Plus,
  Search,
  ChevronRight,
  Clock,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  MoreHorizontal,
  Archive,
  FileText,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { cn } from '@/lib/utils';

// Canonical shipment states per spec
type ShipmentStatus = 'DRAFT' | 'READY' | 'SEALED' | 'SUBMITTED' | 'ACCEPTED' | 'REJECTED' | 'ARCHIVED' | 'ON_HOLD';

interface Shipment {
  id: string;
  code: string;
  status: ShipmentStatus;
  org_name: string;
  created_at: string;
  modified_at: string;
  owner: string;
  plots_count: number;
  farmers_count: number;
  days_in_status: number;
  has_blocking_issues: boolean;
}

const mockShipments: Shipment[] = [];

const STATUS_CONFIG: Record<ShipmentStatus, { label: string; color: string; icon: typeof Clock }> = {
  DRAFT: { label: 'Draft', color: 'bg-gray-100 text-gray-800', icon: Clock },
  READY: { label: 'Ready', color: 'bg-blue-100 text-blue-800', icon: CheckCircle2 },
  SEALED: { label: 'Sealed', color: 'bg-purple-100 text-purple-800', icon: Package },
  SUBMITTED: { label: 'Submitted', color: 'bg-cyan-100 text-cyan-800', icon: FileText },
  ACCEPTED: { label: 'Accepted', color: 'bg-emerald-100 text-emerald-800', icon: CheckCircle2 },
  REJECTED: { label: 'Rejected', color: 'bg-red-100 text-red-800', icon: XCircle },
  ARCHIVED: { label: 'Archived', color: 'bg-gray-100 text-gray-600', icon: Archive },
  ON_HOLD: { label: 'On Hold', color: 'bg-amber-100 text-amber-800', icon: AlertTriangle },
};

export default function ShipmentsPage() {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedStatus, setSelectedStatus] = useState<'all' | ShipmentStatus>('all');
  const [selectedOrg, setSelectedOrg] = useState<'all' | string>('all');

  // Get unique organizations
  const organizations = useMemo(() => {
    return [...new Set(mockShipments.map((s) => s.org_name))];
  }, []);

  // Filter shipments
  const filteredShipments = useMemo(() => {
    return mockShipments.filter((shipment) => {
      if (selectedStatus !== 'all' && shipment.status !== selectedStatus) return false;
      if (selectedOrg !== 'all' && shipment.org_name !== selectedOrg) return false;
      if (searchTerm) {
        const search = searchTerm.toLowerCase();
        return (
          shipment.code.toLowerCase().includes(search) ||
          shipment.owner.toLowerCase().includes(search) ||
          shipment.org_name.toLowerCase().includes(search)
        );
      }
      return true;
    });
  }, [searchTerm, selectedStatus, selectedOrg]);

  // Calculate stats
  const stats = useMemo(() => {
    return {
      draft: mockShipments.filter((s) => s.status === 'DRAFT').length,
      ready: mockShipments.filter((s) => s.status === 'READY').length,
      sealed: mockShipments.filter((s) => s.status === 'SEALED').length,
      submitted: mockShipments.filter((s) => s.status === 'SUBMITTED').length,
      accepted: mockShipments.filter((s) => s.status === 'ACCEPTED').length,
      onHold: mockShipments.filter((s) => s.status === 'ON_HOLD').length,
      total: mockShipments.length,
    };
  }, []);

  return (
    <PermissionGate permission="packages:view">
      <div className="flex flex-col">
        <AppHeader
          title="Shipments"
          subtitle="Manage DDS shipments and TRACES submissions"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Operations' },
            { label: 'Shipments' },
          ]}
          action={
            <PermissionGate permission="packages:create">
              <Button asChild>
                <Link href="/packages/new">
                  <Plus className="mr-2 h-4 w-4" />
                  New Shipment
                </Link>
              </Button>
            </PermissionGate>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Pipeline Stats */}
          <div className="grid gap-4 md:grid-cols-4 lg:grid-cols-7">
            {(['DRAFT', 'READY', 'SEALED', 'SUBMITTED', 'ACCEPTED', 'ON_HOLD'] as ShipmentStatus[]).map((status) => {
              const config = STATUS_CONFIG[status];
              const count = mockShipments.filter((s) => s.status === status).length;
              const Icon = config.icon;
              return (
                <Card
                  key={status}
                  className={cn(
                    'cursor-pointer transition-shadow hover:shadow-md',
                    selectedStatus === status && 'ring-2 ring-primary'
                  )}
                  onClick={() => setSelectedStatus(selectedStatus === status ? 'all' : status)}
                >
                  <CardContent className="pt-4 pb-4">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-muted-foreground">{config.label}</p>
                        <p className="text-2xl font-bold mt-1">{count}</p>
                      </div>
                      <Icon className={cn('h-5 w-5', config.color.replace('bg-', 'text-').split(' ')[0])} />
                    </div>
                  </CardContent>
                </Card>
              );
            })}
            <Card>
              <CardContent className="pt-4 pb-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-medium text-muted-foreground">Total</p>
                    <p className="text-2xl font-bold mt-1">{stats.total}</p>
                  </div>
                  <Package className="h-5 w-5 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-wrap gap-4">
                <div className="flex-1 min-w-[200px]">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search shipments..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                </div>
                <select
                  value={selectedOrg}
                  onChange={(e) => setSelectedOrg(e.target.value)}
                  className="px-3 py-2 border rounded-md text-sm"
                >
                  <option value="all">All Organizations</option>
                  {organizations.map((org) => (
                    <option key={org} value={org}>
                      {org}
                    </option>
                  ))}
                </select>
                <Button
                  variant="outline"
                  onClick={() => {
                    setSearchTerm('');
                    setSelectedStatus('all');
                    setSelectedOrg('all');
                  }}
                >
                  Clear Filters
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Shipments Table */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base font-medium">
                {filteredShipments.length} Shipment{filteredShipments.length !== 1 ? 's' : ''}
                {selectedStatus !== 'all' && ` in ${STATUS_CONFIG[selectedStatus].label}`}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b text-left">
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Code</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Status</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Organization</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Owner</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Plots</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">Modified</th>
                      <th className="pb-3 pr-4 text-sm font-medium text-muted-foreground">SLA</th>
                      <th className="pb-3 text-sm font-medium text-muted-foreground"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredShipments.length === 0 ? (
                      <tr>
                        <td colSpan={8} className="py-12 text-center text-sm text-muted-foreground">
                          No shipments match the selected filters
                        </td>
                      </tr>
                    ) : (
                      filteredShipments.map((shipment) => {
                        const config = STATUS_CONFIG[shipment.status];
                        const slaWarning = shipment.days_in_status >= 7 && ['DRAFT', 'READY'].includes(shipment.status);
                        return (
                          <tr key={shipment.id} className="border-b last:border-0 hover:bg-secondary/30">
                            <td className="py-4 pr-4">
                              <Link
                                href={`/packages/${shipment.id}`}
                                className="font-medium text-primary hover:underline"
                              >
                                {shipment.code}
                              </Link>
                            </td>
                            <td className="py-4 pr-4">
                              <div className="flex items-center gap-2">
                                <Badge className={cn('text-xs', config.color)}>{config.label}</Badge>
                                {shipment.has_blocking_issues && (
                                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                                )}
                              </div>
                            </td>
                            <td className="py-4 pr-4 text-sm text-muted-foreground">{shipment.org_name}</td>
                            <td className="py-4 pr-4 text-sm">{shipment.owner}</td>
                            <td className="py-4 pr-4 text-sm text-muted-foreground">
                              {shipment.plots_count} plots / {shipment.farmers_count} farmers
                            </td>
                            <td className="py-4 pr-4 text-sm text-muted-foreground">
                              {new Date(shipment.modified_at).toLocaleDateString()}
                            </td>
                            <td className="py-4 pr-4">
                              <span
                                className={cn(
                                  'text-xs font-medium',
                                  slaWarning ? 'text-red-600' : 'text-muted-foreground'
                                )}
                              >
                                {shipment.days_in_status}d
                              </span>
                            </td>
                            <td className="py-4">
                              <div className="flex items-center gap-2">
                                <Button variant="ghost" size="sm" asChild>
                                  <Link href={`/packages/${shipment.id}`}>
                                    View
                                    <ChevronRight className="ml-1 h-3 w-3" />
                                  </Link>
                                </Button>
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="sm">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem>
                                      <Link href={`/packages/${shipment.id}/timeline`}>View Timeline</Link>
                                    </DropdownMenuItem>
                                    <DropdownMenuItem>Export PDF</DropdownMenuItem>
                                    <DropdownMenuItem>Archive</DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              </div>
                            </td>
                          </tr>
                        );
                      })
                    )}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
