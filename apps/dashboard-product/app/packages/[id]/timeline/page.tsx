'use client';

import { use } from 'react';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { PermissionGate } from '@/components/common/permission-gate';
import { Timeline, type TimelineEvent } from '@/components/ui/timeline-row';
import { getPackageById } from '@/lib/mock-data';
import { ArrowLeft, Clock, CheckCircle2, AlertTriangle, Upload } from 'lucide-react';
import { cn } from '@/lib/utils';

interface TimelinePageProps {
  params: Promise<{ id: string }>;
}

// Mock timeline events for the shipment
const getShipmentTimeline = (): TimelineEvent[] => [
  {
    id: 'evt-1',
    eventType: 'creation',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
    userName: 'Maria Rodriguez',
    userRole: 'Exporter',
    description: 'Shipment created',
    metadata: { shipment_code: 'SHP-2026-001' },
  },
  {
    id: 'evt-2',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
    userName: 'Maria Rodriguez',
    userRole: 'Exporter',
    description: 'Added 12 plots to shipment',
    metadata: { plots_added: 12 },
  },
  {
    id: 'evt-3',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 12).toISOString(),
    userName: 'Carlos Mendez',
    userRole: 'Field Agent',
    description: 'Uploaded FPIC consent documents for 8 farmers',
    metadata: { farmers_count: 8, document_type: 'FPIC' },
  },
  {
    id: 'evt-4',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 10).toISOString(),
    userName: 'System',
    description: 'Compliance check completed',
    metadata: { checks_passed: 7, checks_total: 8, check_failed: 'Deforestation assessment pending' },
  },
  {
    id: 'evt-5',
    eventType: 'alert',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 9).toISOString(),
    userName: 'System',
    description: 'Compliance issue created: Deforestation risk detected on Plot P-042',
    metadata: { issue_id: 'CI-2024-015', severity: 'BLOCKING' },
  },
  {
    id: 'evt-6',
    eventType: 'document_uploaded',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    userName: 'Ana Garcia',
    userRole: 'Compliance Manager',
    description: 'Uploaded deforestation assessment evidence for Plot P-042',
    metadata: { document_type: 'Evidence', plot_id: 'P-042' },
  },
  {
    id: 'evt-7',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 6).toISOString(),
    userName: 'Ana Garcia',
    userRole: 'Compliance Manager',
    description: 'Compliance issue CI-2024-015 resolved',
    metadata: { issue_id: 'CI-2024-015', resolution: 'Evidence verified - no deforestation' },
  },
  {
    id: 'evt-8',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
    userName: 'Maria Rodriguez',
    userRole: 'Exporter',
    description: 'Status changed: DRAFT → READY',
    metadata: { from_status: 'DRAFT', to_status: 'READY' },
  },
  {
    id: 'evt-9',
    eventType: 'approval',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 4).toISOString(),
    userName: 'System',
    description: 'Pre-flight checks passed (8/8)',
    metadata: { checks_passed: 8, checks_total: 8 },
  },
  {
    id: 'evt-10',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 3).toISOString(),
    userName: 'Maria Rodriguez',
    userRole: 'Exporter',
    description: 'Status changed: READY → SEALED',
    metadata: { from_status: 'READY', to_status: 'SEALED', liability_acknowledged: true },
  },
  {
    id: 'evt-11',
    eventType: 'submission',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    userName: 'Maria Rodriguez',
    userRole: 'Exporter',
    description: 'DDS submitted to TRACES NT',
    metadata: { traces_reference: 'DDS-2026-0891', submission_time: '14:32:15 UTC' },
  },
  {
    id: 'evt-12',
    eventType: 'status_change',
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 24 * 2).toISOString(),
    userName: 'System',
    description: 'Status changed: SEALED → SUBMITTED',
    metadata: { from_status: 'SEALED', to_status: 'SUBMITTED' },
  },
];

// State transition visualization
const STATE_FLOW = [
  { state: 'DRAFT', label: 'Draft', color: 'bg-gray-400' },
  { state: 'READY', label: 'Ready', color: 'bg-blue-500' },
  { state: 'SEALED', label: 'Sealed', color: 'bg-purple-500' },
  { state: 'SUBMITTED', label: 'Submitted', color: 'bg-cyan-500' },
  { state: 'ACCEPTED', label: 'Accepted', color: 'bg-emerald-500' },
];

export default function ShipmentTimelinePage({ params }: TimelinePageProps) {
  const { id } = use(params);
  const pkg = getPackageById(id);

  if (!pkg) {
    notFound();
  }

  const timelineEvents = getShipmentTimeline();
  const currentStateIndex = STATE_FLOW.findIndex(
    (s) => s.state.toLowerCase() === pkg.status.toLowerCase()
  );

  return (
    <PermissionGate permission="packages:view">
      <div className="flex flex-col">
        <AppHeader
          title={`Timeline: ${pkg.code}`}
          subtitle="Complete audit history of shipment state changes and events"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Shipments', href: '/shipments' },
            { label: pkg.code, href: `/packages/${id}` },
            { label: 'Timeline' },
          ]}
          action={
            <Button variant="outline" asChild>
              <Link href={`/packages/${id}`}>
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to Shipment
              </Link>
            </Button>
          }
        />

        <div className="flex-1 space-y-6 p-6">
          {/* State Flow Visualization */}
          <Card>
            <CardHeader>
              <CardTitle>State Progression</CardTitle>
              <CardDescription>Canonical shipment state machine flow</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                {STATE_FLOW.map((state, index) => {
                  const isActive = index <= currentStateIndex;
                  const isCurrent = index === currentStateIndex;
                  return (
                    <div key={state.state} className="flex items-center flex-1">
                      <div className="flex flex-col items-center flex-1">
                        <div
                          className={cn(
                            'h-10 w-10 rounded-full flex items-center justify-center text-white font-medium text-sm',
                            isActive ? state.color : 'bg-gray-200 text-gray-500',
                            isCurrent && 'ring-4 ring-offset-2 ring-primary/30'
                          )}
                        >
                          {index + 1}
                        </div>
                        <p
                          className={cn(
                            'mt-2 text-sm font-medium',
                            isActive ? 'text-foreground' : 'text-muted-foreground'
                          )}
                        >
                          {state.label}
                        </p>
                        {isCurrent && (
                          <Badge variant="outline" className="mt-1 text-xs">
                            Current
                          </Badge>
                        )}
                      </div>
                      {index < STATE_FLOW.length - 1 && (
                        <div
                          className={cn(
                            'h-1 flex-1 mx-2',
                            index < currentStateIndex ? 'bg-primary' : 'bg-gray-200'
                          )}
                        />
                      )}
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* Timeline Stats */}
          <div className="grid gap-4 md:grid-cols-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                    <Clock className="h-5 w-5 text-blue-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Total Events</p>
                    <p className="text-2xl font-bold">{timelineEvents.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-emerald-100 flex items-center justify-center">
                    <CheckCircle2 className="h-5 w-5 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">State Changes</p>
                    <p className="text-2xl font-bold">
                      {timelineEvents.filter((e) => e.eventType === 'status_change').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-amber-100 flex items-center justify-center">
                    <AlertTriangle className="h-5 w-5 text-amber-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Issues Raised</p>
                    <p className="text-2xl font-bold">
                      {timelineEvents.filter((e) => e.eventType === 'alert').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-4">
                  <div className="h-10 w-10 rounded-full bg-purple-100 flex items-center justify-center">
                    <Upload className="h-5 w-5 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">Documents</p>
                    <p className="text-2xl font-bold">
                      {timelineEvents.filter((e) => e.eventType === 'document_uploaded').length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Full Timeline */}
          <Card>
            <CardHeader>
              <CardTitle>Audit Timeline</CardTitle>
              <CardDescription>Complete chronological history of all events</CardDescription>
            </CardHeader>
            <CardContent>
              <Timeline events={timelineEvents} />
            </CardContent>
          </Card>
        </div>
      </div>
    </PermissionGate>
  );
}
