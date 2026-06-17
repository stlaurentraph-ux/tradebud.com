import { describe, expect, it } from 'vitest';
import {
  getPlotsCreateDialogIntro,
  getPlotsEmptyGuidanceMessage,
  getPlotsGuidanceRecommendedBody,
  getPlotCreateCopyManifest,
} from './plot-create-copy';

describe('plot-create-copy', () => {
  it('registers manifest keys', () => {
    expect(Object.keys(getPlotCreateCopyManifest()).length).toBeGreaterThanOrEqual(8);
  });

  it('explains automatic sync for exporters', () => {
    expect(getPlotsGuidanceRecommendedBody('exporter')).toContain('appear here automatically');
    expect(getPlotsEmptyGuidanceMessage('exporter')).toContain('grant access');
  });

  it('uses member language for cooperatives', () => {
    expect(getPlotsCreateDialogIntro('cooperative')).toContain('member');
    expect(getPlotsGuidanceRecommendedBody('cooperative')).toContain('members');
  });
});
