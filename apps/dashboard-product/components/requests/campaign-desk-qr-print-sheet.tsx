'use client';

import { useMemo } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

type CampaignDeskQrPrintSheetProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  recipientLabel: string;
  claimUrl: string;
  claimExpiresAt: string | null;
  t?: (key: string) => string;
};

function formatExpiry(iso: string | null): string | null {
  if (!iso) {
    return null;
  }
  return new Date(iso).toLocaleString();
}

export function CampaignDeskQrPrintSheet({
  open,
  onOpenChange,
  recipientLabel,
  claimUrl,
  claimExpiresAt,
  t,
}: CampaignDeskQrPrintSheetProps) {
  const qrSrc = useMemo(() => {
    const params = new URLSearchParams({
      size: '240x240',
      data: claimUrl,
      margin: '8',
      format: 'png',
    });
    return `https://api.qrserver.com/v1/create-qr-code/?${params.toString()}`;
  }, [claimUrl]);

  const title = t?.('workflow.outreach.recipient.desk_qr.title') ?? 'Desk invite QR';
  const description =
    t?.('workflow.outreach.recipient.desk_qr.description') ??
    'Print this QR for the cooperative desk. The farmer scans it to open the Tracebud campaign claim page.';
  const printLabel = t?.('workflow.outreach.recipient.desk_qr.print') ?? 'Print QR sheet';
  const expiryLabel = claimExpiresAt
    ? (t?.('workflow.outreach.recipient.desk_qr.expires') ?? 'Expires {{date}}').replace(
        '{{date}}',
        formatExpiry(claimExpiresAt) ?? claimExpiresAt,
      )
    : null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md print:max-w-none print:border-0 print:shadow-none">
        <DialogHeader className="print:hidden">
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 rounded-lg border p-4 text-center print:border-0">
          <p className="font-medium text-foreground">{recipientLabel}</p>
          {/* eslint-disable-next-line @next/next/no-img-element -- external QR render service */}
          <img src={qrSrc} alt={title} width={240} height={240} className="mx-auto rounded-md bg-white p-2" />
          <p className="break-all text-xs text-muted-foreground">{claimUrl}</p>
          {expiryLabel ? <p className="text-xs text-muted-foreground">{expiryLabel}</p> : null}
        </div>
        <div className="flex justify-end print:hidden">
          <Button type="button" onClick={() => window.print()}>
            {printLabel}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
