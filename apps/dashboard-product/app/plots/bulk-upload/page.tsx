'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { AppHeader } from '@/components/layout/app-header';
import { PermissionGate } from '@/components/common/permission-gate';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileSpreadsheet,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BULK_PLOT_IMPORT_TEMPLATE_CSV,
  parseAndMapBulkPlotImportCsv,
  type BulkPlotImportMappedRow,
} from '@/lib/bulk-plot-import-csv';
import {
  executeBulkPlotImport,
  previewBulkPlotImport,
  type BulkPlotImportExecuteResponse,
  type BulkPlotImportPreviewResponse,
} from '@/lib/bulk-plot-import';
import { markOnboardingAction } from '@/lib/onboarding-actions';

type Step = 'upload' | 'preview' | 'result';

function downloadTemplate() {
  const blob = new Blob([BULK_PLOT_IMPORT_TEMPLATE_CSV], { type: 'text/csv;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = 'tracebud-plot-import-template.csv';
  anchor.click();
  URL.revokeObjectURL(url);
}

function statusBadge(status: string) {
  if (status === 'READY' || status === 'IMPORTED') {
    return (
      <Badge className="bg-green-500/10 text-green-500">
        <CheckCircle2 className="mr-1 h-3 w-3" />
        {status}
      </Badge>
    );
  }
  if (status === 'DUPLICATE_SKIPPED') {
    return <Badge variant="secondary">{status}</Badge>;
  }
  return (
    <Badge variant="destructive">
      <XCircle className="mr-1 h-3 w-3" />
      {status}
    </Badge>
  );
}

export default function PlotBulkUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [csvText, setCsvText] = useState('');
  const [mappedRows, setMappedRows] = useState<BulkPlotImportMappedRow[]>([]);
  const [preview, setPreview] = useState<BulkPlotImportPreviewResponse | null>(null);
  const [result, setResult] = useState<BulkPlotImportExecuteResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setCsvText(text);
      setError(null);
    } catch {
      setError('Could not read the CSV file.');
    }
  };

  const handlePreview = async () => {
    setError(null);
    const rows = parseAndMapBulkPlotImportCsv(csvText);
    if (rows.length === 0) {
      setError('No valid rows found. Download the template and add at least one plot row.');
      return;
    }
    setMappedRows(rows);
    setIsWorking(true);
    try {
      const response = await previewBulkPlotImport(rows);
      setPreview(response);
      setStep('preview');
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Preview failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const handleImport = async () => {
    if (!mappedRows.length) return;
    setIsWorking(true);
    setError(null);
    try {
      const response = await executeBulkPlotImport(mappedRows);
      setResult(response);
      setStep('result');
      if (response.importedCount > 0) {
        markOnboardingAction('first_plot_captured');
        toast.success(`Imported ${response.importedCount} plot${response.importedCount === 1 ? '' : 's'}.`);
      }
    } catch (importError) {
      setError(importError instanceof Error ? importError.message : 'Import failed.');
    } finally {
      setIsWorking(false);
    }
  };

  return (
    <PermissionGate permission="plots:bulk_upload">
      <div className="flex flex-col">
        <AppHeader
          title="Bulk plot import"
          description="Import producer-linked point plots or cadastral polygons from CSV."
          actions={
            <Button variant="outline" size="sm" asChild>
              <Link href="/plots">
                <ArrowLeft className="mr-2 h-4 w-4" />
                Back to plots
              </Link>
            </Button>
          }
        />

        <main className="flex-1 space-y-6 p-6">
          {step === 'upload' && (
            <Card>
              <CardHeader>
                <CardTitle>Upload CSV</CardTitle>
                <CardDescription>
                  One row per plot. Use latitude/longitude for point plots under 4 ha, or provide
                  cadastral_key + country_code to hydrate a registry polygon.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap gap-2">
                  <Button type="button" variant="outline" onClick={downloadTemplate}>
                    <Download className="mr-2 h-4 w-4" />
                    Download template
                  </Button>
                </div>

                <div className="rounded-lg border border-dashed p-8 text-center">
                  <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                  <Label htmlFor="plot-import-file" className="cursor-pointer">
                    <span className="text-sm font-medium">Choose CSV file</span>
                    <input
                      id="plot-import-file"
                      type="file"
                      accept=".csv,text/csv"
                      className="hidden"
                      onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                    />
                  </Label>
                  {csvText ? (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Loaded {parseAndMapBulkPlotImportCsv(csvText).length} row(s).
                    </p>
                  ) : null}
                </div>

                <div className="space-y-2">
                  <Label htmlFor="plot-import-text">Or paste CSV</Label>
                  <textarea
                    id="plot-import-text"
                    value={csvText}
                    onChange={(event) => setCsvText(event.target.value)}
                    rows={8}
                    className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                    placeholder={BULK_PLOT_IMPORT_TEMPLATE_CSV}
                  />
                </div>

                {error ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <Button onClick={() => void handlePreview()} disabled={!csvText.trim() || isWorking}>
                  {isWorking ? 'Validating…' : 'Preview import'}
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 'preview' && preview ? (
            <Card>
              <CardHeader>
                <CardTitle>Preview</CardTitle>
                <CardDescription>
                  {preview.readyCount} ready · {preview.failedCount} blocked · {preview.totalRows}{' '}
                  total
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Plot</TableHead>
                      <TableHead>Geometry</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {preview.rows.map((row) => (
                      <TableRow key={row.rowIndex}>
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell>{row.producerLabel}</TableCell>
                        <TableCell>{row.clientPlotId}</TableCell>
                        <TableCell>{row.geometryKind ?? '—'}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.message ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                {error ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => setStep('upload')} disabled={isWorking}>
                    Back
                  </Button>
                  <Button
                    onClick={() => void handleImport()}
                    disabled={isWorking || preview.readyCount === 0}
                  >
                    <Upload className="mr-2 h-4 w-4" />
                    {isWorking
                      ? 'Importing…'
                      : `Import ${preview.readyCount} plot${preview.readyCount === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'result' && result ? (
            <Card>
              <CardHeader>
                <CardTitle>Import complete</CardTitle>
                <CardDescription>
                  {result.importedCount} imported · {result.duplicateSkippedCount} skipped as
                  duplicates · {result.failedCount} failed
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Row</TableHead>
                      <TableHead>Producer</TableHead>
                      <TableHead>Plot</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Message</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {result.rows.map((row) => (
                      <TableRow key={row.rowIndex}>
                        <TableCell>{row.rowIndex}</TableCell>
                        <TableCell>{row.producerLabel}</TableCell>
                        <TableCell>{row.clientPlotId}</TableCell>
                        <TableCell>{statusBadge(row.status)}</TableCell>
                        <TableCell className="text-sm text-muted-foreground">{row.message ?? '—'}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>

                <div className="flex flex-wrap gap-2">
                  <Button variant="outline" onClick={() => router.push('/plots')}>
                    View plots
                  </Button>
                  <Button
                    onClick={() => {
                      setStep('upload');
                      setCsvText('');
                      setPreview(null);
                      setResult(null);
                      setMappedRows([]);
                    }}
                  >
                    Import another file
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}
        </main>
      </div>
    </PermissionGate>
  );
}
