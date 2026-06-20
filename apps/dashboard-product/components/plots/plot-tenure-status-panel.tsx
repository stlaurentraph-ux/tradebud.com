'use client';

import { useContext, useMemo, useState } from 'react';
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
import { useOptionalPlotDetailContext } from '@/lib/plot-detail-context';
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
import { LocaleContext } from '@/lib/locale-context';
import {
  getPlotTenurePanelCadastralCrossCheckLabel,
  getPlotTenurePanelJurisdictionHints,
  getPlotTenurePanelCopy,
  getPlotTenurePanelFilesSyncedLabel,
} from '@/lib/plot-tenure-panel-copy';
import {
  getTenureReviewAiConfidenceLabel,
  getTenureReviewAiDetectedLabel,
  getTenureReviewConfirmFailedMessage,
  getTenureReviewDialogCancelLabel,
  getTenureReviewDialogConfirmLabel,
  getTenureReviewDialogNoteLabel,
  getTenureReviewDialogTitle,
  getTenureReviewDocumentFallback,
  getTenureReviewReasonMinLengthMessage,
} from '@/lib/workflow-terminology-labels';

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

export function PlotTenureStatusPanel({
  plotId,
  embedded = false,
}: {
  plotId: string;
  embedded?: boolean;
}) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const detail = useOptionalPlotDetailContext();
  const ownEvidence = useEvidenceFeed({ plotId, enabled: !detail && Boolean(plotId) });
  const ownLegal = usePlotLegalSync(detail ? '' : plotId);
  const ownVerification = usePlotTenureVerification(detail ? '' : plotId, {
    pollWhilePending: !detail,
  });

  const documents = detail?.documents ?? ownEvidence.documents;
  const evidenceLoading = detail?.evidenceLoading ?? ownEvidence.isLoading;
  const legalSync = detail?.legalSync ?? ownLegal.legalSync;
  const legalLoading = detail?.legalLoading ?? ownLegal.isLoading;
  const legalError = detail?.legalError ?? ownLegal.error;
  const verificationRecords = detail?.verificationRecords ?? ownVerification.records;
  const verificationLoading = detail?.verificationLoading ?? ownVerification.isLoading;
  const verificationError = detail?.verificationError ?? ownVerification.error;
  const reload = detail?.reloadVerification ?? ownVerification.reload;

  const [confirmTarget, setConfirmTarget] = useState<PlotTenureVerificationRecord | null>(null);
  const [confirmReason, setConfirmReason] = useState('');
  const [confirmNote, setConfirmNote] = useState('');
  const [confirmError, setConfirmError] = useState<string | null>(null);
  const [confirmBusy, setConfirmBusy] = useState(false);

  const tenureEvidence = detail?.tenureEvidence ?? documents.filter((doc) => doc.evidence_kind === 'tenure_evidence');
  const status =
    detail?.tenureStatus ??
    computePlotTenureStatus({
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
      setConfirmError(getTenureReviewReasonMinLengthMessage(t));
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
      setConfirmError(
        e instanceof Error && e.message.trim()
          ? e.message
          : getTenureReviewConfirmFailedMessage(t),
      );
    } finally {
      setConfirmBusy(false);
    }
  };

  const body = (
    <>
      {isLoading ? (
        <p className="text-muted-foreground flex items-center gap-2 text-sm">
          <Loader2 className="h-4 w-4 animate-spin" />
          {getPlotTenurePanelCopy('loading', t)}
        </p>
      ) : (
        <>
          <div className="flex items-center gap-2 font-medium text-sm">
            <PathIcon className="h-4 w-4 text-primary" />
            {tenurePathLabel(status.path)}
          </div>

              {legalSync?.cadastralKey ? (
                <div className="flex items-center justify-between gap-3 rounded-md border border-border px-3 py-2">
                  <span className="text-muted-foreground">{getPlotTenurePanelCopy('cadastral_key_label', t)}</span>
                  <span className="font-medium">{legalSync.cadastralKey}</span>
                </div>
              ) : (
                <p className="text-xs text-muted-foreground rounded-md border border-dashed px-3 py-2">
                  {getPlotTenurePanelCopy('cadastral_key_hint', t)}
                </p>
              )}

              {legalSync?.informalTenure && legalSync.informalTenureNote ? (
                <div className="rounded-md border border-border px-3 py-2 space-y-1">
                  <p className="text-muted-foreground text-xs">{getPlotTenurePanelCopy('possession_note_label', t)}</p>
                  <p>{legalSync.informalTenureNote}</p>
                </div>
              ) : null}

              <div className="text-muted-foreground text-xs space-y-1">
                <p>
                  {tenureEvidence.length > 0
                    ? getPlotTenurePanelFilesSyncedLabel(tenureEvidence.length, t)
                    : getPlotTenurePanelCopy('no_files', t)}
                </p>
                {legalSync ? (
                  <p>
                    {getPlotTenurePanelCopy('legal_synced_at', t, {
                      date: new Date(legalSync.syncedAt).toLocaleString(),
                    })}
                  </p>
                ) : (
                  <p>{getPlotTenurePanelCopy('informal_after_backup', t)}</p>
                )}
                {pendingPoll ? (
                  <p className="text-amber-700 dark:text-amber-400">
                    {getPlotTenurePanelCopy('ai_in_progress', t)}
                  </p>
                ) : null}
              </div>

              {verificationRecords.length > 0 ? (
                <div className="space-y-2 pt-1">
                  <p className="text-xs font-medium text-foreground">{getPlotTenurePanelCopy('ai_review_title', t)}</p>
                  {verificationRecords.map((record) => {
                    const tenureType = formatTenureType(record.parse_result?.tenure_type);
                    const missing = Array.isArray(record.parse_result?.clauses_missing)
                      ? (record.parse_result?.clauses_missing as string[])
                      : [];
                    const crossCheck = record.parse_result?.cadastral_cross_check as
                      | Record<string, unknown>
                      | undefined;
                    const cadastralLabel = getPlotTenurePanelCadastralCrossCheckLabel(crossCheck, t);
                    const jurisdictionHints = getPlotTenurePanelJurisdictionHints(
                      record.parse_result as Record<string, unknown> | undefined,
                      t,
                    );
                    const label =
                      record.evidence_label?.trim() ||
                      record.storage_path.split('/').pop() ||
                      getTenureReviewDocumentFallback(t);

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
                          <p className="text-xs text-muted-foreground">
                            {getTenureReviewAiDetectedLabel(tenureType, t)}
                          </p>
                        ) : null}
                        {record.parse_confidence != null ? (
                          <p className="text-xs text-muted-foreground">
                            {getTenureReviewAiConfidenceLabel(
                              Math.round(record.parse_confidence * 100),
                              t,
                            )}
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
                              ? ` ${getPlotTenurePanelCopy('extracted_prefix', t)} ${crossCheck.extracted_parcel_reference}`
                              : ''}
                          </p>
                        ) : null}
                        {jurisdictionHints.length > 0 ? (
                          <div className="space-y-1">
                            <p className="text-xs font-medium text-muted-foreground">
                              {getPlotTenurePanelCopy('jurisdiction_exporter_heading', t)}
                            </p>
                            {jurisdictionHints.map((hint) => (
                              <p key={hint} className="text-xs text-sky-800 dark:text-sky-300">
                                {hint}
                              </p>
                            ))}
                          </div>
                        ) : null}
                        {missing.length > 0 ? (
                          <p className="text-xs text-amber-700 dark:text-amber-400">
                            {getPlotTenurePanelCopy('missing_prefix', t)} {missing.slice(0, 3).join(', ')}
                            {missing.length > 3 ? '…' : ''}
                          </p>
                        ) : null}
                        {record.parse_status === 'MANUAL_REQUIRED' ? (
                          <Button size="sm" variant="outline" onClick={() => setConfirmTarget(record)}>
                            {getTenureReviewDialogConfirmLabel(t)}
                          </Button>
                        ) : null}
                      </div>
                    );
                  })}
                </div>
              ) : tenureEvidence.length > 0 ? (
                <p className="text-xs text-muted-foreground">
                  {getPlotTenurePanelCopy('ai_starts_after_sync', t)}
                </p>
              ) : null}

              {legalError ? <p className="text-xs text-destructive">{legalError}</p> : null}
              {verificationError ? <p className="text-xs text-destructive">{verificationError}</p> : null}

              <div className="flex flex-wrap gap-3 pt-1">
                <Button variant="link" size="sm" className="px-0" asChild>
                  <Link href="/compliance/tenure-review">{getPlotTenurePanelCopy('open_queue_link', t)}</Link>
                </Button>
              </div>
            </>
          )}
    </>
  );

  return (
    <>
      {embedded ? (
        <div className="space-y-3">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm font-semibold">{getPlotTenurePanelCopy('title', t)}</p>
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
          {body}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <CardTitle className="text-base">{getPlotTenurePanelCopy('title', t)}</CardTitle>
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
          <CardContent className="space-y-3 text-sm">{body}</CardContent>
        </Card>
      )}

      <Dialog open={confirmTarget != null} onOpenChange={(open) => !open && setConfirmTarget(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{getTenureReviewDialogTitle(t)}</DialogTitle>
            <DialogDescription>{getPlotTenurePanelCopy('dialog_description', t)}</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-2">
              <Label htmlFor="plot-tenure-confirm-reason">
                {getPlotTenurePanelCopy('dialog_reason_required_label', t)}
              </Label>
              <Textarea
                id="plot-tenure-confirm-reason"
                value={confirmReason}
                onChange={(e) => setConfirmReason(e.target.value)}
                placeholder={getPlotTenurePanelCopy('dialog_reason_placeholder', t)}
                rows={3}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plot-tenure-confirm-note">{getTenureReviewDialogNoteLabel(t)}</Label>
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
              {getTenureReviewDialogCancelLabel(t)}
            </Button>
            <Button disabled={confirmBusy} onClick={() => void handleConfirm()}>
              {confirmBusy
                ? getPlotTenurePanelCopy('dialog_confirming', t)
                : getTenureReviewDialogConfirmLabel(t)}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
