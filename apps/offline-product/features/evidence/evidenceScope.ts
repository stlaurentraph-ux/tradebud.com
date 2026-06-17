import type { PlotEvidenceKind } from '@/features/state/persistence';

/** Evidence uploaded once per farmer (Documents tab from Home). */
export const PRODUCER_EVIDENCE_KINDS = ['fpic_repository', 'labor_evidence'] as const satisfies readonly PlotEvidenceKind[];

/** Evidence scoped to an individual plot. */
export const PLOT_EVIDENCE_KINDS = ['tenure_evidence', 'protected_area_permit'] as const satisfies readonly PlotEvidenceKind[];

export type ProducerEvidenceKind = (typeof PRODUCER_EVIDENCE_KINDS)[number];
export type PlotScopedEvidenceKind = (typeof PLOT_EVIDENCE_KINDS)[number];

export function producerEvidenceScopeId(farmerId: string): string {
  return `profile:${farmerId.trim()}`;
}

export function isProducerEvidenceKind(kind: PlotEvidenceKind): kind is ProducerEvidenceKind {
  return (PRODUCER_EVIDENCE_KINDS as readonly string[]).includes(kind);
}

export function isPlotScopedEvidenceKind(kind: PlotEvidenceKind): kind is PlotScopedEvidenceKind {
  return (PLOT_EVIDENCE_KINDS as readonly string[]).includes(kind);
}
