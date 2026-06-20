'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { useMarkets } from '@/lib/use-founder-os-gtm';

const tierColors: Record<string, string> = {
  beachhead: 'bg-emerald-100 text-emerald-800',
  expand: 'bg-blue-100 text-blue-800',
  explore: 'bg-amber-100 text-amber-800',
  paused: 'bg-gray-100 text-gray-600',
};

export default function FounderOsMarketsPage() {
  const { markets, isLoading, error, reload, createMarket } = useMarkets();
  const [form, setForm] = useState({ country_code: '', country_name: '', commodity: '', segment: 'exporter', entry_wedge: '' });
  const [isSaving, setIsSaving] = useState(false);

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Market Registry</h1>
        <Card>
          <CardHeader className="pb-2"><CardTitle className="text-base">Add market</CardTitle></CardHeader>
          <CardContent>
            <form onSubmit={async (e) => { e.preventDefault(); setIsSaving(true); try { await createMarket(form); setForm({ country_code: '', country_name: '', commodity: '', segment: 'exporter', entry_wedge: '' }); } finally { setIsSaving(false); } }} className="grid gap-2 md:grid-cols-3">
              <Input placeholder="Country code" required value={form.country_code} onChange={(e) => setForm((p) => ({ ...p, country_code: e.target.value }))} />
              <Input placeholder="Country name" required value={form.country_name} onChange={(e) => setForm((p) => ({ ...p, country_name: e.target.value }))} />
              <Input placeholder="Commodity" required value={form.commodity} onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))} />
              <Input placeholder="Segment" required value={form.segment} onChange={(e) => setForm((p) => ({ ...p, segment: e.target.value }))} />
              <Input placeholder="Entry wedge" value={form.entry_wedge} onChange={(e) => setForm((p) => ({ ...p, entry_wedge: e.target.value }))} />
              <Button type="submit" disabled={isSaving}>{isSaving ? 'Saving...' : 'Add'}</Button>
            </form>
          </CardContent>
        </Card>
        {isLoading ? <AsyncState mode="loading" title="Loading..." /> : error ? <AsyncState mode="error" title="Error" description={error} onRetry={reload} /> : markets.map((m) => (
          <Card key={m.id}><CardHeader className="pb-2"><CardTitle className="flex justify-between text-base"><span>{m.country_name} — {m.commodity}</span><Badge className={tierColors[m.priority_tier] ?? ''}>{m.priority_tier}</Badge></CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{m.entry_wedge}</CardContent></Card>
        ))}
      </div>
    </div>
  );
}
