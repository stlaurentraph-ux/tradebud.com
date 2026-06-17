import type { ExporterLineageStepId } from '@/lib/exporter-lineage-progress';

type TranslateFn = (key: string) => string;
type StepField = 'title' | 'description' | 'ctaLabel';

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

const EXPORTER_LINEAGE_CARD_COPY = {
  title: {
    key: 'workflow.exporter.lineage.title',
    fallback: 'Export lineage checklist',
  },
  description: {
    key: 'workflow.exporter.lineage.description',
    fallback: 'Complete each step so received lots stay plot-linked and seal-ready for importer handoff.',
  },
  progress: {
    key: 'workflow.exporter.lineage.progress',
    fallback: '{{completed}} of {{total}} steps complete',
  },
} as const;

const EXPORTER_LINEAGE_STEP_COPY: Record<ExporterLineageStepId, Record<StepField, { key: string; fallback: string }>> = {
  register_producers: {
    title: {
      key: 'workflow.exporter.lineage.step.register_producers.title',
      fallback: 'Register suppliers',
    },
    description: {
      key: 'workflow.exporter.lineage.step.register_producers.description',
      fallback:
        'Add upstream suppliers — cooperatives, producers, washing stations, and processing plants. Bulk import from CSV.',
    },
    ctaLabel: {
      key: 'workflow.exporter.lineage.step.register_producers.cta',
      fallback: 'Import suppliers',
    },
  },
  map_plots: {
    title: {
      key: 'workflow.exporter.lineage.step.map_plots.title',
      fallback: 'Import or request plots',
    },
    description: {
      key: 'workflow.exporter.lineage.step.map_plots.description',
      fallback:
        'Import plot files or request boundaries from producers. Plots appear in your inventory once shared or imported.',
    },
    ctaLabel: {
      key: 'workflow.exporter.lineage.step.map_plots.cta',
      fallback: 'Request plot data',
    },
  },
  link_received_lots: {
    title: {
      key: 'workflow.exporter.lineage.step.link_received_lots.title',
      fallback: 'Link received lots',
    },
    description: {
      key: 'workflow.exporter.lineage.step.link_received_lots.description',
      fallback:
        'Review upstream lots shared by cooperatives or suppliers and connect them to your export workspace.',
    },
    ctaLabel: {
      key: 'workflow.exporter.lineage.step.link_received_lots.cta',
      fallback: 'View received lots',
    },
  },
  seal_shipment: {
    title: {
      key: 'workflow.exporter.lineage.step.seal_shipment.title',
      fallback: 'Seal shipment',
    },
    description: {
      key: 'workflow.exporter.lineage.step.seal_shipment.description',
      fallback: 'Assemble and seal when readiness checks pass, then hand off to your importer.',
    },
    ctaLabel: {
      key: 'workflow.exporter.lineage.step.seal_shipment.cta',
      fallback: 'Seal shipments',
    },
  },
};

export function getExporterLineageCardCopy(
  field: keyof typeof EXPORTER_LINEAGE_CARD_COPY,
  t?: TranslateFn,
  values?: Record<string, string | number>,
): string {
  const entry = EXPORTER_LINEAGE_CARD_COPY[field];
  return wf(entry.key, entry.fallback, t, values);
}

export function getExporterLineageStepCopy(
  stepId: ExporterLineageStepId,
  field: StepField,
  t?: TranslateFn,
): string {
  const entry = EXPORTER_LINEAGE_STEP_COPY[stepId][field];
  return wf(entry.key, entry.fallback, t);
}

export function getExporterLineageCopyManifest(): Record<string, string> {
  const entries = [
    ...Object.values(EXPORTER_LINEAGE_CARD_COPY),
    ...Object.values(EXPORTER_LINEAGE_STEP_COPY).flatMap((step) => Object.values(step)),
  ];
  return Object.fromEntries(entries.map((entry) => [entry.key, entry.fallback]));
}
