'use client';

import { useContext, useEffect, useMemo, useState } from 'react';
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
import { LocaleContext } from '@/lib/locale-context';
import { getHarvestReceiveDeliveryCopy } from '@/lib/workflow-terminology-labels';

type DeliveryHandoffDialogProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  intakeRef: string;
  vouchers: TenantHarvestVoucher[];
  onConfirmed: () => void;
};

const MAX_HANDOFF_PHOTO_BYTES = 600_000;

function parseKgInput(value: string): number | null {
  const parsed = Number(value.replace(',', '.'));
  return Number.isFinite(parsed) ? parsed : null;
}

function hasMeaningfulWeightVariance(expectedKg: number, receivedKg: number): boolean {
  if (expectedKg <= 0) return false;
  const delta = Math.abs(receivedKg - expectedKg);
  const variancePct = (delta / expectedKg) * 100;
  return variancePct > 2 || delta > 5;
}

async function sha256Hex(buffer: ArrayBuffer): Promise<string> {
  const hash = await crypto.subtle.digest('SHA-256', buffer);
  return Array.from(new Uint8Array(hash))
    .map((byte) => byte.toString(16).padStart(2, '0'))
    .join('');
}

export function DeliveryHandoffDialog({
  open,
  onOpenChange,
  intakeRef,
  vouchers,
  onConfirmed,
}: DeliveryHandoffDialogProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const copy = (
    field: Parameters<typeof getHarvestReceiveDeliveryCopy>[0],
    values?: Record<string, string | number>,
  ) => getHarvestReceiveDeliveryCopy(field, t, values);

  const expectedKg = vouchers.reduce((sum, voucher) => sum + (voucher.kg ?? 0), 0);
  const [receivedKg, setReceivedKg] = useState(String(Math.round(expectedKg)));
  const [note, setNote] = useState('');
  const [photoName, setPhotoName] = useState<string | null>(null);
  const [photoSha256, setPhotoSha256] = useState<string | null>(null);
  const [photoBytes, setPhotoBytes] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setReceivedKg(String(Math.round(expectedKg)));
    setNote('');
    setPhotoName(null);
    setPhotoSha256(null);
    setPhotoBytes(null);
    setError(null);
  }, [expectedKg, open]);

  const parsedReceivedKg = parseKgInput(receivedKg);
  const showVarianceWarning = useMemo(() => {
    if (parsedReceivedKg == null || parsedReceivedKg <= 0) return false;
    return hasMeaningfulWeightVariance(expectedKg, parsedReceivedKg);
  }, [expectedKg, parsedReceivedKg]);

  const handlePhotoChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) {
      setPhotoName(null);
      setPhotoSha256(null);
      setPhotoBytes(null);
      return;
    }
    if (file.size > MAX_HANDOFF_PHOTO_BYTES) {
      setError(copy('handoff_photo_too_large'));
      event.target.value = '';
      return;
    }
    const buffer = await file.arrayBuffer();
    const digest = await sha256Hex(buffer);
    setPhotoName(file.name);
    setPhotoSha256(digest);
    setPhotoBytes(file.size);
    setError(null);
  };

  const handleConfirm = async () => {
    if (parsedReceivedKg == null || parsedReceivedKg <= 0) {
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
          receivedKg: parsedReceivedKg,
          note: note.trim() || undefined,
          handoffPhotoSha256: photoSha256 ?? undefined,
          handoffPhotoBytes: photoBytes ?? undefined,
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
          <div className="rounded-lg border border-border bg-muted/30 p-3">
            <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {copy('handoff_summary_label')}
            </p>
            <p className="mt-1 text-lg font-semibold">
              {copy('handoff_expected', { kg: Math.round(expectedKg).toLocaleString() })}
            </p>
            {vouchers.length > 1 ? (
              <p className="text-xs text-muted-foreground">
                {copy('handoff_plot_count', { count: vouchers.length })}
              </p>
            ) : null}
            <p className="mt-1 font-mono text-xs text-muted-foreground">{intakeRef}</p>
          </div>

          <ul className="max-h-36 space-y-1.5 overflow-y-auto rounded-md border border-border px-3 py-2">
            {vouchers.map((voucher) => (
              <li key={voucher.id} className="flex items-center justify-between gap-2 text-muted-foreground">
                <span className="truncate">{voucher.plot_name ?? 'Plot'}</span>
                <span className="shrink-0 font-medium text-foreground">
                  {(voucher.kg ?? 0).toLocaleString()} kg
                </span>
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

          {showVarianceWarning ? (
            <p className="rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
              {copy('handoff_variance_warning', {
                expected: Math.round(expectedKg).toLocaleString(),
                received: Math.round(parsedReceivedKg ?? 0).toLocaleString(),
              })}
            </p>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="handoffPhoto">{copy('handoff_photo_label')}</Label>
            <Input
              id="handoffPhoto"
              type="file"
              accept="image/*"
              capture="environment"
              onChange={(event) => void handlePhotoChange(event)}
            />
            <p className="text-xs text-muted-foreground">{copy('handoff_photo_hint')}</p>
            {photoName ? (
              <p className="text-xs font-medium text-foreground">
                {copy('handoff_photo_attached', { name: photoName })}
              </p>
            ) : null}
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
