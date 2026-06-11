import {
  cadastralKeysMatch,
  normalizeCadastralKey,
} from './cadastral-cross-check';
import { normalizeCadastralKeyForCountry } from './cadastral-country-packs';

describe('cadastral-country-packs', () => {
  it('normalizes Honduras clave', () => {
    expect(normalizeCadastralKeyForCountry('0123456789', 'HN')).toBe('012-345-678-9');
  });

  it('normalizes Guatemala matricula', () => {
    expect(normalizeCadastralKeyForCountry('1234567890', 'GT')).toBe('123-456-7890');
  });

  it('matches keys across formatting for Colombia', () => {
    expect(cadastralKeysMatch('123456789012345', '123456789012345', 'CO')).toBe(true);
  });

  it('falls back to generic normalization for unknown countries', () => {
    expect(normalizeCadastralKey('ABC-12345678', 'XX')).toBe('12345678');
  });
});
