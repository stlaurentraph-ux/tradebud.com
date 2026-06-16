import { describe, expect, it } from 'vitest';
import { t } from './i18n';
import {
  formatReviewQueuePlotCount,
  formatReviewQueueRelativeAge,
  getMiniReviewQueueCopy,
  getReviewQueueActionLabel,
  getReviewQueueRiskLabel,
} from './workflow-labels';

describe('workflow-labels', () => {
  it('uses TRACES filing action for sealed importer queue items', () => {
    expect(getReviewQueueActionLabel('importer', 'SEALED')).toBe('Prepare TRACES filing');
    expect(getReviewQueueActionLabel('importer', 'ON_HOLD')).toBe('Resolve hold');
  });

  it('translates review queue copy via locale keys', () => {
    expect(getMiniReviewQueueCopy('importer', (key) => t(key, 'fr')).title).toBe(
      "File d'attente de révision",
    );
    expect(getReviewQueueRiskLabel('high', (key) => t(key, 'es'))).toBe('Riesgo alto');
  });

  it('formats relative age and plot counts with interpolation', () => {
    const daysAgo = formatReviewQueueRelativeAge('2000-01-01T00:00:00Z');
    expect(daysAgo).toMatch(/Updated \d+d ago/);
    expect(formatReviewQueuePlotCount(1)).toBe('1 plot');
    expect(formatReviewQueuePlotCount(3, (key) => t(key, 'fr'))).toBe('3 parcelles');
  });
});
