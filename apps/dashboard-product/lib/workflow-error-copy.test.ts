import { describe, expect, it } from 'vitest';
import { getWorkflowErrorCopy, resolveWorkflowErrorMessage } from '@/lib/workflow-error-copy';

describe('workflow-error-copy', () => {
  it('returns localized fallbacks', () => {
    expect(getWorkflowErrorCopy('inbox_fulfillment_submit')).toBe('Failed to submit fulfillment.');
  });

  it('prefers API error messages when present', () => {
    expect(resolveWorkflowErrorMessage(new Error('Server rejected'), 'inbox_fulfillment_submit')).toBe(
      'Server rejected',
    );
  });

  it('uses fallback for non-error values', () => {
    expect(resolveWorkflowErrorMessage(null, 'billing_upgrade_failed')).toBe('Upgrade failed.');
  });
});
