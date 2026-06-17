export type PlotInventoryRisk = 'low' | 'medium' | 'high' | 'unknown';
export type PlotKind = 'point' | 'polygon' | 'unknown';
export type PlotComplianceStatus =
  | 'pending_check'
  | 'compliant'
  | 'under_review'
  | 'degradation_risk'
  | 'deforestation_detected'
  | 'unknown';

/** EUDR / Tracebud: polygon required at or above this declared area (see plot-geometry-policy). */
export const POLYGON_REQUIRED_MIN_AREA_HA = 4;

export interface PlotInventoryRow {
  id: string;
  name: string;
  farmer_id?: string;
  farmer_name?: string;
  area_hectares: number;
  kind: PlotKind;
  compliance_status: PlotComplianceStatus;
  deforestation_risk: PlotInventoryRisk;
  field_capture_label: string;
  evidence: unknown[];
  /** True only when a walked polygon boundary is on file and compliance is clear. */
  verified: boolean;
}

export function normalizePlotKind(value: unknown): PlotKind {
  if (value === 'point' || value === 'polygon') return value;
  return 'unknown';
}

export function normalizeComplianceStatus(value: unknown): PlotComplianceStatus {
  if (
    value === 'pending_check' ||
    value === 'compliant' ||
    value === 'under_review' ||
    value === 'degradation_risk' ||
    value === 'deforestation_detected'
  ) {
    return value;
  }
  return 'unknown';
}

/** Polygon plots use compliance status for risk bands; point plots stay conservative. */
export function deriveInventoryDeforestationRisk(
  kind: PlotKind,
  status: PlotComplianceStatus,
): PlotInventoryRisk {
  if (status === 'deforestation_detected') return 'high';
  if (status === 'degradation_risk' || status === 'under_review') return 'medium';
  if (kind === 'point') return 'unknown';
  if (status === 'compliant') return 'low';
  return 'unknown';
}

export function derivePlotFieldCaptureLabel(
  kind: PlotKind,
  status: PlotComplianceStatus,
  areaHectares = 0,
): string {
  if (kind === 'polygon') {
    return status === 'compliant' ? 'Mapped boundary' : 'Boundary pending review';
  }
  if (kind === 'point') {
    if (status === 'pending_check') return 'Pin location — screening pending';
    if (areaHectares > 0 && areaHectares < POLYGON_REQUIRED_MIN_AREA_HA) {
      return 'Pin location — sufficient for plots under 4 ha';
    }
    return 'Pin location — perimeter required for 4 ha or more';
  }
  return 'Capture status unknown';
}

export function isPlotFieldVerified(kind: PlotKind, status: PlotComplianceStatus): boolean {
  return kind === 'polygon' && status === 'compliant';
}

/** Geometry capture meets EUDR rules (polygon, or point when plot is under 4 ha). */
export function isPlotGeometryCaptureComplete(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'verified' | 'area_hectares'>,
): boolean {
  if (row.verified) return true;
  return (
    row.kind === 'point' &&
    row.compliance_status !== 'pending_check' &&
    row.area_hectares > 0 &&
    row.area_hectares < POLYGON_REQUIRED_MIN_AREA_HA
  );
}

/** @deprecated Use deriveInventoryDeforestationRisk for inventory rows. */
export function mapPlotStatusToRisk(status: string | null | undefined): PlotInventoryRisk {
  return deriveInventoryDeforestationRisk('unknown', normalizeComplianceStatus(status));
}

export function getPlotInventoryRiskDisplayLabel(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'deforestation_risk'>,
): string {
  if (row.kind === 'point') {
    if (row.compliance_status === 'deforestation_detected') return 'High risk (point screening)';
    if (row.compliance_status === 'degradation_risk' || row.compliance_status === 'under_review') {
      return 'Review needed (point screening)';
    }
    if (row.compliance_status === 'pending_check') return 'Screening pending';
    return 'Screened — point only';
  }

  switch (row.deforestation_risk) {
    case 'low':
      return 'Low risk';
    case 'medium':
      return 'Review needed';
    case 'high':
      return 'High risk';
    default:
      return 'Screening pending';
  }
}

export type PlotInventoryDisplayRisk = 'low' | 'medium' | 'high' | 'pending';

/** Short table label: Low | Medium | High | Pending */
export function resolvePlotInventoryDisplayRisk(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'deforestation_risk'>,
): PlotInventoryDisplayRisk {
  if (row.compliance_status === 'pending_check') return 'pending';
  if (row.compliance_status === 'deforestation_detected') return 'high';
  if (row.compliance_status === 'degradation_risk' || row.compliance_status === 'under_review') {
    return 'medium';
  }
  if (row.kind === 'point' && row.compliance_status === 'compliant') return 'low';
  if (row.deforestation_risk === 'low') return 'low';
  if (row.deforestation_risk === 'medium') return 'medium';
  if (row.deforestation_risk === 'high') return 'high';
  return 'pending';
}

export function getPlotInventoryRiskShortLabel(risk: PlotInventoryDisplayRisk): string {
  const labels: Record<PlotInventoryDisplayRisk, string> = {
    low: 'Low',
    medium: 'Medium',
    high: 'High',
    pending: 'Pending',
  };
  return labels[risk];
}

/** Hover detail: what was screened and what is still missing for plot compliance. */
export function getPlotInventoryRiskDetail(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'deforestation_risk' | 'area_hectares'>,
): string {
  if (row.compliance_status === 'pending_check') {
    return 'Deforestation screening has not finished yet.';
  }
  if (row.compliance_status === 'deforestation_detected') {
    return row.kind === 'point'
      ? 'Deforestation signal at registered coordinates.'
      : 'Deforestation signal on mapped boundary.';
  }
  if (row.compliance_status === 'degradation_risk') {
    return 'Degradation risk flagged — manual review required.';
  }
  if (row.compliance_status === 'under_review') {
    return 'Screening result under review.';
  }
  if (row.kind === 'point' && row.compliance_status === 'compliant') {
    if (row.area_hectares > 0 && row.area_hectares < POLYGON_REQUIRED_MIN_AREA_HA) {
      return 'Low risk from satellite screening around the pin. Point capture is allowed for plots under 4 ha.';
    }
    return 'Low risk from satellite check at the pin location. Plots of 4 ha or more need a walked perimeter.';
  }
  if (row.kind === 'polygon' && row.compliance_status === 'compliant') {
    return 'Low risk from satellite screening on mapped boundary.';
  }
  if (row.kind === 'polygon') {
    return 'Mapped boundary on file; screening outcome still pending or under review.';
  }
  return 'Screening status unknown.';
}

export type PlotInventoryFieldCaptureShort = 'mapped' | 'pin_ok' | 'pin' | 'review' | 'pending';

export function resolvePlotInventoryFieldCaptureShort(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'verified' | 'area_hectares'>,
): PlotInventoryFieldCaptureShort {
  if (row.verified) return 'mapped';
  if (isPlotGeometryCaptureComplete(row)) return 'pin_ok';
  if (row.kind === 'point') {
    return row.compliance_status === 'pending_check' ? 'pending' : 'pin';
  }
  if (row.kind === 'polygon') return 'review';
  return 'pending';
}

export function getPlotInventoryFieldCaptureShortLabel(short: PlotInventoryFieldCaptureShort): string {
  const labels: Record<PlotInventoryFieldCaptureShort, string> = {
    mapped: 'Mapped',
    pin_ok: 'Pin OK',
    pin: 'Pin only',
    review: 'Review',
    pending: 'Pending',
  };
  return labels[short];
}

/** Hover detail: field evidence on file and gaps before full compliance. */
export function getPlotInventoryFieldCaptureDetail(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'verified' | 'field_capture_label' | 'area_hectares'>,
): string {
  if (row.verified) {
    return 'Walked boundary on file. Field capture complete for compliance.';
  }
  if (isPlotGeometryCaptureComplete(row)) {
    return `Pin location on file (${row.area_hectares.toFixed(1)} ha). Under 4 ha, a point is enough — no perimeter walk required.`;
  }
  if (row.kind === 'point') {
    if (row.compliance_status === 'pending_check') {
      return 'Location pin saved. Screening still running.';
    }
    if (row.area_hectares >= POLYGON_REQUIRED_MIN_AREA_HA) {
      return `Declared ${row.area_hectares.toFixed(1)} ha — plots of 4 ha or more need a walked perimeter polygon, not just a pin.`;
    }
    return 'Location pin saved. Confirm declared area is under 4 ha, or walk the perimeter.';
  }
  if (row.kind === 'polygon') {
    return `${row.field_capture_label}. Boundary review or evidence still outstanding.`;
  }
  return row.field_capture_label;
}

export function isPlotInventoryActionNeeded(
  row: Pick<PlotInventoryRow, 'kind' | 'compliance_status' | 'deforestation_risk' | 'verified' | 'area_hectares'>,
): boolean {
  if (!isPlotGeometryCaptureComplete(row)) return true;
  const risk = resolvePlotInventoryDisplayRisk(row);
  return risk === 'medium' || risk === 'high' || risk === 'pending';
}

export function countPlotsNeedingAction(rows: PlotInventoryRow[]): number {
  return rows.filter(isPlotInventoryActionNeeded).length;
}

export interface PlotInventorySummary {
  total: number;
  needs_action: number;
  mapped: number;
  high_risk: number;
}

export function summarizePlotInventory(rows: PlotInventoryRow[]): PlotInventorySummary {
  return {
    total: rows.length,
    needs_action: countPlotsNeedingAction(rows),
    mapped: rows.filter((row) => isPlotGeometryCaptureComplete(row)).length,
    high_risk: rows.filter((row) => resolvePlotInventoryDisplayRisk(row) === 'high').length,
  };
}

export type PlotInventoryStatusTone = 'success' | 'warning' | 'danger' | 'neutral';

export interface PlotInventoryStatusChip {
  label: string;
  title: string;
  tone: PlotInventoryStatusTone;
}

/** Compact table chip: one line in the UI, full context on hover. */
export function getPlotInventoryStatusChip(
  row: Pick<
    PlotInventoryRow,
    'kind' | 'compliance_status' | 'deforestation_risk' | 'field_capture_label'
  >,
): PlotInventoryStatusChip {
  const screening = getPlotInventoryRiskDisplayLabel(row);
  const capture = row.field_capture_label;
  const title = `${capture}. ${screening}.`;

  if (row.compliance_status === 'deforestation_detected') {
    return { label: 'High risk', title, tone: 'danger' };
  }
  if (row.compliance_status === 'degradation_risk' || row.compliance_status === 'under_review') {
    return { label: 'Review needed', title, tone: 'warning' };
  }
  if (row.kind === 'point') {
    if (row.compliance_status === 'pending_check') {
      return { label: 'Coords · pending', title, tone: 'neutral' };
    }
    return { label: 'Coords only', title, tone: 'warning' };
  }
  if (row.kind === 'polygon' && row.compliance_status === 'compliant') {
    return { label: 'Mapped · clear', title, tone: 'success' };
  }
  if (row.kind === 'polygon') {
    return { label: 'Mapped · review', title, tone: 'warning' };
  }
  return { label: 'Pending', title, tone: 'neutral' };
}

export function mapTenantPlotToInventoryRow(plot: Record<string, unknown>): PlotInventoryRow | null {
  const id = typeof plot.id === 'string' ? plot.id : '';
  if (!id) return null;

  const kind = normalizePlotKind(plot.kind);
  const compliance_status = normalizeComplianceStatus(plot.status);
  const areaRaw = plot.area_ha ?? plot.declared_area_ha;
  const area =
    typeof areaRaw === 'number'
      ? areaRaw
      : typeof areaRaw === 'string'
        ? Number(areaRaw)
        : 0;

  const deforestation_risk = deriveInventoryDeforestationRisk(kind, compliance_status);
  const verified = isPlotFieldVerified(kind, compliance_status);

  const row: PlotInventoryRow = {
    id,
    name:
      typeof plot.name === 'string' && plot.name.trim()
        ? plot.name.trim()
        : `Plot ${id.slice(0, 8)}`,
    farmer_id: typeof plot.farmer_id === 'string' ? plot.farmer_id : undefined,
    farmer_name:
      typeof plot.farmer_name === 'string' && plot.farmer_name.trim()
        ? plot.farmer_name.trim()
        : undefined,
    area_hectares: Number.isFinite(area) ? area : 0,
    kind,
    compliance_status,
    deforestation_risk,
    field_capture_label: derivePlotFieldCaptureLabel(kind, compliance_status, Number.isFinite(area) ? area : 0),
    evidence: [],
    verified,
  };

  return row;
}

export function normalizePlotInventoryPayload(payload: unknown): PlotInventoryRow[] {
  const rows = Array.isArray(payload) ? payload : [];
  const plots: PlotInventoryRow[] = [];
  for (const row of rows) {
    if (!row || typeof row !== 'object') continue;
    const mapped = mapTenantPlotToInventoryRow(row as Record<string, unknown>);
    if (mapped) plots.push(mapped);
  }
  return plots;
}
