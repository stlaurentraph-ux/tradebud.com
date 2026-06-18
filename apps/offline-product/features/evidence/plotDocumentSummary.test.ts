import { describe, expect, it } from 'vitest';

import { computePlotReadinessChecklist } from '@/features/compliance/plotChecklist';
import {
  countPlotsNeedingLandDocuments,
  formatPlotDocumentsNavSubtitle,
  summarizePlotDocumentsForOverview,
} from './plotDocumentSummary';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('summarizePlotDocumentsForOverview', () => {
  it('flags missing land papers first', () => {
    const checklist = computePlotReadinessChecklist({
      titlePhotoCount: 0,
      evidenceKinds: [],
      isSyncedToServer: true,
      backendFlags: null,
    });
    const status = summarizePlotDocumentsForOverview(checklist, { titlePhotos: 0, evidenceCount: 0 });
    expect(status.chipKey).toBe('documents_plot_chip_land_missing');
    expect(status.priority).toBe(10);
  });

  it('shows backup pending when local docs exist but plot is not synced', () => {
    const checklist = computePlotReadinessChecklist({
      titlePhotoCount: 1,
      evidenceKinds: ['tenure_evidence'],
      isSyncedToServer: false,
      backendFlags: null,
    });
    const status = summarizePlotDocumentsForOverview(checklist, { titlePhotos: 1, evidenceCount: 1 });
    expect(status.chipKey).toBe('documents_plot_chip_backup_pending');
    expect(status.chipParams).toEqual({ n: 2 });
  });
});

describe('formatPlotDocumentsNavSubtitle', () => {
  it('mentions permit when required', () => {
    const checklist = computePlotReadinessChecklist({
      titlePhotoCount: 1,
      evidenceKinds: ['tenure_evidence'],
      isSyncedToServer: true,
      backendFlags: { sinaph_overlap: true },
    });
    const subtitle = formatPlotDocumentsNavSubtitle(
      checklist,
      { titlePhotos: 1, evidenceCount: 0 },
      t,
    );
    expect(subtitle).toBe('plot_nav_documents_sub_permit');
  });
});

describe('countPlotsNeedingLandDocuments', () => {
  it('counts plots without land documents', () => {
    const ready = computePlotReadinessChecklist({
      titlePhotoCount: 1,
      evidenceKinds: [],
      isSyncedToServer: true,
      backendFlags: null,
    });
    const missing = computePlotReadinessChecklist({
      titlePhotoCount: 0,
      evidenceKinds: [],
      isSyncedToServer: true,
      backendFlags: null,
    });
    expect(countPlotsNeedingLandDocuments([{ checklist: ready }, { checklist: missing }])).toBe(1);
  });
});
