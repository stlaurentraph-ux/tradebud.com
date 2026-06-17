import { describe, expect, it } from 'vitest';
import { formatApiErrorBody } from './api-error-message';

describe('formatApiErrorBody', () => {
  it('prefers error string', () => {
    expect(formatApiErrorBody({ error: 'GEO-103: polygon required' }, 'fallback')).toBe(
      'GEO-103: polygon required',
    );
  });

  it('reads NestJS message string', () => {
    expect(formatApiErrorBody({ message: 'farmerId must be a UUID' }, 'fallback')).toBe(
      'farmerId must be a UUID',
    );
  });

  it('joins validation message arrays', () => {
    expect(
      formatApiErrorBody({ message: ['farmerId must be a UUID', 'clientPlotId should not be empty'] }, 'fallback'),
    ).toBe('farmerId must be a UUID clientPlotId should not be empty');
  });

  it('uses status hint when body is empty', () => {
    expect(formatApiErrorBody({}, 'Failed to create plot.', 403)).toBe(
      'You do not have permission to create this plot for the selected producer.',
    );
    expect(formatApiErrorBody({ message: 'Bad Request' }, 'Failed to create plot.', 400)).toBe(
      'The server rejected this plot. Check producer ID, coordinates, and area, or use Launch data request if details are missing.',
    );
  });
});
