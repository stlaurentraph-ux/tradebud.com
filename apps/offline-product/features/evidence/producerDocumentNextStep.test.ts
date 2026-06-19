import { describe, expect, it } from 'vitest';

import { computePlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import { resolveProducerDocumentsNextStep } from './producerDocumentNextStep';

const completeFarmer = {
  id: 'f1',
  role: 'farmer' as const,
  selfDeclared: true,
  fpicConsent: true,
  laborNoChildLabor: true,
  laborNoForcedLabor: true,
};

describe('resolveProducerDocumentsNextStep', () => {
  it('prioritizes attestations before plot land papers', () => {
    const step = resolveProducerDocumentsNextStep({
      farmer: { id: 'f1', role: 'farmer', selfDeclared: true },
      profileDocCount: 0,
      plots: [{ id: 'p1', name: 'North' }],
      plotReadiness: [
        {
          plotId: 'p1',
          done: false,
          photoCount: 0,
          titlePhotoCount: 0,
          evidenceCount: 0,
          checklist: computePlotReadinessChecklist({
            titlePhotoCount: 0,
            evidenceKinds: [],
            isSyncedToServer: false,
            backendFlags: null,
          }),
        },
      ],
    });
    expect(step.kind).toBe('attestations');
  });

  it('routes to plot land papers when attestations are complete', () => {
    const step = resolveProducerDocumentsNextStep({
      farmer: completeFarmer,
      profileDocCount: 1,
      plots: [{ id: 'p1', name: 'North' }],
      plotReadiness: [
        {
          plotId: 'p1',
          done: false,
          photoCount: 0,
          titlePhotoCount: 0,
          evidenceCount: 0,
          checklist: computePlotReadinessChecklist({
            titlePhotoCount: 0,
            evidenceKinds: [],
            isSyncedToServer: false,
            backendFlags: null,
          }),
        },
      ],
    });
    expect(step).toEqual({
      kind: 'plot_land',
      plotId: 'p1',
      plotCount: 1,
    });
  });

  it('keeps plot land hero while uploads exist but AI has not cleared', () => {
    const step = resolveProducerDocumentsNextStep({
      farmer: completeFarmer,
      profileDocCount: 1,
      plots: [
        { id: 'p1', name: 'North' },
        { id: 'p2', name: 'South' },
        { id: 'p3', name: 'East' },
      ],
      plotReadiness: [
        {
          plotId: 'p1',
          done: false,
          photoCount: 0,
          titlePhotoCount: 1,
          evidenceCount: 0,
          checklist: computePlotReadinessChecklist({
            titlePhotoCount: 1,
            evidenceKinds: [],
            isSyncedToServer: true,
            backendFlags: null,
            tenureVerifications: [{ parse_status: 'PENDING' } as never],
          }),
        },
        {
          plotId: 'p2',
          done: false,
          photoCount: 0,
          titlePhotoCount: 1,
          evidenceCount: 0,
          checklist: computePlotReadinessChecklist({
            titlePhotoCount: 1,
            evidenceKinds: [],
            isSyncedToServer: true,
            backendFlags: null,
            tenureVerifications: [{ parse_status: 'PENDING' } as never],
          }),
        },
        {
          plotId: 'p3',
          done: false,
          photoCount: 0,
          titlePhotoCount: 1,
          evidenceCount: 0,
          checklist: computePlotReadinessChecklist({
            titlePhotoCount: 1,
            evidenceKinds: [],
            isSyncedToServer: true,
            backendFlags: null,
            tenureVerifications: [{ parse_status: 'PENDING' } as never],
          }),
        },
      ],
    });
    expect(step).toEqual({
      kind: 'plot_land',
      plotId: 'p3',
      plotCount: 3,
    });
  });
});
