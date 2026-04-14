'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { AppHeader } from '@/components/layout/app-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { AsyncState } from '@/components/common/async-state';
import { PermissionGate } from '@/components/common/permission-gate';
import { usePackages } from '@/lib/use-packages';
import { useInboxRequests } from '@/lib/use-requests';
import { emitAuditEvent } from '@/lib/audit-events';
import { useAuth } from '@/lib/auth-context';
import type { RequestCampaign } from '@/types';
import { AlertCircle, CheckCircle2, Clock, FileUp, Inbox, MapPin } from 'lucide-react';
import { toast } from 'sonner';

const REQUEST_TYPE_LABELS: Partial<Record<RequestCampaign['request_type'], string>> = {
  CONSENT_GRANT: 'Consent Grant',
  GENERAL_EVIDENCE: 'General Evidence',
  MISSING_PLOT_GEOMETRY: 'Missing Plot Geometry',
};

export default function CooperativeInboxPage() {
  const { user } = useAuth();
  const [respondingId, setRespondingId] = useState<string | null>(null);
  const [uploadingId, setUploadingId] = useState<string | null>(null);
  const [uploadedEvidenceIds, setUploadedEvidenceIds] = useState<string[]>([]);
  const { packages, isLoading, error, reload } = usePackages();
  const {
    pendingRequests,
    respondedCount,
    isLoading: isRequestsLoading,
    error: requestsError,
    reload: reloadRequests,
    respond,
  } = useInboxRequests(user?.tenant_id ?? null);

  const missingEvidenceActions = useMemo(
    () =>
      packages
        .filter((pkg) => pkg.compliance_status === 'WARNINGS' || pkg.compliance_status === 'BLOCKED')
        .map((pkg) => ({
          id: pkg.id,
          code: pkg.code,
          supplier: pkg.supplier_name,
          issues: pkg.compliance_status === 'BLOCKED' ? 2 : 1,
        })),
    [packages]
  );

  const doneCount = respondedCount + uploadedEvidenceIds.length;

  const markDone = async (id: string) => {
    setRespondingId(id);
    try {
      await respond(id);
      await emitAuditEvent({
        event_type: 'REQUEST_CAMPAIGN_RESPONSE_RECEIVED',
        entity_type: 'request',
        entity_id: id,
        payload: { source: 'cooperative_inbox', resolved_at: new Date().toISOString() },
      });
      toast.success('Request marked as responded.');
    } catch {
      toast.error('Could not mark request as responded. Please retry.');
    } finally {
      setRespondingId((prev) => (prev === id ? null : prev));
    }
  };

  const uploadEvidence = async (packageId: string) => {
    setUploadingId(packageId);
    try {
      await emitAuditEvent({
        event_type: 'EVIDENCE_UPLOADED',
        entity_type: 'package',
        entity_id: packageId,
        payload: { source: 'cooperative_inbox', uploaded_at: new Date().toISOString() },
      });
      setUploadedEvidenceIds((prev) => (prev.includes(packageId) ? prev : [...prev, packageId]));
      toast.success('Evidence upload recorded.');
    } catch {
      toast.error('Could not record evidence upload. Please retry.');
    } finally {
      setUploadingId((prev) => (prev === packageId ? null : prev));
    }
  };

  return (
    <div className="flex flex-col">
      <AppHeader
        title="Producer Inbox"
        subtitle="Pending requests and missing evidence actions for this week"
        breadcrumbs={[{ label: 'Dashboard', href: '/' }, { label: 'Inbox' }]}
      />

      <div className="flex-1 space-y-6 p-6">
        {error ? (
          <AsyncState mode="error" title="Failed to load inbox context" description={error} onRetry={reload} />
        ) : null}
        {requestsError ? (
          <AsyncState
            mode="error"
            title="Failed to load request inbox"
            description={requestsError}
            onRetry={reloadRequests}
          />
        ) : null}

        <div className="grid gap-4 md:grid-cols-3">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Pending Requests</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{pendingRequests.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Evidence Actions</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold">{missingEvidenceActions.length}</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">Completed Today</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-2xl font-bold text-emerald-600">{doneCount}</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid gap-6 lg:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Inbox className="h-4 w-4" />
                Pending Requests
              </CardTitle>
              <CardDescription>Respond quickly to unblock supplier package preparation.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {pendingRequests.length === 0 ? (
                <AsyncState mode="empty" title="No pending requests" description="You're fully caught up." />
              ) : (
                pendingRequests.map((request) => (
                  <div key={request.id} className="rounded-lg border p-3">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="font-medium">{request.title}</p>
                        <p className="text-xs text-muted-foreground mt-1">From {request.from_org}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge variant="outline">
                            {REQUEST_TYPE_LABELS[request.request_type] ?? request.request_type}
                          </Badge>
                          <Badge className="bg-amber-500/20 text-amber-600">
                            <Clock className="mr-1 h-3 w-3" />
                            Due {new Date(request.due_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <PermissionGate permission="requests:respond">
                        <Button
                          size="sm"
                          disabled={respondingId === request.id}
                          onClick={() => {
                            void markDone(request.id);
                          }}
                        >
                          <CheckCircle2 className="mr-2 h-3.5 w-3.5" />
                          {respondingId === request.id ? 'Saving...' : 'Mark Responded'}
                        </Button>
                      </PermissionGate>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertCircle className="h-4 w-4" />
                Missing Evidence Actions
              </CardTitle>
              <CardDescription>Resolve evidence blockers currently impacting package progression.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              {isLoading || isRequestsLoading ? (
                <AsyncState mode="loading" title="Loading evidence actions..." />
              ) : missingEvidenceActions.length === 0 ? (
                <AsyncState mode="empty" title="No evidence blockers" description="All linked packages are clear." />
              ) : (
                missingEvidenceActions.map((item) => (
                  <div key={item.id} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="font-medium">{item.code}</p>
                        <p className="text-xs text-muted-foreground mt-1">{item.supplier}</p>
                        <Badge className="mt-2 bg-red-500/20 text-red-600">{item.issues} blocker(s)</Badge>
                      </div>
                      <div className="flex gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/packages/${item.id}`}>
                            <MapPin className="mr-1 h-3.5 w-3.5" />
                            View Package
                          </Link>
                        </Button>
                        <PermissionGate permission="evidence:upload">
                          <Button
                            size="sm"
                            disabled={uploadingId === item.id || uploadedEvidenceIds.includes(item.id)}
                            onClick={() => {
                              void uploadEvidence(item.id);
                            }}
                          >
                            <FileUp className="mr-1 h-3.5 w-3.5" />
                            {uploadedEvidenceIds.includes(item.id)
                              ? 'Uploaded'
                              : uploadingId === item.id
                                ? 'Uploading...'
                                : 'Upload'}
                          </Button>
                        </PermissionGate>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

