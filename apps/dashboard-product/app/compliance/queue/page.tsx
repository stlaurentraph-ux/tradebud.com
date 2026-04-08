'use client';

import { useState } from 'react';
import Link from 'next/link';
import { CheckCircle, XCircle, Clock, AlertCircle, ChevronRight, Filter } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { mockPackages } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

interface QueuedPackage {
  id: string;
  code: string;
  supplier_name: string;
  plots_count: number;
  risk_level: 'low' | 'medium' | 'high';
  submitted_date: string;
  status: 'pending' | 'approved' | 'rejected' | 'changes_requested';
}

const mockQueue: QueuedPackage[] = mockPackages.map((p) => ({
  id: p.id,
  code: p.code,
  supplier_name: p.supplier_name,
  plots_count: p.plots.length,
  risk_level: (p.plots.some((pl) => pl.deforestation_risk === 'high')
    ? 'high'
    : p.plots.some((pl) => pl.deforestation_risk === 'medium')
    ? 'medium'
    : 'low') as 'low' | 'medium' | 'high',
  submitted_date: p.created_at,
  status: 'pending',
})).slice(0, 8);

function getRiskColor(risk: 'low' | 'medium' | 'high') {
  return risk === 'high'
    ? 'bg-destructive/20 text-destructive'
    : risk === 'medium'
    ? 'bg-amber-500/20 text-amber-600'
    : 'bg-emerald-500/20 text-emerald-600';
}

function getStatusIcon(status: 'pending' | 'approved' | 'rejected' | 'changes_requested') {
  switch (status) {
    case 'approved':
      return <CheckCircle className="h-4 w-4 text-emerald-500" />;
    case 'rejected':
      return <XCircle className="h-4 w-4 text-destructive" />;
    case 'changes_requested':
      return <AlertCircle className="h-4 w-4 text-amber-500" />;
    default:
      return <Clock className="h-4 w-4 text-muted-foreground" />;
  }
}

function getStatusLabel(status: 'pending' | 'approved' | 'rejected' | 'changes_requested') {
  switch (status) {
    case 'approved':
      return 'Approved';
    case 'rejected':
      return 'Rejected';
    case 'changes_requested':
      return 'Changes Requested';
    default:
      return 'Pending Review';
  }
}

export default function ComplianceQueuePage() {
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'pending' | 'approved' | 'rejected'>('all');
  const [selectedRisk, setSelectedRisk] = useState<'all' | 'low' | 'medium' | 'high'>('all');

  const filteredQueue = mockQueue.filter((item) => {
    if (selectedStatus !== 'all' && item.status !== selectedStatus) return false;
    if (selectedRisk !== 'all' && item.risk_level !== selectedRisk) return false;
    return true;
  });

  const pendingCount = mockQueue.filter((p) => p.status === 'pending').length;
  const approvedCount = mockQueue.filter((p) => p.status === 'approved').length;
  const rejectedCount = mockQueue.filter((p) => p.status === 'rejected').length;

  return (
    <PermissionGate permission="packages:review">
      <div className="flex flex-col">
        <AppHeader
          title="Compliance Review Queue"
          subtitle="Review and approve submitted DDS packages for EUDR compliance"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Compliance' },
            { label: 'Review Queue' },
          ]}
        />

        <div className="flex-1 space-y-6 p-6">
          {/* Summary Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{pendingCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Pending Review</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-emerald-600">{approvedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Approved</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-destructive">{rejectedCount}</p>
                  <p className="text-sm text-muted-foreground mt-1">Rejected</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-3xl font-bold text-foreground">{mockQueue.length}</p>
                  <p className="text-sm text-muted-foreground mt-1">Total in Queue</p>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader className="pb-3">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <CardTitle className="text-base font-medium">Filters</CardTitle>
              </div>
            </CardHeader>
            <CardContent>
              <div className="flex flex-wrap gap-3">
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Status:</span>
                  {['all', 'pending', 'approved', 'rejected'].map((status) => (
                    <Button
                      key={status}
                      variant={selectedStatus === status ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedStatus(status as any)}
                      className="capitalize"
                    >
                      {status}
                    </Button>
                  ))}
                </div>
                <div className="flex gap-2">
                  <span className="text-sm font-medium text-muted-foreground">Risk Level:</span>
                  {['all', 'low', 'medium', 'high'].map((risk) => (
                    <Button
                      key={risk}
                      variant={selectedRisk === risk ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedRisk(risk as any)}
                      className="capitalize"
                    >
                      {risk}
                    </Button>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Queue List */}
          <div className="space-y-3">
            {filteredQueue.length === 0 ? (
              <div className="rounded-lg border border-border bg-secondary/30 py-12 text-center">
                <p className="text-sm text-muted-foreground">No packages match the selected filters</p>
              </div>
            ) : (
              filteredQueue.map((item) => (
                <Card key={item.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="pt-6 pb-4">
                    <div className="flex items-center justify-between gap-4">
                      {/* Left: Package Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-3 mb-2">
                          <Link
                            href={`/packages/${item.id}`}
                            className="text-sm font-semibold text-primary hover:underline"
                          >
                            {item.code}
                          </Link>
                          <Badge variant="outline" className={cn('capitalize', getRiskColor(item.risk_level))}>
                            {item.risk_level} Risk
                          </Badge>
                          <Badge variant="outline">
                            {getStatusIcon(item.status)}
                            <span className="ml-1">{getStatusLabel(item.status)}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground">
                          <span className="font-medium text-foreground">{item.supplier_name}</span>
                          {' • '}
                          {item.plots_count} plot{item.plots_count !== 1 ? 's' : ''}
                          {' • '}
                          Submitted: {new Date(item.submitted_date).toLocaleDateString()}
                        </p>
                      </div>

                      {/* Right: Actions */}
                      {item.status === 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="outline" size="sm" asChild>
                            <Link href={`/compliance?package=${item.id}`}>
                              Review
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      )}
                      {item.status !== 'pending' && (
                        <div className="flex items-center gap-2 flex-shrink-0">
                          <Button variant="ghost" size="sm" asChild>
                            <Link href={`/packages/${item.id}`}>
                              View Details
                              <ChevronRight className="ml-1 h-3 w-3" />
                            </Link>
                          </Button>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        </div>
      </div>
    </PermissionGate>
  );
}
