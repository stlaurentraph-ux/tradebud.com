type TranslateFn = (key: string) => string;

function wf(key: string, fallback: string, t?: TranslateFn): string {
  if (!t) return fallback;
  const resolved = t(key);
  return resolved === key ? fallback : resolved;
}

const DEMO_DATA_COPY = {
  card_title: { key: 'workflow.demo.card_title', fallback: 'Demo data' },
  card_description: {
    key: 'workflow.demo.card_description',
    fallback:
      "Show realistic sample shipments, campaigns, inbox requests, and plots for live demos. Toggle off to use your tenant's real data again.",
  },
  checkbox_label: { key: 'workflow.demo.checkbox_label', fallback: 'Use demo data' },
  checkbox_aria: { key: 'workflow.demo.checkbox_aria', fallback: 'Use demo data' },
  checkbox_hint: {
    key: 'workflow.demo.checkbox_hint',
    fallback:
      'Applies across overview, shipments, outreach, inbox, and plots for your current role. Persists for this browser session only.',
  },
  sidebar_label: { key: 'workflow.demo.sidebar_label', fallback: 'Demo data' },
} as const;

export function getDemoDataCopy(
  key: keyof typeof DEMO_DATA_COPY,
  t?: TranslateFn,
): string {
  const entry = DEMO_DATA_COPY[key];
  return wf(entry.key, entry.fallback, t);
}

export function getDemoDataCopyManifest(): Record<string, string> {
  return Object.fromEntries(
    Object.values(DEMO_DATA_COPY).map((entry) => [entry.key, entry.fallback]),
  );
}
