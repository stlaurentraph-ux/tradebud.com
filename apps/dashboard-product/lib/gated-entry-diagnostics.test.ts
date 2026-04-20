import { describe, expect, it } from 'vitest';
import { buildTelemetryCsv, DIAGNOSTICS_PRESETS } from './gated-entry-diagnostics';

describe('gated-entry diagnostics helpers', () => {
  it('defines stable saved presets for operator workflows', () => {
    expect(DIAGNOSTICS_PRESETS.map((preset) => preset.id)).toEqual([
      'latest_blocks',
      'weekly_volume',
      'campaign_focus',
      'reporting_focus',
    ]);
  });

  it('builds csv with escaped cells for current telemetry page', () => {
    const csv = buildTelemetryCsv([
      {
        id: 'evt_1',
        timestamp: '2026-04-15T12:00:00.000Z',
        event_type: 'dashboard_gated_entry_attempt',
        payload: {
          tenantId: 'tenant_1',
          gate: 'request_campaigns',
          role: 'buyer',
          feature: 'mvp_gated',
          redirectedPath: '/reports,annual',
        },
      },
      {
        id: 'evt_2',
        timestamp: '2026-04-15T13:30:00.000Z',
        event_type: 'dashboard_gated_entry_attempt',
        payload: {
          tenantId: 'tenant_1',
          gate: 'annual_reporting',
          role: 'reviewer',
          feature: 'mvp_gated',
          redirectedPath: '/reports/"annual"',
        },
      },
    ]);

    expect(csv).toContain('captured_at,gate,role,feature,redirected_path');
    expect(csv).toContain('"\/reports,annual"');
    expect(csv).toContain('"/reports/""annual"""');
  });
});
