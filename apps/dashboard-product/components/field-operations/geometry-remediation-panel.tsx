'use client';

import { useContext, useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, MapPin } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { LocaleContext } from '@/lib/locale-context';
import { resolveWorkflowErrorMessage } from '@/lib/workflow-error-copy';
import {
  getGeometryRemediationEmptyMessage,
  getGeometryRemediationFarmerSuffix,
  getGeometryRemediationLoadingMessage,
  getGeometryRemediationMemberFixHint,
  getGeometryRemediationOpenPlotsCta,
  getGeometryRemediationPanelDescription,
  getGeometryRemediationPanelTitle,
  getGeometryRemediationRecentBadge,
  getGeometryRemediationUnnamedPlot,
} from '@/lib/workflow-terminology-labels';

type GeometryRemediationItem = {
  id: string;
  timestamp: string;
  farmerId?: string | null;
  clientPlotId?: string | null;
  plotId?: string | null;
  phase?: string | null;
  code?: string | null;
  message: string;
};

type GeometryRemediationResponse = {
  total: number;
  items: GeometryRemediationItem[];
};

export function GeometryRemediationPanel() {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [data, setData] = useState<GeometryRemediationResponse>({ total: 0, items: [] });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const token = window.sessionStorage.getItem('tracebud_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : undefined;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- intentional effect-driven state sync (async load / client hydration); React Compiler adoption tracked separately
    setLoading(true);
    void fetch('/api/plots/geometry-remediation?limit=20', { headers, cache: 'no-store' })
      .then(async (response) => {
        if (!response.ok) {
          const body = await response.json().catch(() => ({}));
          throw new Error(body.error ?? `Request failed (${response.status})`);
        }
        return response.json() as Promise<GeometryRemediationResponse>;
      })
      .then((payload) => {
        setData(payload);
        setError(null);
      })
      .catch((err: unknown) => {
        setError(resolveWorkflowErrorMessage(err, 'geometry_remediation_load', t));
      })
      .finally(() => setLoading(false));
  }, [t]);

  return (
    <Card>
      <CardHeader className="flex flex-row items-start justify-between gap-4">
        <div>
          <CardTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-amber-600" />
            {getGeometryRemediationPanelTitle(t)}
          </CardTitle>
          <CardDescription>{getGeometryRemediationPanelDescription(t)}</CardDescription>
        </div>
        {data.total > 0 ? (
          <Badge variant="outline">{getGeometryRemediationRecentBadge(data.total, t)}</Badge>
        ) : null}
      </CardHeader>
      <CardContent className="space-y-3">
        {loading ? (
          <p className="text-sm text-muted-foreground">{getGeometryRemediationLoadingMessage(t)}</p>
        ) : error ? (
          <p className="text-sm text-red-600">{error}</p>
        ) : data.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">{getGeometryRemediationEmptyMessage(t)}</p>
        ) : (
          data.items.map((item) => (
            <div key={item.id} className="rounded-lg border p-3">
              <div className="flex items-start gap-2">
                <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0 text-amber-600" />
                <div className="min-w-0 flex-1 space-y-1">
                  <p className="text-sm font-medium">
                    {item.clientPlotId ?? item.plotId ?? getGeometryRemediationUnnamedPlot(t)}
                    {item.code ? (
                      <span className="ml-2 text-xs font-normal text-muted-foreground">({item.code})</span>
                    ) : null}
                  </p>
                  <p className="text-sm text-muted-foreground">{item.message}</p>
                  <p className="text-xs text-muted-foreground">
                    {item.timestamp ? new Date(item.timestamp).toLocaleString() : '—'}
                    {item.farmerId ? getGeometryRemediationFarmerSuffix(item.farmerId, t) : ''}
                  </p>
                  <p className="text-xs text-muted-foreground">{getGeometryRemediationMemberFixHint(t)}</p>
                </div>
              </div>
            </div>
          ))
        )}
        <div className="flex flex-wrap gap-2 pt-1">
          <Button asChild size="sm" variant="secondary">
            <Link href="/plots">{getGeometryRemediationOpenPlotsCta(t)}</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
