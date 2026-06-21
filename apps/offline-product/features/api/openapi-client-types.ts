/**
 * Typed OpenAPI schema exports for offline mobile API consumers (slice 4.2).
 * Source of truth: docs/openapi/tracebud-v1-draft.yaml → features/api/generated/openapi-v1.d.ts
 */
import type { components } from './generated/openapi-v1';

export type CreatePlotRequest = components['schemas']['CreatePlotRequest'];
export type PlotCreatedResponse = components['schemas']['PlotCreatedResponse'];
export type SyncPlotPhotosRequest = components['schemas']['SyncPlotPhotosRequest'];
export type SyncPlotLegalRequest = components['schemas']['SyncPlotLegalRequest'];
export type SyncPlotEvidenceRequest = components['schemas']['SyncPlotEvidenceRequest'];
