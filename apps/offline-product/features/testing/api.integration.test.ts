/**
 * API Integration Tests
 *
 * Tests the integration between domain-specific API modules and the sync system.
 * These are integration tests, not unit tests - they verify cross-module interactions.
 *
 * Run with: npm test -- api.integration.test.ts
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { ErrorLogger, logError } from '../errors/ErrorLogger';
import { safeFetch } from '../errors/safeFetch';
import {
  validateHarvestKg,
  validateGPSCoordinates,
  validatePostalAddress,
  validateCommodityCode,
} from '../validation/validators';

// Mock fetch for integration tests
global.fetch = vi.fn();

describe('API Integration Tests', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    ErrorLogger.clearLogs();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  describe('Error Handling across API calls', () => {
    it('should capture network errors and classify them correctly', async () => {
      (global.fetch as any).mockRejectedValueOnce(
        new Error('Network request failed')
      );

      const result = await safeFetch('/api/plots', { method: 'GET' });

      expect(result.ok).toBe(false);
      expect(result.error?.type).toBe('network');
      expect(ErrorLogger.getLogs().length).toBeGreaterThan(0);
    });

    it('should handle auth errors (401)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 401,
        json: async () => ({ message: 'Unauthorized' }),
      });

      const result = await safeFetch('/api/plots', { method: 'GET' });

      expect(result.ok).toBe(false);
      expect(result.error?.type).toBe('auth');
      expect(result.error?.statusCode).toBe(401);
    });

    it('should handle server errors (500)', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ message: 'Internal Server Error' }),
      });

      const result = await safeFetch('/api/plots', { method: 'GET' });

      expect(result.ok).toBe(false);
      expect(result.error?.type).toBe('server');
      expect(result.error?.statusCode).toBe(500);
    });

    it('should handle timeout errors', async () => {
      (global.fetch as any).mockImplementationOnce(
        () =>
          new Promise((_, reject) =>
            setTimeout(() => reject(new Error('Request timeout')), 100)
          )
      );

      const result = await safeFetch('/api/plots', { method: 'GET', timeout: 50 });

      expect(result.ok).toBe(false);
      expect(result.error?.type).toBe('network');
    });

    it('should log errors with context', () => {
      const error = new Error('Test error');
      const logged = logError(error, { context: 'harvest_submission', plotId: 'p123' });

      expect(logged).toBeDefined();
      expect(logged.context).toEqual({
        context: 'harvest_submission',
        plotId: 'p123',
      });
      expect(ErrorLogger.getLogs().length).toBe(1);
    });
  });

  describe('Validation Integration with API', () => {
    it('should validate harvest kg and return parsed value', () => {
      const result = validateHarvestKg('1500.5');

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value).toBe(1500.5);
      }
    });

    it('should reject invalid harvest kg values', () => {
      const testCases = ['', '-100', '1000000001', 'abc', null];

      testCases.forEach((input) => {
        const result = validateHarvestKg(input as any);
        expect(result.ok).toBe(false);
        expect(result.error).toBeDefined();
      });
    });

    it('should validate GPS coordinates', () => {
      const result = validateGPSCoordinates(-23.55, -46.63);

      expect(result.ok).toBe(true);
      if (result.ok) {
        expect(result.value.latitude).toBe(-23.55);
        expect(result.value.longitude).toBe(-46.63);
      }
    });

    it('should reject invalid GPS coordinates', () => {
      const testCases = [
        { lat: 91, lng: 0 }, // latitude > 90
        { lat: -91, lng: 0 }, // latitude < -90
        { lat: 0, lng: 181 }, // longitude > 180
        { lat: 0, lng: -181 }, // longitude < -180
        { lat: null, lng: 0 },
      ];

      testCases.forEach(({ lat, lng }) => {
        const result = validateGPSCoordinates(lat as any, lng as any);
        expect(result.ok).toBe(false);
      });
    });

    it('should validate postal addresses', () => {
      const testCases = [
        { input: '123 Main St, Anytown', expected: true },
        { input: 'Rua 5, Brasília, Brazil', expected: true },
        { input: 'a', expected: false }, // too short
        { input: 'x'.repeat(501), expected: false }, // too long
        { input: '', expected: false }, // empty
      ];

      testCases.forEach(({ input, expected }) => {
        const result = validatePostalAddress(input);
        expect(result.ok).toBe(expected);
      });
    });

    it('should validate commodity codes', () => {
      const validCodes = ['coffee', 'cocoa', 'rubber', 'soy', 'timber'];

      validCodes.forEach((code) => {
        const result = validateCommodityCode(code);
        expect(result.ok).toBe(true);
      });

      const invalidCodes = ['invalid', 'oil', '123', ''];
      invalidCodes.forEach((code) => {
        const result = validateCommodityCode(code);
        expect(result.ok).toBe(false);
      });
    });
  });

  describe('Error + Validation Pipeline', () => {
    it('should validate input, then make API call with error handling', async () => {
      // Step 1: Validate input
      const kgValidation = validateHarvestKg('500');
      expect(kgValidation.ok).toBe(true);

      if (!kgValidation.ok) return;

      const gpsValidation = validateGPSCoordinates(-23.55, -46.63);
      expect(gpsValidation.ok).toBe(true);

      // Step 2: Mock successful API response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => ({ id: 'harvest-123', kg: 500, plotId: 'plot-1' }),
      });

      // Step 3: Make API call with safeFetch
      const apiResult = await safeFetch('/api/harvests', {
        method: 'POST',
        body: JSON.stringify({
          kg: kgValidation.value,
          lat: gpsValidation.value.latitude,
          lng: gpsValidation.value.longitude,
        }),
      });

      expect(apiResult.ok).toBe(true);
      expect(apiResult.data?.id).toBe('harvest-123');
    });

    it('should handle validation failure before API call', () => {
      const kgValidation = validateHarvestKg('not-a-number');
      expect(kgValidation.ok).toBe(false);

      // API should not be called if validation fails
      expect(global.fetch).not.toHaveBeenCalled();
    });
  });

  describe('Sync Queue Error Handling', () => {
    it('should log errors from failed sync operations', () => {
      const syncError = new Error('Sync failed: DB connection lost');
      const logged = logError(syncError, { context: 'sync_harvest', action: 'postHarvest' });

      expect(logged.type).toBe('unknown');
      expect(logged.context?.context).toBe('sync_harvest');
      expect(ErrorLogger.getLogs().length).toBe(1);
    });

    it('should track multiple errors in sequence', () => {
      logError(new Error('Error 1'), { action: 'sync' });
      logError(new Error('Error 2'), { action: 'validate' });
      logError(new Error('Error 3'), { action: 'persist' });

      const logs = ErrorLogger.getLogs();
      expect(logs.length).toBe(3);
      expect(logs[0].message).toContain('Error 1');
      expect(logs[2].message).toContain('Error 3');
    });

    it('should trim logs when exceeding max size', () => {
      // Log 60 errors (max is 50)
      for (let i = 0; i < 60; i++) {
        logError(new Error(`Error ${i}`), {});
      }

      const logs = ErrorLogger.getLogs();
      expect(logs.length).toBeLessThanOrEqual(50);
      // Most recent errors should be kept
      expect(logs[logs.length - 1].message).toContain('Error 59');
    });
  });

  describe('API Response Parsing', () => {
    it('should handle JSON parsing errors', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => {
          throw new Error('Invalid JSON');
        },
      });

      const result = await safeFetch('/api/plots', { method: 'GET' });

      expect(result.ok).toBe(false);
      expect(result.error?.type).toBe('unknown');
    });

    it('should handle missing response data', async () => {
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => null,
      });

      const result = await safeFetch('/api/plots', { method: 'GET' });

      expect(result.ok).toBe(true);
      expect(result.data).toBeNull();
    });
  });

  describe('End-to-End Validation + Error Scenario', () => {
    it('complete harvest recording flow with validation and error handling', async () => {
      // Simulate a farmer recording a harvest
      const farmerId = 'farmer-1';
      const plotId = 'plot-abc';
      const kg = '750.5';
      const lat = -15.78;
      const lng = -47.88;

      // Step 1: Validate all inputs
      const kgResult = validateHarvestKg(kg);
      const addressResult = validatePostalAddress('123 Main St, City');
      const gpsResult = validateGPSCoordinates(lat, lng);
      const commodityResult = validateCommodityCode('coffee');

      expect(kgResult.ok).toBe(true);
      expect(addressResult.ok).toBe(true);
      expect(gpsResult.ok).toBe(true);
      expect(commodityResult.ok).toBe(true);

      // Step 2: Prepare payload with validated data
      const payload = {
        farmerId,
        plotId,
        kg: kgResult.ok ? kgResult.value : 0,
        lat: gpsResult.ok ? gpsResult.value.latitude : 0,
        lng: gpsResult.ok ? gpsResult.value.longitude : 0,
        commodity: commodityResult.ok ? commodityResult.value : '',
        address: addressResult.ok ? addressResult.value : '',
      };

      // Step 3: Mock backend response
      (global.fetch as any).mockResolvedValueOnce({
        ok: true,
        status: 201,
        json: async () => ({
          id: 'harvest-xyz',
          ...payload,
          createdAt: Date.now(),
        }),
      });

      // Step 4: Make API call with error handling
      const apiResult = await safeFetch('/api/harvests', {
        method: 'POST',
        body: JSON.stringify(payload),
      });

      expect(apiResult.ok).toBe(true);
      expect(apiResult.data?.id).toBe('harvest-xyz');
      expect(apiResult.data?.kg).toBe(750.5);
    });
  });
});
