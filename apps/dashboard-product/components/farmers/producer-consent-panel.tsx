'use client';

import { useCallback, useContext, useEffect, useState } from 'react';
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
import { useAuth } from '@/lib/auth-context';
import { LocaleContext } from '@/lib/locale-context';
import {
  getProducerConsentCopy,
  getProducerConsentScopeLabel,
  getProducerConsentStatusLabel,
} from '@/lib/workflow-terminology-labels';

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const { user } = useAuth();
  const role = user?.active_role;

  const [grants, setGrants] = useState<ProducerConsentGrant[]>([]);
  const [loading, setLoading] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [message, setMessage] = useState<string | null>(null);

  const formatScopeList = (scope: string[]) =>
    scope.map((item) => getProducerConsentScopeLabel(item, t)).join(', ');

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
      setError(
        e instanceof Error ? e.message : getProducerConsentCopy('error_load', role, t),
      );
      setGrants([]);
    } finally {
      setLoading(false);
    }
  }, [farmerProfileId, role, t]);

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
          ? getProducerConsentCopy('message_already_granted', role, t)
          : result.status === 'pending'
            ? getProducerConsentCopy('message_pending', role, t)
            : getProducerConsentCopy('message_recorded', role, t),
      );
      await refresh();
    } catch (e) {
      setError(
        e instanceof Error ? e.message : getProducerConsentCopy('error_request', role, t),
      );
    } finally {
      setRequesting(false);
    }
  };

  const revokedDateSuffix = revokedGrant?.revoked_at
    ? getProducerConsentCopy('revoked_on', role, t, {
        date: new Date(revokedGrant.revoked_at).toLocaleDateString(),
      })
    : '';
  const revokedRetentionSuffix = revokedGrant?.sold_lineage_retention_until
    ? getProducerConsentCopy('revoked_until', role, t, {
        date: new Date(revokedGrant.sold_lineage_retention_until).toLocaleDateString(),
      })
    : getProducerConsentCopy('revoked_retention_default', role, t);

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between pb-4">
        <CardTitle className="text-base">{getProducerConsentCopy('title', role, t)}</CardTitle>
        <Button variant="ghost" size="sm" onClick={() => void refresh()} disabled={loading || !farmerProfileId}>
          <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
        </Button>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-muted-foreground">{getProducerConsentCopy('intro', role, t)}</p>

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
              {getProducerConsentCopy('revoked_prefix', role, t)}
              {revokedDateSuffix}
              {getProducerConsentCopy('revoked_body', role, t)}
              {revokedRetentionSuffix}.
            </AlertDescription>
          </Alert>
        ) : null}

        {!farmerProfileId ? (
          <div className="rounded-lg border border-dashed p-6 text-center text-sm text-muted-foreground">
            {getProducerConsentCopy('link_required', role, t)}
          </div>
        ) : (
          <>
            {!activeGrant && !revokedGrant ? (
              <Alert className="border-amber-500/50 bg-amber-500/10">
                <AlertDescription className="text-amber-800">
                  {getProducerConsentCopy('no_active_consent', role, t)}
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
                  ? getProducerConsentCopy('action_sending', role, t)
                  : pendingGrant
                    ? getProducerConsentCopy('action_pending', role, t)
                    : activeGrant
                      ? getProducerConsentCopy('action_granted', role, t)
                      : getProducerConsentCopy('action_request', role, t)}
              </Button>
            </PermissionGate>

            {grants.length === 0 && !loading ? (
              <div className="text-center py-6 text-sm text-muted-foreground">
                <FileCheck className="mx-auto mb-2 h-8 w-8 opacity-40" />
                {getProducerConsentCopy('empty_none', role, t, { name: producerName })}
              </div>
            ) : (
              <div className="space-y-2">
                {grants.map((grant) => (
                  <div key={grant.id} className="rounded-lg border p-3">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-medium">
                        {grant.grantee_org_name?.trim() || grant.grantee_tenant_id}
                      </span>
                      <Badge variant={statusBadgeVariant(grant.status)}>
                        {getProducerConsentStatusLabel(grant.status, t)}
                      </Badge>
                    </div>
                    <p className="mt-2 text-xs text-muted-foreground">
                      {getProducerConsentCopy('scope_prefix', role, t)} {formatScopeList(grant.data_scope)}
                    </p>
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      {grant.granted_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getProducerConsentCopy('granted_at', role, t, {
                            date: new Date(grant.granted_at).toLocaleString(),
                          })}
                        </div>
                      ) : null}
                      {grant.revoked_at ? (
                        <div className="flex items-center gap-1">
                          <Calendar className="h-3 w-3" />
                          {getProducerConsentCopy('revoked_at', role, t, {
                            date: new Date(grant.revoked_at).toLocaleString(),
                          })}
                        </div>
                      ) : null}
                      {grant.status === 'pending' ? (
                        <div>{getProducerConsentCopy('waiting_approval', role, t)}</div>
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
