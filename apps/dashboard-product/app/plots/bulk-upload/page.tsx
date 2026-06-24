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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  AlertCircle,
  ArrowLeft,
  CheckCircle2,
  Download,
  FileJson,
  FileSpreadsheet,
  Map,
  Package,
  Upload,
  XCircle,
} from 'lucide-react';
import { toast } from 'sonner';
import {
  BULK_PLOT_IMPORT_TEMPLATE_CSV,
  parseAndMapBulkPlotImportCsv,
} from '@/lib/bulk-plot-import-csv';
import {
  BULK_PLOT_IMPORT_GEOJSON_SAMPLE,
  parseAndMapBulkPlotImportGeoJson,
} from '@/lib/bulk-plot-import-geojson';
import {
  BULK_PLOT_IMPORT_KML_SAMPLE,
  parseAndMapBulkPlotImportKml,
} from '@/lib/bulk-plot-import-kml';
import {
  BULK_PLOT_IMPORT_PACKAGE_SAMPLE,
  parseAndVerifyTracebudImportV1Package,
  parseTracebudImportV1Package,
} from '@/lib/bulk-plot-import-package';
import {
  BULK_PLOT_IMPORT_SYNC_MAX_ROWS,
  executeBulkPlotImport,
  getBulkPlotImportJob,
  isBulkPlotImportJobTerminal,
  previewBulkPlotImport,
  queueBulkPlotImportJob,
  type BulkPlotImportExecuteResponse,
  type BulkPlotImportInputRow,
  type BulkPlotImportJobResponse,
  type BulkPlotImportPreviewResponse,
} from '@/lib/bulk-plot-import';
import { DASHBOARD_EVENTS, trackDashboardEvent } from '@/lib/observability/analytics';
import { markOnboardingAction } from '@/lib/onboarding-actions';

type Step = 'upload' | 'preview' | 'job' | 'result';
type ImportSource = 'csv' | 'geojson' | 'kml' | 'package';

function downloadTemplate(source: ImportSource) {
  const templates: Record<ImportSource, { body: string; mime: string; filename: string }> = {
    csv: {
      body: BULK_PLOT_IMPORT_TEMPLATE_CSV,
      mime: 'text/csv;charset=utf-8',
      filename: 'tracebud-plot-import-template.csv',
    },
    geojson: {
      body: BULK_PLOT_IMPORT_GEOJSON_SAMPLE,
      mime: 'application/geo+json;charset=utf-8',
      filename: 'tracebud-plot-import-sample.geojson',
    },
    kml: {
      body: BULK_PLOT_IMPORT_KML_SAMPLE,
      mime: 'application/vnd.google-earth.kml+xml;charset=utf-8',
      filename: 'tracebud-plot-import-sample.kml',
    },
    package: {
      body: BULK_PLOT_IMPORT_PACKAGE_SAMPLE,
      mime: 'application/json;charset=utf-8',
      filename: 'tracebud-import-v1-sample.json',
    },
  };
  const template = templates[source];
  const blob = new Blob([template.body], { type: template.mime });
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = template.filename;
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

function parseImportRows(source: Exclude<ImportSource, 'package'>, text: string): BulkPlotImportInputRow[] {
  if (source === 'csv') return parseAndMapBulkPlotImportCsv(text);
  if (source === 'kml') return parseAndMapBulkPlotImportKml(text);
  return parseAndMapBulkPlotImportGeoJson(text);
}

function countImportRows(source: ImportSource, text: string): number {
  if (!text.trim()) return 0;
  try {
    if (source === 'package') {
      return parseTracebudImportV1Package(text).rows.length;
    }
    return parseImportRows(source, text).length;
  } catch {
    return 0;
  }
}

export default function PlotBulkUploadPage() {
  const router = useRouter();
  const [step, setStep] = useState<Step>('upload');
  const [source, setSource] = useState<ImportSource>('csv');
  const [fileText, setFileText] = useState('');
  const [mappedRows, setMappedRows] = useState<BulkPlotImportInputRow[]>([]);
  const [preview, setPreview] = useState<BulkPlotImportPreviewResponse | null>(null);
  const [result, setResult] = useState<BulkPlotImportExecuteResponse | null>(null);
  const [activeJob, setActiveJob] = useState<BulkPlotImportJobResponse | null>(null);
  const [packageNotice, setPackageNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isWorking, setIsWorking] = useState(false);

  const handleSourceChange = (nextSource: ImportSource) => {
    setSource(nextSource);
    setFileText('');
    setError(null);
    setPackageNotice(null);
    setPreview(null);
    setResult(null);
    setActiveJob(null);
    setMappedRows([]);
    setStep('upload');
  };

  const handleFile = async (file: File | null) => {
    if (!file) return;
    try {
      const text = await file.text();
      setFileText(text);
      setError(null);
    } catch {
      setError(`Could not read the ${source === 'csv' ? 'CSV' : source === 'geojson' ? 'GeoJSON' : source === 'kml' ? 'KML' : 'import package'} file.`);
    }
  };

  const handlePreview = async () => {
    setError(null);
    setPackageNotice(null);
    let rows: BulkPlotImportInputRow[] = [];
    try {
      if (source === 'package') {
        const parsed = await parseAndVerifyTracebudImportV1Package(fileText);
        rows = parsed.rows;
        if (parsed.evidenceReferenceCount > 0) {
          setPackageNotice(
            `${parsed.evidenceReferenceCount} evidence reference(s) in the package will not be imported in this release.`,
          );
        }
        if (parsed.skippedPlotCount > 0) {
          setPackageNotice(
            (parsed.evidenceReferenceCount > 0
              ? `${parsed.evidenceReferenceCount} evidence reference(s) skipped. `
              : '') + `${parsed.skippedPlotCount} plot(s) skipped: ${parsed.skipMessages.join(' ')}`,
          );
        }
      } else {
        rows = parseImportRows(source, fileText);
      }
    } catch (parseError) {
      setError(parseError instanceof Error ? parseError.message : 'Could not parse file.');
      return;
    }
    if (rows.length === 0) {
      setError(
        source === 'csv'
          ? 'No valid rows found. Download the template and add at least one plot row.'
          : source === 'geojson'
            ? 'No valid features found. Each feature needs client_plot_id in properties and a Point or Polygon geometry.'
            : source === 'kml'
              ? 'No valid placemarks found. Each Placemark needs client_plot_id in ExtendedData and a Point or Polygon.'
              : 'No importable plots found. Check producer_ref links and plot geometry in the package.',
      );
      return;
    }
    setMappedRows(rows);
    setIsWorking(true);
    try {
      const response = await previewBulkPlotImport(rows, {
        summaryOnly: rows.length > BULK_PLOT_IMPORT_SYNC_MAX_ROWS,
      });
      setPreview(response);
      setStep('preview');
    } catch (previewError) {
      setError(previewError instanceof Error ? previewError.message : 'Preview failed.');
    } finally {
      setIsWorking(false);
    }
  };

  const pollImportJob = async (jobId: string): Promise<BulkPlotImportJobResponse> => {
    for (let attempt = 0; attempt < 120; attempt += 1) {
      const job = await getBulkPlotImportJob(jobId);
      setActiveJob(job);
      if (isBulkPlotImportJobTerminal(job.status)) {
        trackDashboardEvent(DASHBOARD_EVENTS.BULK_PLOT_IMPORT_JOB_COMPLETED, {
          job_id: job.id,
          status: job.status,
          imported_count: job.successCount,
          failed_count: job.failureCount,
        });
        return job;
      }
      await new Promise((resolve) => setTimeout(resolve, 2000));
    }
    throw new Error('Import job timed out while processing.');
  };

  const handleImport = async () => {
    if (!mappedRows.length) return;
    setIsWorking(true);
    setError(null);
    try {
      if (mappedRows.length > BULK_PLOT_IMPORT_SYNC_MAX_ROWS) {
        const queued = await queueBulkPlotImportJob(mappedRows);
        setActiveJob(queued);
        setStep('job');
        const finished = await pollImportJob(queued.id);
        setActiveJob(finished);
        if (finished.successCount > 0) {
          markOnboardingAction('first_plot_captured');
        }
        toast.success(
          `Import job ${finished.status.toLowerCase()}: ${finished.successCount} imported, ${finished.failureCount} failed.`,
        );
        return;
      }

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

  const parsedRowCount = countImportRows(source, fileText);
  const isLargeImport = mappedRows.length > BULK_PLOT_IMPORT_SYNC_MAX_ROWS;
  const importProgressPercent =
    activeJob && activeJob.totalRecords > 0
      ? Math.round((activeJob.processedRecords / activeJob.totalRecords) * 100)
      : 0;

  return (
    <PermissionGate permission="plots:bulk_upload">
      <div className="flex flex-col">
        <AppHeader
          title="Bulk plot import"
          description="Import producer-linked plots from CSV, GeoJSON, or tracebud_import_v1 packages. Large imports queue async jobs."
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
                <CardTitle>Upload file</CardTitle>
                <CardDescription>
                  CSV supports point plots under 4 ha or cadastral keys. GeoJSON and KML support
                  Point or Polygon placemarks/features. Import packages use tracebud_import_v1 with
                  optional content_hash_sha256 integrity checks.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Tabs value={source} onValueChange={(value) => handleSourceChange(value as ImportSource)}>
                  <TabsList>
                    <TabsTrigger value="csv">CSV</TabsTrigger>
                    <TabsTrigger value="geojson">GeoJSON</TabsTrigger>
                    <TabsTrigger value="kml">KML</TabsTrigger>
                    <TabsTrigger value="package">Import package</TabsTrigger>
                  </TabsList>

                  <TabsContent value="csv" className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => downloadTemplate('csv')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download CSV template
                      </Button>
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <FileSpreadsheet className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <Label htmlFor="plot-import-csv-file" className="cursor-pointer">
                        <span className="text-sm font-medium">Choose CSV file</span>
                        <input
                          id="plot-import-csv-file"
                          type="file"
                          accept=".csv,text/csv"
                          className="hidden"
                          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                        />
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plot-import-csv-text">Or paste CSV</Label>
                      <textarea
                        id="plot-import-csv-text"
                        value={source === 'csv' ? fileText : ''}
                        onChange={(event) => setFileText(event.target.value)}
                        rows={8}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        placeholder={BULK_PLOT_IMPORT_TEMPLATE_CSV}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="geojson" className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => downloadTemplate('geojson')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download GeoJSON sample
                      </Button>
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <FileJson className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <Label htmlFor="plot-import-geojson-file" className="cursor-pointer">
                        <span className="text-sm font-medium">Choose GeoJSON file</span>
                        <input
                          id="plot-import-geojson-file"
                          type="file"
                          accept=".geojson,.json,application/geo+json,application/json"
                          className="hidden"
                          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                        />
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plot-import-geojson-text">Or paste GeoJSON</Label>
                      <textarea
                        id="plot-import-geojson-text"
                        value={source === 'geojson' ? fileText : ''}
                        onChange={(event) => setFileText(event.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        placeholder={BULK_PLOT_IMPORT_GEOJSON_SAMPLE}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="kml" className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={() => downloadTemplate('kml')}>
                        <Download className="mr-2 h-4 w-4" />
                        Download KML sample
                      </Button>
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <Map className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <Label htmlFor="plot-import-kml-file" className="cursor-pointer">
                        <span className="text-sm font-medium">Choose KML file</span>
                        <input
                          id="plot-import-kml-file"
                          type="file"
                          accept=".kml,application/vnd.google-earth.kml+xml,text/xml,application/xml"
                          className="hidden"
                          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                        />
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plot-import-kml-text">Or paste KML</Label>
                      <textarea
                        id="plot-import-kml-text"
                        value={source === 'kml' ? fileText : ''}
                        onChange={(event) => setFileText(event.target.value)}
                        rows={12}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        placeholder={BULK_PLOT_IMPORT_KML_SAMPLE}
                      />
                    </div>
                  </TabsContent>


                  <TabsContent value="package" className="mt-4 space-y-4">
                    <div className="flex flex-wrap gap-2">
                      <Button
                        type="button"
                        variant="outline"
                        onClick={() => downloadTemplate('package')}
                      >
                        <Download className="mr-2 h-4 w-4" />
                        Download tracebud_import_v1 sample
                      </Button>
                    </div>

                    <div className="rounded-lg border border-dashed p-8 text-center">
                      <Package className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
                      <Label htmlFor="plot-import-package-file" className="cursor-pointer">
                        <span className="text-sm font-medium">Choose import package JSON</span>
                        <input
                          id="plot-import-package-file"
                          type="file"
                          accept=".json,application/json"
                          className="hidden"
                          onChange={(event) => void handleFile(event.target.files?.[0] ?? null)}
                        />
                      </Label>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="plot-import-package-text">Or paste import package</Label>
                      <textarea
                        id="plot-import-package-text"
                        value={source === 'package' ? fileText : ''}
                        onChange={(event) => setFileText(event.target.value)}
                        rows={14}
                        className="w-full rounded-md border border-input bg-background px-3 py-2 font-mono text-sm"
                        placeholder={BULK_PLOT_IMPORT_PACKAGE_SAMPLE}
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {fileText ? (
                  <p className="text-xs text-muted-foreground">Loaded {parsedRowCount} row(s).</p>
                ) : null}

                {error ? (
                  <div className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
                    <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                    <span>{error}</span>
                  </div>
                ) : null}

                {packageNotice ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-900 dark:text-amber-200">
                    {packageNotice}
                  </div>
                ) : null}

                <Button onClick={() => void handlePreview()} disabled={!fileText.trim() || isWorking}>
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
                  {preview.summaryOnly
                    ? ` · showing ${preview.rows.length} sample validation issue(s)`
                    : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {packageNotice ? (
                  <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-sm text-amber-900 dark:text-amber-200">
                    {packageNotice}
                  </div>
                ) : null}

                {isLargeImport ? (
                  <div className="rounded-md border border-blue-500/30 bg-blue-500/5 p-3 text-sm">
                    This import exceeds {BULK_PLOT_IMPORT_SYNC_MAX_ROWS} rows and will run as an async
                    background job with progress tracking.
                  </div>
                ) : null}

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
                      ? isLargeImport
                        ? 'Queueing job…'
                        : 'Importing…'
                      : isLargeImport
                        ? `Queue import job (${preview.readyCount} ready plots)`
                        : `Import ${preview.readyCount} plot${preview.readyCount === 1 ? '' : 's'}`}
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : null}

          {step === 'job' && activeJob ? (
            <Card>
              <CardHeader>
                <CardTitle>Import job running</CardTitle>
                <CardDescription>
                  {activeJob.processedRecords} / {activeJob.totalRecords} processed · status{' '}
                  {activeJob.status}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="h-2 w-full overflow-hidden rounded-full bg-muted">
                  <div
                    className="h-full bg-primary transition-all"
                    style={{ width: `${importProgressPercent}%` }}
                  />
                </div>
                <p className="text-sm text-muted-foreground">
                  {activeJob.successCount} imported · {activeJob.duplicateSkippedCount} duplicates
                  skipped · {activeJob.failureCount} failed
                </p>
                {isBulkPlotImportJobTerminal(activeJob.status) ? (
                  <div className="flex flex-wrap gap-2">
                    <Button variant="outline" onClick={() => router.push('/plots')}>
                      View plots
                    </Button>
                    <Button
                      onClick={() => {
                        setStep('upload');
                        setFileText('');
                        setPreview(null);
                        setActiveJob(null);
                        setMappedRows([]);
                      }}
                    >
                      Import another file
                    </Button>
                  </div>
                ) : (
                  <p className="text-sm text-muted-foreground">Processing in the background…</p>
                )}
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
                      setFileText('');
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
