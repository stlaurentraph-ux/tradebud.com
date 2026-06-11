'use client';

import { useCallback, useEffect, useState } from 'react';
import { Calendar, FileCheck, RefreshCw, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { PermissionGate } from '@/components/common/permission-gate';
import {
  listProducerConsentGrants,
  requestProducerDataAccess,
  type ProducerConsentGrant,
} from '@/lib/consent-grants-service';

function scopeLabel(scope: string[]): string {
  return scope
    .map((item) => {
      if (item === 'identity') return 'profile';
      if (item === 'plots') return 'plots';
      if (item === 'evidence') return 'evidence';
      return item;
    })
    .join(', ');
}

function statusBadgeVariant(
  status: ProducerConsentGrant['status'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'active') return 'default';
  if (status === 'pending') return 'secondary';
  if (status === 'revoked' || status === 'denied') return 'destructive';
  return 'outline';
}

type ProducerConsentPanelProps = {
  farmerProfileId: string | null;
  producerName: string;
  granteeOrgName?: string | null;
  resolveError?: string | null;
};

export function ProducerConsentPanel({
  farmerProfileId,
  producerName,
  granteeOrgName,
  resolveError,
}: ProducerConsentPanelProps) {
  const [grants, setGrants] = useState<ProducerConsentGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!farmerProfileId) {
      setGrants([]);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const items = await listProducerConsentGrants(farmerProfileId);
      setGrants(items);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load consent grants.');
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [farmerProfileId]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const activeGrant = grants.find((g) => g.status === 'active');
  const pendingGrant = grants.find((g) => g.status === 'pending');
  const revokedGrant = grants.find((g) => g.status === 'revoked');

  const handleRequestAccess = async () => {
    if (!farmerProfileId) return;
    setRequesting(true);
    setError(null);
    setMessage(null);
    try {
      const result = await requestProducerDataAccess({
        farmerProfileId,
        granteeOrgName,
      });
      setMessage(
        result.status === 'active'
          ? 'Producer already granted access.'
          : result.status === 'pending'
            ? 'Request sent. The producer must approve in the Tracebud field app under Data sharing.'
            : 'Consent request recorded.',
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to request data access.');
    } finally {
      setRequesting(false);
    }
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">Data access consent</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading || !farmerProfileId}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Plot and evidence data is only visible after the producer approves a request in the Tracebud field app.
          The producer can revoke future access at any time. Data already in batches or shipments they sold to you
          cannot be withdrawn and may be retained for EU compliance (up to 5 years for importers).
        </p>

        {resolveError ? (
          <Alert className="border-amber-500/50 bg-amber-500/10">
            <AlertDescription className="text-amber-800">{resolveError}</AlertDescription>
          </Alert>
        ) : null}

        {error ? (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        ) : null}

        {message ? (
          <Alert className="border-green-500/50 bg-green-500/10">
            <AlertDescription className="text-green-800">{message}</AlertDescription>
          </Alert>
        ) : null}

        {revokedGrant ? (
          <Alert className="border-slate-500/40 bg-slate-500/10">
            <AlertDescription className="text-slate-800">
              Future access revoked by the producer
              {revokedGrant.revoked_at
                ? ` on ${new Date(revokedGrant.revoked_at).toLocaleDateString()}`
                : ''}
              . You can no longer view new plots or harvests. Sold batch and shipment lineage already linked before
              revocation remains available for compliance
              {revokedGrant.sold_lineage_retention_until
                ? ` until ${new Date(revokedGrant.sold_lineage_retention_until).toLocaleDateString()}`
                : ' (up to 5 years for importers)'}
              .
            </AlertDescription>
          </Alert>
        ) : null}

        {!farmerProfileId ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            Link this directory contact to a field-app account (same email) before you can request data access.
          </div>
        ) : (
          <>
            {!activeGrant && !revokedGrant ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertDescription className="text-amber-800">
                  No active data access consent. You cannot view this producer&apos;s backed-up plots until they
                  approve your request.
                </AlertDescription>
              </Alert>
            ) : null}

            <PermissionGate permission="farmers:edit">
              <Button
                onClick={() => void handleRequestAccess()}
                disabled={requesting || Boolean(activeGrant) || Boolean(pendingGrant)}
              >
                <Send className="mr-2 h-4 w-4" />
                {requesting
                  ? 'Sending…'
                  : pendingGrant
                    ? 'Request pending approval'
                    : activeGrant
                      ? 'Access already granted'
                      : 'Request data access'}
              </Button>
            </PermissionGate>

            {grants.length === 0 && !loading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <FileCheck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                No consent requests yet for {producerName}.
              </div>
            ) : (
              <div className="space-y-2">
                {grants.map((grant) => (
                  <div key={grant.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {grant.grantee_org_name?.trim() || grant.grantee_tenant_id}
                      </span>
                      <Badge variant={statusBadgeVariant(grant.status)}>{grant.status}</Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">Can see: {scopeLabel(grant.data_scope)}</p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {grant.granted_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Granted: {new Date(grant.granted_at).toLocaleString()}
                        </div>
                      ) : null}
                      {grant.revoked_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          Revoked: {new Date(grant.revoked_at).toLocaleString()}
                        </div>
                      ) : null}
                      {grant.status === 'pending' ? (
                        <div>Waiting for producer approval in the field app.</div>
                      ) : null}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  );
}
