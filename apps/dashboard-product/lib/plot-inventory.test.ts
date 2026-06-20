import { describe, expect, it } from 'vitest';
import {
  deriveInventoryDeforestationRisk,
  derivePlotFieldCaptureLabel,
  getPlotInventoryFieldCaptureDetail,
  getPlotInventoryFieldCaptureShortLabel,
  getPlotInventoryRiskDetail,
  getPlotInventoryRiskShortLabel,
  isPlotFieldVerified,
  isPlotInventoryActionNeeded,
  normalizePlotInventoryPayload,
  resolvePlotInventoryDisplayRisk,
  resolvePlotInventoryFieldCaptureShort,
  summarizePlotInventory,
} from '@/lib/plot-inventory';

describe('plot-inventory', () => {
  it('does not treat compliant point plots as low risk or field-verified', () => {
    expect(deriveInventoryDeforestationRisk('point', 'deforestation_clear')).toBe('unknown');
    expect(isPlotFieldVerified('point', 'deforestation_clear')).toBe(false);
    expect(derivePlotFieldCaptureLabel('point', 'deforestation_clear', 2.5)).toContain('under 4 ha');
  });

  it('treats compliant polygon plots as low risk and mapped', () => {
    expect(deriveInventoryDeforestationRisk('polygon', 'deforestation_clear')).toBe('low');
    expect(isPlotFieldVerified('polygon', 'deforestation_clear')).toBe(true);
    expect(derivePlotFieldCaptureLabel('polygon', 'deforestation_clear')).toBe('Mapped boundary');
  });

  it('treats sub-4ha point plots as geometry-complete without a perimeter', () => {
    const rows = normalizePlotInventoryPayload([
      { id: 'plot-1', kind: 'point', status: 'deforestation_clear', area_ha: 2.5 },
      { id: 'plot-2', kind: 'point', status: 'deforestation_clear', declared_area_ha: 3.2 },
    ]);
    expect(summarizePlotInventory(rows)).toEqual({
      total: 2,
      needs_action: 0,
      mapped: 2,
      high_risk: 0,
    });
    expect(resolvePlotInventoryFieldCaptureShort(rows[0]!)).toBe('pin_ok');
    expect(getPlotInventoryFieldCaptureShortLabel('pin_ok')).toBe('Pin OK');
  });

  it('still flags point plots at 4 ha or above as needing a perimeter', () => {
    const row = normalizePlotInventoryPayload([
      { id: 'plot-big', kind: 'point', status: 'deforestation_clear', area_ha: 4.5 },
    ])[0]!;
    expect(isPlotInventoryActionNeeded(row)).toBe(true);
    expect(resolvePlotInventoryFieldCaptureShort(row)).toBe('pin');
  });

  it('shows short risk and field labels with assessment detail for point plots', () => {
    const row = {
      kind: 'point' as const,
      compliance_status: 'deforestation_clear' as const,
      deforestation_risk: 'unknown' as const,
      verified: false,
      area_hectares: 2.5,
      field_capture_label: 'Pin location — sufficient for plots under 4 ha',
    };

    expect(resolvePlotInventoryDisplayRisk(row)).toBe('low');
    expect(getPlotInventoryRiskShortLabel('low')).toBe('Low');
    expect(getPlotInventoryRiskDetail(row)).toContain('under 4 ha');
    expect(resolvePlotInventoryFieldCaptureShort(row)).toBe('pin_ok');
    expect(getPlotInventoryFieldCaptureDetail(row)).toContain('no perimeter walk required');
  });

  it('normalizes tenant plot rows with producer name', () => {
    const rows = normalizePlotInventoryPayload([
      {
        id: 'plot-1',
        name: 'Demo Plot 1',
        farmer_id: 'farmer-1',
        farmer_name: 'Maria Lopez',
        kind: 'point',
        area_ha: 2.5,
        status: 'deforestation_clear',
      },
    ]);

    expect(rows).toEqual([
      expect.objectContaining({
        id: 'plot-1',
        name: 'Demo Plot 1',
        farmer_id: 'farmer-1',
        farmer_name: 'Maria Lopez',
        area_hectares: 2.5,
        kind: 'point',
        compliance_status: 'deforestation_clear',
        deforestation_risk: 'unknown',
        verified: false,
        field_capture_label: 'Pin location — sufficient for plots under 4 ha',
      }),
    ]);
  });
});
