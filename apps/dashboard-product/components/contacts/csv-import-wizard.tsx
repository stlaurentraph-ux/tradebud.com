'use client';

import { useState, useCallback, useMemo, useContext } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { WizardProgress } from '@/components/onboarding/wizard-progress';
import { LocaleContext } from '@/lib/locale-context';
import { getContactsCsvWizardLabel } from '@/lib/workflow-terminology-labels';
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
  ArrowLeft,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';

const STEPS = ['step_upload', 'step_map', 'step_review', 'step_import'] as const;

type ImportType = 'contacts' | 'organizations';

interface CsvRow {
  [key: string]: string;
}

interface FieldMapping {
  csvColumn: string;
  targetField: string;
}

interface ValidationError {
  row: number;
  field: string;
  message: string;
}

interface ImportResult {
  success: number;
  failed: number;
  errors: ValidationError[];
}

const CONTACT_FIELDS = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'full_name', label: 'Full Name', required: true },
  { value: 'email', label: 'Email', required: true },
  { value: 'phone', label: 'Phone' },
  { value: 'organization', label: 'Organization' },
  { value: 'contact_type', label: 'Activity type' },
  { value: 'processing_subtype', label: 'Processing subtype' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'tags', label: 'Tags' },
  { value: 'consent_status', label: 'Consent Status' },
  { value: 'notes', label: 'Notes' },
];

const ORG_FIELDS = [
  { value: 'skip', label: 'Skip this column' },
  { value: 'name', label: 'Organization Name', required: true },
  { value: 'org_type', label: 'Organization Type' },
  { value: 'registration_number', label: 'Registration Number' },
  { value: 'primary_email', label: 'Primary Email' },
  { value: 'primary_phone', label: 'Primary Phone' },
  { value: 'website', label: 'Website' },
  { value: 'size', label: 'Organization Size' },
  { value: 'commodities', label: 'Commodities' },
  { value: 'certifications', label: 'Certifications' },
  { value: 'country', label: 'Country' },
  { value: 'region', label: 'Region' },
  { value: 'address', label: 'Address' },
  { value: 'notes', label: 'Notes' },
];

interface CsvImportWizardProps {
  importType: ImportType;
  onComplete: (data: CsvRow[]) => Promise<ImportResult>;
  onCancel: () => void;
  /** Called after import completes — e.g. navigate back to the contacts list. */
  onFinished?: () => void;
}

export function CsvImportWizard({ importType, onComplete, onCancel, onFinished }: CsvImportWizardProps) {
  const localeContext = useContext(LocaleContext);
  const t = localeContext?.t;
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [csvData, setCsvData] = useState<CsvRow[]>([]);
  const [fieldMappings, setFieldMappings] = useState<FieldMapping[]>([]);
  const [selectedRows, setSelectedRows] = useState<Set<number>>(new Set());
  const [importResult, setImportResult] = useState<ImportResult | null>(null);

  const fields = importType === 'contacts' ? CONTACT_FIELDS : ORG_FIELDS;
  const requiredFields = fields.filter((f) => f.required).map((f) => f.value);

  const parseCsv = (text: string): { headers: string[]; rows: CsvRow[] } => {
    const lines = text.split(/\r?\n/).filter((line) => line.trim());
    if (lines.length === 0) return { headers: [], rows: [] };

    const headers = lines[0].split(',').map((h) => h.trim().replace(/^"|"$/g, ''));
    const rows: CsvRow[] = [];

    for (let i = 1; i < lines.length; i++) {
      const values = lines[i].split(',').map((v) => v.trim().replace(/^"|"$/g, ''));
      const row: CsvRow = {};
      headers.forEach((header, index) => {
        row[header] = values[index] || '';
      });
      rows.push(row);
    }

    return { headers, rows };
  };

  const handleFileUpload = useCallback(
    (file: File) => {
      setError(null);

      if (!file.name.endsWith('.csv')) {
        setError(getContactsCsvWizardLabel('error_upload_csv', t));
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0) {
          setError(getContactsCsvWizardLabel('error_empty_csv', t));
          return;
        }

        setCsvData(rows);

        const autoMappings: FieldMapping[] = headers.map((header) => {
          const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
          const activityAliases = new Set([
            'activitytype',
            'activity',
            'suppliertype',
            'supplierrole',
            'role',
            'type',
          ]);
          const subtypeAliases = new Set([
            'processingsubtype',
            'facilitysubtype',
            'subtype',
            'subrole',
          ]);
          if (importType === 'contacts' && activityAliases.has(normalizedHeader)) {
            return { csvColumn: header, targetField: 'contact_type' };
          }
          if (importType === 'contacts' && subtypeAliases.has(normalizedHeader)) {
            return { csvColumn: header, targetField: 'processing_subtype' };
          }
          const matchedField = fields.find((f) => {
            const normalizedField = f.value.toLowerCase().replace(/[_\s-]/g, '');
            const normalizedLabel = f.label.toLowerCase().replace(/[_\s-]/g, '');
            return normalizedField === normalizedHeader || normalizedLabel === normalizedHeader;
          });
          return {
            csvColumn: header,
            targetField: matchedField?.value || 'skip',
          };
        });

        setFieldMappings(autoMappings);
        setSelectedRows(new Set(rows.map((_, i) => i)));
        setStep(2);
      };

      reader.onerror = () => {
        setError(getContactsCsvWizardLabel('error_read_file', t));
      };

      reader.readAsText(file);
    },
    [fields, t, importType],
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload],
  );

  const updateMapping = (csvColumn: string, targetField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, targetField } : m)),
    );
  };

  const toggleRowSelection = (index: number) => {
    setSelectedRows((prev) => {
      const next = new Set(prev);
      if (next.has(index)) {
        next.delete(index);
      } else {
        next.add(index);
      }
      return next;
    });
  };

  const toggleAllRows = () => {
    if (selectedRows.size === csvData.length) {
      setSelectedRows(new Set());
    } else {
      setSelectedRows(new Set(csvData.map((_, i) => i)));
    }
  };

  const validationErrors = useMemo(() => {
    const errors: ValidationError[] = [];

    csvData.forEach((row, index) => {
      if (!selectedRows.has(index)) return;

      fieldMappings.forEach((mapping) => {
        if (requiredFields.includes(mapping.targetField) && !row[mapping.csvColumn]?.trim()) {
          errors.push({
            row: index + 1,
            field: mapping.targetField,
            message: `Missing required field: ${fields.find((f) => f.value === mapping.targetField)?.label}`,
          });
        }
      });
    });

    return errors;
  }, [csvData, selectedRows, fieldMappings, requiredFields, fields]);

  const mappingComplete = useMemo(() => {
    const mappedFields = fieldMappings.map((m) => m.targetField).filter((f) => f !== 'skip');
    return requiredFields.every((rf) => mappedFields.includes(rf));
  }, [fieldMappings, requiredFields]);

  const transformedData = useMemo(() => {
    return csvData
      .filter((_, i) => selectedRows.has(i))
      .map((row) => {
        const transformed: CsvRow = {};
        fieldMappings.forEach((mapping) => {
          if (mapping.targetField !== 'skip') {
            transformed[mapping.targetField] = row[mapping.csvColumn] || '';
          }
        });
        return transformed;
      });
  }, [csvData, selectedRows, fieldMappings]);

  const handleImport = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await onComplete(transformedData);
      setImportResult(result);
      setStep(4);
      if (result.failed === 0 && result.success > 0) {
        onFinished?.();
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : getContactsCsvWizardLabel('error_import_failed', t));
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFinished = () => {
    if (onFinished) {
      onFinished();
      return;
    }
    onCancel();
  };

  const canProceed = () => {
    if (step === 1) return csvData.length > 0;
    if (step === 2) return mappingComplete;
    if (step === 3) return selectedRows.size > 0 && validationErrors.length === 0;
    return false;
  };

  const downloadTemplate = () => {
    const headers = fields.filter((f) => f.value !== 'skip').map((f) => f.label);
    const sampleRow =
      importType === 'contacts'
        ? [
            'Jane Doe',
            'jane@coop.example',
            '+255 700 000 000',
            'Kilimanjaro Cooperative',
            'cooperative',
            'TZ',
            'Kilimanjaro',
            'coffee',
            'unknown',
            'Primary washing station contact',
          ]
        : [];
    const csv = [headers.join(','), sampleRow.length > 0 ? sampleRow.join(',') : ''].filter(Boolean).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${importType}-template.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-6">
      <WizardProgress
        currentStep={step}
        totalSteps={4}
        steps={STEPS.map((item) => getContactsCsvWizardLabel(item, t))}
      />

      {error && (
        <div className="flex items-start gap-3 rounded-md border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-800">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {step === 1 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Upload className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsCsvWizardLabel('title_upload', t)}</CardTitle>
                <CardDescription>
                  {importType === 'contacts'
                    ? getContactsCsvWizardLabel('desc_upload_contacts', t)
                    : getContactsCsvWizardLabel('desc_upload_organizations', t)}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragging ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">{getContactsCsvWizardLabel('dropzone_title', t)}</p>
                <p className="text-sm text-muted-foreground">{getContactsCsvWizardLabel('dropzone_subtitle', t)}</p>
              </div>
              <input
                type="file"
                accept=".csv"
                className="absolute inset-0 cursor-pointer opacity-0"
                onChange={(e) => {
                  const file = e.target.files?.[0];
                  if (file) handleFileUpload(file);
                }}
              />
            </div>

            <div className="flex items-center justify-center">
              <Button variant="outline" size="sm" onClick={downloadTemplate}>
                <Download className="mr-2 h-4 w-4" />
                {getContactsCsvWizardLabel('download_template', t)}
              </Button>
            </div>

            <div className="rounded-md border border-border bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium">{getContactsCsvWizardLabel('requirements_title', t)}</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>{getContactsCsvWizardLabel('requirements_headers', t)}</li>
                <li>{getContactsCsvWizardLabel('requirements_delimiter', t)}</li>
                <li>
                  {getContactsCsvWizardLabel('requirements_required', t)}{' '}
                  {fields
                    .filter((f) => f.required)
                    .map((f) => f.label)
                    .join(', ')}
                </li>
                <li>{getContactsCsvWizardLabel('requirements_max_rows', t)}</li>
              </ul>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                <FileSpreadsheet className="h-5 w-5" />
              </div>
              <div>
                <CardTitle>{getContactsCsvWizardLabel('title_map', t)}</CardTitle>
                <CardDescription>{getContactsCsvWizardLabel('desc_map', t)}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {!mappingComplete && (
              <div className="mb-4 flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  {getContactsCsvWizardLabel('map_required_warning', t)}{' '}
                  {fields
                    .filter((f) => f.required)
                    .map((f) => f.label)
                    .join(', ')}
                </span>
              </div>
            )}

            <div className="space-y-3">
              {fieldMappings.map((mapping) => (
                <div key={mapping.csvColumn} className="grid items-center gap-4 rounded-lg border border-border p-3 sm:grid-cols-3">
                  <div>
                    <Label className="text-muted-foreground">{getContactsCsvWizardLabel('csv_column', t)}</Label>
                    <p className="font-medium">{mapping.csvColumn}</p>
                  </div>
                  <div className="flex items-center justify-center text-muted-foreground">
                    <ArrowRight className="h-4 w-4" />
                  </div>
                  <div>
                    <Label htmlFor={`map-${mapping.csvColumn}`}>{getContactsCsvWizardLabel('map_to_field', t)}</Label>
                    <Select value={mapping.targetField} onValueChange={(value) => updateMapping(mapping.csvColumn, value)}>
                      <SelectTrigger id={`map-${mapping.csvColumn}`}>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {fields.map((field) => (
                          <SelectItem key={field.value} value={field.value}>
                            {field.label}
                            {field.required && <span className="text-destructive"> *</span>}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>{getContactsCsvWizardLabel('title_review', t)}</CardTitle>
            <CardDescription>
              {getContactsCsvWizardLabel('desc_review', t)} ({selectedRows.size} of {csvData.length} selected)
            </CardDescription>
          </CardHeader>
          <CardContent>
            {validationErrors.length > 0 && (
              <div className="mb-4 space-y-2 rounded-md border border-red-200 bg-red-50 p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <XCircle className="h-4 w-4" />
                  {getContactsCsvWizardLabel('validation_errors', t)}
                </h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {validationErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      {getContactsCsvWizardLabel('row_prefix', t)} {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox checked={selectedRows.size === csvData.length} onCheckedChange={toggleAllRows} />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    {fieldMappings.filter((m) => m.targetField !== 'skip').slice(0, 4).map((m) => (
                      <TableHead key={m.csvColumn}>{fields.find((f) => f.value === m.targetField)?.label}</TableHead>
                    ))}
                    <TableHead>{getContactsCsvWizardLabel('table_status', t)}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 20).map((row, index) => {
                    const hasError = validationErrors.some((e) => e.row === index + 1);
                    return (
                      <TableRow key={index} className={hasError ? 'bg-red-50' : ''}>
                        <TableCell>
                          <Checkbox checked={selectedRows.has(index)} onCheckedChange={() => toggleRowSelection(index)} />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        {fieldMappings.filter((m) => m.targetField !== 'skip').slice(0, 4).map((m) => (
                          <TableCell key={m.csvColumn} className="max-w-[150px] truncate">{row[m.csvColumn] || '—'}</TableCell>
                        ))}
                        <TableCell>
                          {hasError ? <Badge variant="secondary">{getContactsCsvWizardLabel('status_error', t)}</Badge> : <Badge variant="outline">{getContactsCsvWizardLabel('status_ready', t)}</Badge>}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && importResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div className={`flex h-10 w-10 items-center justify-center rounded-full ${importResult.failed === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                {importResult.failed === 0 ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              </div>
              <div>
                <CardTitle>{getContactsCsvWizardLabel('title_complete', t)}</CardTitle>
                <CardDescription>
                  {(importType === 'contacts' ? getContactsCsvWizardLabel('desc_complete_contacts', t) : getContactsCsvWizardLabel('desc_complete_organizations', t)).replace('{{count}}', String(importResult.success))}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-2xl font-bold text-emerald-700">{importResult.success}</div>
                <div className="text-sm text-emerald-600">{getContactsCsvWizardLabel('success_count', t)}</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="text-2xl font-bold text-red-700">{importResult.failed}</div>
                <div className="text-sm text-red-600">{getContactsCsvWizardLabel('failed_count', t)}</div>
              </div>
            </div>
            {importResult.errors.length > 0 ? (
              <div className="mt-4 rounded-lg border border-red-200 bg-red-50/50 p-4">
                <p className="mb-2 text-sm font-medium text-red-900">
                  {getContactsCsvWizardLabel('failed_rows_title', t)}
                </p>
                <ul className="space-y-1 text-sm text-red-800">
                  {importResult.errors.map((entry) => (
                    <li key={`${entry.row}-${entry.message}`}>{entry.message}</li>
                  ))}
                </ul>
              </div>
            ) : null}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        {step < 4 ? (
          <>
            <Button variant="outline" onClick={step === 1 ? onCancel : () => setStep(step - 1)}>
              {step === 1 ? getContactsCsvWizardLabel('action_cancel', t) : <><ArrowLeft className="mr-2 h-4 w-4" /> {getContactsCsvWizardLabel('action_back', t)}</>}
            </Button>

            {step < 3 ? (
              <Button onClick={() => setStep(step + 1)} disabled={!canProceed()}>
                {getContactsCsvWizardLabel('action_next', t)} <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? getContactsCsvWizardLabel('action_importing', t) : <><Upload className="mr-2 h-4 w-4" /> {getContactsCsvWizardLabel('action_import_records', t).replace('{{count}}', String(selectedRows.size))}</>}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={handleFinished} className="ml-auto">
            {getContactsCsvWizardLabel(onFinished ? 'action_view_contacts' : 'action_done', t)}
          </Button>
        )}
      </div>
    </div>
  );
}
