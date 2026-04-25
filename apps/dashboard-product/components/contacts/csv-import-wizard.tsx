'use client';

import { useState, useCallback, useMemo } from 'react';
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
  Check,
  ArrowLeft,
  ArrowRight,
  Upload,
  FileSpreadsheet,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Download,
} from 'lucide-react';

const STEPS = ['Upload File', 'Map Fields', 'Review', 'Import'];

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
  { value: 'contact_type', label: 'Contact Type' },
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
}

export function CsvImportWizard({ importType, onComplete, onCancel }: CsvImportWizardProps) {
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  const [csvHeaders, setCsvHeaders] = useState<string[]>([]);
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
        setError('Please upload a CSV file.');
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const text = e.target?.result as string;
        const { headers, rows } = parseCsv(text);

        if (headers.length === 0) {
          setError('The CSV file appears to be empty.');
          return;
        }

        setCsvHeaders(headers);
        setCsvData(rows);

        // Auto-map fields based on header names
        const autoMappings: FieldMapping[] = headers.map((header) => {
          const normalizedHeader = header.toLowerCase().replace(/[_\s-]/g, '');
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
        setError('Failed to read the file. Please try again.');
      };

      reader.readAsText(file);
    },
    [fields]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      const file = e.dataTransfer.files[0];
      if (file) handleFileUpload(file);
    },
    [handleFileUpload]
  );

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const updateMapping = (csvColumn: string, targetField: string) => {
    setFieldMappings((prev) =>
      prev.map((m) => (m.csvColumn === csvColumn ? { ...m, targetField } : m))
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
    const mappedRequiredFields = fieldMappings
      .filter((m) => requiredFields.includes(m.targetField))
      .map((m) => m.csvColumn);

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
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Import failed. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const canProceed = () => {
    if (step === 1) return csvData.length > 0;
    if (step === 2) return mappingComplete;
    if (step === 3) return selectedRows.size > 0 && validationErrors.length === 0;
    return false;
  };

  const handleNext = () => {
    if (step < 4 && canProceed()) {
      setStep(step + 1);
    }
  };

  const handleBack = () => {
    if (step > 1) {
      setStep(step - 1);
    }
  };

  const downloadTemplate = () => {
    const headers = fields.filter((f) => f.value !== 'skip').map((f) => f.label);
    const csv = headers.join(',') + '\n';
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
      <WizardProgress currentStep={step} totalSteps={4} steps={STEPS} />

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
                <CardTitle>Upload CSV File</CardTitle>
                <CardDescription>
                  Upload a CSV file with {importType === 'contacts' ? 'contact' : 'organization'} data
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div
              className={`relative flex flex-col items-center justify-center gap-4 rounded-lg border-2 border-dashed p-8 transition-colors ${
                isDragging
                  ? 'border-primary bg-primary/5'
                  : 'border-border hover:border-muted-foreground/50'
              }`}
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
            >
              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
                <FileSpreadsheet className="h-8 w-8 text-muted-foreground" />
              </div>
              <div className="text-center">
                <p className="text-sm font-medium">Drag and drop your CSV file here</p>
                <p className="text-sm text-muted-foreground">or click to browse</p>
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
                Download Template
              </Button>
            </div>

            <div className="rounded-md border border-border bg-muted/50 p-4">
              <h4 className="mb-2 text-sm font-medium">CSV Requirements</h4>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>First row should contain column headers</li>
                <li>Use comma (,) as the delimiter</li>
                <li>
                  Required fields:{' '}
                  {fields
                    .filter((f) => f.required)
                    .map((f) => f.label)
                    .join(', ')}
                </li>
                <li>Maximum 1,000 rows per import</li>
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
                <CardTitle>Map Fields</CardTitle>
                <CardDescription>Match your CSV columns to the correct fields</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {!mappingComplete && (
                <div className="flex items-start gap-3 rounded-md border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                  <span>
                    Please map all required fields:{' '}
                    {fields
                      .filter((f) => f.required)
                      .map((f) => f.label)
                      .join(', ')}
                  </span>
                </div>
              )}

              <div className="space-y-3">
                {fieldMappings.map((mapping) => (
                  <div
                    key={mapping.csvColumn}
                    className="grid items-center gap-4 rounded-lg border border-border p-3 sm:grid-cols-3"
                  >
                    <div>
                      <Label className="text-muted-foreground">CSV Column</Label>
                      <p className="font-medium">{mapping.csvColumn}</p>
                      {csvData[0] && (
                        <p className="truncate text-xs text-muted-foreground">
                          Sample: {csvData[0][mapping.csvColumn] || '(empty)'}
                        </p>
                      )}
                    </div>
                    <div className="flex items-center justify-center text-muted-foreground">
                      <ArrowRight className="h-4 w-4" />
                    </div>
                    <div>
                      <Label htmlFor={`map-${mapping.csvColumn}`}>Map to Field</Label>
                      <Select
                        value={mapping.targetField}
                        onValueChange={(value) => updateMapping(mapping.csvColumn, value)}
                      >
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
            </div>
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary/10 text-primary">
                  <Check className="h-5 w-5" />
                </div>
                <div>
                  <CardTitle>Review Data</CardTitle>
                  <CardDescription>
                    Select the rows you want to import ({selectedRows.size} of {csvData.length}{' '}
                    selected)
                  </CardDescription>
                </div>
              </div>
              {validationErrors.length > 0 && (
                <Badge variant="secondary" className="bg-red-100 text-red-700">
                  {validationErrors.length} error{validationErrors.length !== 1 ? 's' : ''}
                </Badge>
              )}
            </div>
          </CardHeader>
          <CardContent>
            {validationErrors.length > 0 && (
              <div className="mb-4 space-y-2 rounded-md border border-red-200 bg-red-50 p-4">
                <h4 className="flex items-center gap-2 text-sm font-medium text-red-800">
                  <XCircle className="h-4 w-4" />
                  Validation Errors
                </h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {validationErrors.slice(0, 5).map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {validationErrors.length > 5 && (
                    <li>...and {validationErrors.length - 5} more errors</li>
                  )}
                </ul>
              </div>
            )}

            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox
                        checked={selectedRows.size === csvData.length}
                        onCheckedChange={toggleAllRows}
                      />
                    </TableHead>
                    <TableHead className="w-12">#</TableHead>
                    {fieldMappings
                      .filter((m) => m.targetField !== 'skip')
                      .slice(0, 4)
                      .map((m) => (
                        <TableHead key={m.csvColumn}>
                          {fields.find((f) => f.value === m.targetField)?.label}
                        </TableHead>
                      ))}
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {csvData.slice(0, 20).map((row, index) => {
                    const rowErrors = validationErrors.filter((e) => e.row === index + 1);
                    const hasError = rowErrors.length > 0;

                    return (
                      <TableRow key={index} className={hasError ? 'bg-red-50' : ''}>
                        <TableCell>
                          <Checkbox
                            checked={selectedRows.has(index)}
                            onCheckedChange={() => toggleRowSelection(index)}
                          />
                        </TableCell>
                        <TableCell className="text-muted-foreground">{index + 1}</TableCell>
                        {fieldMappings
                          .filter((m) => m.targetField !== 'skip')
                          .slice(0, 4)
                          .map((m) => (
                            <TableCell key={m.csvColumn} className="max-w-[150px] truncate">
                              {row[m.csvColumn] || '—'}
                            </TableCell>
                          ))}
                        <TableCell>
                          {hasError ? (
                            <Badge variant="secondary" className="bg-red-100 text-red-700">
                              Error
                            </Badge>
                          ) : selectedRows.has(index) ? (
                            <Badge variant="secondary" className="bg-emerald-100 text-emerald-700">
                              Ready
                            </Badge>
                          ) : (
                            <Badge variant="outline">Skipped</Badge>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
              {csvData.length > 20 && (
                <div className="border-t border-border bg-muted/50 px-4 py-2 text-center text-sm text-muted-foreground">
                  Showing first 20 of {csvData.length} rows
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {step === 4 && importResult && (
        <Card>
          <CardHeader>
            <div className="flex items-center gap-3">
              <div
                className={`flex h-10 w-10 items-center justify-center rounded-full ${
                  importResult.failed === 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'
                }`}
              >
                {importResult.failed === 0 ? (
                  <CheckCircle2 className="h-5 w-5" />
                ) : (
                  <AlertCircle className="h-5 w-5" />
                )}
              </div>
              <div>
                <CardTitle>Import Complete</CardTitle>
                <CardDescription>
                  {importResult.success} {importType === 'contacts' ? 'contacts' : 'organizations'}{' '}
                  imported successfully
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-lg border border-emerald-200 bg-emerald-50 p-4">
                <div className="text-2xl font-bold text-emerald-700">{importResult.success}</div>
                <div className="text-sm text-emerald-600">Successfully imported</div>
              </div>
              <div className="rounded-lg border border-red-200 bg-red-50 p-4">
                <div className="text-2xl font-bold text-red-700">{importResult.failed}</div>
                <div className="text-sm text-red-600">Failed to import</div>
              </div>
            </div>

            {importResult.errors.length > 0 && (
              <div className="mt-4 space-y-2 rounded-md border border-red-200 bg-red-50 p-4">
                <h4 className="text-sm font-medium text-red-800">Import Errors</h4>
                <ul className="space-y-1 text-sm text-red-700">
                  {importResult.errors.slice(0, 10).map((err, i) => (
                    <li key={i}>
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                  {importResult.errors.length > 10 && (
                    <li>...and {importResult.errors.length - 10} more errors</li>
                  )}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      <div className="flex items-center justify-between gap-3">
        {step < 4 ? (
          <>
            <Button variant="outline" onClick={step === 1 ? onCancel : handleBack}>
              {step === 1 ? (
                'Cancel'
              ) : (
                <>
                  <ArrowLeft className="mr-2 h-4 w-4" /> Back
                </>
              )}
            </Button>

            {step < 3 ? (
              <Button onClick={handleNext} disabled={!canProceed()}>
                Next <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            ) : (
              <Button onClick={handleImport} disabled={isSubmitting || !canProceed()}>
                {isSubmitting ? (
                  'Importing...'
                ) : (
                  <>
                    <Upload className="mr-2 h-4 w-4" /> Import {selectedRows.size} Records
                  </>
                )}
              </Button>
            )}
          </>
        ) : (
          <Button onClick={onCancel} className="ml-auto">
            Done
          </Button>
        )}
      </div>
    </div>
  );
}
