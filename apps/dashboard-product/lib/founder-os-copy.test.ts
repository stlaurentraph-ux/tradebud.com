import { describe, expect, it } from 'vitest';
import { getFounderOsCopy } from '@/lib/founder-os-copy';

describe('founder-os-copy', () => {
  it('returns English fallbacks', () => {
    expect(getFounderOsCopy('page_title')).toBe('Today');
    expect(getFounderOsCopy('outreach_streak', undefined, { count: 3 })).toBe('Outreach streak: 3 weekday(s)');
  });
});
