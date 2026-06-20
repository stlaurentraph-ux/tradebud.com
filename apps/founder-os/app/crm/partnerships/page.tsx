'use client';

import { useState } from 'react';
import { AsyncState } from '@/components/common/async-state';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { usePartnerships } from '@/lib/use-founder-os-gtm';

const types = ['cooperative', 'auditor', 'ngo', 'government', 'tech', 'consultant', 'other'];

export default function FounderOsPartnershipsPage() {
  const { partnerships, isLoading, error, reload, createPartnership } = usePartnerships();
  const [form, setForm] = useState({ organization_name: '', partner_type: 'cooperative', country: '', notes: '' });

  return (
    <div className="p-6">
      <div className="mx-auto max-w-6xl space-y-4">
        <h1 className="text-2xl font-semibold">Partnerships</h1>
        <Card><CardContent className="pt-4">
          <form onSubmit={async (e) => { e.preventDefault(); await createPartnership(form); setForm({ organization_name: '', partner_type: 'cooperative', country: '', notes: '' }); }} className="grid gap-2 md:grid-cols-2">
            <Input placeholder="Organization" required value={form.organization_name} onChange={(e) => setForm((p) => ({ ...p, organization_name: e.target.value }))} />
            <select className="rounded border px-3 py-2 text-sm" value={form.partner_type} onChange={(e) => setForm((p) => ({ ...p, partner_type: e.target.value }))}>{types.map((t) => <option key={t} value={t}>{t}</option>)}</select>
            <Input placeholder="Country" value={form.country} onChange={(e) => setForm((p) => ({ ...p, country: e.target.value }))} />
            <Input placeholder="Notes" value={form.notes} onChange={(e) => setForm((p) => ({ ...p, notes: e.target.value }))} />
            <Button type="submit">Add</Button>
          </form>
        </CardContent></Card>
        {isLoading ? <AsyncState mode="loading" title="Loading..." /> : error ? <AsyncState mode="error" title="Error" description={error} onRetry={reload} /> : partnerships.map((p) => (
          <Card key={p.id}><CardHeader className="pb-2"><CardTitle className="flex justify-between text-base"><span>{p.organization_name}</span><Badge variant="outline">{p.status}</Badge></CardTitle></CardHeader>
            <CardContent className="text-sm text-muted-foreground">{p.partner_type} · {p.country}</CardContent></Card>
        ))}
      </div>
    </div>
  );
}
