type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn): string {
  if (!t) return fallback;
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

const REQUEST_INTENT_COPY = {
  loading_title: {
    key: 'workflow.requests.intent.loading_title',
    fallback: 'Saving your response',
  },
  loading_description: {
    key: 'workflow.requests.intent.loading_description',
    fallback: 'Redirecting you to sign in so we can record your campaign decision.',
  },
} as const;

export function getRequestIntentCopy(
  key: keyof typeof REQUEST_INTENT_COPY,
  t?: TranslateFn,
): string {
  const entry = REQUEST_INTENT_COPY[key];
  return wf(entry.key, entry.fallback, t);
}

export function getRequestIntentCopyManifest(): Record<string, string> {
  return Object.fromEntries(Object.values(REQUEST_INTENT_COPY).map((entry) => [entry.key, entry.fallback]));
}
