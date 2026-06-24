export type BulkPlotImportGeoJsonGeometry =
  | { type: 'Point'; coordinates: [number, number] }
  | { type: 'Polygon'; coordinates: [number, number][][] };

export type BulkPlotImportInputRow = {
  rowIndex?: number;
  producerFullName?: string;
  producerEmail?: string;
  producerPhone?: string | null;
  producerCountry?: string | null;
  producerContactId?: string | null;
  plotName?: string | null;
  clientPlotId: string;
  latitude?: number | string | null;
  longitude?: number | string | null;
  declaredAreaHa?: number | string | null;
  cadastralKey?: string | null;
  countryCode?: string | null;
  geometry?: BulkPlotImportGeoJsonGeometry | null;
};

export type BulkPlotImportPreviewStatus = 'READY' | 'VALIDATION_FAILED';

export type BulkPlotImportExecuteStatus =
  | 'IMPORTED'
  | 'DUPLICATE_SKIPPED'
  | 'VALIDATION_FAILED'
  | 'FAILED';

export type BulkPlotImportRowPreview = {
  rowIndex: number;
  clientPlotId: string;
  producerLabel: string;
  status: BulkPlotImportPreviewStatus;
  geometryKind: 'point' | 'polygon' | null;
  declaredAreaHa: number | null;
  message?: string;
};

export type BulkPlotImportRowResult = {
  rowIndex: number;
  clientPlotId: string;
  producerLabel: string;
  status: BulkPlotImportExecuteStatus;
  plotId?: string;
  producerContactId?: string;
  message?: string;
};

export type BulkPlotImportPreviewResponse = {
  totalRows: number;
  readyCount: number;
  failedCount: number;
  rows: BulkPlotImportRowPreview[];
};

export type BulkPlotImportExecuteResponse = {
  totalRows: number;
  importedCount: number;
  duplicateSkippedCount: number;
  failedCount: number;
  rows: BulkPlotImportRowResult[];
};

export const BULK_PLOT_IMPORT_MAX_ROWS = 500;

export const BULK_PLOT_POINT_MAX_AREA_HA = 4;
