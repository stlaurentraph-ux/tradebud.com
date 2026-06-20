'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useObjections, usePenetrationMetrics } from '@/lib/use-founder-os-gtm';

export default function FounderOsIntelligencePage() {
  const { metrics, isLoading, error, reload, refreshIcp } = usePenetrationMetrics();
  const { objections, createObjection } = useObjections();
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [form, setForm] = useState({ category: '', objection_text: '', response_text: '' });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-semibold">GTM Intelligence</h1>
          <Button variant="outline" disabled={isRefreshing} onClick={() => { setIsRefreshing(true); void refreshIcp().finally(() => setIsRefreshing(false)); }}>{isRefreshing ? 'Refreshing...' : 'Refresh ICP'}</Button>
        </div>
        {isLoading ? <AsyncState mode="loading" title="Loading..." /> : error ? <AsyncState mode="error" title="Error" description={error} onRetry={reload} /> : (
          <div className="grid gap-4 md:grid-cols-3">{metrics.map((m) => (
            <Card key={m.metric_key}><CardHeader className="pb-2"><CardTitle className="text-sm">{m.metric_label}</CardTitle></CardHeader><CardContent><p className="text-3xl font-bold">{m.metric_value}</p></CardContent></Card>
          ))}</div>
        )}
        <Card><CardHeader className="pb-2"><CardTitle className="text-base">Log market learning</CardTitle></CardHeader>
          <CardContent><form onSubmit={async (e) => { e.preventDefault(); await createObjection(form); setForm({ category: '', objection_text: '', response_text: '' }); }} className="grid gap-2">
            <Input placeholder="Category" required value={form.category} onChange={(e) => setForm((p) => ({ ...p, category: e.target.value }))} />
            <Textarea placeholder="Objection / insight" required value={form.objection_text} onChange={(e) => setForm((p) => ({ ...p, objection_text: e.target.value }))} />
            <Textarea placeholder="Response" value={form.response_text} onChange={(e) => setForm((p) => ({ ...p, response_text: e.target.value }))} />
            <Button type="submit">Save</Button>
          </form></CardContent></Card>
        {objections.slice(0, 8).map((o) => (<Card key={o.id}><CardContent className="pt-4 text-sm"><p className="font-medium">{o.category}</p><p>{o.objection_text}</p></CardContent></Card>))}
      </div>
    </div>
  );
}
