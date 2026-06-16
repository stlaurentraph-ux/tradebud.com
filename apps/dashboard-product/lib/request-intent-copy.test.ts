import { describe, expect, it } from 'vitest';
import { getRequestIntentCopy } from '@/lib/request-intent-copy';
import { getAuthCopy } from '@/lib/workflow-terminology-labels';

describe('request-intent-copy', () => {
  it('returns English fallbacks', () => {
    expect(getRequestIntentCopy('loading_title')).toBe('Saving your response');
  });
});

describe('auth confirm copy', () => {
  it('returns confirm flow fallbacks', () => {
    expect(getAuthCopy('confirm_loading_title')).toBe('Confirming your email');
    expect(getAuthCopy('confirm_link_invalid')).toContain('invalid or has expired');
  });
});
