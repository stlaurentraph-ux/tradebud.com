'use client';

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { acceptBandUpgrade, type SubscriptionBandStatus } from '@/lib/billing-client';

function formatBandLabel(band: string): string {
  return band.charAt(0).toUpperCase() + band.slice(1);
}

type UpgradeBandConsentModalProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  status: SubscriptionBandStatus | null;
  onAccepted?: (status: SubscriptionBandStatus) => void;
};

export function UpgradeBandConsentModal({
  open,
  onOpenChange,
  status,
  onAccepted,
}: UpgradeBandConsentModalProps) {
  const [confirmed, setConfirmed] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const targetBand = status?.target_upgrade_band ?? status?.preview_band ?? status?.pending_billing_band;
  const previewPrice = status?.preview_subscription_eur;

  const handleAccept = async () => {
    if (!targetBand || !confirmed) {
      return;
    }
    setIsSubmitting(true);
    setError(null);
    try {
      const nextStatus = await acceptBandUpgrade(targetBand);
      if (nextStatus) {
        onAccepted?.(nextStatus);
      }
      onOpenChange(false);
      setConfirmed(false);
    } catch (acceptError) {
      setError(acceptError instanceof Error ? acceptError.message : 'Upgrade failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Confirm subscription band upgrade</DialogTitle>
          <DialogDescription>
            Your managed contact count requires a higher subscription band. Billing updates on the
            first day of next month; you can add contacts immediately after accepting.
          </DialogDescription>
        </DialogHeader>

        {status && targetBand ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p>
                <span className="text-muted-foreground">Current band:</span>{' '}
                <strong>{formatBandLabel(status.contracted_billing_band)}</strong> · €
                {status.current_subscription_eur.toFixed(2)}/mo
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">New band:</span>{' '}
                <strong>{formatBandLabel(targetBand)}</strong>
                {previewPrice != null ? ` · €${previewPrice.toFixed(2)}/mo from next month` : ''}
              </p>
              <p className="mt-2 text-muted-foreground">
                Managed contacts: {status.managed_contact_count}
                {status.band_contact_ceiling != null ? ` / ${status.band_contact_ceiling}` : ''}
              </p>
            </div>

            <label className="flex items-start gap-3">
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />
              <span>
                I understand my subscription will move to the {formatBandLabel(targetBand)} band and
                the new monthly price applies from the next calendar month.
              </span>
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleAccept()} disabled={!confirmed || isSubmitting || !targetBand}>
            {isSubmitting ? 'Saving…' : 'Accept upgrade'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
