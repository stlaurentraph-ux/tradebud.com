import { describe, expect, it } from 'vitest';
import { SYNC_QUEUE_PHASES } from './fieldStateTransitionRegistry';

describe('fieldStateTransitionRegistry', () => {
  it('includes restore and upload phases', () => {
    expect(SYNC_QUEUE_PHASES).toContain('restoring_plots');
    expect(SYNC_QUEUE_PHASES).toContain('uploading_plots');
    expect(SYNC_QUEUE_PHASES).toContain('processing_queue');
  });
});
