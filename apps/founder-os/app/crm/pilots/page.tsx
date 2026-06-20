'use client';

import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { usePilots } from '@/lib/use-founder-os-gtm';
import { useState } from 'react';

const statuses = ['lead', 'qualified', 'active', 'success', 'stalled', 'lost'];

export default function FounderOsPilotsPage() {
  const { pilots, isLoading, error, reload, createPilot, updatePilotStatus } = usePilots();
  const [form, setForm] = useState({ name: '', country: '', commodity: '', notes: '' });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Pilot Tracker</h1>
        <Card><CardContent className="pt-4">
          <form onSubmit={async (e) => { e.preventDefault(); await createPilot(form); setForm({ name: '', country: '', commodity: '', notes: '' }); }} className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Name" required value={form.name} onChange={(e) => setForm((p) => ({ ...p, name: e.target.value }))} />
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            <Input placeholder="Commodity" value={form.commodity} onChange={(e) => setForm((p) => ({ ...p, commodity: e.target.value }))} />
            <Textarea placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            <Button type="submit">Add pilot</Button>
          </form>
        </CardContent></Card>
        {isLoading ? <AsyncState mode="loading" title="Loading..." /> : error ? <AsyncState mode="error" title="Error" description={error} onRetry={reload} /> : pilots.map((p) => (
          <Card key={p.id}><CardHeader className="pb-2"><CardTitle className="flex justify-between text-base"><span>{p.name}</span><Badge variant="outline">{p.status}</Badge></CardTitle></CardHeader>
            <CardContent className="space-y-2 text-sm">
              {p.prospects ? <p>Contact: {p.prospects.name}</p> : null}
              <select className="rounded border px-2 py-1" value={p.status} onChange={(e) => void updatePilotStatus(p.id, e.target.value)}>{statuses.map((s) => <option key={s} value={s}>{s}</option>)}</select>
            </CardContent></Card>
        ))}
      </div>
    </div>
  );
}
