import { describe, expect, it } from 'vitest';

import { classifyTenureParseError } from './tenureParseFailure';

describe('classifyTenureParseError', () => {
  it('treats storage and LLM failures as service issues, not bad photos', () => {
    expect(classifyTenureParseError('Could not download tenure evidence file.')).toBe('service');
    expect(classifyTenureParseError('LLM tenure parse failed (502): bad gateway')).toBe('service');
    expect(classifyTenureParseError('LLM tenure parse returned invalid JSON.')).toBe('service');
  });

  it('keeps OCR failures as photo issues', () => {
    expect(classifyTenureParseError('OCR could not read document')).toBe('photo');
    expect(classifyTenureParseError('unreadable')).toBe('photo');
  });
});
