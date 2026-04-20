const SENSITIVE_PAYLOAD_KEY_PATTERN =
  /(name|email|phone|address|token|secret|password|apiKey|api_key|identifier|idNumber|id_number)/i;

export function redactSensitivePayload(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((item) => redactSensitivePayload(item));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }
  const input = value as Record<string, unknown>;
  const output: Record<string, unknown> = {};
  for (const [key, item] of Object.entries(input)) {
    if (SENSITIVE_PAYLOAD_KEY_PATTERN.test(key)) {
      output[key] = '[REDACTED]';
      continue;
    }
    output[key] = redactSensitivePayload(item);
  }
  return output;
}

