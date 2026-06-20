'use client';

import { useMemo } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { PIPELINE_STAGES } from '@/lib/founder-os-gtm-constants';
import { useProspects } from '@/lib/use-crm';

export default function FounderOsPipelinePage() {
  const { prospects, isLoading, error, reload, updateProspect } = useProspects();
  const byStage = useMemo(() => {
    const map = new Map<string, typeof prospects>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const p of prospects) (map.get(p.stage ?? 'identified') ?? map.get('identified')!).push(p);
    return map;
  }, [prospects]);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-7xl space-y-4">
        <h1 className="text-2xl font-semibold">Pipeline</h1>
        {isLoading ? <AsyncState mode="loading" title="Loading..." /> : error ? <AsyncState mode="error" title="Error" description={error} onRetry={reload} /> : (
          <div className="flex gap-3 overflow-x-auto pb-4">
            {PIPELINE_STAGES.filter((s) => s !== 'dead' && s !== 'not_interested').map((stage) => (
              <div key={stage} className="min-w-[220px] flex-shrink-0">
                <div className="mb-2 flex justify-between"><span className="text-sm font-medium capitalize">{stage.replace(/_/g, ' ')}</span><Badge variant="outline">{(byStage.get(stage) ?? []).length}</Badge></div>
                <div className="space-y-2">{(byStage.get(stage) ?? []).map((p) => (
                  <Card key={p.id}><CardHeader className="p-3 pb-1"><CardTitle className="text-sm">{p.name}</CardTitle></CardHeader>
                    <CardContent className="space-y-2 p-3 pt-0 text-xs">
                      <p>{p.company}</p>
                      {p.icp_score != null ? <p>ICP {p.icp_score}</p> : null}
                      <select className="w-full rounded border px-2 py-1" value={p.stage ?? 'identified'} onChange={(e) => void updateProspect(p.id, { stage: e.target.value })}>
                        {PIPELINE_STAGES.map((s) => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </CardContent></Card>
                ))}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
