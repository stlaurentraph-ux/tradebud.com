'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';

type InboxStatus = 'Pending' | 'In Review' | 'Fulfilled' | 'Archived';

type InboxRequest = {
  id: string;
  counterpartName: string;
  commodity: string;
  date: string;
  status: InboxStatus;
};

const INBOX_STATUS_TABS: InboxStatus[] = ['Pending', 'In Review', 'Fulfilled', 'Archived'];

const MOCK_INBOX_REQUESTS: InboxRequest[] = [
  { id: 'IN-2026-014', counterpartName: 'Trace EU Imports', commodity: 'Cocoa', date: '2026-04-22', status: 'Pending' },
  { id: 'IN-2026-011', counterpartName: 'Blue Harbor Brands', commodity: 'Coffee', date: '2026-04-20', status: 'In Review' },
  { id: 'IN-2026-006', counterpartName: 'Atlas Retail Group', commodity: 'Palm Oil', date: '2026-04-16', status: 'Fulfilled' },
];

const statusBadgeClass: Record<InboxStatus, string> = {
  Pending: 'bg-amber-500/15 text-amber-700',
  'In Review': 'bg-blue-500/15 text-blue-700',
  Fulfilled: 'bg-emerald-500/15 text-emerald-700',
  Archived: 'bg-zinc-500/15 text-zinc-700',
};

export default function InboxPage() {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const [statusTab, setStatusTab] = useState<InboxStatus>('Pending');
  const filteredRequests = useMemo(
    () => MOCK_INBOX_REQUESTS.filter((request) => request.status === statusTab),
    [statusTab],
  );

  return (
    <div className="flex flex-col">
      <AppHeader
        title={isImporter ? 'Requests' : 'Inbox'}
        subtitle={
          isImporter
            ? 'Fulfill inbound requests from downstream partners and customers'
            : 'Review and fulfill requests received from downstream partners'
        }
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: isImporter ? 'Requests' : 'Inbox' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{isImporter ? 'Inbound Requests' : 'Incoming Requests'}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as InboxStatus)}>
              <TabsList>
                {INBOX_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">No {statusTab.toLowerCase()} requests</p>
                <p className="mt-1 text-sm text-muted-foreground">
                  {isImporter
                    ? 'Requests from downstream customers and regulators appear here for response and fulfillment.'
                    : 'When downstream partners send requests, they will appear here for response and fulfillment.'}
                </p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{isImporter ? 'Inbound ID' : 'Request ID'}</TableHead>
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
    </div>
  );
}

