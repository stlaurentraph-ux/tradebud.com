/**
 * Safer fetch wrapper with improved error handling and logging.
 * Wraps common API patterns to provide consistent error classification.
 */

import { logError } from './ErrorLogger';

export type SafeFetchOptions = {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
  context?: Record<string, unknown>;
};

export interface SafeFetchResult<T> {
  ok: true;
  data: T;
}

export interface SafeFetchError {
  ok: false;
  statusCode?: number;
  message: string;
  userMessage: string;
}

export type SafeFetchResponse<T> = SafeFetchResult<T> | SafeFetchError;

/**
 * Parse JSON response body with fallback for failed parsing.
 */
async function parseJsonSafe(response: Response): Promise<any> {
  try {
    return await response.json();
  } catch {
    return {};
  }
}

/**
 * Extract error message from NestJS-style response.
 */
function extractErrorMessage(body: any): string | undefined {
  if (!body || typeof body !== 'object') return undefined;
  
  const raw = body.message;
  if (typeof raw === 'string') return raw;
  if (Array.isArray(raw) && raw.every((x) => typeof x === 'string')) {
    return raw.join(' | ');
  }
  
  return undefined;
}

/**
 * Safe fetch wrapper with timeout and error classification.
 * Handles both network and HTTP errors gracefully.
 */
export async function safeFetch<T = any>(
  url: string,
  options?: SafeFetchOptions,
): Promise<SafeFetchResponse<T>> {
  const timeout = options?.timeout ?? 30000;
  const context = {
    url,
    method: options?.method ?? 'GET',
    ...options?.context,
  };

  try {
    // Create abort controller for timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), timeout);

    const response = await fetch(url, {
      method: options?.method ?? 'GET',
      headers: options?.headers,
      body: options?.body,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    // Handle non-200 responses
    if (!response.ok) {
      const body = await parseJsonSafe(response);
      const backendMessage = extractErrorMessage(body);
      const message = backendMessage ?? `HTTP ${response.status}`;

      logError(new Error(message), {
        ...context,
        statusCode: response.status,
        backendResponse: body,
      });

      return {
        ok: false,
        statusCode: response.status,
        message,
        userMessage:
          response.status === 401 || response.status === 403
            ? 'Authentication failed. Please check your credentials.'
            : response.status >= 500
              ? 'Server error. Please try again later.'
              : message,
      };
    }

    // Parse successful response
    try {
      const data = await response.json() as T;
      return { ok: true, data };
    } catch (parseError) {
      logError(parseError as Error, {
        ...context,
        phase: 'response_parsing',
      });

      return {
        ok: false,
        message: 'Failed to parse server response',
        userMessage: 'Invalid response from server. Please try again.',
      };
    }
  } catch (error) {
    // Network or timeout error
    if (error instanceof Error && error.name === 'AbortError') {
      logError(error, { ...context, phase: 'timeout' });
      return {
        ok: false,
        message: 'Request timeout',
        userMessage: 'Request took too long. Check your connection and try again.',
      };
    }

    logError(error as Error, { ...context, phase: 'network' });

    return {
      ok: false,
      message: error instanceof Error ? error.message : 'Network error',
      userMessage: 'Network connection failed. Changes will be saved locally.',
    };
  }
}

/**
 * Specialized wrapper for authenticated API calls.
 * Injects Authorization header and handles auth errors.
 */
export async function safeAuthenticatedFetch<T = any>(
  url: string,
  accessToken: string | null,
  options?: Omit<SafeFetchOptions, 'headers'>,
): Promise<SafeFetchResponse<T>> {
  if (!accessToken) {
    const error = new Error('No access token available');
    logError(error, { url, phase: 'auth' });
    return {
      ok: false,
      message: 'Not authenticated',
      userMessage: 'Please sign in in Settings.',
    };
  }

  const headers = {
    Authorization: `Bearer ${accessToken}`,
    'Content-Type': 'application/json',
    ...options?.headers,
  };

  return safeFetch<T>(url, {
    ...options,
    headers,
    context: { authenticated: true, ...options?.context },
  });
}
