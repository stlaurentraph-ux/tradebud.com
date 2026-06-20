import { describe, expect, it } from 'vitest';

import { appendLandDocsReminderToSyncCompleteMessage } from './landDocUploadReminderMessage';

const t = (key: string, params?: Record<string, string | number>) =>
  params ? `${key}:${JSON.stringify(params)}` : key;

describe('appendLandDocsReminderToSyncCompleteMessage', () => {
  it('appends a reminder when land papers are still local-only', () => {
    expect(
      appendLandDocsReminderToSyncCompleteMessage('Backup complete', ['Plot 1'], t),
    ).toContain('Backup complete');
    expect(
      appendLandDocsReminderToSyncCompleteMessage('Backup complete', ['Plot 1'], t),
    ).toContain('sync_result_land_docs_on_phone');
  });

  it('returns the base message when no plots need upload', () => {
    expect(
      appendLandDocsReminderToSyncCompleteMessage('Backup complete', [], t),
    ).toBe('Backup complete');
  });
});
