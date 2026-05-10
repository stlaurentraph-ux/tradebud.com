/**
 * Test suite for input validators.
 * Tests validation logic for critical fields.
 */

import { describe, it, expect } from '@jest/globals';
import {
  validateHarvestKg,
  validateLatitude,
  validateLongitude,
  validateGpsCoordinates,
  validatePostalAddress,
  validateEmail,
  validateCommodityCode,
  validatePlotAreaHa,
  validateConsent,
  validateRequired,
} from '../validation/validators';

describe('Input Validators', () => {
  describe('validateHarvestKg', () => {
    it('accepts valid positive harvest weights', () => {
      expect(validateHarvestKg(100)).toEqual({ ok: true, value: 100 });
      expect(validateHarvestKg('50.5')).toEqual({ ok: true, value: 50.5 });
      expect(validateHarvestKg(0.01)).toEqual({ ok: true, value: 0.01 });
    });

    it('rejects zero and negative values', () => {
      const result = validateHarvestKg(0);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('greater than 0');

      const negResult = validateHarvestKg(-50);
      expect(negResult.ok).toBe(false);
    });

    it('rejects values exceeding maximum', () => {
      const result = validateHarvestKg(1_000_001);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('exceeds maximum');
    });

    it('rejects non-numeric input', () => {
      const result = validateHarvestKg('abc');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('valid number');
    });

    it('rounds to 2 decimal places', () => {
      const result = validateHarvestKg(99.9999);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(100);
      }
    });
  });

  describe('validateGpsCoordinates', () => {
    it('accepts valid GPS coordinates', () => {
      const result = validateGpsCoordinates(-10.5, -50.25);
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toEqual({ latitude: -10.5, longitude: -50.25 });
      }
    });

    it('rejects out-of-range latitudes', () => {
      const result = validateGpsCoordinates(91, -50);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Latitude');
    });

    it('rejects out-of-range longitudes', () => {
      const result = validateGpsCoordinates(0, 181);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('Longitude');
    });

    it('rejects non-numeric input', () => {
      const result = validateGpsCoordinates('abc', '-50');
      expect(result.ok).toBe(false);
    });
  });

  describe('validatePostalAddress', () => {
    it('accepts valid addresses', () => {
      const result = validatePostalAddress('123 Main St, City, Country');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('123 Main St, City, Country');
      }
    });

    it('rejects addresses that are too short', () => {
      const result = validatePostalAddress('Main');
      expect(result.ok).toBe(false);
      expect(result.error).toContain('at least 5');
    });

    it('rejects addresses that exceed max length', () => {
      const longAddr = 'a'.repeat(501);
      const result = validatePostalAddress(longAddr);
      expect(result.ok).toBe(false);
      expect(result.error).toContain('not exceed 500');
    });

    it('trims whitespace', () => {
      const result = validatePostalAddress('  123 Main St  ');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('123 Main St');
      }
    });
  });

  describe('validateEmail', () => {
    it('accepts valid email formats', () => {
      expect(validateEmail('test@example.com').ok).toBe(true);
      expect(validateEmail('user+tag@domain.co.uk').ok).toBe(true);
    });

    it('rejects invalid email formats', () => {
      expect(validateEmail('notanemail').ok).toBe(false);
      expect(validateEmail('@example.com').ok).toBe(false);
      expect(validateEmail('user@').ok).toBe(false);
    });
  });

  describe('validateCommodityCode', () => {
    it('accepts valid commodity codes', () => {
      expect(validateCommodityCode('070111').ok).toBe(true);
      expect(validateCommodityCode('A00001').ok).toBe(true);
    });

    it('rejects invalid formats', () => {
      expect(validateCommodityCode('ABC').ok).toBe(false); // too short
      expect(validateCommodityCode('A_1001').ok).toBe(false); // invalid character
    });
  });

  describe('validatePlotAreaHa', () => {
    it('accepts valid plot areas', () => {
      expect(validatePlotAreaHa(2.5).ok).toBe(true);
      expect(validatePlotAreaHa(100).ok).toBe(true);
    });

    it('rejects zero and negative values', () => {
      expect(validatePlotAreaHa(0).ok).toBe(false);
      expect(validatePlotAreaHa(-5).ok).toBe(false);
    });

    it('rejects values exceeding maximum', () => {
      expect(validatePlotAreaHa(10_001).ok).toBe(false);
    });
  });

  describe('validateConsent', () => {
    it('accepts true consent', () => {
      expect(validateConsent(true)).toEqual({ ok: true, value: true });
    });

    it('rejects false or missing consent', () => {
      expect(validateConsent(false).ok).toBe(false);
      expect(validateConsent(undefined).ok).toBe(false);
    });
  });

  describe('validateRequired', () => {
    it('accepts non-empty strings', () => {
      const result = validateRequired('some value', 'Field');
      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe('some value');
      }
    });

    it('rejects empty strings', () => {
      expect(validateRequired('', 'Field').ok).toBe(false);
      expect(validateRequired('   ', 'Field').ok).toBe(false);
    });

    it('includes field name in error message', () => {
      const result = validateRequired('', 'CustomField');
      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(result.error).toContain('CustomField');
      }
    });
  });
});
