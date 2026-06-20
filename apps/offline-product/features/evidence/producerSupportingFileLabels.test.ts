import { describe, expect, it } from 'vitest';

import {
  badgeKeyForProducerSupportingFile,
  isProducerAdditionalFile,
  PRODUCER_ADDITIONAL_FILE_LABEL,
} from './producerSupportingFileLabels';

describe('producerSupportingFileLabels', () => {
  it('treats additional_file labor evidence as additional', () => {
    const item = { kind: 'labor_evidence' as const, label: PRODUCER_ADDITIONAL_FILE_LABEL };
    expect(isProducerAdditionalFile(item)).toBe(true);
    expect(badgeKeyForProducerSupportingFile(item)).toBe('documents_badge_additional');
  });

  it('treats labor standards as labor badge', () => {
    const item = { kind: 'labor_evidence' as const, label: 'labor_standards' };
    expect(isProducerAdditionalFile(item)).toBe(false);
    expect(badgeKeyForProducerSupportingFile(item)).toBe('documents_badge_labor');
  });
});
