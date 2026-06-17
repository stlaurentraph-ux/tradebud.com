type TranslateFn = (key: string) => string;

function wf(
  key: string,
  fallback: string,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  if (!t) {
    const text = fallback;
    if (!values) return text;
    return Object.entries(values).reduce(
      (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
      text,
    );
  }
  const resolved = t(key);
  const text = resolved === key ? fallback : resolved;
  if (!values) return text;
  return Object.entries(values).reduce(
    (acc, [name, value]) => acc.replaceAll(`{{${name}}}`, String(value)),
    text,
  );
}

const PACKAGE_LINEAGE_SUMMARY_COPY = {
  title: {
    key: 'workflow.package.lineage.title',
    fallback: 'Lineage summary',
  },
  description: {
    key: 'workflow.package.lineage.description',
    fallback: 'Producer → plot → batch chain for this shipment package.',
  },
  intact: {
    key: 'workflow.package.lineage.intact',
    fallback: 'Lineage intact — producers and plots are linked on this batch.',
  },
  missing_producers: {
    key: 'workflow.package.lineage.missing_producers',
    fallback: 'No producers linked yet. Link producers before sealing.',
  },
  missing_plots: {
    key: 'workflow.package.lineage.missing_plots',
    fallback: 'No plots linked yet. Associate plots to preserve batch lineage.',
  },
  missing_both: {
    key: 'workflow.package.lineage.missing_both',
    fallback: 'Producers and plots are missing. Complete upstream registration first.',
  },
  producers: {
    key: 'workflow.package.lineage.producers',
    fallback: '{{count}} producer(s)',
  },
  plots: {
    key: 'workflow.package.lineage.plots',
    fallback: '{{count}} plot(s)',
  },
  verified_plots: {
    key: 'workflow.package.lineage.verified_plots',
    fallback: '{{count}} verified plot(s)',
  },
  weight: {
    key: 'workflow.package.lineage.weight',
    fallback: '{{kg}} kg batch weight',
  },
  hectares: {
    key: 'workflow.package.lineage.hectares',
    fallback: '{{ha}} ha contributing area',
  },
  flow_label: {
    key: 'workflow.package.lineage.flow_label',
    fallback: 'Producer → plot → batch',
  },
} as const;

export function getPackageLineageSummaryCopy(
  field: keyof typeof PACKAGE_LINEAGE_SUMMARY_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = PACKAGE_LINEAGE_SUMMARY_COPY[field];
  return wf(entry.key, entry.fallback, t, values);
}

export function getPackageLineageStatusMessage(
  summary: { isIntact: boolean; missingProducers: boolean; missingPlots: boolean },
  t?: TranslateFn,
): string {
  if (summary.isIntact) {
    return getPackageLineageSummaryCopy('intact', t);
  }
  if (summary.missingProducers && summary.missingPlots) {
    return getPackageLineageSummaryCopy('missing_both', t);
  }
  if (summary.missingProducers) {
    return getPackageLineageSummaryCopy('missing_producers', t);
  }
  return getPackageLineageSummaryCopy('missing_plots', t);
}

export function getPackageLineageSummaryCopyManifest(): Record<string, string> {
  return Object.fromEntries(
    Object.values(PACKAGE_LINEAGE_SUMMARY_COPY).map((entry) => [entry.key, entry.fallback]),
  );
}
