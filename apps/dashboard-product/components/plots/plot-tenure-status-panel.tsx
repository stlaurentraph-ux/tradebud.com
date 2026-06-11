'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { FileText, Hand, Loader2, RefreshCw, Sparkles } from 'lucide-react';
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
import {
  computePlotTenureStatus,
  tenureBadgeLabel,
  tenurePathLabel,
} from '@/lib/plot-tenure-status';
import { useEvidenceFeed } from '@/lib/use-evidence-feed';
import { usePlotLegalSync } from '@/lib/use-plot-legal-sync';
import {
  summarizePlotTenureParse,
  tenureParseStatusLabel,
  usePlotTenureVerification,
  type PlotTenureVerificationRecord,
  type TenureParseStatus,
} from '@/lib/use-plot-tenure-verification';
import { confirmTenureReview } from '@/lib/use-tenure-review-queue';

function badgeVariant(
  badge: ReturnType<typeof computePlotTenureStatus>['badge'],
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (badge === 'formal_documented' || badge === 'producer_in_possession') return 'default';
  if (badge === 'attestation_only') return 'secondary';
  return 'outline';
}

function aiBadgeVariant(
  status: TenureParseStatus,
): 'default' | 'secondary' | 'destructive' | 'outline' {
  if (status === 'COMPLETED') return 'default';
  if (status === 'MANUAL_REQUIRED' || status === 'FAILED') return 'destructive';
  if (status === 'IN_PROGRESS') return 'secondary';
  return 'outline';
}

function formatTenureType(value: unknown): string | null {
  if (typeof value !== 'string' || !value.trim()) return null;
  return value.replace(/_/g, ' ').toLowerCase();
}

function cadastralCrossCheckLabel(
  crossCheck: Record<string, unknown> | null | undefined,
): string | null {
  if (!crossCheck || typeof crossCheck !== 'object') return null;
  if (crossCheck.keys_match === true) return 'Cadastral key verified';
  if (crossCheck.keys_match === false) return 'Cadastral key mismatch';
  if (Array.isArray(crossCheck.issues) && crossCheck.issues.includes('declared_cadastral_key_missing')) {
    return 'Enter Clave Catastral to cross-check';
  }
  if (crossCheck.requires_manual_review === true) return 'Formal title needs review';
  if (typeof crossCheck.country_label === 'string' && crossCheck.country_label.length > 0) {
    if (crossCheck.keys_match === null && crossCheck.extracted_parcel_reference) {
      return `Enter ${crossCheck.country_label} to cross-check`;
    }
  }
  return null;
}

export function PlotTenureStatusPanel({ plotId }: { plotId: string }) {
  const { documents, isLoading: evidenceLoading } = useEvidenceFeed({ plotId, enabled: Boolean(plotId) });
  const { legalSync, isLoading: legalLoading, error: legalError } = usePlotLegalSync(plotId);
  const {
    records: verificationRecords,
    isLoading: verificationLoading,
    error: verificationError,
    reload,
  } = usePlotTenureVerification(plotId, { pollWhilePending: true });

  const [confirmTarget, setConfirmTarget] = useState<PlotTenureVerificationRecord | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const tenureEvidence = documents.filter((doc) => doc.evidence_kind === 'tenure_evidence');
  const status = computePlotTenureStatus({
    informalTenure: legalSync?.informalTenure ?? null,
    cadastralKey: legalSync?.cadastralKey ?? null,
    tenureEvidenceCount: tenureEvidence.length,
    landTenureDeclared: null,
  });

  const aggregateParseStatus = summarizePlotTenureParse(verificationRecords);
  const isLoading = evidenceLoading || legalLoading || verificationLoading;
  const PathIcon = status.path === 'producer_in_possession' ? Hand : FileText;

  const pendingPoll = useMemo(
    () =>
      verificationRecords.some(
        (row) => row.parse_status === 'PENDING' || row.parse_status === 'IN_PROGRESS',
      ),
    [verificationRecords],
  );

  const handleConfirm = async () => {
    if (!confirmTarget || confirmReason.trim().length < 8) {
      setConfirmError('Enter a reason with at least 8 characters.');
      return;
    }
    setConfirmBusy(true);
    setConfirmError(null);
    try {
      await confirmTenureReview(
        confirmTarget.plot_id,
        confirmTarget.id,
        confirmReason.trim(),
        confirmNote.trim() || undefined,
      );
      setConfirmTarget(null);
      setConfirmReason('');
      setConfirmNote('');
      await reload();
    } catch (e) {
      setConfirmError(e instanceof Error ? e.message : 'Confirmation failed.');
    } finally {
      setConfirmBusy(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <CardTitle className="text-base">Land tenure path</CardTitle>
            <div className="flex flex-wrap items-center gap-2">
              <Badge variant={badgeVariant(status.badge)}>{tenureBadgeLabel(status.badge)}</Badge>
              {aggregateParseStatus ? (
                <Badge variant={aiBadgeVariant(aggregateParseStatus)}>
                  <Sparkles className="h-3 w-3 mr-1" />
                  {tenureParseStatusLabel(aggregateParseStatus)}
                </Badge>
              ) : null}
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2"
                disabled={verificationLoading}
                onClick={() => void reload()}
              >
                <RefreshCw className={`h-4 w-4 ${verificationLoading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {isLoading ? (
            <p className="text-muted-foreground flex items-center gap-2">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading tenure status…
            </p>
          ) : (
            <>
              <div className="flex items-center gap-2 font-medium">
                <PathIcon className="h-4 w-4 text-primary" />
                {tenurePathLabel(status.path)}
              </div>

              {legalSync?.cadastralKey ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">Cadastral key</span>
                  <span className="font-medium">{legalSync.cadastralKey}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2">
                  Ask the farmer to enter Clave Catastral and sync land title photos from the field app
                  for formal cadastral cross-check.
                </p>
              )}

              {legalSync?.informalTenure && legalSync.informalTenureNote ? (
                <div className="rounded-md border border-border px-3 py-2 space-y-1">
                  <p className="text-muted-foreground text-xs">Possession note</p>
                  <p>{legalSync.informalTenureNote}</p>
                </div>
              ) : null}

              <div className="text-muted-foreground text-xs space-y-1">
                <p>
                  {tenureEvidence.length > 0
                    ? `${tenureEvidence.length} tenure file${tenureEvidence.length === 1 ? '' : 's'} synced`
                    : 'No tenure files synced for this plot yet.'}
                </p>
                {legalSync ? (
                  <p>Legal metadata last synced {new Date(legalSync.syncedAt).toLocaleString()}</p>
                ) : (
                  <p>Informal tenure and cadastral metadata appear after the farmer backs up from the field app.</p>
                )}
                {pendingPoll ? (
                  <p className="text-amber-700 dark:text-amber-400">
                    AI review in progress — status refreshes automatically.
                  </p>
                ) : null}
              </div>

              {verificationRecords.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-foreground">AI tenure review</p>
                  {verificationRecords.map((record) => {
                    const tenureType = formatTenureType(record.parse_result?.tenure_type);
                    const missing = Array.isArray(record.parse_result?.clauses_missing)
                      ? (record.parse_result?.clauses_missing as string[])
                      : [];
                    const crossCheck = record.parse_result?.cadastral_cross_check as
                      | Record<string, unknown>
                      | undefined;
                    const cadastralLabel = cadastralCrossCheckLabel(crossCheck);
                    const label =
                      record.evidence_label?.trim() ||
                      record.storage_path.split('/').pop() ||
                      'Tenure document';

                    return (
                      <div
                        key={record.id}
                        className="rounded-md border border-border px-3 py-2 space-y-2"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium truncate">{label}</span>
                          <Badge variant={aiBadgeVariant(record.parse_status)}>
                            {tenureParseStatusLabel(record.parse_status)}
                          </Badge>
                        </div>
                        {tenureType ? (
                          <p className="text-xs text-muted-foreground">Detected: {tenureType}</p>
                        ) : null}
                        {record.parse_confidence != null ? (
                          <p className="text-xs text-muted-foreground">
                            Confidence {Math.round(record.parse_confidence * 100)}%
                          </p>
                        ) : null}
                        {cadastralLabel ? (
                          <p
                            className={
                              crossCheck?.keys_match === true
                                ? 'text-xs text-emerald-700 dark:text-emerald-400'
                                : 'text-xs text-amber-700 dark:text-amber-400'
                            }
                          >
                            {cadastralLabel}
                            {typeof crossCheck?.extracted_parcel_reference === 'string'
                              ? ` · Extracted: ${crossCheck.extracted_parcel_reference}`
                              : ''}
                          </p>
                        ) : null}
                        {missing.length > 0 ? (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            Missing: {missing.slice(0, 3).join(', ')}
                            {missing.length > 3 ? '…' : ''}
                          </p>
                        ) : null}
                        {record.parse_status === 'MANUAL_REQUIRED' ? (
                          <Button size="sm" variant="outline" onClick={() => setConfirmTarget(record)}>
                            Confirm review
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : tenureEvidence.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  AI review starts automatically after tenure files sync. Use refresh if a file was
                  just uploaded.
                </p>
              ) : null}

              {legalError ? <p className="text-xs text-destructive">{legalError}</p> : null}
              {verificationError ? <p className="text-xs text-destructive">{verificationError}</p> : null}

              <div className="flex flex-wrap gap-3 pt-1">
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href="#plot-evidence">View uploaded evidence below</Link>
                </Button>
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href="/compliance/tenure-review">Open full tenure queue</Link>
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      <Dialog open={confirmTarget != null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm tenure review</DialogTitle>
            <DialogDescription>
              Record why this AI extraction is acceptable for compliance. This clears the manual review
              gate for the farmer checklist.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="plot-tenure-confirm-reason">Reason (required)</Label>
              <Textarea
                id="plot-tenure-confirm-reason"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder="e.g. Municipal attestation matches field visit notes…"
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plot-tenure-confirm-note">Note (optional)</Label>
              <Textarea
                id="plot-tenure-confirm-note"
                value={confirmNote}
                onChange={(e) => setConfirmNote(e.target.value)}
                rows={2}
              />
            </div>
            {confirmError ? <p className="text-sm text-destructive">{confirmError}</p> : null}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmTarget(null)}>
              Cancel
            </Button>
            <Button disabled={confirmBusy} onClick={() => void handleConfirm()}>
              {confirmBusy ? 'Confirming…' : 'Confirm review'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
