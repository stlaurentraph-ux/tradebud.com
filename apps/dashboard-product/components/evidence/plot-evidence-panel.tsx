'use client';

import { useContext, useState } from 'react';
import Link from 'next/link';
import { Download, ExternalLink, FileText, Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  downloadEvidenceFile,
  evidenceKindLabel,
  openEvidenceFile,
} from '@/lib/evidence-files';
import { useEvidenceFeed, type EvidenceFeedDocument } from '@/lib/use-evidence-feed';
import { LocaleContext } from '@/lib/locale-context';
import { resolveWorkflowErrorMessage } from '@/lib/workflow-error-copy';

function EvidenceRow({ doc }: { doc: EvidenceFeedDocument }) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [busy, setBusy] = useState<'view' | 'download' | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleView = async () => {
    if (!doc.storage_path) return;
    setBusy('view');
    setError(null);
    try {
      await openEvidenceFile(doc.storage_path);
    } catch (e) {
      setError(resolveWorkflowErrorMessage(e, 'evidence_open_file', t));
    } finally {
      setBusy(null);
    }
  };

  const handleDownload = async () => {
    if (!doc.storage_path) return;
    setBusy('download');
    setError(null);
    try {
      await downloadEvidenceFile(doc.storage_path, doc.name);
    } catch (e) {
      setError(resolveWorkflowErrorMessage(e, 'evidence_download_file', t));
    } finally {
      setBusy(null);
    }
  };

  return (
    <div className="rounded-lg border border-border p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary">
          <FileText className="h-4 w-4 text-muted-foreground" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <p className="font-medium text-sm truncate">{doc.name}</p>
            <Badge variant="secondary">
              {evidenceKindLabel(doc.evidence_kind)}
            </Badge>
            {doc.has_file ? (
              <Badge variant="outline">
                File
              </Badge>
            ) : (
              <Badge variant="outline">
                Metadata only
              </Badge>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {doc.farmer_or_community} · Uploaded {new Date(doc.upload_date).toLocaleDateString()}
            {doc.mime_type ? ` · ${doc.mime_type}` : ''}
          </p>
          {error ? <p className="text-xs text-destructive mt-2">{error}</p> : null}
        </div>
        <div className="flex gap-1 flex-shrink-0">
          {doc.storage_path ? (
            <>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => void handleView()}
              >
                {busy === 'view' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ExternalLink className="h-4 w-4" />
                )}
              </Button>
              <Button
                variant="outline"
                size="sm"
                disabled={busy !== null}
                onClick={() => void handleDownload()}
              >
                {busy === 'download' ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Download className="h-4 w-4" />
                )}
              </Button>
            </>
          ) : null}
        </div>
      </div>
    </div>
  );
}

export function PlotEvidencePanel({ plotId }: { plotId: string }) {
  const { documents, isLoading, error } = useEvidenceFeed({ plotId, enabled: Boolean(plotId) });

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Uploaded evidence</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading evidence files…</p>
        ) : error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : documents.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No synced evidence for this plot yet. Farmers upload from the field app; files appear here
            after backup and evidence sync.
          </p>
        ) : (
          documents.map((doc) => <EvidenceRow key={doc.id} doc={doc} />)
        )}
        <div className="pt-2">
          <Button variant="link" size="sm" className="px-0" asChild>
            <Link href="/fpic">Open full evidence repository</Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
