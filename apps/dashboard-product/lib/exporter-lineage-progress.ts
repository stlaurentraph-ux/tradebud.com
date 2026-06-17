import type { VirginProgressSignals } from '@/lib/virgin-state-progress';
import { countCompletedVirginSteps } from '@/lib/virgin-state-progress';

export type ExporterLineageStepId = 'register_producers' | 'map_plots' | 'link_received_lots' | 'seal_shipment';

export interface ExporterLineageStepState {
  id: ExporterLineageStepId;
  completed: boolean;
  href: string;
}

const EXPORTER_LINEAGE_STEP_HREFS: Record<ExporterLineageStepId, string> = {
  register_producers: '/contacts/add?mode=csv',
  map_plots: '/outreach?new=1',
  link_received_lots: '/harvests',
  seal_shipment: '/packages?status=READY',
};

export function buildExporterLineageSteps(signals: VirginProgressSignals): ExporterLineageStepState[] {
  const farmers = signals.total_farmers ?? 0;
  const plots = signals.total_plots ?? 0;
  const packages = signals.total_packages ?? 0;
  const readyOrSealed =
    (signals.packages_by_status?.READY ?? 0) + (signals.packages_by_status?.SEALED ?? 0);
  const linkedLots = (signals.total_harvest_batches ?? 0) > 0;
  const hasProducers = farmers > 0 || Boolean(signals.contacts_uploaded);
  const hasPlots = plots > 0 || Boolean(signals.first_plot_captured);
  const hasLinkedLots = linkedLots || packages > 0;

  return [
    { id: 'register_producers', completed: hasProducers, href: EXPORTER_LINEAGE_STEP_HREFS.register_producers },
    { id: 'map_plots', completed: hasPlots, href: EXPORTER_LINEAGE_STEP_HREFS.map_plots },
    {
      id: 'link_received_lots',
      completed: hasLinkedLots,
      href: EXPORTER_LINEAGE_STEP_HREFS.link_received_lots,
    },
    { id: 'seal_shipment', completed: readyOrSealed > 0, href: EXPORTER_LINEAGE_STEP_HREFS.seal_shipment },
  ];
}

export function isExporterLineageComplete(signals: VirginProgressSignals): boolean {
  return countCompletedVirginSteps('exporter', signals) >= 4;
}

export function countExporterLineageCompletedSteps(steps: ExporterLineageStepState[]): number {
  return steps.filter((step) => step.completed).length;
}
