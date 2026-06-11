'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Hand, Loader2, Sparkles } from 'lucide-react';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { useTenureReviewQueue } from '@/lib/use-tenure-review-queue';
import { tenureParseStatusLabel } from '@/lib/use-plot-tenure-verification';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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

function formatTenureType(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.replace(/_/g, ' ').toLowerCase();
}

export default function TenureReviewPage() {
  const { items, isLoading, error, confirmReview } = useTenureReviewQueue();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [reason, setReason] = useState('');
  const [note, setNote] = useState('');
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const selected = useMemo(
    () => items.find((item) => item.id === selectedId) ?? null,
    [items, selectedId],
  );

  const counts = useMemo(
    () => ({
      total: items.length,
      manual: items.filter((item) => item.parse_status === 'MANUAL_REQUIRED').length,
      failed: items.filter((item) => item.parse_status === 'FAILED').length,
    }),
    [items],
  );

  const openConfirm = (id: string) => {
    setSelectedId(id);
    setReason('');
    setNote('');
    setSubmitError(null);
  };

  const handleConfirm = async () => {
    if (!selected || reason.trim().length < 8) {
      setSubmitError('Enter a reason with at least 8 characters.');
      return;
    }
    setIsSubmitting(true);
    setSubmitError(null);
    try {
      await confirmReview(selected.plot_id, selected.id, reason.trim(), note.trim() || undefined);
      setSelectedId(null);
    } catch (submitErr) {
      setSubmitError(submitErr instanceof Error ? submitErr.message : 'Confirmation failed.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <PermissionGate permission="compliance:view">
      <div className="flex flex-col">
        <AppHeader
          title="Tenure document review"
          subtitle="Confirm AI tenure extractions for producer-in-possession and informal land evidence"
          breadcrumbs={[
            { label: 'Dashboard', href: '/' },
            { label: 'Compliance', href: '/compliance' },
            { label: 'Tenure review' },
          ]}
        />

        <div className="flex-1 space-y-6 p-6">
          {error ? (
            <div className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          ) : null}

          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold">{counts.total}</p>
                <p className="text-sm text-muted-foreground mt-1">Documents awaiting review</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-amber-600">{counts.manual}</p>
                <p className="text-sm text-muted-foreground mt-1">Manual review required</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6 text-center">
                <p className="text-3xl font-bold text-red-600">{counts.failed}</p>
                <p className="text-sm text-muted-foreground mt-1">Parse failed</p>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-3">
            {isLoading ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground flex items-center justify-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Loading tenure review queue…
              </div>
            ) : items.length === 0 ? (
              <div className="rounded-lg border bg-secondary/30 py-12 text-center text-sm text-muted-foreground">
                No tenure documents currently require human review.
              </div>
            ) : (
              items.map((item) => {
                const label =
                  item.evidence_label?.trim() ||
                  item.storage_path.split('/').pop() ||
                  'Tenure document';
                const tenureType = formatTenureType(item.parse_result?.tenure_type);
                const missing = Array.isArray(item.parse_result?.clauses_missing)
                  ? (item.parse_result?.clauses_missing as string[])
                  : [];
                const crossCheck = item.parse_result?.cadastral_cross_check as
                  | Record<string, unknown>
                  | undefined;

                return (
                  <Card key={item.id}>
                    <CardHeader className="pb-3">
                      <div className="flex flex-wrap items-start justify-between gap-3">
                        <div className="space-y-1">
                          <CardTitle className="text-base flex items-center gap-2">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            {label}
                          </CardTitle>
                          <p className="text-sm text-muted-foreground">
                            {item.plot_name ?? 'Plot'} · {item.farmer_name ?? 'Producer'}
                          </p>
                        </div>
                        <Badge variant="destructive">
                          <Sparkles className="h-3 w-3 mr-1" />
                          {tenureParseStatusLabel(item.parse_status)}
                        </Badge>
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="grid gap-3 md:grid-cols-2 text-sm">
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="font-medium flex items-center gap-2">
                            <Hand className="h-4 w-4" />
                            AI extraction
                          </p>
                          <p className="text-muted-foreground">
                            {tenureType ? `Detected: ${tenureType}` : 'No tenure type detected'}
                          </p>
                          {item.parse_confidence != null ? (
                            <p className="text-muted-foreground">
                              Confidence {Math.round(item.parse_confidence * 100)}%
                            </p>
                          ) : null}
                        </div>
                        <div className="rounded-md border p-3 space-y-1">
                          <p className="font-medium">Cadastral cross-check</p>
                          <p className="text-muted-foreground">
                            {crossCheck?.keys_match === true
                              ? 'Declared Clave matches document extraction.'
                              : crossCheck?.keys_match === false
                                ? `Mismatch: declared ${String(crossCheck?.declared_cadastral_key ?? 'n/a')} vs extracted ${String(crossCheck?.extracted_parcel_reference ?? 'n/a')}`
                                : 'Awaiting declared Clave or clearer extraction.'}
                          </p>
                        </div>
                        <div className="rounded-md border p-3 space-y-1 md:col-span-2">
                          <p className="font-medium">Missing elements</p>
                          <p className="text-muted-foreground">
                            {missing.length > 0
                              ? missing.slice(0, 4).join(', ')
                              : 'Review document quality and issuer details.'}
                          </p>
                        </div>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <Button variant="outline" size="sm" asChild>
                          <Link href={`/plots/${item.plot_id}`}>Open plot</Link>
                        </Button>
                        <Button size="sm" onClick={() => openConfirm(item.id)}>
                          Confirm tenure review
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                );
              })
            )}
          </div>
        </div>

        <Dialog open={Boolean(selected)} onOpenChange={(open) => !open && setSelectedId(null)}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Confirm tenure review</DialogTitle>
              <DialogDescription>
                Accept this tenure document after manual review. This clears the compliance issue and
                allows the plot land checklist to pass when other requirements are met.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-3">
              <div className="space-y-2">
                <Label htmlFor="tenure-review-reason">Reason</Label>
                <Textarea
                  id="tenure-review-reason"
                  value={reason}
                  onChange={(event) => setReason(event.target.value)}
                  placeholder="Explain why this document is acceptable for EUDR land-use evidence."
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="tenure-review-note">Note (optional)</Label>
                <Textarea
                  id="tenure-review-note"
                  value={note}
                  onChange={(event) => setNote(event.target.value)}
                  placeholder="Optional reviewer note for audit trail."
                />
              </div>
              {submitError ? <p className="text-sm text-destructive">{submitError}</p> : null}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setSelectedId(null)} disabled={isSubmitting}>
                Cancel
              </Button>
              <Button onClick={() => void handleConfirm()} disabled={isSubmitting}>
                {isSubmitting ? 'Saving…' : 'Confirm review'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </PermissionGate>
  );
}
