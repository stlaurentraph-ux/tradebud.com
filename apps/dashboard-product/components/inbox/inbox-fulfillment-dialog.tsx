'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import type { InboxRequest } from '@/lib/use-requests';
import { useEvidenceFeed } from '@/lib/use-evidence-feed';
import { useHarvestPackages } from '@/lib/use-harvest-packages';
import { useTenantPlots } from '@/lib/use-tenant-plots';
import { useAuth } from '@/lib/auth-context';

export type InboxFulfillmentPayload = {
  notes?: string;
  evidencePlotIds?: string[];
  evidencePackageIds?: string[];
};

type InboxFulfillmentDialogProps = {
  request: InboxRequest | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (requestId: string, payload: InboxFulfillmentPayload) => Promise<void>;
};

const evidenceStatusLabel: Record<string, string> = {
  verified: 'Verified',
  pending_review: 'Pending review',
  expired: 'Expired',
  renewal_due: 'Renewal due',
};

export function InboxFulfillmentDialog({
  request,
  open,
  onOpenChange,
  onSubmit,
}: InboxFulfillmentDialogProps) {
  const { user } = useAuth();
  const { packages } = useHarvestPackages(user?.tenant_id ?? null, { scope: 'tenant', enabled: open });
  const { plots, isLoading: plotsLoading, error: plotsError } = useTenantPlots(user?.tenant_id ?? null, {
    enabled: open,
  });
  const { documents: evidenceDocuments, isLoading: evidenceLoading, error: evidenceError } = useEvidenceFeed({
    enabled: open,
  });
  const [notes, setNotes] = useState('');
  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [selectedPlotIds, setSelectedPlotIds] = useState<string[]>([]);
  const [selectedEvidenceIds, setSelectedEvidenceIds] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const selectedPackage = useMemo(
    () => packages.find((pkg) => pkg.id === selectedPackageId) ?? null,
    [packages, selectedPackageId],
  );

  const plotOptions = useMemo(() => {
    const byId = new Map<string, { id: string; name: string; source: string }>();
    for (const plot of plots) {
      byId.set(plot.id, { id: plot.id, name: plot.name, source: 'tenant' });
    }
    for (const plot of selectedPackage?.plots ?? []) {
      if (!byId.has(plot.id)) {
        byId.set(plot.id, { id: plot.id, name: plot.name, source: 'shipment' });
      }
    }
    return Array.from(byId.values());
  }, [plots, selectedPackage?.plots]);

  const reset = () => {
    setNotes('');
    setSelectedPackageId('');
    setSelectedPlotIds([]);
    setSelectedEvidenceIds([]);
    setError(null);
  };

  const handleOpenChange = (nextOpen: boolean) => {
    if (!nextOpen) reset();
    onOpenChange(nextOpen);
  };

  const togglePlot = (plotId: string, checked: boolean) => {
    setSelectedPlotIds((current) => {
      if (checked) {
        return current.includes(plotId) ? current : [...current, plotId];
      }
      return current.filter((id) => id !== plotId);
    });
  };

  const toggleEvidence = (evidenceId: string, plotId: string | null, checked: boolean) => {
    setSelectedEvidenceIds((current) => {
      if (checked) {
        return current.includes(evidenceId) ? current : [...current, evidenceId];
      }
      return current.filter((id) => id !== evidenceId);
    });
    if (plotId) {
      togglePlot(plotId, checked);
    }
  };

  const handleSubmit = async () => {
    if (!request) return;
    setIsSubmitting(true);
    setError(null);
    try {
      await onSubmit(request.id, {
        notes: notes.trim() || undefined,
        evidencePackageIds: selectedPackageId ? [selectedPackageId] : undefined,
        evidencePlotIds: selectedPlotIds.length > 0 ? selectedPlotIds : undefined,
      });
      handleOpenChange(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to submit fulfillment.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!request) return null;

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Fulfill request</DialogTitle>
          <DialogDescription>
            Attach shipment, plot, and evidence context for <span className="font-medium">{request.title}</span> from{' '}
            {request.from_org}. This marks the request as responded and updates the sender campaign.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="rounded-md border bg-muted/30 p-3 text-sm">
            <p className="font-medium text-foreground">{request.request_type.replace(/_/g, ' ')}</p>
            <p className="text-muted-foreground">Due {new Date(request.due_at).toLocaleDateString()}</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor="fulfillment-notes">Fulfillment notes</Label>
            <Textarea
              id="fulfillment-notes"
              value={notes}
              onChange={(event) => setNotes(event.target.value)}
              placeholder="Describe what evidence or shipment context you are providing."
              rows={4}
            />
          </div>

          {packages.length > 0 ? (
            <div className="space-y-2">
              <Label htmlFor="fulfillment-package">Link shipment (optional)</Label>
              <select
                id="fulfillment-package"
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
                value={selectedPackageId}
                onChange={(event) => setSelectedPackageId(event.target.value)}
              >
                <option value="">No shipment linked</option>
                {packages.map((pkg) => (
                  <option key={pkg.id} value={pkg.id}>
                    {pkg.code} ({pkg.status})
                  </option>
                ))}
              </select>
            </div>
          ) : null}

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>Plot evidence</Label>
              <span className="text-xs text-muted-foreground">{selectedPlotIds.length} selected</span>
            </div>
            {plotsLoading ? (
              <p className="text-sm text-muted-foreground">Loading tenant plots...</p>
            ) : plotsError ? (
              <p className="text-sm text-destructive">{plotsError}</p>
            ) : plotOptions.length === 0 ? (
              <p className="text-sm text-muted-foreground">No plots available for this tenant yet.</p>
            ) : (
              <div className="max-h-40 space-y-2 overflow-y-auto rounded-md border p-3">
                {plotOptions.map((plot) => (
                  <label key={plot.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selectedPlotIds.includes(plot.id)}
                      onCheckedChange={(checked) => togglePlot(plot.id, checked === true)}
                    />
                    <span>
                      <span className="font-medium text-foreground">{plot.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {plot.source === 'shipment' ? 'From linked shipment' : 'Tenant plot'}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-2">
              <Label>FPIC / evidence repository</Label>
              <Link href="/fpic" className="text-xs text-primary underline">
                Open evidence repository
              </Link>
            </div>
            {evidenceLoading ? (
              <p className="text-sm text-muted-foreground">Loading evidence feed...</p>
            ) : evidenceError ? (
              <p className="text-sm text-destructive">{evidenceError}</p>
            ) : evidenceDocuments.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No synced evidence documents yet. Upload in the evidence repository, then return to fulfill this request.
              </p>
            ) : (
              <div className="max-h-48 space-y-2 overflow-y-auto rounded-md border p-3">
                {evidenceDocuments.map((doc) => (
                  <label key={doc.id} className="flex items-start gap-2 text-sm">
                    <Checkbox
                      checked={selectedEvidenceIds.includes(doc.id)}
                      onCheckedChange={(checked) => toggleEvidence(doc.id, doc.plot_id, checked === true)}
                    />
                    <span>
                      <span className="font-medium text-foreground">{doc.name}</span>
                      <span className="block text-xs text-muted-foreground">
                        {doc.farmer_or_community}
                        {doc.plot_id ? ` · plot ${doc.plot_id.slice(0, 8)}` : ''}
                        {' · '}
                        {evidenceStatusLabel[doc.status] ?? doc.status}
                      </span>
                    </span>
                  </label>
                ))}
              </div>
            )}
          </div>

          {error ? <p className="text-sm text-destructive">{error}</p> : null}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => handleOpenChange(false)} disabled={isSubmitting}>
            Cancel
          </Button>
          <Button onClick={() => void handleSubmit()} disabled={isSubmitting}>
            {isSubmitting ? 'Submitting...' : 'Submit fulfillment'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
