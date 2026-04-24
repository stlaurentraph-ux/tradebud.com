'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Plus, Send } from 'lucide-react';
import { NewRequestWizardDialog, type NewRequestResult } from '@/components/requests/wizard/new-request-wizard-dialog';
import { useAuth } from '@/lib/auth-context';

type OutreachStatus = 'Draft' | 'Sent' | 'Completed' | 'Archived';

type OutreachRequest = {
  id: string;
  counterpartName: string;
  commodity: string;
  date: string;
  status: OutreachStatus;
};

const MOCK_OUTREACH_REQUESTS: OutreachRequest[] = [
  { id: 'OUT-2026-001', counterpartName: 'North Valley Cooperative', commodity: 'Cocoa', date: '2026-04-20', status: 'Sent' },
  { id: 'OUT-2026-002', counterpartName: 'Green Ridge Producers', commodity: 'Coffee', date: '2026-04-18', status: 'Draft' },
  { id: 'OUT-2026-003', counterpartName: 'Kivu Export Group', commodity: 'Palm Oil', date: '2026-04-12', status: 'Completed' },
];

const OUTREACH_STATUS_TABS: OutreachStatus[] = ['Draft', 'Sent', 'Completed', 'Archived'];

const statusBadgeClass: Record<OutreachStatus, string> = {
  Draft: 'bg-slate-500/15 text-slate-700',
  Sent: 'bg-blue-500/15 text-blue-700',
  Completed: 'bg-emerald-500/15 text-emerald-700',
  Archived: 'bg-zinc-500/15 text-zinc-700',
};

export default function OutreachPage() {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const [statusTab, setStatusTab] = useState<OutreachStatus>('Draft');
  const [isWizardOpen, setIsWizardOpen] = useState(false);
  const [requests, setRequests] = useState<OutreachRequest[]>(MOCK_OUTREACH_REQUESTS);

  const filteredRequests = useMemo(
    () => requests.filter((request) => request.status === statusTab),
    [requests, statusTab],
  );

  const handleWizardComplete = (result: NewRequestResult) => {
    const requestId = `OUT-2026-${String(requests.length + 1).padStart(3, '0')}`;
    const newRequest: OutreachRequest = {
      id: requestId,
      counterpartName: result.counterpartName,
      commodity: result.commodity,
      date: new Date().toISOString().slice(0, 10),
      status: result.status,
    };
    setRequests((prev) => [newRequest, ...prev]);
    setStatusTab(result.status);
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title={isImporter ? 'Campaigns' : 'Outreach'}
        subtitle={
          isImporter
            ? 'Launch and monitor outbound data-collection campaigns to upstream partners'
            : 'Draft, send, and track requests to upstream partners'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: isImporter ? 'Campaigns' : 'Outreach' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>{isImporter ? 'Outbound Campaigns' : 'Outgoing Requests'}</CardTitle>
            <Button onClick={() => setIsWizardOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              {isImporter ? 'New Campaign' : 'New Request'}
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as OutreachStatus)}>
              <TabsList>
                {OUTREACH_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Send className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">
                  {isImporter ? `No ${statusTab.toLowerCase()} campaigns` : `No ${statusTab.toLowerCase()} outreach requests`}
                </p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isImporter
                    ? 'Start a campaign to collect missing evidence and references from upstream partners.'
                    : 'Create a new request to start collecting evidence from your upstream partners.'}
                </p>
                <Button className="mt-4" variant="outline" onClick={() => setIsWizardOpen(true)}>
                  <Plus className="mr-2 h-4 w-4" />
                  {isImporter ? 'New Campaign' : 'New Request'}
                </Button>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isImporter ? 'Campaign ID' : 'Request ID'}</TableHead>
                    <TableHead>Counterpart Name</TableHead>
                    <TableHead>Commodity</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.counterpartName}</TableCell>
                      <TableCell>{request.commodity}</TableCell>
                      <TableCell>{new Date(request.date).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[request.status]}>{request.status}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>
      <NewRequestWizardDialog
        open={isWizardOpen}
        onOpenChange={setIsWizardOpen}
        onComplete={handleWizardComplete}
      />
    </div>
  );
}
