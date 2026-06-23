'use client';

import { useContext, useMemo, useState } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import { buildAppBreadcrumbs } from '@/lib/nav-labels';
import {
  getInboxCardTitle,
  getInboxCompletedLabel,
  getInboxEmptyDescription,
  getInboxEmptyTitle,
  getInboxFulfillButtonLabel,
  getInboxLoadingMessage,
  getInboxPageSubtitle,
  getInboxPageTitle,
  getInboxStatusLabel,
  getInboxTableColumnLabel,
} from '@/lib/workflow-terminology-labels';
import {
  DASHBOARD_INBOX_UI_STATUSES,
  mapInboxStatusToUi,
  type DashboardInboxUiStatus,
} from '@/lib/dashboardCrmOutreachRegistry';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';

type InboxStatus = DashboardInboxUiStatus;

const INBOX_STATUS_TABS: InboxStatus[] = [...DASHBOARD_INBOX_UI_STATUSES];

const statusBadgeClass: Record<InboxStatus, string> = {
  Pending: 'bg-amber-500/15 text-amber-700',
  Fulfilled: 'bg-emerald-500/15 text-emerald-700',
};

export default function InboxPage() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;
  const isImporter = role === 'importer';
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
        displayStatus: mapInboxStatusToUi(request.status),
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
    const request = backendRequests.find((item) => item.id === requestId);
    try {
      await respond(requestId, payload);
      trackDashboardEvent(DASHBOARD_EVENTS.INBOX_RESPOND_SUCCESS, {
        request_type: request?.request_type ?? 'unknown',
      });
      await reload();
    } catch (error) {
      trackDashboardEvent(DASHBOARD_EVENTS.INBOX_RESPOND_FAILURE, {
        request_type: request?.request_type ?? 'unknown',
        reason: error instanceof Error ? error.message : 'unknown',
      });
      throw error;
    }
  };

  const pageTitle = getInboxPageTitle(role, t);
  const breadcrumbName = isImporter ? 'Requests' : 'Inbox';

  return (
    <div className="flex flex-col">
      <AppHeader
        title={pageTitle}
        subtitle={getInboxPageSubtitle(role, t)}
        breadcrumbs={buildAppBreadcrumbs(t, { name: breadcrumbName })}
      />

      <div className="flex-1 space-y-6 p-6">
        <Card>
          <CardHeader>
            <CardTitle>{getInboxCardTitle(role, t)}</CardTitle>
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
                    {getInboxStatusLabel(status, t)}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>

            {isLoading ? (
              <div className="rounded-lg border p-10 text-center text-sm text-muted-foreground">
                {getInboxLoadingMessage(t)}
              </div>
            ) : filteredRequests.length === 0 ? (
              <div className="rounded-lg border border-dashed p-10 text-center">
                <Inbox className="mx-auto mb-3 h-8 w-8 text-muted-foreground" />
                <p className="font-medium text-foreground">{getInboxEmptyTitle(statusTab, t)}</p>
                <p className="mt-1 text-sm text-muted-foreground">{getInboxEmptyDescription(role, t)}</p>
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{getInboxTableColumnLabel('id', role, t)}</TableHead>
                    <TableHead>{getInboxTableColumnLabel('title', role, t)}</TableHead>
                    <TableHead>{getInboxTableColumnLabel('from', role, t)}</TableHead>
                    <TableHead>{getInboxTableColumnLabel('type', role, t)}</TableHead>
                    <TableHead>{getInboxTableColumnLabel('due', role, t)}</TableHead>
                    <TableHead>{getInboxTableColumnLabel('status', role, t)}</TableHead>
                    <TableHead className="text-right">{getInboxTableColumnLabel('actions', role, t)}</TableHead>
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
                        <Badge className={statusBadgeClass[request.displayStatus]}>
                          {getInboxStatusLabel(request.displayStatus, t)}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        {request.displayStatus === 'Pending' ? (
                          <PermissionGate permission="requests:respond">
                            <Button size="sm" onClick={() => openFulfillment(request)}>
                              {getInboxFulfillButtonLabel(t)}
                            </Button>
                          </PermissionGate>
                        ) : (
                          <span className="text-xs text-muted-foreground">{getInboxCompletedLabel(t)}</span>
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
