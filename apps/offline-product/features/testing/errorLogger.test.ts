/**
 * Test suite for error logging and classification.
 */

import { describe, it, expect, beforeEach } from '@jest/globals';
import {
  classifyError,
  getUserMessage,
  logError,
  clearErrorLog,
  getErrorLog,
  type ErrorCategory,
} from '../errors/ErrorLogger';

describe('Error Logger', () => {
  beforeEach(() => {
    clearErrorLog();
  });

  describe('classifyError', () => {
    it('classifies network errors', () => {
      const networkError = new TypeError('fetch failed');
      const classified = classifyError(networkError);
      expect(classified.category).toBe('network');
    });

    it('classifies auth errors', () => {
      const authError = new Error('unauthorized token');
      const classified = classifyError(authError);
      expect(classified.category).toBe('auth');
    });

    it('classifies validation errors', () => {
      const validationError = new Error('validation failed: invalid input');
      const classified = classifyError(validationError);
      expect(classified.category).toBe('validation');
    });

    it('classifies server errors', () => {
      const serverError = new Error('server 500 internal error');
      const classified = classifyError(serverError);
      expect(classified.category).toBe('server');
    });

    it('classifies rate limit errors', () => {
      const rateLimitError = new Error('Too many requests');
      const classified = classifyError(rateLimitError, { statusCode: 429 });
      expect(classified.category).toBe('server');
      expect(classified.code).toBe('RATE_LIMITED');
      expect(classified.statusCode).toBe(429);
    });

    it('classifies unknown errors', () => {
      const unknownError = new Error('something went wrong');
      const classified = classifyError(unknownError);
      expect(classified.category).toBe('unknown');
    });

    it('includes context in classified error', () => {
      const error = new Error('test error');
      const context = { userId: '123', action: 'upload' };
      const classified = classifyError(error, context);
      expect(classified.context).toEqual(context);
    });
  });

  describe('getUserMessage', () => {
    it('returns user-friendly message for network errors', () => {
      const message = getUserMessage({
        category: 'network' as ErrorCategory,
        message: 'fetch failed',
        timestamp: Date.now(),
      });
      expect(message).toContain('Network connection');
    });

    it('returns user-friendly message for auth errors', () => {
      const message = getUserMessage({
        category: 'auth' as ErrorCategory,
        message: 'unauthorized',
        timestamp: Date.now(),
      });
      expect(message).toContain('Authentication failed');
    });

    it('returns user-friendly message for validation errors', () => {
      const message = getUserMessage({
        category: 'validation' as ErrorCategory,
        message: 'invalid input',
        timestamp: Date.now(),
      });
      expect(message).toContain('Invalid input');
    });

    it('returns generic message for unknown errors', () => {
      const message = getUserMessage({
        category: 'unknown' as ErrorCategory,
        message: 'something',
        timestamp: Date.now(),
      });
      expect(message).toContain('unexpected error');
    });
  });

  describe('logError', () => {
    it('logs errors and returns classification', () => {
      const error = new Error('test error');
      const classified = logError(error, { context: 'test' });
      expect(classified.message).toBe('test error');
    });

    it('maintains error log with size limit', () => {
      for (let i = 0; i < 60; i++) {
        logError(new Error(`Error ${i}`), {});
      }
      const log = getErrorLog(100);
      expect(log.length).toBeLessThanOrEqual(50); // Max size is 50
    });

    it('stores user message in log entry', () => {
      logError(new Error('network failed'), {});
      const log = getErrorLog(1);
      expect(log[0].userMessage).toBeDefined();
    });

    it('deduplicates repeated rate-limit errors within the suppression window', () => {
      logError(new Error('Too many requests'), { statusCode: 429, context: 'plot_fetch' });
      logError(new Error('Too many requests'), { statusCode: 429, context: 'plot_fetch' });
      logError(new Error('Too many requests'), { statusCode: 429, context: 'plot_fetch' });
      expect(getErrorLog(100).length).toBe(1);
    });
  });

  describe('getErrorLog', () => {
    it('returns most recent errors', () => {
      logError(new Error('Error 1'), {});
      logError(new Error('Error 2'), {});
      logError(new Error('Error 3'), {});

      const log = getErrorLog(2);
      expect(log.length).toBe(2);
      expect(log[1].error.message).toContain('Error 3'); // Most recent last
    });

    it('respects limit parameter', () => {
      for (let i = 0; i < 20; i++) {
        logError(new Error(`Error ${i}`), {});
      }
      const limited = getErrorLog(5);
      expect(limited.length).toBe(5);
    });
  });

  describe('clearErrorLog', () => {
    it('removes all logged errors', () => {
      logError(new Error('Error 1'), {});
      logError(new Error('Error 2'), {});
      clearErrorLog();
      expect(getErrorLog().length).toBe(0);
    });
  });
});
