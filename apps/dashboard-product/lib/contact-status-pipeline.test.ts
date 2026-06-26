import { describe, expect, it } from 'vitest';

import {
  CONTACT_PIPELINE_STATUSES,
  getContactPipelineStepIndex,
  isContactPipelineStatus,
  isContactPipelineStepComplete,
  isContactPipelineStepCurrent,
} from './contact-status-pipeline';

describe('contact-status-pipeline', () => {
  it('tracks funnel step order', () => {
    expect(CONTACT_PIPELINE_STATUSES).toEqual(['new', 'invited', 'engaged', 'submitted']);
    expect(getContactPipelineStepIndex('engaged')).toBe(2);
    expect(getContactPipelineStepIndex('submitted')).toBe(3);
  });

  it('marks earlier steps complete for submitted contacts', () => {
    expect(isContactPipelineStepComplete('submitted', 'engaged')).toBe(true);
    expect(isContactPipelineStepComplete('submitted', 'invited')).toBe(true);
    expect(isContactPipelineStepCurrent('submitted', 'submitted')).toBe(true);
    expect(isContactPipelineStepComplete('engaged', 'submitted')).toBe(false);
  });

  it('excludes terminal directory states from the funnel', () => {
    expect(isContactPipelineStatus('blocked')).toBe(false);
    expect(isContactPipelineStatus('inactive')).toBe(false);
    expect(getContactPipelineStepIndex('blocked')).toBe(-1);
  });
});
