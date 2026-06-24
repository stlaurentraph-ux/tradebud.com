'use client';

import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { TenantHarvestVoucher } from '@/lib/harvest-voucher-client';
import { getHarvestReceiveDeliveryCopy } from '@/lib/workflow-terminology-labels';

type DeliveryHandoffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeRef: string;
  vouchers: TenantHarvestVoucher[];
  onConfirmed: () => void;
};

export function DeliveryHandoffDialog({
  open,
  onOpenChange,
  intakeRef,
  vouchers,
  onConfirmed,
}: DeliveryHandoffDialogProps) {
  const expectedKg = vouchers.reduce((sum, voucher) => sum + (voucher.kg ?? 0), 0);
  const [receivedKg, setReceivedKg] = useState(String(Math.round(expectedKg)));
  const [note, setNote] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReceivedKg(String(Math.round(expectedKg)));
    setNote('');
    setError(null);
  }, [expectedKg, open]);

  const copy = (field: Parameters<typeof getHarvestReceiveDeliveryCopy>[0], values?: Record<string, string | number>) =>
    getHarvestReceiveDeliveryCopy(field, undefined, values);

  const handleConfirm = async () => {
    const parsed = Number(receivedKg.replace(',', '.'));
    if (!Number.isFinite(parsed) || parsed <= 0) {
      setError(copy('handoff_invalid_weight'));
      return;
    }
    setBusy(true);
    setError(null);
    try {
      const token = sessionStorage.getItem('tracebud_token');
      const response = await fetch('/api/harvest/vouchers/handoff-confirm', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({
          intakeRef,
          receivedKg: parsed,
          note: note.trim() || undefined,
        }),
      });
      if (!response.ok) {
        setError(copy('handoff_failed'));
        return;
      }
      onConfirmed();
      onOpenChange(false);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>{copy('handoff_title')}</DialogTitle>
          <DialogDescription>{copy('handoff_description')}</DialogDescription>
        </DialogHeader>

        <div className="space-y-3 text-sm">
          <p>
            {copy('handoff_expected', { kg: Math.round(expectedKg).toLocaleString() })}
            {vouchers.length > 1 ? ` · ${copy('handoff_plot_count', { count: vouchers.length })}` : null}
          </p>
          <ul className="max-h-32 space-y-1 overflow-y-auto rounded-md border border-border px-3 py-2">
            {vouchers.map((voucher) => (
              <li key={voucher.id} className="text-muted-foreground">
                {voucher.plot_name ?? 'Plot'} · {(voucher.kg ?? 0).toLocaleString()} kg
              </li>
            ))}
          </ul>
          <div className="space-y-2">
            <Label htmlFor="receivedKg">{copy('handoff_received_label')}</Label>
            <Input
              id="receivedKg"
              inputMode="decimal"
              value={receivedKg}
              onChange={(event) => setReceivedKg(event.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="handoffNote">{copy('handoff_note_label')}</Label>
            <Textarea
              id="handoffNote"
              value={note}
              onChange={(event) => setNote(event.target.value)}
              placeholder={copy('handoff_note_placeholder')}
              rows={2}
            />
          </div>
          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={busy}>
            {copy('handoff_cancel')}
          </Button>
          <Button type="button" onClick={() => void handleConfirm()} disabled={busy}>
            {busy ? copy('handoff_confirming') : copy('handoff_confirm')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
