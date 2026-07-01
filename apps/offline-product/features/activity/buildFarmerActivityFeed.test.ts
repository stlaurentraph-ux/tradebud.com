import { describe, expect, it } from 'vitest';

import type { PlotReadinessLoadResult } from '@/features/compliance/loadPlotReadiness';
import { createTranslator } from '@/features/i18n/translate';
import type { Plot } from '@/features/state/AppStateContext';

import { buildFarmerActivityFeed, countActivityActions } from './buildFarmerActivityFeed';

const t = createTranslator('en');

function basePlot(overrides: Partial<Plot> = {}): Plot {
  return {
    id: 'plot-1',
    farmerId: 'farmer-1',
    name: 'Finca Norte',
    areaHectares: 2,
    areaSquareMeters: 20_000,
    kind: 'polygon',
    points: [
      { latitude: 14.1, longitude: -87.2 },
      { latitude: 14.11, longitude: -87.21 },
      { latitude: 14.12, longitude: -87.19 },
    ],
    createdAt: Date.parse('2026-06-20T10:00:00.000Z'),
    ...overrides,
  };
}

function readiness(overrides: Partial<PlotReadinessLoadResult> = {}): PlotReadinessLoadResult {
  return {
    plotId: 'plot-1',
    done: false,
    photoCount: 0,
    titlePhotoCount: 0,
    evidenceCount: 0,
    checklist: {
      groundOk: true,
      landOk: false,
      tenureParseGate: 'not_applicable',
      needsFpic: false,
      needsPermit: false,
      fpicOk: true,
      permitOk: true,
      syncOk: false,
      done: false,
    },
    ...overrides,
  };
}

describe('buildFarmerActivityFeed', () => {
  it('returns empty feed when signed out', () => {
    expect(
      buildFarmerActivityFeed({
        plots: [basePlot()],
        backendPlots: [],
        plotServerLinks: {},
        readinessByPlotId: new Map(),
        pendingConsentGrants: [],
        syncPendingCount: 0,
        isSignedIn: false,
        t,
      }),
    ).toEqual([]);
  });

  it('prompts sync when plot is not on server', () => {
    const items = buildFarmerActivityFeed({
      plots: [basePlot()],
      backendPlots: [],
      plotServerLinks: {},
      readinessByPlotId: new Map([['plot-1', readiness()]]),
      pendingConsentGrants: [],
      syncPendingCount: 0,
      isSignedIn: true,
      t,
    });
    expect(items.some((item) => item.id === 'deforestation:pending-sync:plot-1')).toBe(true);
    expect(items.find((item) => item.id === 'deforestation:pending-sync:plot-1')?.severity).toBe(
      'action',
    );
  });

  it('shows deforestation passed as info when server plot is clear', () => {
    const items = buildFarmerActivityFeed({
      plots: [basePlot()],
      backendPlots: [
        {
          id: 'server-1',
          name: 'Finca Norte',
          status: 'deforestation_clear',
          deforestation_screening: { screenedAt: '2026-06-23T12:00:00.000Z', signalTier: 'green' },
        },
      ],
      plotServerLinks: { 'plot-1': 'server-1' },
      readinessByPlotId: new Map([['plot-1', readiness()]]),
      pendingConsentGrants: [],
      syncPendingCount: 0,
      isSignedIn: true,
      t,
    });
    const passed = items.find((item) => item.id === 'deforestation:passed:plot-1');
    expect(passed?.severity).toBe('info');
    expect(passed?.titleKey).toBe('activity_deforestation_passed');
  });

  it('includes pending consent requests', () => {
    const items = buildFarmerActivityFeed({
      plots: [],
      backendPlots: [],
      plotServerLinks: {},
      readinessByPlotId: new Map(),
      pendingConsentGrants: [
        {
          id: 'grant-1',
          farmer_id: 'farmer-1',
          grantee_tenant_id: 'tenant-co-op',
          grantee_org_name: 'Co-op X',
          purpose_code: 'due_diligence',
          data_scope: ['plots'],
          status: 'pending',
          consent_mechanism: null,
          granted_at: null,
          revoked_at: null,
          revocation_reason: null,
          created_at: '2026-06-22T08:00:00.000Z',
          updated_at: '2026-06-22T08:00:00.000Z',
        },
      ],
      syncPendingCount: 0,
      isSignedIn: true,
      t,
    });
    expect(items.some((item) => item.id === 'consent:grant-1')).toBe(true);
  });

  it('sorts action items before info items', () => {
    const items = buildFarmerActivityFeed({
      plots: [basePlot()],
      backendPlots: [
        {
          id: 'server-1',
          name: 'Finca Norte',
          status: 'deforestation_clear',
          deforestation_screening: { screenedAt: '2026-06-23T12:00:00.000Z' },
        },
      ],
      plotServerLinks: { 'plot-1': 'server-1' },
      readinessByPlotId: new Map([
        [
          'plot-1',
          readiness({
            checklist: {
              groundOk: false,
              landOk: false,
              tenureParseGate: 'blocked',
              needsFpic: false,
              needsPermit: false,
              fpicOk: true,
              permitOk: true,
              syncOk: true,
              done: false,
            },
            titlePhotoCount: 1,
          }),
        ],
      ]),
      pendingConsentGrants: [],
      syncPendingCount: 0,
      isSignedIn: true,
      t,
    });
    const firstActionIndex = items.findIndex((item) => item.severity === 'action');
    const firstInfoIndex = items.findIndex((item) => item.severity === 'info');
    expect(firstActionIndex).toBeGreaterThanOrEqual(0);
    expect(firstInfoIndex).toBeGreaterThan(firstActionIndex);
  });
});

describe('countActivityActions', () => {
  it('counts only action severity rows', () => {
    expect(
      countActivityActions([
        {
          id: 'a',
          category: 'consent',
          severity: 'action',
          titleKey: 'x',
          occurredAt: null,
          navigate: { screen: 'data-sharing' },
        },
        {
          id: 'b',
          category: 'deforestation',
          severity: 'info',
          titleKey: 'y',
          occurredAt: null,
          navigate: { screen: 'plot', plotId: 'p1' },
        },
      ]),
    ).toBe(1);
  });
});
