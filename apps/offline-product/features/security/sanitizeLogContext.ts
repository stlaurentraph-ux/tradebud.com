const SENSITIVE_KEY =
  /password|passwd|secret|token|authorization|refresh|api[_-]?key|credential|national[_-]?id|email|phone/i;

/** Email-shaped values (redacted even under an innocuous key like `message` or `detail`). */
const EMAIL_LIKE = /[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}/;

/** Bearer header values, any length (a short token is just as sensitive as a long one). */
const BEARER_PREFIX = /^Bearer\s+/i;

/** JWT-shaped strings (`eyJ...header.payload.signature`) regardless of key name or `Bearer ` prefix. */
const JWT_LIKE = /\beyJ[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{5,}\.[A-Za-z0-9_-]{2,}/;

const MAX_DEPTH = 4;

function sanitizeValue(value: unknown, depth: number): unknown {
  if (typeof value === 'string') {
    if (BEARER_PREFIX.test(value) || JWT_LIKE.test(value) || EMAIL_LIKE.test(value)) {
      return '[redacted]';
    }
    return value;
  }
  if (Array.isArray(value)) {
    if (depth >= MAX_DEPTH) return '[truncated]';
    return value.map((entry) => sanitizeValue(entry, depth + 1));
  }
  if (value && typeof value === 'object') {
    if (depth >= MAX_DEPTH) return '[truncated]';
    const out: Record<string, unknown> = {};
    for (const [key, entry] of Object.entries(value as Record<string, unknown>)) {
      out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitizeValue(entry, depth + 1);
    }
    return out;
  }
  return value;
}

export function sanitizeLogContext(
  context?: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (!context) return undefined;
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(context)) {
    // Redact by key name, otherwise scrub the value (recursively for nested API bodies like
    // `backendResponse`, which can contain tokens or PII nested several levels deep).
    out[key] = SENSITIVE_KEY.test(key) ? '[redacted]' : sanitizeValue(value, 1);
  }
  return out;
}
