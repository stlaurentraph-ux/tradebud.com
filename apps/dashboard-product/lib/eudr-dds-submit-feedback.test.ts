import { describe, expect, it } from 'vitest';
import { buildEudrDdsSubmitSuccessMessage } from './eudr-dds-submit-feedback';

describe('buildEudrDdsSubmitSuccessMessage', () => {
  it('returns standard submit success message when not replayed', () => {
    expect(buildEudrDdsSubmitSuccessMessage({ statusCode: 200, replayed: false })).toBe(
      'EUDR DDS submitted (status 200).',
    );
  });

  it('returns replay-aware success message when replayed', () => {
    expect(buildEudrDdsSubmitSuccessMessage({ statusCode: 409, replayed: true })).toBe(
      'EUDR DDS replay acknowledged (status 409). No duplicate side effects created.',
    );
  });

  it('defaults to status 200 when status code is missing', () => {
    expect(buildEudrDdsSubmitSuccessMessage({ replayed: false })).toBe('EUDR DDS submitted (status 200).');
  });
});
