'use client';

import { useMemo, useState } from 'react';
import { AppHeader } from '@/components/layout/app-header';
import { InboxFulfillmentDialog } from '@/components/inbox/inbox-fulfillment-dialog';
import { PermissionGate } from '@/components/common/permission-gate';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Inbox } from 'lucide-react';
import { useAuth } from '@/lib/auth-context';
import { useInboxRequests, type InboxRequest } from '@/lib/use-requests';

type InboxStatus = 'Pending' | 'Fulfilled';

const INBOX_STATUS_TABS: InboxStatus[] = ['Pending', 'Fulfilled'];

const statusBadgeClass: Record<InboxStatus, string> = {
  Pending: 'bg-amber-500/15 text-amber-700',
  Fulfilled: 'bg-emerald-500/15 text-emerald-700',
};

function mapStatus(request: InboxRequest): InboxStatus {
  return request.status === 'PENDING' ? 'Pending' : 'Fulfilled';
}

export default function InboxPage() {
  const { user } = useAuth();
  const isImporter = user?.active_role === 'importer';
  const { requests: backendRequests, isLoading, error, respond, reload } = useInboxRequests(
    user?.tenant_id ?? null,
  );
  const [statusTab, setStatusTab] = useState<InboxStatus>('Pending');
  const [selectedRequest, setSelectedRequest] = useState<InboxRequest | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);

  const mappedRequests = useMemo(
    () =>
      backendRequests.map((request) => ({
        ...request,
        displayStatus: mapStatus(request),
      })),
    [backendRequests],
  );

  const filteredRequests = useMemo(
    () => mappedRequests.filter((request) => request.displayStatus === statusTab),
    [mappedRequests, statusTab],
  );

  const openFulfillment = (request: InboxRequest) => {
    setSelectedRequest(request);
    setDialogOpen(true);
  };

  const handleFulfillmentSubmit = async (
    requestId: string,
    payload: { notes?: string; evidencePlotIds?: string[]; evidencePackageIds?: string[] },
  ) => {
    await respond(requestId, payload);
    await reload();
  };

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
            {error ? (
              <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm text-amber-800">
                {error}
              </div>
            ) : null}
            <Tabs value={statusTab} onValueChange={(value) => setStatusTab(value as InboxStatus)}>
              <TabsList>
                {INBOX_STATUS_TABS.map((status) => (
                  <TabsTrigger key={status} value={status}>
                    {status}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
                Loading requests...
              </div>
            ) : filteredRequests.length === 0 ? (
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
                    <TableHead>Title</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Due</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredRequests.map((request) => (
                    <TableRow key={request.id}>
                      <TableCell className="font-medium">{request.id}</TableCell>
                      <TableCell>{request.title}</TableCell>
                      <TableCell>{request.from_org}</TableCell>
                      <TableCell>{request.request_type.replace(/_/g, ' ').toLowerCase()}</TableCell>
                      <TableCell>{new Date(request.due_at).toLocaleDateString()}</TableCell>
                      <TableCell>
                        <Badge className={statusBadgeClass[request.displayStatus]}>{request.displayStatus}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.displayStatus === 'Pending' ? (
                          <PermissionGate permission="requests:respond">
                            <Button size="sm" onClick={() => openFulfillment(request)}>
                              Fulfill
                            </Button>
                          </PermissionGate>
                        ) : (
                          <span className="text-xs text-muted-foreground">Completed</span>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      </div>

      <InboxFulfillmentDialog
        request={selectedRequest}
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSubmit={handleFulfillmentSubmit}
      />
    </div>
  );
}
