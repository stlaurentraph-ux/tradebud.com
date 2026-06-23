/**
 * Centralized error logging and classification system.
 * Handles network errors, validation errors, auth errors, and server errors.
 */

import { isSentryEnabled, reportErrorToSentry } from '@/features/observability/sentryClient';
import { sanitizeLogContext } from '@/features/security/sanitizeLogContext';

export type ErrorCategory = 'network' | 'auth' | 'validation' | 'server' | 'unknown';

export interface ClassifiedError {
  category: ErrorCategory;
  message: string;
  code?: string;
  statusCode?: number;
  originalError?: Error;
  timestamp: number;
  context?: Record<string, unknown>;
}

export interface ErrorLogEntry {
  error: ClassifiedError;
  userMessage: string;
  stackTrace?: string;
}

/** In-memory error log (limited to last 50 errors) */
let errorLog: ErrorLogEntry[] = [];
const MAX_LOG_SIZE = 50;

/** Suppress duplicate console/Sentry noise for bursty API failures (especially 429). */
const DEFAULT_DEDUPE_WINDOW_MS = 30_000;
const RATE_LIMIT_DEDUPE_WINDOW_MS = 120_000;
const recentLogKeys = new Map<string, number>();

function isRateLimitMessage(message: string, context?: Record<string, unknown>): boolean {
  const statusCode = context?.statusCode;
  if (typeof statusCode === 'number' && statusCode === 429) return true;
  return /too many requests|rate limit|please slow down/i.test(message);
}

function dedupeKey(message: string, context?: Record<string, unknown>): string {
  return [
    message.toLowerCase().trim(),
    String(context?.statusCode ?? ''),
    String(context?.context ?? context?.phase ?? ''),
    String(context?.action ?? ''),
    String(context?.farmerId ?? ''),
    String(context?.plotId ?? ''),
    String(context?.clientPlotId ?? ''),
  ].join('|');
}

function shouldSkipDuplicateLog(message: string, context?: Record<string, unknown>): boolean {
  const key = dedupeKey(message, context);
  const windowMs = isRateLimitMessage(message, context)
    ? RATE_LIMIT_DEDUPE_WINDOW_MS
    : DEFAULT_DEDUPE_WINDOW_MS;
  const now = Date.now();
  const lastAt = recentLogKeys.get(key);
  if (lastAt != null && now - lastAt < windowMs) {
    return true;
  }
  recentLogKeys.set(key, now);
  if (recentLogKeys.size > 200) {
    for (const [k, at] of recentLogKeys) {
      if (now - at > RATE_LIMIT_DEDUPE_WINDOW_MS) recentLogKeys.delete(k);
    }
  }
  return false;
}

/**
 * Classify an error into a category for appropriate handling.
 */
export function classifyError(error: unknown, context?: Record<string, unknown>): ClassifiedError {
  const timestamp = Date.now();
  const statusCode =
    typeof context?.statusCode === 'number' ? context.statusCode : undefined;

  if (error instanceof TypeError && error.message.includes('fetch')) {
    return {
      category: 'network',
      message: 'Network request failed',
      code: 'FETCH_ERROR',
      originalError: error,
      timestamp,
      context,
    };
  }

  if (error instanceof Error) {
    const msg = error.message.toLowerCase();

    if (
      statusCode === 429 ||
      msg.includes('too many requests') ||
      msg.includes('rate limit') ||
      msg.includes('please slow down')
    ) {
      return {
        category: 'server',
        message: error.message,
        code: 'RATE_LIMITED',
        statusCode: statusCode ?? 429,
        originalError: error,
        timestamp,
        context,
      };
    }

    if (msg.includes('network') || msg.includes('offline')) {
      return {
        category: 'network',
        message: error.message,
        code: 'NETWORK_ERROR',
        originalError: error,
        timestamp,
        context,
      };
    }

    if (msg.includes('unauthorized') || msg.includes('authentication') || msg.includes('token')) {
      return {
        category: 'auth',
        message: error.message,
        code: 'AUTH_ERROR',
        originalError: error,
        timestamp,
        context,
      };
    }

    if (msg.includes('validation') || msg.includes('invalid')) {
      return {
        category: 'validation',
        message: error.message,
        code: 'VALIDATION_ERROR',
        originalError: error,
        timestamp,
        context,
      };
    }

    if (msg.includes('server') || msg.includes('500') || msg.includes('internal')) {
      return {
        category: 'server',
        message: error.message,
        code: 'SERVER_ERROR',
        originalError: error,
        timestamp,
        context,
      };
    }

    return {
      category: 'unknown',
      message: error.message,
      originalError: error,
      timestamp,
      context,
    };
  }

  return {
    category: 'unknown',
    message: String(error),
    timestamp,
    context,
  };
}

/**
 * Get user-facing message for an error category.
 */
export function getUserMessage(classified: ClassifiedError): string {
  switch (classified.category) {
    case 'network':
      return 'Network connection issue. Changes will be saved locally and synced when online.';
    case 'auth':
      return 'Authentication failed. Please check your sign-in credentials in Settings.';
    case 'validation':
      return 'Invalid input. Please check your data and try again.';
    case 'server':
      return 'Server error. Please try again later or contact support.';
    default:
      return 'An unexpected error occurred. Please try again.';
  }
}

/**
 * Log an error with classification and context.
 */
export function logError(error: unknown, context?: Record<string, unknown>): ClassifiedError {
  const safeContext = sanitizeLogContext(context);
  const classified = classifyError(error, safeContext);

  // Expected during sync bursts — UI maps to farmer copy; do not spam LogBox/Sentry.
  if (classified.code === 'RATE_LIMITED') {
    return classified;
  }

  if (shouldSkipDuplicateLog(classified.message, safeContext)) {
    return classified;
  }

  const userMessage = getUserMessage(classified);
  const stackTrace = error instanceof Error ? error.stack : undefined;

  const entry: ErrorLogEntry = {
    error: classified,
    userMessage,
    stackTrace,
  };

  // Add to in-memory log (with size limit)
  errorLog.push(entry);
  if (errorLog.length > MAX_LOG_SIZE) {
    errorLog = errorLog.slice(-MAX_LOG_SIZE);
  }

  // Log to console in development
  if (__DEV__) {
    console.error(`[ErrorLogger] ${classified.category}:`, {
      message: classified.message,
      code: classified.code,
      context: safeContext,
      stackTrace,
    });
  }

  if (classified.category !== 'validation' && isSentryEnabled()) {
    reportErrorToSentry(classified.originalError ?? new Error(classified.message), {
      category: classified.category,
      code: classified.code,
      ...safeContext,
    });
  }

  return classified;
}

/**
 * Get the last N error log entries.
 */
export function getErrorLog(limit: number = 10): ErrorLogEntry[] {
  return errorLog.slice(-limit);
}

/**
 * Clear error log.
 */
export function clearErrorLog(): void {
  errorLog = [];
  recentLogKeys.clear();
}

/**
 * Export error log as JSON for debugging/support.
 */
export function exportErrorLog(): string {
  return JSON.stringify(errorLog, null, 2);
}
