'use client';

import { useState, useContext } from 'react';
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
import { getBillingUpgradeCopy } from '@/lib/billing-upgrade-copy';
import { LocaleContext } from '@/lib/locale-context';
import { resolveWorkflowErrorMessage } from '@/lib/workflow-error-copy';

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
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
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
      setError(resolveWorkflowErrorMessage(acceptError, 'billing_upgrade_failed', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{getBillingUpgradeCopy('dialog_title', t)}</DialogTitle>
          <DialogDescription>{getBillingUpgradeCopy('dialog_description', t)}</DialogDescription>
        </DialogHeader>

        {status && targetBand ? (
          <div className="space-y-3 text-sm">
            <div className="rounded-lg border p-3">
              <p>
                <span className="text-muted-foreground">{getBillingUpgradeCopy('current_band_label', t)}</span>{' '}
                <strong>{formatBandLabel(status.contracted_billing_band)}</strong> · €
                {status.current_subscription_eur.toFixed(2)}/mo
              </p>
              <p className="mt-2">
                <span className="text-muted-foreground">{getBillingUpgradeCopy('new_band_label', t)}</span>{' '}
                <strong>{formatBandLabel(targetBand)}</strong>
                {previewPrice != null
                  ? ` ${getBillingUpgradeCopy('price_from_next_month', t, { price: previewPrice.toFixed(2) })}`
                  : ''}
              </p>
              <p className="mt-2 text-muted-foreground">
                {getBillingUpgradeCopy('managed_contacts', t, { count: status.managed_contact_count })}
                {status.band_contact_ceiling != null
                  ? getBillingUpgradeCopy('managed_contacts_ceiling', t, {
                      ceiling: status.band_contact_ceiling,
                    })
                  : ''}
              </p>
            </div>

            <label className="flex items-start gap-3">
              <Checkbox checked={confirmed} onCheckedChange={(value) => setConfirmed(value === true)} />
              <span>
                {getBillingUpgradeCopy('consent_checkbox', t, { band: formatBandLabel(targetBand) })}
              </span>
            </label>
          </div>
        ) : null}

        {error ? <p className="text-sm text-red-600">{error}</p> : null}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isSubmitting}>
            {getBillingUpgradeCopy('cancel', t)}
          </Button>
          <Button onClick={() => void handleAccept()} disabled={!confirmed || isSubmitting || !targetBand}>
            {isSubmitting ? getBillingUpgradeCopy('saving', t) : getBillingUpgradeCopy('accept', t)}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
